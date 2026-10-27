export function StatusBadge({ online }: { online: boolean }) {
  return online ? (
    <span className="tag gap-1 bg-brand-500/15 text-brand-300">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Online
    </span>
  ) : (
    <span className="tag gap-1 bg-red-500/15 text-red-300">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Offline
    </span>
  );
}
