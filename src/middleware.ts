import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AGENT_COOKIE = "fv-agent-token";
const OWNER_COOKIE = "fv-owner-token";

function getSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function isValidToken(token: string) {
  const secret = getSecret();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect agent routes (except login)
  if (pathname.startsWith("/agent") && !pathname.startsWith("/agent/login")) {
    const token = request.cookies.get(AGENT_COOKIE)?.value;
    if (!token || !(await isValidToken(token))) {
      return NextResponse.redirect(new URL("/agent/login", request.url));
    }
  }

  // Protect owner routes (except login)
  if (pathname.startsWith("/owner") && !pathname.startsWith("/owner/login")) {
    const token = request.cookies.get(OWNER_COOKIE)?.value;
    if (!token || !(await isValidToken(token))) {
      return NextResponse.redirect(new URL("/owner/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/agent/:path*",
    "/owner/:path*",
  ],
};
