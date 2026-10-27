import "server-only";
import crypto from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { localRedirect } from "@/lib/i18n/server";

const COOKIE_NAME = "mcsl_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt });
  // Opportunistic cleanup so the table does not grow forever.
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.secureCookies,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  }
  jar.delete(COOKIE_NAME);
}

/** Returns the logged-in user, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      username: schema.users.username,
      role: schema.users.role,
      banned: schema.users.banned,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(
      and(eq(schema.sessions.id, hashToken(token)), gt(schema.sessions.expiresAt, new Date())),
    )
    .limit(1);
  const row = rows[0];
  if (!row || row.banned) return null;
  return { id: row.id, email: row.email, username: row.username, role: row.role };
});

export async function requireUser(next = "/") {
  const user = await getCurrentUser();
  // `next` stays an internal path; the login action localizes it again.
  if (!user) return localRedirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "admin") await localRedirect("/");
  return user;
}
