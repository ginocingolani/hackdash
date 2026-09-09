import { PROJECT_STATUSES, type ProjectStatus } from "@hackdash/db";
import { cx } from "@/lib/cx";

// The 6-segment progress bar — HackDash's most distinctive UI element.
// Segment order derives ONLY from the canonical PROJECT_STATUSES array in
// @hackdash/db (the legacy client and server disagreed; the server order won).
// Filled segments are action red; the final "releasing" segment fills yellow —
// the celebratory Media Party color (the palette has no green).

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  brainstorming: "Brainstorming",
  wireframing: "Wireframing",
  building: "Building",
  researching: "Researching",
  prototyping: "Prototyping",
  releasing: "Releasing",
};

type StatusBarSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<
  StatusBarSize,
  { bar: string; segment: string; label: string }
> = {
  sm: { bar: "gap-[3px]", segment: "h-1.5", label: "" },
  md: { bar: "gap-1", segment: "h-2", label: "text-xs" },
  lg: { bar: "gap-1.5", segment: "h-3", label: "text-sm" },
};

export interface StatusBarProps {
  status: ProjectStatus;
  size?: StatusBarSize;
  /** Localized stage names; defaults to English. */
  labels?: Partial<Record<ProjectStatus, string>>;
  className?: string;
}

export function StatusBar({
  status,
  size = "md",
  labels,
  className,
}: StatusBarProps) {
  const index = PROJECT_STATUSES.indexOf(status);
  const label = labels?.[status] ?? STATUS_LABELS[status];
  const styles = SIZE_STYLES[size];
  const accessibleLabel = `${label} — stage ${index + 1} of ${PROJECT_STATUSES.length}`;

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      className={cx("min-w-0", className)}
    >
      <div className={cx("flex", styles.bar)}>
        {PROJECT_STATUSES.map((stage, i) => {
          const filled = i <= index;
          return (
            <span
              key={stage}
              className={cx(
                "flex-1 rounded-full transition-colors",
                styles.segment,
                filled
                  ? stage === "releasing"
                    ? "bg-mp-yellow"
                    : "bg-action"
                  : "bg-line",
              )}
            />
          );
        })}
      </div>
      {size === "sm" ? (
        <span className="sr-only">{accessibleLabel}</span>
      ) : (
        <p className={cx("mt-1.5 font-medium text-ink", styles.label)}>
          {label}
          <span className="ml-1.5 font-normal text-muted">
            {index + 1}/{PROJECT_STATUSES.length}
          </span>
        </p>
      )}
    </div>
  );
}
