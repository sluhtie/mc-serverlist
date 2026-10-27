"use server";

import bcrypt from "bcryptjs";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { decryptSecret, encryptSecret } from "@/lib/auth/crypto";
import { requireUser } from "@/lib/auth/session";
import { issueToken } from "@/lib/auth/tokens";
import { generateTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { checkSecondFactor, checkTotp, replaceRecoveryCodes } from "@/lib/auth/two-factor";
import { sendVerificationMail } from "@/lib/auth/verification";
import { db, schema } from "@/lib/db";
import { str, type FormState } from "@/lib/form";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { mailLink, queueMail } from "@/lib/mail";
import { rateLimit } from "@/lib/security";

const { users, recoveryCodes } = schema;

export type TwoFactorState = FormState & { recoveryCodes?: string[] };

async function loadUser(next: string) {
  const session = await requireUser(next);
  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  return user;
}

export async function resendVerification(): Promise<FormState> {
  const [user, t] = await Promise.all([requireUser("/settings"), getDictionary()]);
  if (user.emailVerified) return { success: t.settings.alreadyVerified };
  if (!rateLimit(`verify-mail:${user.id}`, 3, 60 * 60 * 1000)) return { error: t.errors.tooManyRequests };
  await sendVerificationMail(user);
  return { success: t.settings.verificationSent(user.email) };
}

export async function changeEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const [user, t, locale] = await Promise.all([loadUser("/settings"), getDictionary(), getLocale()]);
  const parsed = z.email(t.errors.invalidEmail).max(255).safeParse(str(formData, "email").toLowerCase());
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message } };
  const email = parsed.data;

  if (!(await bcrypt.compare(String(formData.get("current") ?? ""), user.passwordHash))) {
    return { fieldErrors: { current: t.errors.wrongPassword } };
  }
  if (email === user.email.toLowerCase()) return { fieldErrors: { email: t.errors.sameEmail } };
  if (!rateLimit(`change-email:${user.id}`, 3, 60 * 60 * 1000)) return { error: t.errors.tooManyRequests };

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(sql`lower(${users.email}) = ${email}`, ne(users.id, user.id)))
    .limit(1);
  if (taken) return { fieldErrors: { email: t.errors.emailTaken } };

  const token = await issueToken(user.id, "change_email", email);
  queueMail(
    email,
    "changeEmail",
    { username: user.username, email, url: mailLink(`/verify-email?token=${token}`, locale) },
    locale,
  );
  queueMail(user.email, "emailChanged", { username: user.username, email }, locale);
  return { success: t.settings.changeEmailSent(email) };
}

/** Creates a fresh, not yet enabled secret; the settings page then shows its QR code. */
export async function startTotpSetup() {
  const user = await loadUser("/settings");
  if (!user.totpEnabledAt) {
    await db
      .update(users)
      .set({ totpSecret: encryptSecret(generateTotpSecret()), totpLastStep: null })
      .where(eq(users.id, user.id));
  }
  revalidatePath("/settings");
}

export async function cancelTotpSetup() {
  const user = await requireUser("/settings");
  await db
    .update(users)
    .set({ totpSecret: null })
    .where(and(eq(users.id, user.id), isNull(users.totpEnabledAt)));
  revalidatePath("/settings");
}

export async function enableTotp(_prev: TwoFactorState, formData: FormData): Promise<TwoFactorState> {
  const [user, t, locale] = await Promise.all([loadUser("/settings"), getDictionary(), getLocale()]);
  if (user.totpEnabledAt) return { error: t.settings.twoFactorAlreadyOn };
  if (!user.totpSecret) return { error: t.settings.setupExpired };
  if (!rateLimit(`2fa-setup:${user.id}`, 10, 15 * 60 * 1000)) return { error: t.errors.tooManyCodes };

  // The first code proves the app was set up correctly before 2FA is switched on.
  const step = verifyTotp(decryptSecret(user.totpSecret), str(formData, "code"), null);
  if (step === null) return { fieldErrors: { code: t.errors.invalidCode } };

  await db.update(users).set({ totpEnabledAt: new Date(), totpLastStep: step }).where(eq(users.id, user.id));
  const codes = await replaceRecoveryCodes(user.id);
  queueMail(user.email, "twoFactor", { username: user.username, enabled: true }, locale);
  return { success: t.settings.twoFactorEnabled, recoveryCodes: codes };
}

export async function disableTotp(_prev: FormState, formData: FormData): Promise<FormState> {
  const [user, t, locale] = await Promise.all([loadUser("/settings"), getDictionary(), getLocale()]);
  if (!user.totpEnabledAt) return { error: t.settings.twoFactorAlreadyOff };
  if (!rateLimit(`2fa:${user.id}`, 5, 15 * 60 * 1000)) return { error: t.errors.tooManyCodes };

  if (!(await bcrypt.compare(String(formData.get("current") ?? ""), user.passwordHash))) {
    return { fieldErrors: { current: t.errors.wrongPassword } };
  }
  if (!(await checkSecondFactor(user, str(formData, "code")))) {
    return { fieldErrors: { code: t.errors.invalidCode } };
  }

  await db
    .update(users)
    .set({ totpSecret: null, totpEnabledAt: null, totpLastStep: null })
    .where(eq(users.id, user.id));
  await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, user.id));
  queueMail(user.email, "twoFactor", { username: user.username, enabled: false }, locale);
  revalidatePath("/settings");
  return { success: t.settings.twoFactorDisabled };
}

export async function regenerateRecoveryCodes(_prev: TwoFactorState, formData: FormData): Promise<TwoFactorState> {
  const [user, t] = await Promise.all([loadUser("/settings"), getDictionary()]);
  if (!user.totpEnabledAt) return { error: t.settings.twoFactorAlreadyOff };
  if (!rateLimit(`2fa:${user.id}`, 5, 15 * 60 * 1000)) return { error: t.errors.tooManyCodes };
  // Only a fresh authenticator code, so a leaked recovery code cannot mint new ones.
  if (!(await checkTotp(user, str(formData, "code")))) {
    return { fieldErrors: { code: t.errors.invalidCode } };
  }
  return { success: t.settings.codesRegenerated, recoveryCodes: await replaceRecoveryCodes(user.id) };
}
