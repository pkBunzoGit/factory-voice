import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS } from "@/lib/claude";

export async function GET() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: factory } = await supabase
      .from("factories")
      .select("id, name, city, slug, is_active")
      .eq("id", owner.factoryId)
      .single();

    const { data: profiles } = await supabase
      .from("factory_profiles")
      .select("section, data")
      .eq("factory_id", owner.factoryId);

    return NextResponse.json({ factory, profiles: profiles || [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: "section and data are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Update profile section
    const { error: profileErr } = await supabase
      .from("factory_profiles")
      .upsert(
        {
          factory_id: owner.factoryId,
          section,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "factory_id,section" }
      );

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // Regenerate system prompt
    const { data: profiles } = await supabase
      .from("factory_profiles")
      .select("section, data")
      .eq("factory_id", owner.factoryId);

    if (profiles && profiles.length > 0) {
      const profileSummary = profiles
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

      const claude = getClaudeClient();

      const response = await claude.messages.create({
        model: MODELS.brain,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are building an AI customer assistant for a manufacturing business. Based on the factory data below, write a concise system prompt that the AI assistant will use to answer customer queries over chat.

The system prompt should:
- State the business name, location, and what they do
- Include product details, price ranges (if available), and MOQ
- Include lead times and capacity info
- Mention the owner's name for escalation
- Instruct the bot to be helpful, professional, and concise
- Tell the bot to never make up prices — only share ranges that were provided
- Tell the bot to ask the customer to contact the owner directly for exact quotes, custom work, or anything not covered
- Keep responses short (2-4 sentences), suitable for a chat interface

Factory Data:
${profileSummary}

Write ONLY the system prompt, nothing else.`,
          },
        ],
      });

      const systemPrompt =
        response.content[0].type === "text" ? response.content[0].text : "";

      await supabase
        .from("factories")
        .update({
          system_prompt: systemPrompt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", owner.factoryId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
