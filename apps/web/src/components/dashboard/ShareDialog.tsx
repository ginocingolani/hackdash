"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_STATUSES } from "@hackdash/db/shared";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Overlay } from "./Overlay";
import type { StatusLabels, WallSort } from "./types";

// Share + embed builder. The embed pages live under /embed/dashboards/* and
// accept the legacy iframe params (docs/legacy/client.md §40):
//   hide=title,desc,logo,pprg,ptitle,pcontrib,pacnbar
//   + query / status / sort / slider=1..6

const HIDE_FLAGS = [
  { flag: "title", key: "title" },
  { flag: "desc", key: "description" },
  { flag: "logo", key: "logo" },
  { flag: "pprg", key: "progress" },
  { flag: "ptitle", key: "projectTitle" },
  { flag: "pcontrib", key: "contributors" },
  { flag: "pacnbar", key: "actionBar" },
] as const;

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  domain: string;
  title: string;
  statusCounts: Record<string, number>;
  statusLabels: StatusLabels;
}

function useCopy(): [copiedKey: string | null, copy: (key: string, text: string) => void] {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!copiedKey) return;
    const timer = setTimeout(() => setCopiedKey(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedKey]);
  return [
    copiedKey,
    (key, text) => {
      void navigator.clipboard?.writeText(text).then(() => setCopiedKey(key));
    },
  ];
}

export function ShareDialog({
  open,
  onClose,
  domain,
  title,
  statusCounts,
  statusLabels,
}: ShareDialogProps) {
  const t = useTranslations("dashboard.share");
  const tSort = useTranslations("dashboard.wall.sort");
  const tc = useTranslations("common.actions");
  const [copiedKey, copy] = useCopy();

  // The dialog only mounts client-side after interaction, so reading
  // window here never runs during SSR.
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );

  // Embed builder state.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<WallSort>("showcase");
  const [slider, setSlider] = useState(3);

  const shareUrl = `${origin}/d/${domain}`;
  const shareText = title || domain;

  const embedSrc = useMemo(() => {
    const params = new URLSearchParams();
    if (hidden.size > 0) params.set("hide", HIDE_FLAGS.map((f) => f.flag).filter((f) => hidden.has(f)).join(","));
    if (query.trim()) params.set("query", query.trim());
    if (status) params.set("status", status);
    params.set("sort", sort);
    params.set("slider", String(slider));
    return `${origin}/embed/dashboards/${domain}?${params.toString()}`;
  }, [origin, domain, hidden, query, status, sort, slider]);

  const embedCode = `<iframe src="${embedSrc}" width="100%" height="600" frameborder="0"></iframe>`;

  const intents = [
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  function toggleHidden(flag: string) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  }

  const fieldLabel = "flex flex-col gap-1.5 text-xs font-medium text-muted";
  const selectClasses =
    "h-10 w-full rounded-lg border border-line bg-raised px-3 text-sm text-ink transition-colors hover:border-muted/60";

  return (
    <Overlay open={open} onClose={onClose} title={t("title")} wide>
      <div className="flex flex-col gap-8">
        {/* Link + social */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-ink">{t("link")}</h3>
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly aria-label={t("link")} onFocus={(e) => e.currentTarget.select()} />
            <Button variant="secondary" onClick={() => copy("link", shareUrl)}>
              {copiedKey === "link" ? tc("copied") : tc("copy")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {intents.map((intent) => (
              <a
                key={intent.name}
                href={intent.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-sm font-medium text-ink transition-colors hover:border-muted/60"
              >
                {intent.name}
              </a>
            ))}
          </div>
        </section>

        {/* Embed builder */}
        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-medium text-ink">{t("embed.title")}</h3>
            <p className="mt-1 text-sm text-muted">{t("embed.instructions")}</p>
          </div>

          <fieldset className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            <legend className="sr-only">{t("embed.note")}</legend>
            {HIDE_FLAGS.map(({ flag, key }) => (
              <label key={flag} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={!hidden.has(flag)}
                  onChange={() => toggleHidden(flag)}
                  className="h-4 w-4 accent-[var(--action)]"
                />
                {t(`embed.hide.${key}`)}
              </label>
            ))}
          </fieldset>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className={fieldLabel}>
              {t("embed.filterKeyword")}
              <Input value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label className={fieldLabel}>
              {t("embed.filterStatus")}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={selectClasses}
              >
                <option value="">{t("embed.anyStatus")}</option>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]} ({statusCounts[s] ?? 0})
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldLabel}>
              {tSort("label")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as WallSort)}
                className={selectClasses}
              >
                <option value="showcase">{tSort("byShowcase")}</option>
                <option value="name">{tSort("byName")}</option>
                <option value="date">{tSort("byDate")}</option>
              </select>
            </label>
          </div>

          <label className={fieldLabel}>
            {t("embed.columns")}: {slider}
            <input
              type="range"
              min={1}
              max={6}
              value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              className="accent-[var(--action)]"
            />
          </label>

          <div className="flex flex-col gap-2">
            <code className="block overflow-x-auto rounded-lg bg-mp-ink p-3 text-xs whitespace-nowrap text-mp-white">
              {embedCode}
            </code>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted">{t("embed.note")}</p>
              <Button variant="secondary" size="sm" onClick={() => copy("embed", embedCode)}>
                {copiedKey === "embed" ? tc("copied") : t("embed.copyCode")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Overlay>
  );
}
