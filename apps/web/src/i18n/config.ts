// Locale configuration. Cookie-based (no URL prefixes) per the improvement
// plan §2.8: persisted preference, Accept-Language fallback, default en.
export const LOCALES = ["en", "es", "pt"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isAppLocale(value: unknown): value is AppLocale {
  return (LOCALES as readonly unknown[]).includes(value);
}
