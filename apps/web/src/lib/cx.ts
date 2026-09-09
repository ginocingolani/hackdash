// Tiny className joiner — the only "utility library" the UI kit needs.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
