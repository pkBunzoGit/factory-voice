import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";
import {
  isInternalProfileSection,
  regenerateBrain,
} from "@/lib/regenerate-brain";

export async function GET() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: factory } = await supabase
      .from("factories")
      .select("id, name, city, slug, is_active, logo_url, brand_colors, updated_at")
      .eq("id", owner.factoryId)
      .single();

    const { data: profiles } = await supabase
      .from("factory_profiles")
      .select("section, data")
      .eq("factory_id", owner.factoryId);

    const visibleProfiles = (profiles || []).filter(
      (p) => !isInternalProfileSection(p.section)
    );

    return NextResponse.json({
      factory,
      profiles: visibleProfiles,
      bot_updated_at: factory?.updated_at || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: "section and data are required" },
        { status: 400 }
      );
    }

    if (isInternalProfileSection(section)) {
      return NextResponse.json(
        { error: "Invalid profile section" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { error: profileErr } = await supabase
      .from("factory_profiles")
      .upsert(
        {
          factory_id: owner.factoryId,
          section,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "factory_id,section" }
      );

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    const brain = await regenerateBrain(supabase, owner.factoryId);

    return NextResponse.json({
      ok: true,
      brain,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
