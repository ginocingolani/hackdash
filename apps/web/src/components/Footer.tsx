import { getTranslations } from "next-intl/server";
import { DiamondMark, Wordmark } from "@/components/Wordmark";

// The diamond checkerboard band, reduced to a single quiet row — the brand's
// hero/footer pattern from the style guide. Colors cycle the raw palette.
const BAND = [
  "bg-mp-red",
  "bg-mp-blue",
  "bg-mp-cyan",
  "bg-mp-yellow",
  "bg-mp-orange",
] as const;

function DiamondRow() {
  return (
    <div
      aria-hidden="true"
      className="flex justify-center gap-3 overflow-hidden py-1"
    >
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 shrink-0 rotate-45 rounded-[22%] ${BAND[i % BAND.length]}`}
        />
      ))}
    </div>
  );
}

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <DiamondRow />
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <span className="flex items-center gap-2">
            <DiamondMark size={16} />
            <Wordmark className="text-xs" />
          </span>
          <p className="text-sm text-muted">
            {t("tagline")} {t("openSource")}
          </p>
        </div>
      </div>
    </footer>
  );
}
