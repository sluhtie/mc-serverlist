import { bannerTheme } from "@/lib/banner";

export function ServerIcon({
  favicon,
  name,
  size = 48,
  className = "",
}: {
  favicon: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (favicon) {
    return (
      // Favicons are base64 data URLs from the status ping.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={favicon}
        alt=""
        width={size}
        height={size}
        decoding="async"
        className={`shrink-0 rounded-xl [image-rendering:pixelated] ${className}`}
      />
    );
  }
  // No favicon: a tinted block with the initial, colored like the server's generated banner.
  const { hue } = bannerTheme(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, hsl(${hue} 45% 42%), hsl(${(hue + 40) % 360} 50% 22%))`,
      }}
      className={`grid shrink-0 place-items-center rounded-xl font-display font-extrabold text-white shadow-inner ring-1 ring-black/10 ${className}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
