import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { mailLink, queueMail } from "@/lib/mail";
import { findToken, issueToken, revokeTokens } from "./tokens";

const { users } = schema;

/** Holds the pending login between the password and the 2FA step. */
export const CHALLENGE_COOKIE = "mcsl_2fa";

/** Sends the confirmation link for the account's current address. */
export async function sendVerificationMail(user: { id: string; email: string; username: string }) {
  const locale = await getLocale();
  const token = await issueToken(user.id, "verify_email", user.email);
  queueMail(
    user.email,
    "verifyEmail",
    { username: user.username, url: mailLink(`/verify-email?token=${token}`, locale) },
    locale,
  );
}

export type EmailConfirmation = "verified" | "changed" | "taken" | "invalid";

/**
 * Applies a link from a verify or change e-mail. Links stay valid until they expire, because
 * mail scanners often open them before the user does; applying one twice changes nothing.
 */
export async function confirmEmailToken(token: string): Promise<EmailConfirmation> {
  const verify = await findToken(token, "verify_email");
  if (verify) {
    const [user] = await db.select().from(users).where(eq(users.id, verify.userId)).limit(1);
    // A link for an address the account no longer uses proves nothing.
    if (!user || verify.email?.toLowerCase() !== user.email.toLowerCase()) return "invalid";
    if (!user.emailVerifiedAt) {
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, user.id));
    }
    return "verified";
  }

  const change = await findToken(token, "change_email");
  if (!change?.email) return "invalid";
  const email = change.email.toLowerCase();
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(sql`lower(${users.email}) = ${email}`, ne(users.id, change.userId)))
    .limit(1);
  if (taken) return "taken";
  await db.update(users).set({ email, emailVerifiedAt: new Date() }).where(eq(users.id, change.userId));
  // Links still pointing at the old address are worthless now.
  await revokeTokens(change.userId, "verify_email");
  return "changed";
}
