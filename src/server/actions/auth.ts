"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createSession, destroySession, requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { fieldErrorsFrom, str, type FormState } from "@/lib/form";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getDictionary, localRedirect } from "@/lib/i18n/server";
import { getClientIp, rateLimit } from "@/lib/security";

const { users } = schema;

// Built per request, so validation messages come in the visitor's language.
const passwordSchema = (t: Dictionary) =>
  z.string().min(8, t.errors.minChars(8)).max(128, t.errors.maxChars(128));

const registerSchema = (t: Dictionary) =>
  z.object({
    email: z.email(t.errors.invalidEmail).max(255),
    username: z.string().regex(/^[A-Za-z0-9_]{3,32}$/, t.errors.usernameRule),
    password: passwordSchema(t),
  });

let dummyHash: string | undefined;

/** Only same-site paths; `next` holds an internal path, localized on redirect. */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const [ip, t] = await Promise.all([getClientIp(), getDictionary()]);
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: t.errors.tooManyRegistrations };
  }

  const parsed = registerSchema(t).safeParse({
    email: str(formData, "email").toLowerCase(),
    username: str(formData, "username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { email, username, password } = parsed.data;

  const existing = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(sql`lower(${users.email}) = ${email} or lower(${users.username}) = ${username.toLowerCase()}`);
  if (existing.some((u) => u.email.toLowerCase() === email)) {
    return { fieldErrors: { email: t.errors.emailTaken } };
  }
  if (existing.length > 0) return { fieldErrors: { username: t.errors.usernameTaken } };

  const role = env.adminEmails.includes(email) ? "admin" : "user";
  const [user] = await db
    .insert(users)
    .values({ email, username, passwordHash: await bcrypt.hash(password, 12), role })
    .returning({ id: users.id });

  await createSession(user.id);
  return localRedirect(safeNext(str(formData, "next") || "/account"));
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const [ip, t] = await Promise.all([getClientIp(), getDictionary()]);
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return { error: t.errors.tooManyLogins };
  }

  const identifier = str(formData, "identifier").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${identifier} or lower(${users.username}) = ${identifier}`)
    .limit(1);

  // Compare against a dummy hash when the user is unknown to keep timing similar.
  dummyHash ??= await bcrypt.hash("timing-equalizer", 12);
  const hash = user?.passwordHash ?? dummyHash;
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) return { error: t.errors.invalidLogin };
  if (user.banned) return { error: t.errors.banned };

  if (user.role !== "admin" && env.adminEmails.includes(user.email.toLowerCase())) {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
  }

  await createSession(user.id);
  return localRedirect(safeNext(str(formData, "next") || "/"));
}

export async function logout() {
  await destroySession();
  await localRedirect("/");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const [user, t] = await Promise.all([requireUser("/account"), getDictionary()]);
  const current = String(formData.get("current") ?? "");
  const parsed = passwordSchema(t).safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) {
    return { fieldErrors: { current: t.errors.wrongPassword } };
  }
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data, 12) })
    .where(eq(users.id, user.id));
  // Sign out every other device.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
  await createSession(user.id);
  return { success: t.errors.passwordChanged };
}
