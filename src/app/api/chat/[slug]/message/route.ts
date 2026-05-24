import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getClaudeClient, MODELS, CHAT_CONFIG } from "@/lib/claude";
import { chatMessageSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const parsed = chatMessageSchema.safeParse({ message: body.message });
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0].message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { message } = parsed.data;
    const sessionId = body.session_id;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createServiceClient();

    // Get factory + system prompt
    const { data: factory } = await supabase
      .from("factories")
      .select("id, system_prompt")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!factory?.system_prompt) {
      return new Response(
        JSON.stringify({ error: "Business not found or not active" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Save user message
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    });

    // Load most recent chat history (descending to get latest, then reverse for chronological order)
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(CHAT_CONFIG.maxHistoryMessages);

    const messages = (history || [])
      .reverse()
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Stream response from Claude
    const claude = getClaudeClient();

    const stream = await claude.messages.stream({
      model: MODELS.chat,
      max_tokens: CHAT_CONFIG.maxTokens,
      temperature: CHAT_CONFIG.temperature,
      system: factory.system_prompt,
      messages,
    });

    // SSE response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          // Save full assistant message (only if non-empty)
          if (fullResponse.trim()) {
            await supabase.from("chat_messages").insert({
              session_id: sessionId,
              role: "assistant",
              content: fullResponse,
            });
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`
              )
            );
            controller.close();
          } catch {
            // controller already closed
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
