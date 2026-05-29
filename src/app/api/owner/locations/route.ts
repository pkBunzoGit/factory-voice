import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { regenerateBrain } from "@/lib/regenerate-brain";

export async function GET() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("factory_id", owner.factoryId)
      .order("location_type")
      .order("city");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ locations: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to load locations" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locations } = await request.json();

    if (!Array.isArray(locations)) {
      return NextResponse.json({ error: "locations must be an array" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const factoryId = owner.factoryId;

    await supabase.from("locations").delete().eq("factory_id", factoryId);

    if (locations.length > 0) {
      const rows = locations.map((l: Record<string, unknown>) => ({
        factory_id: factoryId,
        name: l.name || "",
        city: l.city || "",
        area: l.area || null,
        phone: l.phone || null,
        location_type: l.location_type || "distributor",
      }));

      const { error } = await supabase.from("locations").insert(rows);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const brain = await regenerateBrain(supabase, factoryId);

    return NextResponse.json({ ok: true, brain });
  } catch {
    return NextResponse.json({ error: "Failed to save locations" }, { status: 500 });
  }
}
