export const THEME_COOKIE = "mcsl_theme";
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** Stored choice, or "system" (no cookie) to follow the OS preference. */
export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}
