"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

/** Dictionary of the current locale for Client Components. */
export function useT() {
  return dictionaries[useLocale()];
}
