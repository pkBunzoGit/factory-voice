import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export async function GET() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("factories")
      .select("logo_url, brand_colors")
      .eq("id", owner.factoryId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logo_url: data?.logo_url || null,
      brand_colors: (data?.brand_colors as BrandColors) || { primary: "", secondary: "", accent: "" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load brand settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.brand_colors !== undefined) {
      update.brand_colors = body.brand_colors;
    }
    if (body.logo_url !== undefined) {
      update.logo_url = body.logo_url;
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("factories")
      .update(update)
      .eq("id", owner.factoryId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update brand settings" }, { status: 500 });
  }
}
