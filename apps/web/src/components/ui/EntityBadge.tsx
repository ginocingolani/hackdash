import { cx } from "@/lib/cx";
import type { EntityKind } from "./DiamondAvatar";

// Entity colors carry MEANING, never decoration: this badge is for mixed
// contexts (search results, profile tabs) where the entity type isn't obvious.
// Text color mixes the entity token toward ink so it stays readable in both
// themes (entity tokens lighten in dark mode; ink flips to light).

const ENTITY_LABELS: Record<EntityKind, string> = {
  dashboard: "Dashboard",
  project: "Project",
  user: "User",
  collection: "Collection",
};

export interface EntityBadgeProps {
  entity: EntityKind;
  /** Localized label; defaults to English. */
  label?: string;
  className?: string;
}

export function EntityBadge({ entity, label, className }: EntityBadgeProps) {
  const color = `var(--entity-${entity})`;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        color: `color-mix(in srgb, ${color} 70%, var(--ink))`,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      <span
        aria-hidden="true"
        className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[22%]"
        style={{ background: color }}
      />
      {label ?? ENTITY_LABELS[entity]}
    </span>
  );
}
