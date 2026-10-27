/** Player count with a Minecraft-style experience bar showing how full the server is. */
export function PlayerBar({
  online,
  max,
  label,
  className = "",
}: {
  online: number;
  max: number;
  /** Shown with the count above the bar; leave out for the bar alone. */
  label?: string;
  className?: string;
}) {
  const fill = max > 0 ? Math.min(100, Math.round((online / max) * 100)) : 0;
  return (
    <div className={className} title={label}>
      {label && (
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-subtle">{label}</span>
          <span className="font-pixel text-sm text-fg">
            {online}
            <span className="text-subtle">/{max}</span>
          </span>
        </div>
      )}
      {/* Keep a sliver visible for servers with players, so the bar never looks empty by mistake. */}
      <div className="xp-bar mt-1.5" style={{ "--fill": `${online > 0 ? Math.max(fill, 3) : 0}%` } as React.CSSProperties} />
    </div>
  );
}
