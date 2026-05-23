import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const agent = await getAgentFromCookie();
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: factories, error } = await supabase
      .from("factories")
      .select("*")
      .eq("agent_id", agent.sub)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ factories: factories || [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to load factories" },
      { status: 500 }
    );
  }
}
