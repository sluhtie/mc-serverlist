import { crc32, deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { decodePng, encodePng } from "../png";

function chunk(type: string, body: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])) >>> 0);
  return Buffer.concat([head, body, crc]);
}

function png(width: number, height: number, colorType: number, raw: Buffer, extra: Buffer[] = []) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    ...extra,
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("png", () => {
  it("round-trips RGBA images", () => {
    const data = new Uint8Array(3 * 2 * 4).map((_, i) => (i * 37) % 256);
    expect(decodePng(encodePng({ width: 3, height: 2, data }))).toEqual({ width: 3, height: 2, data });
  });

  it("undoes sub, up, average and paeth filters", () => {
    // 2x4 grayscale image, one filter type per row (values worked out by hand from the spec).
    const raw = Buffer.from([
      1, 10, 10, // sub: 10, 10+10
      2, 20, 20, // up: 10+20, 20+20
      3, 35, 30, // average: 30/2+35, (50+40)/2+30
      4, 20, 20, // paeth: up 50+20, up 75+20
    ]);
    const { data } = decodePng(png(2, 4, 0, raw));
    expect(Array.from({ length: 8 }, (_, i) => data[i * 4])).toEqual([10, 20, 30, 40, 50, 75, 70, 95]);
  });

  it("decodes palette images with transparency", () => {
    const plte = chunk("PLTE", Buffer.from([255, 0, 0, 0, 0, 255]));
    const trns = chunk("tRNS", Buffer.from([0]));
    const { data } = decodePng(png(2, 1, 3, Buffer.from([0, 0, 1]), [plte, trns]));
    expect(Array.from(data)).toEqual([255, 0, 0, 0, 0, 0, 255, 255]);
  });

  it("rejects non-PNG input", () => {
    expect(() => decodePng(Buffer.from("GIF89a"))).toThrow("Not a PNG");
  });
});
