import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get leads with chat message count
    const { data: leads, error } = await supabase
      .from("leads")
      .select(`
        id,
        phone,
        created_at,
        chat_sessions (
          id,
          chat_messages ( id )
        )
      `)
      .eq("factory_id", owner.factoryId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (leads || []).map((lead) => {
      const sessions = lead.chat_sessions || [];
      const messageCount = sessions.reduce(
        (acc: number, s: { chat_messages: { id: string }[] }) =>
          acc + (s.chat_messages?.length || 0),
        0
      );
      return {
        id: lead.id,
        phone: lead.phone,
        created_at: lead.created_at,
        message_count: messageCount,
        session_id: sessions[0]?.id || null,
      };
    });

    return NextResponse.json({ leads: formatted });
  } catch {
    return NextResponse.json(
      { error: "Failed to load leads" },
      { status: 500 }
    );
  }
}
