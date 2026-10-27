// Time-based one-time passwords (RFC 6238) as used by Google Authenticator, Aegis, 1Password & co.
// Implemented on node:crypto so there is no dependency for a few dozen lines of math.
import crypto from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOTP_PERIOD = 30;
const DIGITS = 6;
// Accept the previous and next code too, so a slightly wrong clock still works.
const WINDOW = 1;

export function base32Encode(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string) {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** 160-bit secret, the size RFC 4226 recommends for HMAC-SHA1. */
export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function hotp(secret: string, counter: number, digits = DIGITS) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(message).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export function totpStep(now = Date.now()) {
  return Math.floor(now / 1000 / TOTP_PERIOD);
}

/**
 * Checks a code and returns the matching time step, or null. Steps at or before `lastStep`
 * are rejected, so a code that was already used (or an older one) cannot be replayed.
 */
export function verifyTotp(secret: string, code: string, lastStep: number | null, now = Date.now()) {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const current = totpStep(now);
  for (let step = current - WINDOW; step <= current + WINDOW; step++) {
    if (lastStep !== null && step <= lastStep) continue;
    const expected = hotp(secret, step);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return step;
  }
  return null;
}

/** URI for the QR code that authenticator apps scan. */
export function otpauthUri(secret: string, account: string, issuer: string) {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(TOTP_PERIOD),
  });
  return `otpauth://totp/${label}?${params}`;
}

/** Groups the secret in blocks of four for typing it in by hand. */
export function formatSecret(secret: string) {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

// Recovery codes: no 0/O/1/l so they survive being written down.
const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const RECOVERY_CODE_COUNT = 10;

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT) {
  return Array.from({ length: count }, () => {
    const chars = Array.from({ length: 10 }, () => RECOVERY_ALPHABET[crypto.randomInt(RECOVERY_ALPHABET.length)]);
    return `${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
  });
}

/** Case, spaces and dashes do not matter when a recovery code is typed in. */
export function normalizeRecoveryCode(code: string) {
  return code.toLowerCase().replace(/[\s-]/g, "");
}

export function looksLikeRecoveryCode(code: string) {
  return /^[a-z0-9]{10}$/.test(normalizeRecoveryCode(code));
}
