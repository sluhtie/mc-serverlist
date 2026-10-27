import "server-only";
import { headers } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, localizePath, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

/** Locale of the current request, as set by the proxy. Works in pages, layouts and actions. */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

export async function getDictionary() {
  return dictionaries[await getLocale()];
}

/** Returns the public URL of an internal path in the current locale. */
export async function localHref(path: string) {
  return localizePath(path, await getLocale());
}

/** `redirect()` that keeps the visitor in their language. */
export async function localRedirect(path: string): Promise<never> {
  redirect(await localHref(path));
}

export async function localPermanentRedirect(path: string): Promise<never> {
  permanentRedirect(await localHref(path));
}
