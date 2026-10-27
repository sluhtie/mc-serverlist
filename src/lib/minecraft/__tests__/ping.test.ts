import { describe, expect, it } from "vitest";
import { decodeVarInt, encodeVarInt, parseStatus } from "../ping";

describe("VarInt", () => {
  it.each([0, 1, 127, 128, 255, 25565, 2147483647])("round-trips %i", (value) => {
    const encoded = encodeVarInt(value);
    expect(decodeVarInt(encoded)).toEqual({ value, size: encoded.length });
  });

  it("encodes -1 as five bytes", () => {
    expect([...encodeVarInt(-1)]).toEqual([0xff, 0xff, 0xff, 0xff, 0x0f]);
  });

  it("returns null for incomplete input", () => {
    expect(decodeVarInt(Buffer.from([0x80]))).toBeNull();
  });
});

describe("parseStatus", () => {
  it("extracts players, version and favicon", () => {
    const result = parseStatus(
      JSON.stringify({
        version: { name: "Paper 1.21.4", protocol: 769 },
        players: { online: 5, max: 20 },
        description: "Hello",
        favicon: "data:image/png;base64,AAAA",
      }),
      12,
    );
    expect(result).toMatchObject({
      online: true,
      version: "Paper 1.21.4",
      playersOnline: 5,
      playersMax: 20,
      favicon: "data:image/png;base64,AAAA",
      latencyMs: 12,
    });
  });

  it("drops favicons that are not PNG data URLs", () => {
    const result = parseStatus(JSON.stringify({ favicon: "javascript:alert(1)" }), 1);
    expect(result.online && result.favicon).toBeNull();
  });

  it("fails on invalid JSON", () => {
    expect(parseStatus("nope", 1)).toEqual({ online: false, error: "invalid status json" });
  });
});
