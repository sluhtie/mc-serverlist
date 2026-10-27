"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { fieldErrorsFrom, str, type FormState } from "@/lib/form";
import { getClientIp, rateLimit } from "@/lib/security";

const { users } = schema;

const passwordSchema = z
  .string()
  .min(8, "Mindestens 8 Zeichen")
  .max(128, "Höchstens 128 Zeichen");

const registerSchema = z.object({
  email: z.email("Ungültige E-Mail-Adresse").max(255),
  username: z
    .string()
    .regex(/^[A-Za-z0-9_]{3,32}$/, "3–32 Zeichen, nur Buchstaben, Zahlen und _"),
  password: passwordSchema,
});

let dummyHash: string | undefined;

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getClientIp();
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Zu viele Registrierungen. Bitte später erneut versuchen." };
  }

  const parsed = registerSchema.safeParse({
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
    return { fieldErrors: { email: "E-Mail ist bereits registriert" } };
  }
  if (existing.length > 0) return { fieldErrors: { username: "Benutzername ist vergeben" } };

  const role = env.adminEmails.includes(email) ? "admin" : "user";
  const [user] = await db
    .insert(users)
    .values({ email, username, passwordHash: await bcrypt.hash(password, 12), role })
    .returning({ id: users.id });

  await createSession(user.id);
  redirect(safeNext(str(formData, "next") || "/account"));
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getClientIp();
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return { error: "Zu viele Anmeldeversuche. Bitte in 15 Minuten erneut versuchen." };
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
  if (!user || !valid) return { error: "E-Mail/Benutzername oder Passwort ist falsch." };
  if (user.banned) return { error: "Dieser Account wurde gesperrt." };

  if (user.role !== "admin" && env.adminEmails.includes(user.email.toLowerCase())) {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
  }

  await createSession(user.id);
  redirect(safeNext(str(formData, "next") || "/"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const current = String(formData.get("current") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) {
    return { fieldErrors: { current: "Aktuelles Passwort ist falsch" } };
  }
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data, 12) })
    .where(eq(users.id, user.id));
  // Sign out every other device.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
  await createSession(user.id);
  return { success: "Passwort geändert." };
}
