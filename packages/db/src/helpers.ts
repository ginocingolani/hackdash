export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Legacy behavior: bare links get an http:// prefix.
export function httpPrefix(link: string | undefined): string | undefined {
  if (!link) return link;
  return /^https?:\/\//i.test(link) ? link : `http://${link}`;
}

// Tags arrive as an array or a comma-separated string (legacy contract).
export function normalizeTags(tags: unknown): string[] {
  const list = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? tags.split(",")
      : [];
  return [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 10);
}

export function sameId(a: unknown, b: unknown): boolean {
  return a != null && b != null && String(a) === String(b);
}
