import Link from "next/link";
import { cx } from "@/lib/cx";
import type { EntityKind } from "@/components/ui/DiamondAvatar";

// The four discovery filters as entity-colored pills. Entity colors carry
// meaning here (per the design spec: tab pills on discovery are one of the
// few sanctioned uses). Pills are plain links so filtering stays URL-driven
// and server-rendered.

export type DiscoveryKind = "dashboards" | "projects" | "people" | "collections";

export const DISCOVERY_TABS: {
  kind: DiscoveryKind;
  href: string;
  entity: EntityKind;
}[] = [
  { kind: "dashboards", href: "/dashboards", entity: "dashboard" },
  { kind: "projects", href: "/projects", entity: "project" },
  { kind: "people", href: "/users", entity: "user" },
  { kind: "collections", href: "/collections", entity: "collection" },
];

export interface FilterPillsProps {
  /** Currently active filter; the landing passes "dashboards". */
  active: DiscoveryKind;
  /** Localized labels (landing.tabs.*). */
  labels: Record<DiscoveryKind, string>;
  /**
   * Accessible name for the nav landmark. English fallback until a
   * landing.tabs.navLabel key exists (see messages/TODO-landing.md).
   */
  navLabel?: string;
  className?: string;
}

export function FilterPills({ active, labels, navLabel = "Browse", className }: FilterPillsProps) {
  return (
    <nav aria-label={navLabel} className={className}>
      <ul className="flex flex-wrap gap-2">
        {DISCOVERY_TABS.map(({ kind, href, entity }) => {
          const isActive = kind === active;
          const color = `var(--entity-${entity})`;
          return (
            <li key={kind}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  isActive
                    ? "font-semibold"
                    : "border-line bg-raised font-medium text-muted hover:border-muted/60 hover:text-ink",
                )}
                style={
                  isActive
                    ? {
                        color: `color-mix(in srgb, ${color} 70%, var(--ink))`,
                        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                        background: `color-mix(in srgb, ${color} 10%, var(--raised))`,
                      }
                    : undefined
                }
              >
                <span
                  aria-hidden="true"
                  className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[22%]"
                  style={{ background: isActive ? color : "var(--line)" }}
                />
                {labels[kind]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
