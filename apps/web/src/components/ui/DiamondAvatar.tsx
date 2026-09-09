import { cx } from "@/lib/cx";

// The rounded diamond (45°-rotated rounded square, border-radius 22%) is the
// Media Party signature shape; it replaces the legacy hexagon as the avatar.
// Fills use the RAW brand palette on purpose — avatars are brand fills and
// stay identical in light and dark (per-entity color; cyan-family fills take
// ink text, everything else takes white).

export type EntityKind = "dashboard" | "project" | "user" | "collection";

const SIZES = { sm: 40, md: 64, lg: 96 } as const;
type AvatarSize = keyof typeof SIZES;

const ENTITY_FILL: Record<EntityKind, { bg: string; fg: string }> = {
  dashboard: { bg: "bg-mp-ink", fg: "text-mp-white" },
  project: { bg: "bg-mp-blue", fg: "text-mp-white" },
  user: { bg: "bg-mp-plum", fg: "text-mp-white" },
  collection: { bg: "bg-mp-teal", fg: "text-mp-ink" },
};

const INITIALS_TEXT: Record<AvatarSize, string> = {
  sm: "text-[11px]",
  md: "text-base",
  lg: "text-2xl",
};

// Deterministic two-letter initials: first letters of the first two words,
// falling back to the first two characters of a single word.
export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export interface DiamondAvatarProps {
  name: string;
  src?: string | null;
  entity?: EntityKind;
  size?: AvatarSize;
  className?: string;
}

export function DiamondAvatar({
  name,
  src,
  entity = "user",
  size = "sm",
  className,
}: DiamondAvatarProps) {
  const px = SIZES[size];
  const inner = Math.round(px * 0.72); // rotated square inscribed in the box
  const fill = ENTITY_FILL[entity];

  return (
    <span
      role="img"
      aria-label={name}
      className={cx("inline-flex items-center justify-center", className)}
      style={{ width: px, height: px }}
    >
      <span
        className={cx(
          "flex rotate-45 items-center justify-center overflow-hidden rounded-[22%]",
          fill.bg,
        )}
        style={{ width: inner, height: inner }}
      >
        {src ? (
          // Plain <img>: avatar sources are arbitrary remote hosts (GitHub,
          // legacy data), which next/image would need per-host config for.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-full w-full -rotate-45 scale-[1.45] object-cover"
          />
        ) : (
          <span
            className={cx(
              "-rotate-45 leading-none font-semibold tracking-wide select-none",
              fill.fg,
              INITIALS_TEXT[size],
            )}
          >
            {initialsFor(name)}
          </span>
        )}
      </span>
    </span>
  );
}
