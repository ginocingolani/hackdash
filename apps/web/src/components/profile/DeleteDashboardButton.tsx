"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, errorCode } from "@/components/collection/request";

// Guarded dashboard removal on the own-profile Dashboards tab (improvement
// plan item 39/19): type-the-domain confirmation, and the server guards
// (dashboard_has_projects / dashboard_has_admins) surfaced clearly.

export function DeleteDashboardButton({ domain }: { domain: string }) {
  const router = useRouter();
  const t = useTranslations();
  const tErr = useTranslations("errors.api");
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function destroy() {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/api/v2/dashboards/${domain}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      const code = errorCode(err);
      setError(tErr.has(code) ? tErr(code) : tErr("unknown"));
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTyped("");
          setError(null);
        }}
        aria-label={`${t("dashboard.delete.title")} /${domain}`}
        title={t("dashboard.delete.title")}
        className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-raised/90 text-muted shadow-sm backdrop-blur transition-colors hover:border-action hover:text-action"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
          <path
            d="M3 4.5h10M6.5 4V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M5 4.5l.6 8a1 1 0 0 0 1 .9h2.8a1 1 0 0 0 1-.9l.6-8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute inset-0 z-20 flex flex-col gap-2 overflow-y-auto rounded-2xl border border-action/50 bg-raised p-4">
          <h3 className="font-semibold text-ink">{t("dashboard.delete.title")}</h3>
          <p className="text-xs text-muted">{t("dashboard.delete.warning", { domain })}</p>
          <label className="text-xs font-medium text-ink" htmlFor={`delete-${domain}`}>
            {t("dashboard.delete.typeToConfirm", { domain })}
          </label>
          <Input
            id={`delete-${domain}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={t("dashboard.delete.confirmPlaceholder")}
            autoComplete="off"
            className="h-8"
          />
          {error ? (
            <p role="alert" className="text-xs font-medium text-action">
              {error}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap justify-end gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button size="sm" onClick={destroy} disabled={typed !== domain || pending}>
              {t("dashboard.delete.confirmButton")}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
