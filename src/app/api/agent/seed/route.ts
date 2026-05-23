import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/agent/seed
 * Creates a test agent for development. Remove this route before production.
 * Body: { email, name, pin }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const { email, name, pin } = await request.json();

    if (!email || !name || !pin || pin.length !== 6) {
      return NextResponse.json(
        { error: "Provide email, name, and a 6-digit pin" },
        { status: 400 }
      );
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("agents")
      .upsert({ email, name, pin_hash: pinHash, is_active: true }, { onConflict: "email" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agent: { id: data.id, email: data.email, name: data.name } });
  } catch {
    return NextResponse.json({ error: "Failed to seed agent" }, { status: 500 });
  }
}
