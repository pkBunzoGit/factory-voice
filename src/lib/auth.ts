import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const AGENT_COOKIE = "fv-agent-token";
const OWNER_COOKIE = "fv-owner-token";

function getSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return new TextEncoder().encode(secret);
}

// --- Agent JWT ---

export async function createAgentToken(agentId: string, email: string) {
  return new SignJWT({ sub: agentId, email, role: "agent" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAgentToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { sub: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function setAgentCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AGENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getAgentFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AGENT_COOKIE)?.value;
  if (!token) return null;
  return verifyAgentToken(token);
}

export async function clearAgentCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AGENT_COOKIE);
}

// --- Owner JWT ---

export async function createOwnerToken(ownerId: string, email: string, factoryId: string) {
  return new SignJWT({ sub: ownerId, email, factoryId, role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyOwnerToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { sub: string; email: string; factoryId: string; role: string };
  } catch {
    return null;
  }
}

export async function setOwnerCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(OWNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getOwnerFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_COOKIE)?.value;
  if (!token) return null;
  return verifyOwnerToken(token);
}

export async function clearOwnerCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_COOKIE);
}

export { AGENT_COOKIE, OWNER_COOKIE };
