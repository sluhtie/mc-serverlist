import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildV1Payload, buildV2Payload } from "../votifier";

const vote = { serviceName: "Test", username: "Notch", address: "1.2.3.4", timestamp: 1700000000000 };

describe("Votifier v2", () => {
  it("signs the payload with HMAC-SHA256", () => {
    const packet = buildV2Payload(vote, "secret", "challenge123");
    expect(packet.readUInt16BE(0)).toBe(0x733a);
    const length = packet.readUInt16BE(2);
    const message = JSON.parse(packet.subarray(4, 4 + length).toString());
    const payload = JSON.parse(message.payload);
    expect(payload).toMatchObject({ ...vote, challenge: "challenge123" });
    const expected = crypto.createHmac("sha256", "secret").update(message.payload).digest("base64");
    expect(message.signature).toBe(expected);
  });
});

describe("Votifier v1", () => {
  it("encrypts a block the private key can read", () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    const base64Key = publicKey.export({ type: "spki", format: "der" }).toString("base64");
    const block = buildV1Payload(vote, base64Key);
    expect(block.length).toBe(256);
    const plain = crypto
      .privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING }, block)
      .toString();
    expect(plain).toBe("VOTE\nTest\nNotch\n1.2.3.4\n1700000000000\n");
  });
});
