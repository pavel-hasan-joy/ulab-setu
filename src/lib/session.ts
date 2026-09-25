// Edge-safe session helpers (used by proxy.ts and server code).
import { SignJWT, jwtVerify } from "jose";

export type Role = "STUDENT" | "ALUMNI" | "ADMIN";
export type SessionPayload = { userId: string; role: Role };

export const SESSION_COOKIE = "setu_session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function homeFor(role: Role) {
  if (role === "ALUMNI") return "/alumni";
  if (role === "ADMIN") return "/admin";
  return "/student";
}
