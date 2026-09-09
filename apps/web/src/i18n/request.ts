import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isAppLocale,
  type AppLocale,
} from "./config";
import { defaultMessages } from "./defaults";

type Messages = Record<string, unknown>;

// Best matching supported locale from an Accept-Language header, or null.
function fromAcceptLanguage(header: string | null): AppLocale | null {
  if (!header) return null;
  const ranges = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isNaN(q) ? 0 : q };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranges) {
    const base = tag.split("-")[0];
    if (isAppLocale(base)) return base;
  }
  return null;
}

// Message catalogs live in `apps/web/messages/{locale}.json`. They are
// authored separately and MAY NOT EXIST yet — a missing or malformed file
// falls back to an empty object, so typecheck/build never depend on them.
// (Filesystem read rather than a bundler dynamic import on purpose: an
// import context over a not-yet-existing directory breaks the build.)
async function loadCatalog(locale: AppLocale): Promise<Messages> {
  try {
    const file = path.join(process.cwd(), "messages", `${locale}.json`);
    const parsed: unknown = JSON.parse(await fs.readFile(file, "utf8"));
    return parsed && typeof parsed === "object" ? (parsed as Messages) : {};
  } catch {
    return {};
  }
}

// Deep-merge `override` over `base` (plain objects only; arrays/leaves replace).
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const prev = out[key];
    if (
      prev &&
      value &&
      typeof prev === "object" &&
      typeof value === "object" &&
      !Array.isArray(prev) &&
      !Array.isArray(value)
    ) {
      out[key] = deepMerge(prev as Messages, value as Messages);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;

  const locale: AppLocale = isAppLocale(cookieLocale)
    ? cookieLocale
    : (fromAcceptLanguage((await headers()).get("accept-language")) ??
      DEFAULT_LOCALE);

  // Built-in English defaults keep the chrome legible until (and wherever)
  // the catalogs cover a key; catalogs win on every key they define.
  const messages = deepMerge(
    defaultMessages as unknown as Messages,
    await loadCatalog(locale),
  );

  return { locale, messages };
});
