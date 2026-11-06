import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE, decrypt, encrypt, homeFor, type Role } from "./session";

export async function createSession(userId: string, role: Role) {
  const token = await encrypt({ userId, role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const session = await decrypt((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  // Strict session invalidation for suspended, rejected, or soft-deleted accounts
  const userRecord = user as typeof user & { deletedAt?: Date | null; status?: string };
  if (userRecord.status === "SUSPENDED" || userRecord.status === "REJECTED" || userRecord.deletedAt != null) {
    return null;
  }
  return user;
});

/** Use at the top of every protected page and server action. Pass one role or a list. */
export async function requireUser(role?: Role | Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    try {
      await deleteSession();
    } catch {
      // In Server Components headers might be read-only; redirect still clears via cookies or routes
    }
    redirect("/login");
  }
  const allowed = role === undefined ? null : Array.isArray(role) ? role : [role];
  if (allowed && !allowed.includes(user.role as Role)) redirect(homeFor(user.role as Role));
  return user;
}

/** Alumni and teachers can post jobs and notices. Returns the user and their area's base path. */
export async function requirePoster() {
  const user = await requireUser(["ALUMNI", "TEACHER"]);
  return { user, base: user.role === "TEACHER" ? "/teacher" : "/alumni" };
}
