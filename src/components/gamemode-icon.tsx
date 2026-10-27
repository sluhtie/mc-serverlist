import type { TAGS } from "@/lib/constants";
import { GAMEMODE_ICONS, ICON_PALETTE, ICON_SIZE } from "@/lib/gamemode-icons";

/** Pixel-art icon for a game mode tag, rendered as crisp SVG rects. */
export function GamemodeIcon({
  tag,
  className = "",
}: {
  tag: (typeof TAGS)[number];
  className?: string;
}) {
  const rects: React.ReactNode[] = [];
  GAMEMODE_ICONS[tag].forEach((row, y) => {
    // Merge horizontal runs of the same color to keep the markup small.
    let x = 0;
    while (x < row.length) {
      const char = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === char) end++;
      if (char !== ".") {
        rects.push(
          <rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={ICON_PALETTE[char]} />,
        );
      }
      x = end;
    }
  });
  return (
    <svg viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`} shapeRendering="crispEdges" className={className} aria-hidden>
      {rects}
    </svg>
  );
}
