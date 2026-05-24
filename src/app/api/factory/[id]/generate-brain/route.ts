import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS } from "@/lib/claude";

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
- When a customer asks about a combo/package, instruct the bot to include the image using markdown: ![Package Name](image_url)
- Include lead times and capacity info
- Mention the owner's name for escalation
- Tell the bot to never make up prices — only share what was provided
- Tell the bot to ask the customer to contact the owner directly for exact quotes, custom work, or anything not covered

CRITICAL — ENGAGEMENT & SALES BEHAVIOR:
The bot must NEVER let a conversation die. After every answer, the bot must:
- End with a relevant follow-up question to keep the customer talking
- Proactively suggest related products or combos the customer might need
- Ask about the customer's use case or requirements to recommend the right product — tailor questions to the business domain
- If the customer seems interested in one product, cross-sell complementary items or suggest a complete package
- If the customer goes quiet or says "ok/thanks", re-engage by highlighting a bundled package or a popular product they might have missed
- Act like a knowledgeable, friendly salesperson — not a boring FAQ bot
- Keep responses short (2-4 sentences + a follow-up question), suitable for a chat interface

Business Data:
${profileSummary}${productCatalog}${comboSection}

Write ONLY the system prompt, nothing else.`,
        },
      ],
    });

    const systemPrompt =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save system prompt to factory
    const { error: updateErr } = await supabase
      .from("factories")
      .update({ system_prompt: systemPrompt, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ system_prompt: systemPrompt });
  } catch (err) {
    console.error("Brain generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate bot profile" },
      { status: 500 }
    );
  }
}
