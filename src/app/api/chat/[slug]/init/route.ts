import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient();

    const { data: factory, error } = await supabase
      .from("factories")
      .select("id, name, city, slug, is_active, welcome_line")
      .eq("slug", slug)
      .single();

    if (error || !factory) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!factory.is_active) {
      return NextResponse.json(
        { error: "This business is not yet active" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      factory: {
        id: factory.id,
        name: factory.name,
        city: factory.city,
        welcome_intro: factory.welcome_line || "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
