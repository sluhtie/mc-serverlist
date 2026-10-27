import { isValidPlayerName } from "./player";
import { decodePng, encodePng, type Rgba } from "./png";

/**
 * Player heads for Minecraft names: resolve the name via the Mojang API, download the skin
 * texture and crop the face (plus the hat overlay) out of it.
 * https://minecraft.wiki/w/Mojang_API
 */

// Original placeholder face for unknown names and failed lookups.
const DEFAULT_FACE = [
  "HHHHHHHH",
  "HHHHHHHH",
  "HSSSSSSH",
  "SSSSSSSS",
  "SWISSIWS",
  "SSSNNSSS",
  "SSMMMMSS",
  "SSSSSSSS",
];
const DEFAULT_COLORS: Record<string, [number, number, number]> = {
  H: [74, 47, 29],
  S: [198, 146, 118],
  N: [176, 122, 95],
  W: [255, 255, 255],
  I: [79, 63, 176],
  M: [122, 74, 51],
};

export function defaultFace(): Rgba {
  const data = new Uint8Array(8 * 8 * 4);
  DEFAULT_FACE.join("")
    .split("")
    .forEach((key, i) => data.set([...DEFAULT_COLORS[key], 255], i * 4));
  return { width: 8, height: 8, data };
}

/**
 * Crops the 8x8 face from a skin (64x64 or legacy 64x32) and composites the hat layer on top.
 * Legacy skins often fill the hat area with one opaque color; the game ignores that, so do we.
 */
export function extractFace(skin: Rgba): Rgba {
  if (skin.width !== 64 || (skin.height !== 64 && skin.height !== 32)) {
    throw new Error("Unexpected skin size");
  }
  const face = crop(skin, 8, 8);
  const hat = crop(skin, 40, 8);
  if (isSolidOpaque(hat)) return face;

  const out = face.data;
  for (let i = 0; i < out.length; i += 4) {
    const alpha = hat.data[i + 3] / 255;
    for (let c = 0; c < 3; c++) {
      out[i + c] = Math.round(hat.data[i + c] * alpha + out[i + c] * (1 - alpha));
    }
    out[i + 3] = 255;
  }
  return face;
}

function crop(skin: Rgba, left: number, top: number): Rgba {
  const data = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; y++) {
    const start = ((top + y) * skin.width + left) * 4;
    data.set(skin.data.subarray(start, start + 8 * 4), y * 8 * 4);
  }
  return { width: 8, height: 8, data };
}

function isSolidOpaque({ data }: Rgba) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 255) return false;
    if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) return false;
  }
  return true;
}

/** Nearest-neighbour upscaling keeps the pixel-art look. */
export function scaleFace(face: Rgba, size: number): Rgba {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const src = (Math.floor((y * face.height) / size) * face.width + Math.floor((x * face.width) / size)) * 4;
      data.set(face.data.subarray(src, src + 4), (y * size + x) * 4);
    }
  }
  return { width: size, height: size, data };
}

export function renderHeadPng(face: Rgba, size: number) {
  return encodePng(scaleFace(face, size));
}

/** Reads the skin URL from the base64 "textures" property of a session profile. */
export function parseSkinUrl(profile: unknown): string | null {
  const properties = (profile as { properties?: { name?: string; value?: string }[] })?.properties;
  const value = properties?.find((p) => p.name === "textures")?.value;
  if (!value) return null;
  try {
    const textures = JSON.parse(Buffer.from(value, "base64").toString("utf8")) as {
      textures?: { SKIN?: { url?: string } };
    };
    const url = new URL(textures.textures?.SKIN?.url ?? "");
    // Only ever download from Mojang's texture CDN, whatever the profile claims.
    if (url.hostname !== "textures.minecraft.net") return null;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

export type HeadLookup = { face: Rgba; status: "found" | "unknown" | "error" };

const FOUND_TTL_MS = 6 * 60 * 60 * 1000;
const UNKNOWN_TTL_MS = 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;
const TIMEOUT_MS = 5000;

const cache = new Map<string, { lookup: HeadLookup; expiresAt: number }>();
const inFlight = new Map<string, Promise<HeadLookup>>();

/** Returns a cached face without touching the network, or null on a cache miss. */
export function getCachedHead(name: string): HeadLookup | null {
  const key = name.toLowerCase();
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.lookup;
}

/**
 * Looks up a player's face. Results (including misses and upstream errors) are cached in
 * memory so a busy page does not hammer the rate-limited Mojang API.
 */
export function lookupHead(name: string): Promise<HeadLookup> {
  if (!isValidPlayerName(name)) return Promise.resolve({ face: defaultFace(), status: "unknown" });
  const cached = getCachedHead(name);
  if (cached) return Promise.resolve(cached);

  const key = name.toLowerCase();
  let pending = inFlight.get(key);
  if (!pending) {
    pending = fetchFace(name)
      .then((face): HeadLookup => (face ? { face, status: "found" } : { face: defaultFace(), status: "unknown" }))
      .catch((): HeadLookup => ({ face: defaultFace(), status: "error" }))
      .then((lookup) => {
        remember(key, lookup);
        return lookup;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}

function remember(key: string, lookup: HeadLookup) {
  const ttl = lookup.status === "found" ? FOUND_TTL_MS : lookup.status === "unknown" ? UNKNOWN_TTL_MS : ERROR_TTL_MS;
  cache.delete(key);
  cache.set(key, { lookup, expiresAt: Date.now() + ttl });
  // Maps iterate in insertion order, so the first key is the oldest entry.
  while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
}

/** Test hook. */
export function clearHeadCache() {
  cache.clear();
  inFlight.clear();
}

async function fetchFace(name: string): Promise<Rgba | null> {
  const profileRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (profileRes.status === 204 || profileRes.status === 404) return null;
  if (!profileRes.ok) throw new Error(`Mojang profile lookup failed: ${profileRes.status}`);
  const { id } = (await profileRes.json()) as { id?: string };
  if (!id || !/^[0-9a-f]{32}$/i.test(id)) return null;

  const sessionRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${id}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (sessionRes.status === 204 || sessionRes.status === 404) return null;
  if (!sessionRes.ok) throw new Error(`Mojang session lookup failed: ${sessionRes.status}`);
  const skinUrl = parseSkinUrl(await sessionRes.json());
  // No custom skin: the client would pick a default skin, our placeholder plays that role.
  if (!skinUrl) return null;

  const skinRes = await fetch(skinUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!skinRes.ok) throw new Error(`Skin download failed: ${skinRes.status}`);
  return extractFace(decodePng(new Uint8Array(await skinRes.arrayBuffer())));
}
