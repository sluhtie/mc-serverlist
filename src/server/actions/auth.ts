"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSession, destroySession, requireUser } from "@/lib/auth/session";
import { consumeToken, findToken, issueToken, revokeTokens, TOKEN_TTL } from "@/lib/auth/tokens";
import { CHALLENGE_COOKIE, sendVerificationMail } from "@/lib/auth/verification";
import { checkSecondFactor } from "@/lib/auth/two-factor";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { fieldErrorsFrom, str, type FormState } from "@/lib/form";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getDictionary, getLocale, localRedirect } from "@/lib/i18n/server";
import { mailLink, queueMail } from "@/lib/mail";
import { getClientIp, rateLimit } from "@/lib/security";

const { users, sessions } = schema;


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
    .returning({ id: users.id, email: users.email, username: users.username });

  await sendVerificationMail(user);
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

  const next = safeNext(str(formData, "next") || "/");
  if (user.totpEnabledAt) {
    // Password is right, but the session only starts after the second factor.
    const token = await issueToken(user.id, "login_2fa");
    (await cookies()).set(CHALLENGE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.secureCookies,
      path: "/",
      maxAge: TOKEN_TTL.login_2fa / 1000,
    });
    return localRedirect(`/login/2fa?next=${encodeURIComponent(next)}`);
  }

  await createSession(user.id);
  return localRedirect(next);
}

export async function verifyLoginChallenge(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getDictionary();
  const jar = await cookies();
  const token = jar.get(CHALLENGE_COOKIE)?.value ?? "";
  const challenge = await findToken(token, "login_2fa");
  if (!challenge) return localRedirect("/login?expired=1");

  // Six digits are guessable with enough tries, so attempts are limited per account.
  if (!rateLimit(`2fa:${challenge.userId}`, 5, 15 * 60 * 1000)) {
    return { error: t.errors.tooManyCodes };
  }

  const [user] = await db.select().from(users).where(eq(users.id, challenge.userId)).limit(1);
  if (!user || user.banned || !user.totpEnabledAt) return localRedirect("/login");
  if (!(await checkSecondFactor(user, str(formData, "code")))) {
    return { fieldErrors: { code: t.errors.invalidCode } };
  }

  await consumeToken(token, "login_2fa");
  jar.delete(CHALLENGE_COOKIE);
  await createSession(user.id);
  return localRedirect(safeNext(str(formData, "next") || "/"));
}

export async function logout() {
  await destroySession();
  await localRedirect("/");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const [user, t, locale] = await Promise.all([requireUser("/settings"), getDictionary(), getLocale()]);
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
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await revokeTokens(user.id, "reset_password");
  await createSession(user.id);
  queueMail(row.email, "passwordChanged", { username: row.username }, locale);
  return { success: t.errors.passwordChanged };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const [ip, t, locale] = await Promise.all([getClientIp(), getDictionary(), getLocale()]);
  const parsed = z.email(t.errors.invalidEmail).safeParse(str(formData, "email").toLowerCase());
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message } };
  const email = parsed.data;
  if (!rateLimit(`reset:${ip}`, 5, 60 * 60 * 1000) || !rateLimit(`reset:${email}`, 3, 60 * 60 * 1000)) {
    return { error: t.errors.tooManyRequests };
  }

  const [user] = await db
    .select({ id: users.id, username: users.username, email: users.email, banned: users.banned })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  if (user && !user.banned) {
    const token = await issueToken(user.id, "reset_password", user.email);
    queueMail(
      user.email,
      "resetPassword",
      { username: user.username, url: mailLink(`/reset-password?token=${token}`, locale) },
      locale,
    );
  }
  // Same answer either way, so the form cannot be used to find out who has an account.
  return { success: t.auth.resetSent };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const [ip, t, locale] = await Promise.all([getClientIp(), getDictionary(), getLocale()]);
  if (!rateLimit(`reset-confirm:${ip}`, 10, 15 * 60 * 1000)) {
    return { error: t.errors.tooManyRequests };
  }
  const parsed = passwordSchema(t).safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };

  const token = await consumeToken(str(formData, "token"), "reset_password");
  if (!token) return { error: t.errors.linkInvalid };

  const [user] = await db.select().from(users).where(eq(users.id, token.userId)).limit(1);
  if (!user) return { error: t.errors.linkInvalid };
  await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(parsed.data, 12),
      // The link proves access to the inbox, as long as the address did not change since.
      ...(token.email?.toLowerCase() === user.email.toLowerCase() && !user.emailVerifiedAt
        ? { emailVerifiedAt: new Date() }
        : {}),
    })
    .where(eq(users.id, user.id));
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  queueMail(user.email, "passwordChanged", { username: user.username }, locale);
  // No automatic login: with 2FA on, the second factor is still required.
  return localRedirect("/login?reset=1");
}
