import { NextResponse } from "next/server";
import { clearAgentCookie } from "@/lib/auth";

export async function POST() {
  await clearAgentCookie();
  return NextResponse.json({ ok: true });
}
