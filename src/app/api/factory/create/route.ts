import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";
import { createFactorySchema } from "@/lib/validators";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const agent = await getAgentFromCookie();
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createFactorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, city } = parsed.data;
    const supabase = createServiceClient();

    let slug = slugify(name);

    // Check for slug collision and append suffix if needed
    const { data: existing } = await supabase
      .from("factories")
      .select("slug")
      .eq("slug", slug)
      .single();

    if (existing) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${suffix}`;
    }

    const { data: factory, error } = await supabase
      .from("factories")
      .insert({
        slug,
        name,
        city,
        agent_id: agent.sub,
        is_active: false,
        visit_status: "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ factory });
  } catch {
    return NextResponse.json(
      { error: "Failed to create factory" },
      { status: 500 }
    );
  }
}
