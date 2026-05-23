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
