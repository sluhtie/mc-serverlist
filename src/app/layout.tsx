import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { env } from "@/lib/env";
import { LocaleProvider } from "@/lib/i18n/client";
import { OG_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headings.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

// Small pixel accents (eyebrows, ranks, counters). Not for running text.
// Monocraft (SIL OFL 1.1, see fonts/Monocraft-OFL.txt) follows the in-game font closely and keeps
// digits and look-alike letters (0/O, 1/l/I, 5/S, 8/B) distinct. The file is a Latin subset.
// It is monospaced and draws large glyphs, so it is scaled down to fit the existing font sizes.
const monocraft = localFont({
  src: "./fonts/monocraft-latin.woff2",
  variable: "--font-monocraft",
  display: "swap",
  declarations: [{ prop: "size-adjust", value: "90%" }],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0f" },
  ],
  colorScheme: "light dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const name = env.siteName;
  const title = `${name} – ${t.meta.tagline}`;
  const description = t.meta.siteDescription;
  return {
    metadataBase: new URL(env.appUrl),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    // Indexing is the default; allow large previews. Pages opt out with their own `robots`.
    robots: { googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
    // Server addresses look like numbers to mobile Safari.
    formatDetection: { telephone: false, address: false, email: false },
    openGraph: { siteName: name, type: "website", locale: OG_LOCALE[locale], title, description },
    twitter: { card: "summary_large_image", title, description },
    verification: env.googleSiteVerification ? { google: env.googleSiteVerification } : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, jar] = await Promise.all([getLocale(), cookies()]);
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);
  return (
    <html
      lang={locale}
      data-theme={theme === "system" ? undefined : theme}
      // The theme toggle changes data-theme on the client.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${monocraft.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <LocaleProvider locale={locale}>
          <SiteHeader theme={theme} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
