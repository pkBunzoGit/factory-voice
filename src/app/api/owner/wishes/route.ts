import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const year = new Date().getFullYear();

    const { data, error } = await supabase
      .from("wish_posts")
      .select("*")
      .eq("factory_id", owner.factoryId)
      .eq("year", year)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to load wish posts" }, { status: 500 });
  }
}
