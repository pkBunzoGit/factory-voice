import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS } from "@/lib/claude";

export async function POST() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const factoryId = owner.factoryId;

    // Gather owner's business context
    const [factoryRes, profilesRes, productsRes, combosRes, locationsRes] =
      await Promise.all([
        supabase
          .from("factories")
          .select("name, city")
          .eq("id", factoryId)
          .single(),
        supabase
          .from("factory_profiles")
          .select("section, data")
          .eq("factory_id", factoryId),
        supabase
          .from("products")
          .select("category, name, unit_price, price_unit, tags")
          .eq("factory_id", factoryId)
          .order("category"),
        supabase
          .from("combo_solutions")
          .select("name, grand_total, tags")
          .eq("factory_id", factoryId),
        supabase
          .from("locations")
          .select("name, city, location_type")
          .eq("factory_id", factoryId),
      ]);

    const factory = factoryRes.data;
    if (!factory) {
      return NextResponse.json({ error: "Factory not found" }, { status: 404 });
    }

    // Build business context string
    const profileSummary = (profilesRes.data || [])
      .map((p) => {
        const entries = Object.entries(p.data as Record<string, string>)
          .filter(([, v]) => v?.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        return `${p.section}: ${entries}`;
      })
      .join("\n");

    const productList = (productsRes.data || [])
      .map((p) => {
        let line = `${p.category} > ${p.name}`;
        if (p.unit_price) line += ` — ${p.unit_price} ${p.price_unit || ""}`;
        const tags = p.tags as Record<string, string> | null;
        if (tags && Object.keys(tags).length > 0) {
          line += ` (${Object.entries(tags).map(([k, v]) => `${k}: ${v}`).join(", ")})`;
        }
        return line;
      })
      .join("\n");

    const comboList = (combosRes.data || [])
      .map((c) => {
        let line = c.name;
        if (c.grand_total) line += ` — Total: ${c.grand_total}`;
        return line;
      })
      .join("\n");

    const locationList = (locationsRes.data || [])
      .map((l) => `${l.name} (${l.location_type}) in ${l.city}`)
      .join("\n");

    // Check for existing competitors the owner may have edited
    const { data: existingCompetitors } = await supabase
      .from("competitors")
      .select("name, city, products_summary, strengths, weaknesses, is_ai_generated")
      .eq("factory_id", factoryId);

    const existingContext =
      existingCompetitors && existingCompetitors.length > 0
        ? `\n\nThe owner has already identified these competitors (refine and expand on them):\n${existingCompetitors
            .map((c) => `- ${c.name}${c.city ? ` (${c.city})` : ""}${c.products_summary ? `: ${c.products_summary}` : ""}`)
            .join("\n")}`
        : "";

    const claude = getClaudeClient();

    const response = await claude.messages.create({
      model: MODELS.brain,
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `You are a competitive intelligence analyst. Analyze the competitive landscape for the business described below.

BUSINESS PROFILE:
Name: ${factory.name}
Location: ${factory.city}
${profileSummary}

PRODUCTS:
${productList || "Not specified"}

COMBO PACKAGES:
${comboList || "None"}

DISTRIBUTION:
${locationList || "Not specified"}
${existingContext}

Based on your knowledge of this industry and region, provide:

1. COMPETITORS: Identify 3-5 likely competitors in the same industry and region. For each, provide:
   - name: Company name
   - city: Their location
   - products_summary: What they sell (1 line)
   - strengths: What they're good at (1 line)
   - weaknesses: Where they fall short (1 line)

2. ANALYSIS: A competitive landscape summary covering:
   - overall_position: Where this business stands in the market (1-2 sentences)
   - advantages: 3-4 bullet points on what makes this business strong
   - gaps: 2-3 areas where competitors may have an edge
   - opportunities: 2-3 actionable suggestions to gain competitive advantage
   - pricing_position: Whether this business is premium/mid-range/budget relative to market

Respond ONLY with valid JSON in this exact format:
{
  "competitors": [
    {"name": "...", "city": "...", "products_summary": "...", "strengths": "...", "weaknesses": "..."}
  ],
  "analysis": {
    "overall_position": "...",
    "advantages": ["...", "..."],
    "gaps": ["...", "..."],
    "opportunities": ["...", "..."],
    "pricing_position": "..."
  }
}

Return ONLY the JSON, no markdown fences, no explanation.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let parsed;
    try {
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid data. Try again." },
        { status: 500 }
      );
    }

    const { competitors: aiCompetitors, analysis } = parsed;

    // Save competitors
    await supabase.from("competitors").delete().eq("factory_id", factoryId);

    if (Array.isArray(aiCompetitors) && aiCompetitors.length > 0) {
      const rows = aiCompetitors.map((c: Record<string, string>) => ({
        factory_id: factoryId,
        name: c.name || "Unknown",
        city: c.city || null,
        products_summary: c.products_summary || null,
        strengths: c.strengths || null,
        weaknesses: c.weaknesses || null,
        is_ai_generated: true,
      }));

      await supabase.from("competitors").insert(rows);
    }

    // Save analysis report
    await supabase.from("competitive_reports").upsert(
      {
        factory_id: factoryId,
        report_data: analysis || {},
        generated_at: new Date().toISOString(),
      },
      { onConflict: "factory_id" }
    );

    // Re-fetch saved competitors (to get IDs)
    const { data: savedCompetitors } = await supabase
      .from("competitors")
      .select("*")
      .eq("factory_id", factoryId)
      .order("created_at");

    return NextResponse.json({
      competitors: savedCompetitors || [],
      report: analysis || null,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Competitive analysis error:", err);
    return NextResponse.json(
      { error: "Failed to generate competitive analysis" },
      { status: 500 }
    );
  }
}
