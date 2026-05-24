import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";

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

    const { data, error } = await supabase
      .from("combo_solutions")
      .select("*")
      .eq("factory_id", id)
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ combos: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to load combos" }, { status: 500 });
  }
}

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
    const body = await request.json();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("combo_solutions")
      .insert({
        factory_id: id,
        name: body.name || "Untitled Package",
        tags: body.tags || {},
        items: body.items || [],
        grand_total: body.grand_total || null,
        image_url: body.image_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ combo: data });
  } catch {
    return NextResponse.json({ error: "Failed to save combo" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAgentFromCookie();
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comboId = request.nextUrl.searchParams.get("combo_id");
    if (!comboId) {
      return NextResponse.json({ error: "combo_id required" }, { status: 400 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("combo_solutions")
      .delete()
      .eq("id", comboId)
      .eq("factory_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete combo" }, { status: 500 });
  }
}
