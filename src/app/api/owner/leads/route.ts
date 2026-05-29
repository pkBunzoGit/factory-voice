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

    // Get leads with chat sessions and message counts
    const { data: leads, error } = await supabase
      .from("leads")
      .select(`
        id,
        phone,
        name,
        created_at,
        chat_sessions (
          id,
          started_at,
          chat_messages ( id )
        )
      `)
      .eq("factory_id", owner.factoryId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by phone — same number may have multiple lead rows (legacy data)
    type SessionRow = { id: string; started_at: string; chat_messages: { id: string }[] };
    const byPhone = new Map<
      string,
      { id: string; phone: string; name: string | null; created_at: string; sessions: SessionRow[] }
    >();

    for (const lead of leads || []) {
      const sessions = (lead.chat_sessions || []) as SessionRow[];
      const leadName =
        typeof lead.name === "string" && lead.name.trim() ? lead.name.trim() : null;
      const existing = byPhone.get(lead.phone);
      if (!existing) {
        byPhone.set(lead.phone, {
          id: lead.id,
          phone: lead.phone,
          name: leadName,
          created_at: lead.created_at,
          sessions,
        });
      } else {
        existing.sessions.push(...sessions);
        if (leadName) existing.name = leadName;
        if (new Date(lead.created_at) < new Date(existing.created_at)) {
          existing.created_at = lead.created_at;
        }
      }
    }

    const formatted = Array.from(byPhone.values()).map((lead) => {
      const messageCount = lead.sessions.reduce(
        (acc, s) => acc + (s.chat_messages?.length || 0),
        0
      );
      const sessionCount = lead.sessions.length;
      // Find the most recent session date
      const lastVisitAt = lead.sessions.reduce((latest, s) => {
        const d = new Date(s.started_at);
        return d > latest ? d : latest;
      }, new Date(lead.created_at)).toISOString();
      const latestSession = lead.sessions.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )[0];
      return {
        id: lead.id,
        phone: lead.phone,
        name: lead.name,
        created_at: lead.created_at,
        last_visit_at: lastVisitAt,
        message_count: messageCount,
        session_count: sessionCount,
        session_id: latestSession?.id || null,
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
