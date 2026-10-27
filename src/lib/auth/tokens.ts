import "server-only";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hashToken, randomToken } from "./crypto";

const { userTokens } = schema;
type Purpose = (typeof schema.tokenPurposeEnum.enumValues)[number];

const HOUR = 60 * 60 * 1000;
export const TOKEN_TTL: Record<Purpose, number> = {
  verify_email: 48 * HOUR,
  change_email: 24 * HOUR,
  reset_password: HOUR,
  login_2fa: 10 * 60 * 1000,
};

/** Creates a single-use token. Older tokens of the same purpose stop working. */
export async function issueToken(userId: string, purpose: Purpose, email: string | null = null) {
  const token = randomToken();
  await db.transaction(async (tx) => {
    await tx.delete(userTokens).where(and(eq(userTokens.userId, userId), eq(userTokens.purpose, purpose)));
    await tx.delete(userTokens).where(lt(userTokens.expiresAt, new Date()));
    await tx.insert(userTokens).values({
      id: hashToken(token),
      userId,
      purpose,
      email,
      expiresAt: new Date(Date.now() + TOKEN_TTL[purpose]),
    });
  });
  return token;
}

/** Looks a token up without using it up (e.g. to show the reset form). */
export async function findToken(token: string, purpose: Purpose) {
  if (!token) return null;
  const [row] = await db
    .select()
    .from(userTokens)
    .where(
      and(eq(userTokens.id, hashToken(token)), eq(userTokens.purpose, purpose), gt(userTokens.expiresAt, new Date())),
    )
    .limit(1);
  return row ?? null;
}

/** Deletes and returns a valid token; a second call with the same token gets null. */
export async function consumeToken(token: string, purpose: Purpose) {
  if (!token) return null;
  const [row] = await db
    .delete(userTokens)
    .where(and(eq(userTokens.id, hashToken(token)), eq(userTokens.purpose, purpose)))
    .returning();
  return row && row.expiresAt > new Date() ? row : null;
}

export async function revokeTokens(userId: string, purpose: Purpose) {
  await db.delete(userTokens).where(and(eq(userTokens.userId, userId), eq(userTokens.purpose, purpose)));
}
