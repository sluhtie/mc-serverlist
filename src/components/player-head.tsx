import { HEAD_SIZES } from "@/lib/minecraft/player";

/** Minecraft player head, served (and cached) by /api/skins/[name]. */
export function PlayerHead({ name, size = 24, className = "" }: { name: string; size?: number; className?: string }) {
  // Request twice the display size for sharp pixels on high-DPI screens.
  const requested = HEAD_SIZES.find((s) => s >= size * 2) ?? HEAD_SIZES[HEAD_SIZES.length - 1];
  return (
    // Same-origin API route; next/image would only re-encode the tiny PNG.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/skins/${encodeURIComponent(name)}?size=${requested}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`shrink-0 rounded-sm bg-zinc-800 [image-rendering:pixelated] ${className}`}
    />
  );
}
