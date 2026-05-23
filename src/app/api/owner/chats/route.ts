import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify session belongs to owner's factory
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("id, factory_id")
      .eq("id", sessionId)
      .eq("factory_id", owner.factoryId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to load chat" },
      { status: 500 }
    );
  }
}
