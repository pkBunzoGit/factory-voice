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
      .from("products")
      .select("*")
      .eq("factory_id", owner.factoryId)
      .order("category")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { products } = await request.json();

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "products must be an array" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const factoryId = owner.factoryId;

    await supabase.from("products").delete().eq("factory_id", factoryId);

    if (products.length > 0) {
      const rows = products.map((p: Record<string, unknown>) => ({
        factory_id: factoryId,
        category: p.category || "",
        sub_category: p.sub_category || null,
        name: p.name || "",
        size_spec: p.size_spec || null,
        unit_price: p.unit_price || null,
        price_unit: p.price_unit || null,
        tags: p.tags || {},
        image_url: p.image_url || null,
      }));

      const { error } = await supabase.from("products").insert(rows);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const brain = await regenerateBrain(supabase, factoryId);

    return NextResponse.json({ ok: true, brain });
  } catch {
    return NextResponse.json({ error: "Failed to save products" }, { status: 500 });
  }
}
