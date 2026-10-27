export function ServerIcon({
  favicon,
  name,
  size = 48,
}: {
  favicon: string | null;
  name: string;
  size?: number;
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
        className="shrink-0 rounded-md [image-rendering:pixelated]"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-md bg-zinc-800 font-bold text-zinc-400"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
