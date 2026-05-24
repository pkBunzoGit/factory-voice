import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("combo_solutions")
      .select("*")
      .eq("factory_id", owner.factoryId)
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ combos: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to load combos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("combo_solutions")
      .insert({
        factory_id: owner.factoryId,
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

export async function DELETE(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comboId = request.nextUrl.searchParams.get("combo_id");
    if (!comboId) {
      return NextResponse.json({ error: "combo_id required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("combo_solutions")
      .delete()
      .eq("id", comboId)
      .eq("factory_id", owner.factoryId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete combo" }, { status: 500 });
  }
}
