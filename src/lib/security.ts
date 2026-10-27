import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/** Client IP as seen by the reverse proxy (Traefik in Dokploy sets X-Forwarded-For). */
export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}

/** IPs are only stored as salted hashes. */
export function hashIp(ip: string) {
  return crypto.createHmac("sha256", env.appSecret).update(ip).digest("hex");
}

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Small in-memory fixed-window rate limiter. Good enough for a single instance;
 * swap for Redis if you run several replicas.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count++;
  return bucket.count <= limit;
}

export async function verifyTurnstile(token: string | null, ip: string) {
  const secret = env.turnstileSecretKey;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
