import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";
import { regenerateBrain } from "@/lib/regenerate-brain";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAgentFromCookie();
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    const { data: factory, error: factoryErr } = await supabase
      .from("factories")
      .select("id")
      .eq("id", id)
      .single();

    if (factoryErr || !factory) {
      return NextResponse.json({ error: "Factory not found" }, { status: 404 });
    }

    const brain = await regenerateBrain(supabase, id);

    if (!brain.ok) {
      return NextResponse.json({ error: brain.error }, { status: 400 });
    }

    const { data: updated } = await supabase
      .from("factories")
      .select("system_prompt, welcome_line")
      .eq("id", id)
      .single();

    return NextResponse.json({
      system_prompt: updated?.system_prompt || "",
      welcome_line: updated?.welcome_line || null,
    });
  } catch (err) {
    console.error("Brain generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate bot profile" },
      { status: 500 }
    );
  }
}
