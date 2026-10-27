// Kept free of Node APIs so Client Components can import it.

/** Java Edition names: 3–16 characters, letters, digits and underscore. */
export const PLAYER_NAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;

export function isValidPlayerName(name: string) {
  return PLAYER_NAME_PATTERN.test(name);
}

export const HEAD_SIZES = [8, 16, 24, 32, 48, 64, 96, 128, 256] as const;

/** Snaps a requested size to the nearest supported one, so caches see few variants. */
export function normalizeHeadSize(value: string | null, fallback = 64) {
  const size = Number(value);
  if (!value || !Number.isFinite(size)) return fallback;
  return HEAD_SIZES.reduce((best, s) => (Math.abs(s - size) < Math.abs(best - size) ? s : best));
}
