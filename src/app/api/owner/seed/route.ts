import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/owner/seed
 * Creates a test owner for development. Remove this route before production.
 * Body: { email, name, password, factory_id }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const { email, name, password, factory_id } = await request.json();

    if (!email || !password || !factory_id) {
      return NextResponse.json(
        { error: "Provide email, password, and factory_id" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("owners")
      .upsert(
        { email, name: name || null, password_hash: passwordHash, factory_id },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ owner: { id: data.id, email: data.email, name: data.name } });
  } catch {
    return NextResponse.json({ error: "Failed to seed owner" }, { status: 500 });
  }
}
