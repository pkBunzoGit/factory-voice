import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";
import { createOwnerToken, setOwnerCookie } from "@/lib/auth";
import { ownerLoginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ownerLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = createServiceClient();

    const { data: owner, error } = await supabase
      .from("owners")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !owner) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, owner.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createOwnerToken(owner.id, owner.email, owner.factory_id);
    await setOwnerCookie(token);

    return NextResponse.json({
      owner: { id: owner.id, name: owner.name, email: owner.email },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
