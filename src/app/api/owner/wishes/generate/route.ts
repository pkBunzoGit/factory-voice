import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS } from "@/lib/claude";
import { getOpenAIClient, IMAGE_MODEL, IMAGE_CONFIG } from "@/lib/openai";
interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

const MAX_POSTS_PER_EVENT = 3;

export async function POST(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { event_name, event_date, event_region } = await request.json();
    if (!event_name || !event_date) {
      return NextResponse.json({ error: "event_name and event_date are required" }, { status: 400 });
    }

    const region: "zambia" | "africa" | "global" = event_region || "global";

    const supabase = createServiceClient();
    const factoryId = owner.factoryId;
    const year = new Date().getFullYear();

    // Check post limit
    const { data: existing } = await supabase
      .from("wish_posts")
      .select("generation_number")
      .eq("factory_id", factoryId)
      .eq("event_date", event_date)
      .eq("year", year)
      .order("generation_number", { ascending: false })
      .limit(1);

    const currentCount = existing?.[0]?.generation_number || 0;
    if (currentCount >= MAX_POSTS_PER_EVENT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_POSTS_PER_EVENT} posts per event reached` },
        { status: 400 }
      );
    }

    // Fetch business context (including brand settings)
    const [factoryRes, profilesRes, productsRes] = await Promise.all([
      supabase.from("factories").select("name, city, brand_colors").eq("id", factoryId).single(),
      supabase.from("factory_profiles").select("section, data").eq("factory_id", factoryId),
      supabase.from("products").select("category, name").eq("factory_id", factoryId).limit(10),
    ]);

    const factory = factoryRes.data;
    if (!factory) {
      return NextResponse.json({ error: "Factory not found" }, { status: 404 });
    }

    const brandColors = (factory.brand_colors as BrandColors) || {};
    const hasBrandColors =
      !!(brandColors.primary || brandColors.secondary || brandColors.accent);

    const profileSummary = (profilesRes.data || [])
      .map((p) => {
        const entries = Object.entries(p.data as Record<string, string>)
          .filter(([, v]) => v?.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        return `${p.section}: ${entries}`;
      })
      .join(". ");

    const categories = [...new Set((productsRes.data || []).map((p) => p.category))].join(", ");

    // Build brand context note for Claude
    const brandColorNote = hasBrandColors
      ? `\nBrand Colors (MUST USE for COLORS line): ${[brandColors.primary, brandColors.secondary, brandColors.accent].filter(Boolean).join(", ")}`
      : "";

    // Step 1: Claude generates business description, visual style hints, and caption
    const claude = getClaudeClient();
    const claudeResponse = await claude.messages.create({
      model: MODELS.chat,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are helping a business create a social media wish post for "${event_name}".

Business: "${factory.name}" based in ${factory.city}.
Context: ${profileSummary}
Products: ${categories}${brandColorNote}

Return EXACTLY three sections separated by ---

SECTION 1 (BUSINESS): A one-line description of what this company does. Keep it simple and visual — describe the industry/products in plain words (e.g. "drip irrigation products" not "16mm dual emitter drip tape"). Max 10 words.

---

SECTION 2 (VISUAL STYLE): Suggest visual elements for the image that fit THIS specific industry.
${region === "global" ? "IMPORTANT: This is a GLOBAL/WORLDWIDE event — do NOT suggest African maps, Zambian flags, or Africa-specific geography/landmarks. Use universally relatable, artistic scenes." : region === "africa" ? "This is an African regional event — African imagery, landscapes, and cultural elements are appropriate." : "This is a Zambian national event — Zambian and African imagery, landmarks, and cultural elements are welcome."}
Return exactly 3 comma-separated items for each line:
SCENE: a photorealistic background scene fitting the industry ${region === "global" ? '(use universal imagery — e.g. "lush green farmland at sunset" or "modern office workspace" — NO African maps or region-specific geography)' : '(e.g. "lush green farmland at sunset" or "modern office workspace" or "construction site at dawn")'}
PRODUCTS: what products to show in circular frames at the bottom (e.g. "black irrigation pipes and drippers" or "laptops and servers" or "wooden furniture pieces")
DECORATIONS: subtle decorative elements fitting the industry (e.g. "floating leaves and water droplets" or "geometric tech patterns" or "wood grain textures")
COLORS: ${hasBrandColors ? `Use the brand's actual colors: ${[brandColors.primary, brandColors.secondary, brandColors.accent].filter(Boolean).join(", ")} — blend them with event-appropriate accents` : 'a color palette fitting the brand and industry (e.g. "earth tones, greens, warm golds" or "sleek blues, silvers, white" or "warm browns, cream, forest green")'}

---

SECTION 3 (CAPTION): A social media caption for ${event_name}.
- 3-4 lines maximum
- Warm greeting for ${event_name}
- Include 1-2 interesting facts about ${event_name}
- Tie it naturally to the business (don't force it)
- End with company name
- Simple English, warm and professional
- 2-3 relevant hashtags at the end

Write ONLY the three sections with --- between them, nothing else.`,
        },
      ],
    });

    const claudeText =
      claudeResponse.content[0].type === "text"
        ? claudeResponse.content[0].text.trim()
        : "";

    const sections = claudeText.split("---").map((s) => s.trim());
    const businessDesc = sections[0] || categories;
    const visualHints = sections[1] || "";
    const caption = sections.slice(2).join("---").trim();

    // Parse visual hints
    const sceneLine = visualHints.match(/SCENE:\s*(.+)/i)?.[1]?.trim() || "professional industry setting";
    const productsLine = visualHints.match(/PRODUCTS:\s*(.+)/i)?.[1]?.trim() || businessDesc;
    const decorLine = visualHints.match(/DECORATIONS:\s*(.+)/i)?.[1]?.trim() || "subtle design elements";
    const colorsLine = hasBrandColors
      ? [brandColors.primary, brandColors.secondary, brandColors.accent].filter(Boolean).join(", ")
      : (visualHints.match(/COLORS:\s*(.+)/i)?.[1]?.trim() || "professional, vibrant colors");

    // Step 2: Generate image with GPT Image (logo composited separately via sharp)
    const openai = getOpenAIClient();

    const brandInstruction = hasBrandColors
      ? `- PRIMARY BRAND COLORS: ${[brandColors.primary, brandColors.secondary, brandColors.accent].filter(Boolean).join(", ")} — these are the company's official brand colors. Use them as the dominant palette throughout the design.`
      : `- Color palette: ${colorsLine}`;

    const locationLine = region === "global"
      ? `Create a professional social media wish post image for a company called "${factory.name}" that makes ${businessDesc}.`
      : `Create a professional social media wish post image for a company called "${factory.name}" that makes ${businessDesc}, based in ${factory.city || "Zambia"}.`;

    const regionInstruction = region === "global"
      ? "- IMPORTANT: This is a GLOBAL event. Do NOT include African maps, country outlines, flags, or region-specific geography. Use artistic, universally relatable imagery."
      : region === "africa"
        ? "- African imagery, landscapes, and cultural elements are appropriate for this regional event."
        : "- Zambian and African imagery, landmarks, flags, and cultural elements are welcome for this national event.";

    const imagePrompt = `${locationLine}

Event: ${event_name}

Visual design brief:
- Top-right: Company name "${factory.name}" in bold professional font
- Center: A large, beautiful silhouette or visual related to ${event_name} — filled with a photorealistic scene of ${sceneLine}. NOT a flat cartoon.
- Text: "Happy ${event_name}!" in bold, stylized typography with colors matching the event theme
- Bottom strip: Show 4-5 photorealistic images of ${productsLine} arranged in small circular frames on a dark band
- Decorative elements: ${decorLine}
${brandInstruction}
${regionInstruction}
- Overall style: High-end corporate social media post, photorealistic elements mixed with clean graphic design. NOT cartoon, NOT flat illustration. Think professional brand campaign quality.
- Square 1:1 format`;

    const imageResponse = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: imagePrompt,
      n: 1,
      size: IMAGE_CONFIG.size,
      quality: IMAGE_CONFIG.quality,
    });

    const imageData = imageResponse.data?.[0];
    if (!imageData) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    // Get generated image as buffer
    let generatedBuffer: Buffer;

    if (imageData.b64_json) {
      generatedBuffer = Buffer.from(imageData.b64_json, "base64");
    } else if (imageData.url) {
      const imgRes = await fetch(imageData.url);
      generatedBuffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      return NextResponse.json({ error: "Failed to process generated image" }, { status: 500 });
    }

    // Upload to Supabase Storage
    const fileName = `${factoryId}/${Date.now()}_wish.png`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, generatedBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);
    const imageUrl = publicUrl.publicUrl;

    // Step 3: Save to database
    const nextNum = currentCount + 1;
    const { data: saved, error: saveError } = await supabase
      .from("wish_posts")
      .insert({
        factory_id: factoryId,
        event_name,
        event_date,
        image_url: imageUrl,
        caption,
        generation_number: nextNum,
        year,
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ post: saved });
  } catch (err) {
    console.error("Wish post generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate wish post" },
      { status: 500 }
    );
  }
}
