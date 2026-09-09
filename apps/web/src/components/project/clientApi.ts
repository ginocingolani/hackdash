"use client";

import { useTranslations } from "next-intl";

// Thin client for the legacy-contract /api/v2 REST endpoints.
// Error bodies are `{ error: <code> }`; codes map onto the errors.api
// i18n namespace (unknown codes fall back to errors.api.unknown).

export type ApiResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; status: number };

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const headers: HeadersInit = {
      ...(typeof init?.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    };
    const res = await fetch(path, { ...init, headers });
    if (res.status === 204) return { ok: true, data: undefined as T };
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const code =
        data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "unknown";
      return { ok: false, code, status: res.status };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, code: "unknown", status: 0 };
  }
}

// Codes present in the errors.api catalog (mirrors ServiceErrorCode).
const KNOWN_CODES = new Set([
  "not_authenticated",
  "forbidden",
  "not_found",
  "subdomain_invalid",
  "subdomain_inuse",
  "title_required",
  "description_required",
  "email_invalid",
  "name_required",
  "email_required",
  "dashboard_closed",
  "dashboard_has_projects",
  "dashboard_has_admins",
  "last_admin",
  "leader_cannot_leave",
  "validation_failed",
]);

export function useApiErrorMessage(): (code: string) => string {
  const t = useTranslations("errors.api");
  return (code: string) => t(KNOWN_CODES.has(code) ? code : "unknown");
}
