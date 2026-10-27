import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { decryptSecret, hashRecoveryCode } from "./crypto";
import { generateRecoveryCodes, looksLikeRecoveryCode, normalizeRecoveryCode, verifyTotp } from "./totp";

const { users, recoveryCodes } = schema;

type TotpUser = Pick<schema.User, "id" | "totpSecret" | "totpLastStep">;

/** Checks an authenticator code and remembers its time step against replays. */
export async function checkTotp(user: TotpUser, code: string) {
  if (!user.totpSecret) return false;
  const step = verifyTotp(decryptSecret(user.totpSecret), code, user.totpLastStep);
  if (step === null) return false;
  await db.update(users).set({ totpLastStep: step }).where(eq(users.id, user.id));
  return true;
}

/** Uses up a recovery code. Each code works once. */
export async function redeemRecoveryCode(userId: string, code: string) {
  if (!looksLikeRecoveryCode(code)) return false;
  const used = await db
    .update(recoveryCodes)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(recoveryCodes.userId, userId),
        eq(recoveryCodes.codeHash, hashRecoveryCode(normalizeRecoveryCode(code))),
        isNull(recoveryCodes.usedAt),
      ),
    )
    .returning({ id: recoveryCodes.id });
  return used.length > 0;
}

/** Accepts either a 6-digit authenticator code or a recovery code. */
export async function checkSecondFactor(user: TotpUser, code: string) {
  return (await checkTotp(user, code)) || (await redeemRecoveryCode(user.id, code));
}

/** Replaces all recovery codes and returns the new plain codes (shown once). */
export async function replaceRecoveryCodes(userId: string) {
  const codes = generateRecoveryCodes();
  await db.transaction(async (tx) => {
    await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
    await tx
      .insert(recoveryCodes)
      .values(codes.map((code) => ({ userId, codeHash: hashRecoveryCode(normalizeRecoveryCode(code)) })));
  });
  return codes;
}

export async function remainingRecoveryCodes(userId: string) {
  const rows = await db
    .select({ id: recoveryCodes.id })
    .from(recoveryCodes)
    .where(and(eq(recoveryCodes.userId, userId), isNull(recoveryCodes.usedAt)));
  return rows.length;
}
