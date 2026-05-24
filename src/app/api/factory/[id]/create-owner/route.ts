import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAgentFromCookie();
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name, email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json(
        { error: "email and pin are required" },
        { status: 400 }
      );
    }

    if (pin.length < 4) {
      return NextResponse.json(
        { error: "PIN must be at least 4 characters" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if owner already exists for this factory
    const { data: existing } = await supabase
      .from("owners")
      .select("id")
      .eq("factory_id", id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An owner account already exists for this factory" },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(pin, 10);

    const { data: owner, error } = await supabase
      .from("owners")
      .insert({
        factory_id: id,
        email,
        password_hash,
        name: name || null,
      })
      .select("id, email, name")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ owner });
  } catch {
    return NextResponse.json(
      { error: "Failed to create owner account" },
      { status: 500 }
    );
  }
}
