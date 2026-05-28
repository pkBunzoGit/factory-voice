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

    const ALLOWED_BUCKETS = ["combo-images", "product-images", "factory-logos"];
    const bucketParam = (formData.get("bucket") as string) || "combo-images";
    if (!ALLOWED_BUCKETS.includes(bucketParam)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    // factory-logos maps to product-images bucket with a logos/ subfolder
    const isLogo = bucketParam === "factory-logos";
    const bucket = isLogo ? "product-images" : bucketParam;

    const supabase = createServiceClient();
    const ext = file.name.split(".").pop() || "png";
    const path = isLogo
      ? `${factoryId}/logos/logo.${ext}`
      : `${factoryId}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: isLogo,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
