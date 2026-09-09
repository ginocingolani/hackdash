import { cx } from "@/lib/cx";

// The Media Party icon-only mark: a 2×2 cluster of rounded diamonds
// (blue/red/orange/yellow) whose overlaps darken multiply-style — the plum
// center is literally the blend of the primaries. Theme-invariant brand fill.
export function DiamondMark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cx("shrink-0", className)}
    >
      <g transform="rotate(45 12 12)">
        <rect x="4" y="4" width="8" height="8" rx="1.8" fill="#0071AC" />
        <rect x="12" y="4" width="8" height="8" rx="1.8" fill="#FF4654" />
        <rect x="4" y="12" width="8" height="8" rx="1.8" fill="#FE9144" />
        <rect x="12" y="12" width="8" height="8" rx="1.8" fill="#FFDC00" />
        <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1.2" fill="#58253A" />
      </g>
    </svg>
  );
}

// The HACKDASH wordmark: the MEDIAPARTY treatment — Poppins heavy uppercase
// with very wide tracking.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "font-extrabold tracking-[0.28em] text-ink uppercase",
        className,
      )}
    >
      Hackdash
    </span>
  );
}
