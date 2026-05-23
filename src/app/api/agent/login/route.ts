import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";
import { createAgentToken, setAgentCookie } from "@/lib/auth";
import { agentLoginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = agentLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, pin } = parsed.data;
    const supabase = createServiceClient();

    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: "Invalid email or PIN" },
        { status: 401 }
      );
    }

    const pinValid = await bcrypt.compare(pin, agent.pin_hash);
    if (!pinValid) {
      return NextResponse.json(
        { error: "Invalid email or PIN" },
        { status: 401 }
      );
    }

    const token = await createAgentToken(agent.id, agent.email);
    await setAgentCookie(token);

    return NextResponse.json({
      agent: { id: agent.id, name: agent.name, email: agent.email },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
