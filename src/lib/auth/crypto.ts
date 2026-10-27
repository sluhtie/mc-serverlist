import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

/** Random token for links and cookies; only its hash is stored. */
export function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Keyed hash for recovery codes, so a database dump alone cannot be brute-forced offline. */
export function hashRecoveryCode(normalized: string) {
  return crypto.createHmac("sha256", env.appSecret).update(`recovery:${normalized}`).digest("hex");
}

function secretKey() {
  return crypto.createHash("sha256").update(`totp:${env.appSecret}`).digest();
}

/** AES-256-GCM, stored as iv.tag.ciphertext (base64url). */
export function encryptSecret(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(stored: string) {
  const [iv, tag, data] = stored.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
