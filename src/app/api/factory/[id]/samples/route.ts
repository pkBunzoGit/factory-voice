import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS, CHAT_CONFIG } from "@/lib/claude";

const SAMPLE_QUESTIONS = [
  "What products do you have available?",
  "What are your prices for MS angles?",
  "How long does delivery take?",
];

export async function GET(
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

    const { data: factory } = await supabase
      .from("factories")
      .select("system_prompt, name")
      .eq("id", id)
      .single();

    if (!factory?.system_prompt) {
      return NextResponse.json(
        { error: "Generate the bot profile first" },
        { status: 400 }
      );
    }

    const claude = getClaudeClient();
    const samples = [];

    for (const question of SAMPLE_QUESTIONS) {
      const response = await claude.messages.create({
        model: MODELS.chat,
        max_tokens: CHAT_CONFIG.maxTokens,
        temperature: CHAT_CONFIG.temperature,
        system: factory.system_prompt,
        messages: [{ role: "user", content: question }],
      });

      const answer =
        response.content[0].type === "text" ? response.content[0].text : "";

      samples.push({ question, answer });
    }

    return NextResponse.json({ samples });
  } catch (err) {
    console.error("Sample generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate samples" },
      { status: 500 }
    );
  }
}
