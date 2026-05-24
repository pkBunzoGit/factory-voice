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
      .from("products")
      .select("*")
      .eq("factory_id", id)
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
    const { products } = await request.json();

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "products must be an array" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Delete existing products for this factory, then bulk insert
    await supabase.from("products").delete().eq("factory_id", id);

    if (products.length > 0) {
      const rows = products.map((p: Record<string, unknown>) => ({
        factory_id: id,
        category: p.category || "",
        sub_category: p.sub_category || null,
        name: p.name || "",
        size_spec: p.size_spec || null,
        unit_price: p.unit_price || null,
        price_unit: p.price_unit || null,
      }));

      const { error } = await supabase.from("products").insert(rows);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save products" }, { status: 500 });
  }
}
