import { PROJECT_STATUSES } from "@hackdash/db";

// The six-segment status bar, blown up to hero scale on the ink ground —
// the product's core metaphor as the landing's one graphic. Segments fill
// left to right once on load (the page's single orchestrated motion moment;
// globals.css collapses it under prefers-reduced-motion), ending on the
// celebratory yellow "releasing" segment. Stage names sit beneath so the
// motif teaches the vocabulary instead of decorating.

export function HeroStatusMotif({ labels }: { labels: string[] }) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <style>{`@keyframes hd-hero-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
      <div aria-hidden="true" className="flex gap-1.5">
        {PROJECT_STATUSES.map((stage, i) => (
          <span
            key={stage}
            className={`h-2.5 flex-1 origin-left rounded-full sm:h-3 ${
              stage === "releasing" ? "bg-mp-yellow" : "bg-mp-red"
            }`}
            style={{
              animation: `hd-hero-fill 0.45s ease-out ${0.15 + i * 0.12}s both`,
            }}
          />
        ))}
      </div>
      <div className="mt-2 hidden gap-1.5 sm:flex">
        {labels.map((label) => (
          <span key={label} className="flex-1 text-center text-[11px] text-mp-white/50">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
