"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

// Three-state theme control: system → light → dark.
// The choice persists in localStorage ("hd-theme") and is stamped on
// <html data-theme="…">; "system" removes both so the media query decides.
// An inline script in the root layout applies the stored value before paint.

export type ThemeMode = "system" | "light" | "dark";
export const THEME_STORAGE_KEY = "hd-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  try {
    if (mode === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
      delete root.dataset.theme;
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      root.dataset.theme = mode;
    }
  } catch {
    // Storage can be unavailable (private mode) — still stamp the attribute.
    if (mode === "system") delete root.dataset.theme;
    else root.dataset.theme = mode;
  }
}

function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

// Tiny external store so the control hydrates safely (the server renders the
// "system" snapshot, the client re-renders with the stored one) and multiple
// toggles on a page stay in sync. The storage event covers other tabs.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function emit() {
  for (const listener of listeners) listener();
}
function getServerSnapshot(): ThemeMode {
  return "system";
}

const ICONS: Record<ThemeMode, React.ReactNode> = {
  system: (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect
        x="2.75"
        y="3.75"
        width="14.5"
        height="9.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 16.25h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  light: (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  dark: (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M16.5 12.2A6.75 6.75 0 0 1 7.8 3.5a6.75 6.75 0 1 0 8.7 8.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const MODES: ThemeMode[] = ["system", "light", "dark"];

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("theme");
  const mode = useSyncExternalStore(
    subscribe,
    readStoredTheme,
    getServerSnapshot,
  );

  const select = (next: ThemeMode) => {
    applyTheme(next);
    emit();
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
      {MODES.map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            aria-label={t(m)}
            title={t(m)}
            onClick={() => select(m)}
            className={cx(
              "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-line/60 text-ink"
                : "text-muted hover:text-ink",
            )}
          >
            {ICONS[m]}
          </button>
        );
      })}
    </div>
  );
}
