import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";

export async function PUT(
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
      .select("system_prompt")
      .eq("id", id)
      .single();

    if (!factory?.system_prompt) {
      return NextResponse.json(
        { error: "Generate the bot profile first" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("factories")
      .update({
        is_active: true,
        visit_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch slug for the chat link
    const { data: updated } = await supabase
      .from("factories")
      .select("slug")
      .eq("id", id)
      .single();

    return NextResponse.json({ ok: true, slug: updated?.slug });
  } catch {
    return NextResponse.json(
      { error: "Failed to approve" },
      { status: 500 }
    );
  }
}
