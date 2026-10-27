"use server";

import { and, eq, gt, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { VOTE_COOLDOWN_HOURS } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { str, type FormState } from "@/lib/form";
import { getDictionary } from "@/lib/i18n/server";
import { PLAYER_NAME_PATTERN } from "@/lib/minecraft/player";
import { sendVote } from "@/lib/minecraft/votifier";
import { getClientIp, hashIp, rateLimit, verifyTurnstile } from "@/lib/security";

const { servers, votes } = schema;

export async function castVote(_prev: FormState, formData: FormData): Promise<FormState> {
  const [ip, t] = await Promise.all([getClientIp(), getDictionary()]);
  if (!rateLimit(`vote:${ip}`, 20, 60 * 60 * 1000)) {
    return { error: t.errors.tooManyRequests };
  }

  const parsedName = z.string().regex(PLAYER_NAME_PATTERN, t.errors.playerName).safeParse(str(formData, "username"));
  if (!parsedName.success) {
    return { fieldErrors: { username: parsedName.error.issues[0].message } };
  }
  const username = parsedName.data;

  if (!(await verifyTurnstile(str(formData, "cf-turnstile-response") || null, ip))) {
    return { error: t.errors.captcha };
  }

  const [server] = await db
    .select()
    .from(servers)
    .where(and(eq(servers.id, str(formData, "serverId")), eq(servers.published, true)))
    .limit(1);
  if (!server) return { error: t.errors.serverNotFound };

  const user = await getCurrentUser();
  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - VOTE_COOLDOWN_HOURS * 60 * 60 * 1000);

  const identity = [
    eq(votes.ipHash, ipHash),
    sql`lower(${votes.username}) = ${username.toLowerCase()}`,
  ];
  if (user) identity.push(eq(votes.userId, user.id));

  const [recent] = await db
    .select({ createdAt: votes.createdAt })
    .from(votes)
    .where(and(eq(votes.serverId, server.id), gt(votes.createdAt, since), or(...identity)))
    .orderBy(votes.createdAt)
    .limit(1);
  if (recent) {
    const next = new Date(recent.createdAt.getTime() + VOTE_COOLDOWN_HOURS * 60 * 60 * 1000);
    const hours = Math.max(1, Math.ceil((next.getTime() - Date.now()) / (60 * 60 * 1000)));
    return { error: t.errors.alreadyVoted(hours) };
  }

  const [vote] = await db
    .insert(votes)
    .values({ serverId: server.id, userId: user?.id ?? null, username, ipHash })
    .returning({ id: votes.id });

  let delivered = false;
  if (server.votifierEnabled && server.votifierHost && server.votifierPort) {
    try {
      await sendVote(
        {
          host: server.votifierHost,
          port: server.votifierPort,
          protocol: server.votifierProtocol,
          publicKey: server.votifierPublicKey,
          token: server.votifierToken,
        },
        { serviceName: env.siteName, username, address: ip, timestamp: Date.now() },
      );
      delivered = true;
      await db.update(votes).set({ delivered: true }).where(eq(votes.id, vote.id));
    } catch (err) {
      console.warn(`[vote] Votifier delivery to ${server.slug} failed:`, (err as Error).message);
    }
  }

  revalidatePath(`/server/${server.slug}`);
  revalidatePath("/");
  return {
    success: delivered ? t.errors.voteDelivered(username) : t.errors.voteThanks(username),
  };
}
