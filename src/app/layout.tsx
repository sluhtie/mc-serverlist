import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { env } from "@/lib/env";
import { SITE_DESCRIPTION } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const name = env.siteName;
  const title = `${name} – Minecraft Serverliste`;
  const description = SITE_DESCRIPTION;
  return {
    metadataBase: new URL(env.appUrl),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    // Indexing is the default; allow large previews. Pages opt out with their own `robots`.
    robots: { googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
    // Server addresses look like numbers to mobile Safari.
    formatDetection: { telephone: false, address: false, email: false },
    openGraph: { siteName: name, type: "website", locale: "de_DE", title, description },
    twitter: { card: "summary_large_image", title, description },
    verification: env.googleSiteVerification ? { google: env.googleSiteVerification } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
