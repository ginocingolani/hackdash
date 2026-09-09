// Tiny client-side helper for the legacy /api/v2 REST surface.
// Errors carry the legacy `{ error: <code> }` body as `ApiError.code`,
// which the UI maps onto the `errors.api.*` message catalog.

export class ApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ApiError";
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError("unknown");
  }
  if (!res.ok) {
    let code = "unknown";
    try {
      const data = (await res.json()) as { error?: unknown };
      if (typeof data.error === "string") code = data.error;
    } catch {
      // Non-JSON error body — keep the generic code.
    }
    throw new ApiError(code);
  }
  if (res.status === 204) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function errorCode(error: unknown): string {
  return error instanceof ApiError ? error.code : "unknown";
}
