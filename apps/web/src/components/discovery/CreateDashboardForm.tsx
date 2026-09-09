"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

// The one-field create-a-dashboard hero form — the soul of the product
// (improvement plan §2.2 item 4). Validates against the canonical domain
// regex (passed as a pattern string so mongoose never reaches the client
// bundle), checks availability with a debounced GET (404 = available), and
// creates via POST /api/v2/dashboards. Styled with raw brand tokens on
// purpose: the hero is theme-invariant ink.

const CHECK_DEBOUNCE_MS = 400;

type Status =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "login"
  | "error";

export interface CreateDashboardFormProps {
  /** Whether the visitor is signed in (server-provided). */
  authenticated: boolean;
  /** DASHBOARD_DOMAIN_REGEX.source from @hackdash/db. */
  domainPattern: string;
}

export function CreateDashboardForm({ authenticated, domainPattern }: CreateDashboardFormProps) {
  const router = useRouter();
  const t = useTranslations("landing.hero");
  const tErrors = useTranslations("errors.api");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const regex = useMemo(() => new RegExp(domainPattern), [domainPattern]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function scheduleCheck(domain: string) {
    const id = ++seq.current;
    if (timer.current) clearTimeout(timer.current);
    if (!domain) {
      setStatus("idle");
      return;
    }
    if (!regex.test(domain)) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v2/dashboards/${encodeURIComponent(domain)}`);
        if (seq.current !== id) return;
        if (res.status === 404) setStatus("available");
        else if (res.ok) setStatus("taken");
        else setStatus("error");
      } catch {
        if (seq.current === id) setStatus("error");
      }
    }, CHECK_DEBOUNCE_MS);
  }

  async function submit() {
    const domain = value.trim();
    if (!domain || !regex.test(domain)) {
      setStatus("invalid");
      return;
    }
    if (!authenticated) {
      setStatus("login");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v2/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (res.ok) {
        router.push(`/dashboards/${encodeURIComponent(domain)}`);
        return; // keep the button disabled while navigation happens
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (body.error === "subdomain_inuse") setStatus("taken");
      else if (body.error === "subdomain_invalid") setStatus("invalid");
      else if (body.error === "not_authenticated") setStatus("login");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
    setSubmitting(false);
  }

  const signInHref = `/api/auth/signin?callbackUrl=${encodeURIComponent("/")}`;
  const loginPrompt = (
    <a
      href={signInHref}
      className="font-medium text-mp-cyan underline decoration-mp-cyan/50 underline-offset-4 hover:decoration-mp-cyan"
    >
      {t("logInToCreate")}
    </a>
  );

  let message: React.ReactNode;
  let tone = "text-mp-white/70";
  switch (status) {
    case "checking":
      message = t("checking");
      break;
    case "available":
      message = t("available", { domain: value.trim() });
      tone = "text-mp-cyan";
      break;
    case "taken":
      message = t("taken");
      tone = "text-mp-orange";
      break;
    case "invalid":
      message = t("invalid");
      tone = "text-mp-orange";
      break;
    case "login":
      message = loginPrompt;
      break;
    case "error":
      message = tErrors("unknown");
      tone = "text-mp-orange";
      break;
    default:
      // Anonymous visitors see the login prompt as the resting state; signed-in
      // visitors get the format hint.
      message = authenticated ? t("hint") : loginPrompt;
  }

  return (
    <form
      className="mx-auto w-full max-w-xl"
      onSubmit={(event) => {
        event.preventDefault();
        if (!submitting) void submit();
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="domain"
          aria-label={t("createPlaceholder")}
          placeholder={t("createPlaceholder")}
          value={value}
          onChange={(event) => {
            const next = event.target.value.toLowerCase().replace(/\s+/g, "");
            setValue(next);
            scheduleCheck(next.trim());
          }}
          minLength={4}
          maxLength={32}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 w-full rounded-lg border border-transparent bg-mp-white px-4 text-base text-mp-ink transition-colors placeholder:text-mp-ink/45"
        />
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting || undefined}
          className={cx(
            "inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-action px-6 text-base font-semibold whitespace-nowrap text-on-action transition-[filter]",
            submitting ? "opacity-60" : "hover:brightness-95 active:translate-y-px",
          )}
        >
          {t("createNow")}
        </button>
      </div>
      <p aria-live="polite" className={cx("mt-3 min-h-6 text-sm", tone)}>
        {message}
      </p>
    </form>
  );
}
