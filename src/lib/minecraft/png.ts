import { crc32, deflateSync, inflateSync } from "node:zlib";

/**
 * Just enough PNG to crop player heads out of skin textures without an image library:
 * 8-bit, non-interlaced truecolor, truecolor+alpha, grayscale(+alpha) and palette images.
 * https://www.w3.org/TR/png-3/
 */

export type Rgba = { width: number; height: number; data: Uint8Array };

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
// Skins are 64x64; anything far bigger is not a skin and not worth inflating.
const MAX_DIMENSION = 1024;

export function decodePng(input: Uint8Array): Rgba {
  const buf = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("Not a PNG");

  let width = 0;
  let height = 0;
  let colorType = -1;
  let palette: Buffer | null = null;
  let transparency: Buffer | null = null;
  const idat: Buffer[] = [];

  let offset = 8;
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("latin1", offset + 4, offset + 8);
    const body = buf.subarray(offset + 8, offset + 8 + length);
    if (body.length !== length) throw new Error("Truncated PNG");
    offset += 12 + length;

    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const bitDepth = body[8];
      colorType = body[9];
      const interlace = body[12];
      if (bitDepth !== 8 || interlace !== 0 || !(colorType in CHANNELS)) {
        throw new Error("Unsupported PNG format");
      }
      if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION) {
        throw new Error("Unsupported PNG size");
      }
    } else if (type === "PLTE") {
      palette = body;
    } else if (type === "tRNS") {
      transparency = body;
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
  }
  if (colorType < 0) throw new Error("Missing IHDR");
  if (colorType === 3 && !palette) throw new Error("Missing PLTE");

  const bpp = CHANNELS[colorType];
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat), { maxOutputLength: (stride + 1) * height });
  if (raw.length < (stride + 1) * height) throw new Error("Truncated image data");

  const pixels = unfilter(raw, width, height, bpp);
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const p = i * bpp;
    const o = i * 4;
    switch (colorType) {
      case 6:
        data.set(pixels.subarray(p, p + 4), o);
        break;
      case 2:
        data[o] = pixels[p];
        data[o + 1] = pixels[p + 1];
        data[o + 2] = pixels[p + 2];
        data[o + 3] = 255;
        break;
      case 4:
        data[o] = data[o + 1] = data[o + 2] = pixels[p];
        data[o + 3] = pixels[p + 1];
        break;
      case 0:
        data[o] = data[o + 1] = data[o + 2] = pixels[p];
        data[o + 3] = 255;
        break;
      case 3: {
        const index = pixels[p];
        data[o] = palette![index * 3] ?? 0;
        data[o + 1] = palette![index * 3 + 1] ?? 0;
        data[o + 2] = palette![index * 3 + 2] ?? 0;
        data[o + 3] = transparency?.[index] ?? 255;
        break;
      }
    }
  }
  return { width, height, data };
}

function unfilter(raw: Buffer, width: number, height: number, bpp: number) {
  const stride = width * bpp;
  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0;
      const b = y > 0 ? out[row - stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[row - stride + x - bpp] : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      else if (filter === 2) predictor = b;
      else if (filter === 3) predictor = (a + b) >> 1;
      else if (filter === 4) predictor = paeth(a, b, c);
      else if (filter !== 0) throw new Error("Invalid PNG filter");
      out[row + x] = (line[x] + predictor) & 0xff;
    }
  }
  return out;
}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export function encodePng({ width, height, data }: Rgba): Buffer {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    // Filter type 0 (none): the images are tiny and deflate handles the repetition well.
    raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type: string, body: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])) >>> 0);
  return Buffer.concat([head, body, crc]);
}
