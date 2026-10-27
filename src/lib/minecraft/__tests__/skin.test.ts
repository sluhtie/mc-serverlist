import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeHeadSize } from "../player";
import { decodePng, encodePng, type Rgba } from "../png";
import { clearHeadCache, defaultFace, extractFace, lookupHead, parseSkinUrl, scaleFace } from "../skin";

function skin(height: 64 | 32, paint: (x: number, y: number) => [number, number, number, number]): Rgba {
  const data = new Uint8Array(64 * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 64; x++) data.set(paint(x, y), (y * 64 + x) * 4);
  }
  return { width: 64, height, data };
}

const inFace = (x: number, y: number) => x >= 8 && x < 16 && y >= 8 && y < 16;
const inHat = (x: number, y: number) => x >= 40 && x < 48 && y >= 8 && y < 16;
const pixel = (img: Rgba, x: number, y: number) => Array.from(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

function texturesProperty(url: string) {
  const value = Buffer.from(JSON.stringify({ textures: { SKIN: { url } } })).toString("base64");
  return { id: "069a79f444e94726a5befca90e38aaf5", properties: [{ name: "textures", value }] };
}

describe("extractFace", () => {
  it("composites the hat layer over the face", () => {
    const face = extractFace(
      skin(64, (x, y) => {
        if (inFace(x, y)) return [200, 100, 50, 255];
        if (inHat(x, y) && x === 40 && y === 8) return [0, 0, 255, 255];
        return [0, 0, 0, 0];
      }),
    );
    expect(pixel(face, 0, 0)).toEqual([0, 0, 255, 255]);
    expect(pixel(face, 1, 0)).toEqual([200, 100, 50, 255]);
  });

  it("ignores a solid opaque hat area on legacy skins", () => {
    const face = extractFace(skin(32, (x, y) => (inFace(x, y) ? [10, 20, 30, 255] : [0, 0, 0, 255])));
    expect(pixel(face, 3, 3)).toEqual([10, 20, 30, 255]);
  });

  it("rejects textures that are not skins", () => {
    expect(() => extractFace({ width: 8, height: 8, data: new Uint8Array(256) })).toThrow();
  });
});

describe("scaleFace", () => {
  it("scales with nearest neighbour", () => {
    const big = scaleFace(defaultFace(), 32);
    expect(big.width).toBe(32);
    expect(pixel(big, 3, 3)).toEqual(pixel(defaultFace(), 0, 0));
    expect(pixel(big, 31, 31)).toEqual(pixel(defaultFace(), 7, 7));
  });
});

describe("normalizeHeadSize", () => {
  it("snaps to supported sizes", () => {
    expect(normalizeHeadSize(null)).toBe(64);
    expect(normalizeHeadSize("abc")).toBe(64);
    expect(normalizeHeadSize("30")).toBe(32);
    expect(normalizeHeadSize("100000")).toBe(256);
    expect(normalizeHeadSize("-5")).toBe(8);
  });
});

describe("parseSkinUrl", () => {
  it("reads the skin URL and upgrades it to https", () => {
    expect(parseSkinUrl(texturesProperty("http://textures.minecraft.net/texture/abc"))).toBe(
      "https://textures.minecraft.net/texture/abc",
    );
  });

  it("refuses hosts other than the Mojang texture CDN", () => {
    expect(parseSkinUrl(texturesProperty("http://169.254.169.254/latest"))).toBeNull();
    expect(parseSkinUrl({ properties: [] })).toBeNull();
    expect(parseSkinUrl({ properties: [{ name: "textures", value: "not json" }] })).toBeNull();
  });
});

describe("lookupHead", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearHeadCache();
  });

  it("resolves name, profile and texture, then caches the face", async () => {
    const texture = encodePng(skin(64, (x, y) => (inFace(x, y) ? [1, 2, 3, 255] : [0, 0, 0, 0])));
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith("https://api.mojang.com/")) return Response.json({ id: "069a79f444e94726a5befca90e38aaf5", name: "Notch" });
      if (url.startsWith("https://sessionserver.mojang.com/")) return Response.json(texturesProperty("http://textures.minecraft.net/texture/abc"));
      if (url === "https://textures.minecraft.net/texture/abc") return new Response(new Uint8Array(texture));
      return new Response(null, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await lookupHead("Notch");
    expect(first.status).toBe("found");
    expect(pixel(first.face, 0, 0)).toEqual([1, 2, 3, 255]);
    expect((await lookupHead("notch")).status).toBe("found");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("falls back to the placeholder for unknown names and upstream errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    expect(await lookupHead("NobodyHere")).toEqual({ face: defaultFace(), status: "unknown" });

    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 429 })));
    expect((await lookupHead("RateLimited")).status).toBe("error");
  });

  it("does not hit the network for invalid names", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await lookupHead("../etc")).status).toBe("unknown");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders a decodable placeholder", () => {
    expect(decodePng(encodePng(defaultFace()))).toEqual(defaultFace());
  });
});
