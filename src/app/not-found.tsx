import { LogoMark } from "@/components/brand/logo-mark";
import Link from "@/components/link";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getDictionary();
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="relative">
        <LogoMark className="h-28 w-28 animate-float opacity-40 grayscale" />
        <span className="absolute -right-4 -bottom-2 rotate-6 rounded-lg bg-surface-2 px-2 py-1 font-pixel text-2xl text-accent ring-1 ring-line">
          404
        </span>
      </div>
      <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight">{t.notFound.title}</h1>
      <p className="mt-2 text-muted">{t.notFound.text}</p>
      <Link href="/" className="btn-primary mt-8">
        {t.notFound.cta}
      </Link>
    </div>
  );
}
