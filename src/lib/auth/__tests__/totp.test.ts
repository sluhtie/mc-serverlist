import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  formatSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hotp,
  looksLikeRecoveryCode,
  normalizeRecoveryCode,
  otpauthUri,
  totpStep,
  verifyTotp,
} from "../totp";

// RFC 6238 appendix B uses the ASCII secret "12345678901234567890" for SHA-1.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));

describe("base32", () => {
  it("round-trips arbitrary bytes", () => {
    const bytes = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 42]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });

  it("matches the RFC 4648 test vectors", () => {
    expect(base32Encode(Buffer.from("foobar"))).toBe("MZXW6YTBOI");
    expect(base32Decode("MZXW6YTBOI").toString()).toBe("foobar");
  });

  it("ignores case, spaces and padding", () => {
    expect(base32Decode("mzxw 6ytb oi==").toString()).toBe("foobar");
  });

  it("rejects invalid characters", () => {
    expect(() => base32Decode("MZXW1")).toThrow();
  });
});

describe("hotp / totp", () => {
  it("matches the RFC 4226 HOTP values", () => {
    expect(hotp(RFC_SECRET, 0)).toBe("755224");
    expect(hotp(RFC_SECRET, 1)).toBe("287082");
    expect(hotp(RFC_SECRET, 9)).toBe("520489");
  });

  it("matches the RFC 6238 TOTP values (last 6 of 8 digits)", () => {
    expect(hotp(RFC_SECRET, totpStep(59_000), 8)).toBe("94287082");
    expect(hotp(RFC_SECRET, totpStep(1_111_111_109_000), 8)).toBe("07081804");
    expect(hotp(RFC_SECRET, totpStep(2_000_000_000_000), 8)).toBe("69279037");
  });

  it("accepts the current and adjacent codes and returns the step", () => {
    const now = 1_700_000_000_000;
    const step = totpStep(now);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step), null, now)).toBe(step);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step - 1), null, now)).toBe(step - 1);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step + 1), null, now)).toBe(step + 1);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step - 3), null, now)).toBeNull();
  });

  it("tolerates spaces in the input", () => {
    const now = 1_700_000_000_000;
    const code = hotp(RFC_SECRET, totpStep(now));
    expect(verifyTotp(RFC_SECRET, `${code.slice(0, 3)} ${code.slice(3)}`, null, now)).not.toBeNull();
  });

  it("rejects replays and older codes", () => {
    const now = 1_700_000_000_000;
    const step = totpStep(now);
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step), step, now)).toBeNull();
    expect(verifyTotp(RFC_SECRET, hotp(RFC_SECRET, step - 1), step - 1, now)).toBeNull();
  });

  it("rejects malformed codes", () => {
    expect(verifyTotp(RFC_SECRET, "12345", null)).toBeNull();
    expect(verifyTotp(RFC_SECRET, "abcdef", null)).toBeNull();
    expect(verifyTotp(RFC_SECRET, "", null)).toBeNull();
  });
});

describe("secrets and URIs", () => {
  it("generates 160-bit base32 secrets", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(secret)).toHaveLength(20);
    expect(generateTotpSecret()).not.toBe(secret);
  });

  it("builds an otpauth URI with issuer and account", () => {
    const uri = otpauthUri("JBSWY3DPEHPK3PXP", "steve@example.net", "MCServerlist");
    expect(uri.startsWith("otpauth://totp/MCServerlist:steve%40example.net?")).toBe(true);
    const params = new URL(uri).searchParams;
    expect(params.get("secret")).toBe("JBSWY3DPEHPK3PXP");
    expect(params.get("issuer")).toBe("MCServerlist");
    expect(params.get("digits")).toBe("6");
    expect(params.get("period")).toBe("30");
  });

  it("groups the secret for manual entry", () => {
    expect(formatSecret("JBSWY3DPEHPK3PXP")).toBe("JBSW Y3DP EHPK 3PXP");
  });
});

describe("recovery codes", () => {
  it("generates ten unique, readable codes", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/);
      expect(code).not.toMatch(/[01ilo]/);
    }
  });

  it("normalizes case, spaces and dashes", () => {
    expect(normalizeRecoveryCode(" ABCDE-fghjk ")).toBe("abcdefghjk");
    expect(looksLikeRecoveryCode("ABCDE FGHJK")).toBe(true);
    expect(looksLikeRecoveryCode("123456")).toBe(false);
  });
});
