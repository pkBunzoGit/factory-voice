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

    const { data: competitors, error } = await supabase
      .from("competitors")
      .select("*")
      .eq("factory_id", owner.factoryId)
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: report } = await supabase
      .from("competitive_reports")
      .select("report_data, generated_at")
      .eq("factory_id", owner.factoryId)
      .single();

    return NextResponse.json({
      competitors: competitors || [],
      report: report?.report_data || null,
      generated_at: report?.generated_at || null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load competitors" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitors } = await request.json();

    if (!Array.isArray(competitors)) {
      return NextResponse.json({ error: "competitors must be an array" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const factoryId = owner.factoryId;

    await supabase.from("competitors").delete().eq("factory_id", factoryId);

    if (competitors.length > 0) {
      const rows = competitors.map((c: Record<string, unknown>) => ({
        factory_id: factoryId,
        name: c.name || "",
        city: c.city || null,
        products_summary: c.products_summary || null,
        strengths: c.strengths || null,
        weaknesses: c.weaknesses || null,
        is_ai_generated: c.is_ai_generated ?? true,
      }));

      const { error } = await supabase.from("competitors").insert(rows);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save competitors" }, { status: 500 });
  }
}
