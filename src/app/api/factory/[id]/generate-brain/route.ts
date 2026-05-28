import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS } from "@/lib/claude";
import { MULTILINGUAL_INSTRUCTION } from "@/lib/language";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAgentFromCookie();
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    // Load factory info
    const { data: factory, error: factoryErr } = await supabase
      .from("factories")
      .select("*")
      .eq("id", id)
      .single();

    if (factoryErr || !factory) {
      return NextResponse.json({ error: "Factory not found" }, { status: 404 });
    }

    // Load all profile sections
    const { data: profiles } = await supabase
      .from("factory_profiles")
      .select("*")
      .eq("factory_id", id);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "No profile data found. Please fill at least one section." },
        { status: 400 }
      );
    }

    // Build profile summary for Claude
    const profileSummary = profiles
      .map((p) => {
        const sectionLabel = p.section.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const entries = Object.entries(p.data as Record<string, string>)
          .filter(([, v]) => v && v.trim())
          .map(([k, v]) => `  ${k.replace(/_/g, " ")}: ${v}`)
          .join("\n");
        return `${sectionLabel}:\n${entries}`;
      })
      .join("\n\n");

    // Fetch structured products
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("factory_id", id)
      .order("category")
      .order("name");

    let productCatalog = "";
    if (products && products.length > 0) {
      const byCategory: Record<string, typeof products> = {};
      for (const p of products) {
        if (!byCategory[p.category]) byCategory[p.category] = [];
        byCategory[p.category].push(p);
      }
      productCatalog = "\n\nPRODUCT CATALOG:\n" +
        Object.entries(byCategory)
          .map(([cat, items]) =>
            `Category: ${cat}\n` +
            items
              .map((p) => {
                let line = `  - ${p.name}`;
                if (p.sub_category) line += ` (${p.sub_category})`;
                if (p.size_spec) line += ` — ${p.size_spec}`;
                if (p.unit_price != null) line += ` — ${p.unit_price}`;
                if (p.price_unit) line += ` ${p.price_unit}`;
                const tags = p.tags as Record<string, string> | null;
                if (tags && Object.keys(tags).length > 0) {
                  line += "\n    Details: " + Object.entries(tags).map(([k, v]) => `${k}: ${v}`).join(" | ");
                }
                return line;
              })
              .join("\n")
          )
          .join("\n");
    }

    // Fetch combo solutions
    const { data: combos } = await supabase
      .from("combo_solutions")
      .select("*")
      .eq("factory_id", id)
      .order("created_at");

    let comboSection = "";
    if (combos && combos.length > 0) {
      comboSection = "\n\nCOMBO PACKAGES (include image link when customer asks):\n" +
        combos
          .map((c, i) => {
            let line = `${i + 1}. "${c.name}"`;
            const tags = c.tags as Record<string, string> | null;
            const meta = Object.entries(tags || {})
              .filter(([, v]) => v)
              .map(([k, v]) => `${k}: ${v}`);
            if (meta.length > 0) line += `\n   ${meta.join(" | ")}`;
            if (c.items && Array.isArray(c.items) && c.items.length > 0) {
              line += "\n   Items: " +
                (c.items as Array<{ name: string; qty: number; total: number }>)
                  .map((it) => `${it.name} x${it.qty} (${it.total})`)
                  .join(", ");
            }
            if (c.grand_total) line += `\n   Total: ${c.grand_total}`;
            if (c.image_url) line += `\n   Image: ![${c.name}](${c.image_url})`;
            return line;
          })
          .join("\n");
    }

    // Fetch locations
    const { data: locations } = await supabase
      .from("locations")
      .select("*")
      .eq("factory_id", id)
      .order("location_type")
      .order("city");

    let locationsSection = "";
    if (locations && locations.length > 0) {
      locationsSection = "\n\nDISTRIBUTOR & STORE LOCATIONS:\n" +
        locations.map((l) => {
          let line = `- ${l.name} (${l.location_type}) — ${l.city}`;
          if (l.area) line += `, ${l.area}`;
          if (l.phone) line += ` — Phone: ${l.phone}`;
          return line;
        }).join("\n");
    }

    // Fetch competitive advantages
    const { data: compReport } = await supabase
      .from("competitive_reports")
      .select("report_data")
      .eq("factory_id", id)
      .single();

    let competitiveSection = "";
    if (compReport?.report_data) {
      const r = compReport.report_data as Record<string, unknown>;
      const advantages = r.advantages as string[] | undefined;
      if (advantages && advantages.length > 0) {
        competitiveSection = "\n\nCOMPETITIVE ADVANTAGES (use these when customer compares or asks why choose us):\n" +
          advantages.map((a) => `- ${a}`).join("\n");
      }
    }

    const claude = getClaudeClient();

    const response = await claude.messages.create({
      model: MODELS.brain,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are building an AI sales assistant for a business. Based on the business data below, write a system prompt that the AI assistant will use to answer customer queries AND actively drive sales over chat.

The system prompt should:
- State the business name, location, and what they do
- Include product details with exact prices from the product catalog — use the correct local currency based on the business location
- Include combo/package/bundle details with all items and totals
- When a customer mentions or asks about any combo/package, always include the image using markdown: ![Package Name](image_url)
- Include lead times and capacity info
- Mention the owner's name for escalation
- Tell the bot to never make up prices — only share what was provided
- Tell the bot to ask the customer to contact the owner directly for exact quotes, custom work, or anything not covered

CRITICAL — ENGAGEMENT & SALES BEHAVIOR:
The bot must NEVER let a conversation die. After every answer, the bot should:
- Proactively suggest related products or combos the customer might need
- Ask about the customer's use case or requirements to recommend the right product — tailor questions to the business domain
- If the customer seems interested in one product, cross-sell complementary items or suggest a complete package
- If the customer goes quiet or says "ok/thanks", re-engage by highlighting a bundled package or a popular product they might have missed
- Act like a knowledgeable, friendly salesperson — not a boring FAQ bot
- Not every response needs a follow-up question — when the customer says "thanks, will order tomorrow" or clearly wants to end, just close warmly without forcing a question

${MULTILINGUAL_INSTRUCTION}

Business Data:
${profileSummary}${productCatalog}${comboSection}${locationsSection}${competitiveSection}

Write ONLY the system prompt, nothing else.`,
        },
      ],
    });

    const systemPrompt =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Generate a short welcome line describing what the business sells
    const welcomeResponse = await claude.messages.create({
      model: MODELS.chat,
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Based on this business data, write a single short sentence (max 15 words) describing what this business makes or sells. No quotes, no business name, just what they offer. Use very simple English.\n\nBusiness: ${factory.name}, ${factory.city}\n${profileSummary}${productCatalog}${locationsSection}\n\nExamples of good output:\n- We make drip irrigation systems, pipes, fittings, and complete farm packages.\n- We manufacture steel doors, gates, and window frames.\n- We supply building materials — cement, sand, and hardware.\n\nWrite ONLY the one sentence, nothing else.`,
        },
      ],
    });

    const welcomeLine =
      welcomeResponse.content[0].type === "text"
        ? welcomeResponse.content[0].text.trim().replace(/^["']|["']$/g, "")
        : "";

    // Save system prompt and welcome line to factory
    const { error: updateErr } = await supabase
      .from("factories")
      .update({
        system_prompt: systemPrompt,
        welcome_line: welcomeLine || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ system_prompt: systemPrompt, welcome_line: welcomeLine });
  } catch (err) {
    console.error("Brain generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate bot profile" },
      { status: 500 }
    );
  }
}
