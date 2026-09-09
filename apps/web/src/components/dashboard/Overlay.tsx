"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

// Minimal overlay pair for the wall: a centered dialog and a right-hand
// side panel. Escape and backdrop-click close; body scroll locks while open.

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** "dialog" (centered) or "panel" (right sheet). */
  kind?: "dialog" | "panel";
  wide?: boolean;
}

export function Overlay({
  open,
  onClose,
  title,
  children,
  kind = "dialog",
  wide = false,
}: OverlayProps) {
  const t = useTranslations("common.actions");
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    surfaceRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isPanel = kind === "panel";

  return (
    <div
      className={cx(
        "fixed inset-0 z-50 flex bg-mp-ink/50",
        isPanel ? "justify-end" : "items-center justify-center p-4",
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "bg-raised outline-none",
          isPanel
            ? "flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line"
            : cx(
                "max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-2xl border border-line shadow-[0_20px_60px_-20px_color-mix(in_srgb,var(--mp-ink)_60%,transparent)]",
                wide ? "max-w-2xl" : "max-w-lg",
              ),
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-raised px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-line/50 hover:text-ink"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4">
              <path
                d="m3 3 10 10M13 3 3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
