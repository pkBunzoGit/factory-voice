import { NextResponse } from "next/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image_base64, media_type } = await request.json();

    if (!image_base64) {
      return NextResponse.json({ error: "image_base64 is required" }, { status: 400 });
    }

    const claude = getClaudeClient();

    const response = await claude.messages.create({
      model: MODELS.brain,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: media_type || "image/png",
                data: image_base64,
              },
            },
            {
              type: "text",
              text: `Extract all data from this pricing/package/bundle sheet image. Return ONLY valid JSON with this structure:
{
  "package_name": "string - the package/combo/bundle name",
  "tags": { "key": "value" },
  "items": [
    {"name": "item name", "qty": number, "unit_price": number, "total": number}
  ],
  "grand_total": number
}
The "tags" field should contain any contextual metadata found on the sheet — for example crop, area, land size, material, coverage, spacing, use case, or any other relevant details. Use short readable keys.
Return ONLY the JSON object, no markdown, no explanation.`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let extracted;
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extracted = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse extracted data", raw: text },
        { status: 422 }
      );
    }

    return NextResponse.json({ extracted });
  } catch (err) {
    console.error("Owner combo extraction error:", err);
    return NextResponse.json(
      { error: "Failed to extract data from image" },
      { status: 500 }
    );
  }
}
