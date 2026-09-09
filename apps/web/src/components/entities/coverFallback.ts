// Deterministic branded gradient for entities without a cover image — removes
// the legacy trap where cover-less projects were invisible. Pairs are drawn
// from adjacent Media Party palette colors (the logo's overlap sequence).
const PAIRS: [string, string][] = [
  ["#00D7FB", "#0071AC"],
  ["#0071AC", "#FF4654"],
  ["#FF4654", "#FE9144"],
  ["#FE9144", "#FFDC00"],
  ["#04AECA", "#0B2A47"],
  ["#FF4654", "#58253A"],
];

export function coverGradient(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const [from, to] = PAIRS[Math.abs(hash) % PAIRS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
