const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(date: Date | string, locale: string): string {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, span] of UNITS) {
    if (Math.abs(seconds) >= span) return rtf.format(Math.round(seconds / span), unit);
  }
  return rtf.format(Math.round(seconds), "second");
}
