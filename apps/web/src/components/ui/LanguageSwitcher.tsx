"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/i18n/actions";
import { LOCALES, type AppLocale } from "@/i18n/config";
import { cx } from "@/lib/cx";

// Cookie-based language switcher (en/es/pt, no URL prefixes): stores the
// NEXT_LOCALE cookie via a server action, then refreshes so every server
// component re-renders in the new locale.

const LOCALE_NAMES: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("locale");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const select = (next: AppLocale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cx(
        "inline-flex items-center rounded-lg border border-line bg-raised p-0.5",
        className,
      )}
    >
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            aria-label={LOCALE_NAMES[l]}
            title={LOCALE_NAMES[l]}
            lang={l}
            disabled={isPending}
            onClick={() => select(l)}
            className={cx(
              "inline-flex h-7 items-center justify-center rounded-md px-1.5 text-xs font-semibold uppercase transition-colors disabled:opacity-60",
              active ? "bg-line/60 text-ink" : "text-muted hover:text-ink",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
