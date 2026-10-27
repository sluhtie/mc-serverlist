import { LogoMark } from "@/components/brand/logo-mark";

/** Centered card for login and sign-up, with the logo floating above it. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-4 sm:py-8">
      <div className="relative mb-6 flex flex-col items-center text-center">
        <div className="absolute top-2 h-20 w-20 animate-glow rounded-full bg-brand-500/30 blur-2xl" aria-hidden />
        <LogoMark className="relative h-20 w-20 animate-float" />
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-muted">{subtitle}</p>
      </div>
      <div className="card animate-rise p-6 sm:p-8">{children}</div>
    </div>
  );
}
