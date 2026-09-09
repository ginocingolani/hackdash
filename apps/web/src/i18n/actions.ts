"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isAppLocale } from "./config";

// Persist the language preference (cookie-based locale, no URL prefixes).
// The client refreshes after calling this so server components re-render
// in the new locale.
export async function setLocale(locale: string): Promise<void> {
  if (!isAppLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
