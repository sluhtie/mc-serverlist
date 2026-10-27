export function StatusBadge({ online }: { online: boolean }) {
  return online ? (
    <span className="tag gap-1.5 border-brand-500/30 bg-brand-500/10 text-ok">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
      </span>
      Online
    </span>
  ) : (
    <span className="tag gap-1.5 border-red-500/30 bg-red-500/10 text-danger">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Offline
    </span>
  );
}
