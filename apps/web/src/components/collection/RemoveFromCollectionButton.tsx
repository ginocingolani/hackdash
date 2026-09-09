"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, errorCode } from "./request";

// Per-card overlay on the collection grid (owner only): removes a dashboard
// from the collection without leaving the page. Non-destructive for the
// dashboard itself, so no confirmation step.

export function RemoveFromCollectionButton({
  cid,
  did,
  label,
}: {
  cid: string;
  did: string;
  label: string; // localized "Remove from collection"
}) {
  const router = useRouter();
  const tErr = useTranslations("errors.api");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/api/v2/collections/${cid}/dashboards/${did}`, { method: "DELETE" });
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
        onClick={remove}
        disabled={pending}
        aria-label={label}
        title={label}
        className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-raised/90 text-muted shadow-sm backdrop-blur transition-colors hover:border-action hover:text-action disabled:pointer-events-none disabled:opacity-50"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
          <path
            d="m4 4 8 8m0-8-8 8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {error ? (
        <p
          role="alert"
          className="absolute top-11 right-2 z-10 max-w-[85%] rounded-lg border border-line bg-raised px-2 py-1 text-xs text-action shadow-sm"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}
