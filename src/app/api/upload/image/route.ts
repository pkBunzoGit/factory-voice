import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgentFromCookie, getOwnerFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const agent = await getAgentFromCookie();
    const owner = await getOwnerFromCookie();
    if (!agent && !owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const factoryId = formData.get("factory_id") as string;

    if (!file || !factoryId) {
      return NextResponse.json(
        { error: "file and factory_id are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `${factoryId}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabase.storage
      .from("combo-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("combo-images")
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
