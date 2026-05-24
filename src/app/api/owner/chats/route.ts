import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";

interface SessionGroup {
  session_id: string;
  visit_number: number;
  started_at: string;
  messages: { id: string; role: string; content: string; created_at: string }[];
}

export async function GET(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const leadId = request.nextUrl.searchParams.get("lead_id");
    const sessionId = request.nextUrl.searchParams.get("session_id");

    // Resolve all lead IDs for this customer (same phone, same factory)
    let leadIds: string[] = [];

    if (leadId) {
      // Find the phone for this lead, then all leads with that phone
      const { data: lead } = await supabase
        .from("leads")
        .select("phone")
        .eq("id", leadId)
        .single();

      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const { data: allLeads } = await supabase
        .from("leads")
        .select("id")
        .eq("factory_id", owner.factoryId)
        .eq("phone", lead.phone);

      leadIds = (allLeads || []).map((l) => l.id);
    } else if (sessionId) {
      // Resolve session -> lead -> phone -> all leads
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("lead_id")
        .eq("id", sessionId)
        .eq("factory_id", owner.factoryId)
        .single();

      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const { data: lead } = await supabase
        .from("leads")
        .select("phone")
        .eq("id", session.lead_id)
        .single();

      if (lead) {
        const { data: allLeads } = await supabase
          .from("leads")
          .select("id")
          .eq("factory_id", owner.factoryId)
          .eq("phone", lead.phone);

        leadIds = (allLeads || []).map((l) => l.id);
      }
    } else {
      return NextResponse.json(
        { error: "lead_id or session_id is required" },
        { status: 400 }
      );
    }

    if (leadIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    // Fetch all sessions across all lead IDs for this customer
    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("id, started_at")
      .in("lead_id", leadIds)
      .eq("factory_id", owner.factoryId)
      .order("started_at", { ascending: true });

    const groups: SessionGroup[] = [];

    for (const s of sessions || []) {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", s.id)
        .order("created_at", { ascending: true });

      if (msgs && msgs.length > 0) {
        groups.push({
          session_id: s.id,
          visit_number: groups.length + 1,
          started_at: s.started_at,
          messages: msgs,
        });
      }
    }

    return NextResponse.json({ sessions: groups });
  } catch {
    return NextResponse.json(
      { error: "Failed to load chat" },
      { status: 500 }
    );
  }
}
