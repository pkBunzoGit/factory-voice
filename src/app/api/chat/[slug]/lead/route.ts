import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { leadCaptureSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const parsed = leadCaptureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get factory by slug
    const { data: factory } = await supabase
      .from("factories")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!factory) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Reuse existing lead for this phone number, or create a new one
    let leadId: string;
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("factory_id", factory.id)
      .eq("phone", parsed.data.phone)
      .limit(1)
      .single();

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      const { data: newLead, error: leadErr } = await supabase
        .from("leads")
        .insert({ factory_id: factory.id, phone: parsed.data.phone })
        .select()
        .single();
      if (leadErr) {
        return NextResponse.json({ error: leadErr.message }, { status: 500 });
      }
      leadId = newLead.id;
    }

    // Always create a new chat session for this visit
    const { data: session, error: sessionErr } = await supabase
      .from("chat_sessions")
      .insert({ factory_id: factory.id, lead_id: leadId })
      .select()
      .single();

    if (sessionErr) {
      return NextResponse.json({ error: sessionErr.message }, { status: 500 });
    }

    return NextResponse.json({ session_id: session.id, lead_id: leadId });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
