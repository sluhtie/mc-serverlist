/** 32-bit FNV-1a hash, so the same server name always produces the same artwork. */
export function hashString(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG (mulberry32) seeded from the hash. */
function random(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type BannerTheme = {
  /** Base hue in degrees (0–359). */
  hue: number;
  /** Block column heights from 1 to `maxHeight`, left to right. */
  columns: number[];
  maxHeight: number;
};

/**
 * Derives the placeholder banner for servers without their own banner: a hue plus a blocky
 * skyline. Hues of plain red are skipped because red already means "offline" in the UI.
 */
export function bannerTheme(seed: string, columnCount = 24, maxHeight = 5): BannerTheme {
  const hash = hashString(seed.toLowerCase());
  const next = random(hash);
  const hue = (hash % 300) + 30;
  const columns: number[] = [];
  let height = 1 + Math.floor(next() * maxHeight);
  for (let i = 0; i < columnCount; i++) {
    // Random walk keeps the terrain smooth instead of noisy.
    height += Math.round((next() - 0.5) * 2.4);
    height = Math.min(maxHeight, Math.max(1, height));
    columns.push(height);
  }
  return { hue, columns, maxHeight };
}
