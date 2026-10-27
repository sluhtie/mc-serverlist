export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <Heading className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</Heading>
        {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
