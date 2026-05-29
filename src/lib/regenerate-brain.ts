import type { SupabaseClient } from "@supabase/supabase-js";
import { getClaudeClient, MODELS, BRAIN_MAX_OUTPUT_TOKENS } from "@/lib/claude";
import { MULTILINGUAL_INSTRUCTION } from "@/lib/language";

export const INTERNAL_PROFILE_SECTIONS = new Set(["_trigger_regen"]);

export type RegenerateBrainResult =
  | { ok: true; updated_at: string }
  | { ok: false; error: string };

export function isInternalProfileSection(section: string): boolean {
  return section.startsWith("_") || INTERNAL_PROFILE_SECTIONS.has(section);
}

export async function regenerateBrain(
  supabase: SupabaseClient,
  factoryId: string
): Promise<RegenerateBrainResult> {
  const { data: profiles } = await supabase
    .from("factory_profiles")
    .select("section, data")
    .eq("factory_id", factoryId);

  const visibleProfiles = (profiles || []).filter(
    (p) => !isInternalProfileSection(p.section)
  );

  if (visibleProfiles.length === 0) {
    return {
      ok: false,
      error: "No business profile data. Fill Business Profile first.",
    };
  }

  const profileSummary = visibleProfiles
    .map((p) => {
      const sectionLabel = p.section
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      const entries = Object.entries(p.data as Record<string, string>)
        .filter(([, v]) => v && v.trim())
        .map(([k, v]) => `  ${k.replace(/_/g, " ")}: ${v}`)
        .join("\n");
      return `${sectionLabel}:\n${entries}`;
    })
    .join("\n\n");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("factory_id", factoryId)
    .order("category")
    .order("name");

  let productCatalog = "";
  if (products && products.length > 0) {
    const byCategory: Record<string, typeof products> = {};
    for (const p of products) {
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(p);
    }
    productCatalog =
      "\n\nPRODUCT CATALOG:\n" +
      Object.entries(byCategory)
        .map(
          ([cat, items]) =>
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
                  line +=
                    "\n    Details: " +
                    Object.entries(tags)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" | ");
                }
                return line;
              })
              .join("\n")
        )
        .join("\n");
  }

  const { data: combos } = await supabase
    .from("combo_solutions")
    .select("*")
    .eq("factory_id", factoryId)
    .order("created_at");

  let comboSection = "";
  if (combos && combos.length > 0) {
    comboSection =
      "\n\nCOMBO PACKAGES (include image link when customer asks):\n" +
      combos
        .map((c, i) => {
          let line = `${i + 1}. "${c.name}"`;
          const tags = c.tags as Record<string, string> | null;
          const meta = Object.entries(tags || {})
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`);
          if (meta.length > 0) line += `\n   ${meta.join(" | ")}`;
          if (c.items && Array.isArray(c.items) && c.items.length > 0) {
            line +=
              "\n   Items: " +
              (
                c.items as Array<{ name: string; qty: number; total: number }>
              )
                .map((it) => `${it.name} x${it.qty} (${it.total})`)
                .join(", ");
          }
          if (c.grand_total) line += `\n   Total: ${c.grand_total}`;
          if (c.image_url) line += `\n   Image: ![${c.name}](${c.image_url})`;
          return line;
        })
        .join("\n");
  }

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("factory_id", factoryId)
    .order("location_type")
    .order("city");

  let locationsSection = "";
  if (locations && locations.length > 0) {
    locationsSection =
      "\n\nDISTRIBUTOR & STORE LOCATIONS:\n" +
      locations
        .map((l) => {
          let line = `- ${l.name} (${l.location_type}) — ${l.city}`;
          if (l.area) line += `, ${l.area}`;
          if (l.phone) line += ` — Phone: ${l.phone}`;
          return line;
        })
        .join("\n");
  }

  const { data: compReport } = await supabase
    .from("competitive_reports")
    .select("report_data")
    .eq("factory_id", factoryId)
    .single();

  let competitiveSection = "";
  if (compReport?.report_data) {
    const r = compReport.report_data as Record<string, unknown>;
    const advantages = r.advantages as string[] | undefined;
    if (advantages && advantages.length > 0) {
      competitiveSection =
        "\n\nCOMPETITIVE ADVANTAGES (use these when customer compares or asks why choose us):\n" +
        advantages.map((a) => `- ${a}`).join("\n");
    }
  }

  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: MODELS.brain,
    max_tokens: BRAIN_MAX_OUTPUT_TOKENS,
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

  if (!systemPrompt.trim()) {
    return { ok: false, error: "Brain generation returned empty content." };
  }

  const { data: factory } = await supabase
    .from("factories")
    .select("name, city")
    .eq("id", factoryId)
    .single();

  const welcomeResponse = await claude.messages.create({
    model: MODELS.chat,
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Based on this business data, write a single short sentence (max 15 words) describing what this business makes or sells. No quotes, no business name, just what they offer. Use very simple English.\n\nBusiness: ${factory?.name || ""}, ${factory?.city || ""}\n${profileSummary}${productCatalog}${locationsSection}\n\nExamples of good output:\n- We make drip irrigation systems, pipes, fittings, and complete farm packages.\n- We manufacture steel doors, gates, and window frames.\n- We supply building materials — cement, sand, and hardware.\n\nWrite ONLY the one sentence, nothing else.`,
      },
    ],
  });

  const welcomeLine =
    welcomeResponse.content[0].type === "text"
      ? welcomeResponse.content[0].text.trim().replace(/^["']|["']$/g, "")
      : "";

  const updatedAt = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("factories")
    .update({
      system_prompt: systemPrompt,
      welcome_line: welcomeLine || null,
      updated_at: updatedAt,
    })
    .eq("id", factoryId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  return { ok: true, updated_at: updatedAt };
}
