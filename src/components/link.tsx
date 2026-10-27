"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/lib/i18n/client";
import { localizePath } from "@/lib/i18n/config";

/**
 * next/link with internal paths rewritten for the current locale. Use it for every internal
 * link and pass the German file system path: <Link href="/spielmodus"> becomes /en/gamemodes.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  return <NextLink href={typeof href === "string" ? localizePath(href, locale) : href} {...props} />;
}
