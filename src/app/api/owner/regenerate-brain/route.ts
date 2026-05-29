import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { regenerateBrain } from "@/lib/regenerate-brain";

export async function POST() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const brain = await regenerateBrain(supabase, owner.factoryId);

    if (!brain.ok) {
      return NextResponse.json(
        { ok: false, brain },
        { status: brain.error.includes("No business profile") ? 400 : 500 }
      );
    }

    return NextResponse.json({ ok: true, brain });
  } catch (err) {
    console.error("Regenerate brain error:", err);
    return NextResponse.json(
      {
        ok: false,
        brain: { ok: false, error: "Failed to update chat bot. Please try again." },
      },
      { status: 500 }
    );
  }
}
