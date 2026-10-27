import type { LegalSection } from "@/lib/legal";

export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return sections.map((section) => (
    <section key={section.title} className="space-y-3">
      <h2 className="pt-2 font-display text-xl font-bold text-fg">{section.title}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {section.items && (
        <ul className="list-disc space-y-1.5 pl-6 marker:text-subtle">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  ));
}

/** Name, postal address and contact lines of the site operator. */
export function OperatorAddress({ name, address }: { name: string | null; address: string[] }) {
  return (
    <p>
      {[name, ...address].filter(Boolean).map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </p>
  );
}

export function OperatorContact({
  phone,
  email,
  labels,
}: {
  phone: string | null;
  email: string | null;
  labels: { phone: string; email: string };
}) {
  return (
    <p>
      {phone && (
        <span className="block">
          {labels.phone}:{" "}
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="link">
            {phone}
          </a>
        </span>
      )}
      {email && (
        <span className="block">
          {labels.email}:{" "}
          <a href={`mailto:${email}`} className="link">
            {email}
          </a>
        </span>
      )}
    </p>
  );
}
