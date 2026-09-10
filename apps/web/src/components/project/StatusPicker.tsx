"use client";

import { PROJECT_STATUSES, type ProjectStatus } from "@hackdash/db/shared";
import { cx } from "@/lib/cx";
import type { StatusLabels } from "@/components/dashboard/types";

// The StatusBar as an input: a tappable segmented control over the six
// canonical stages. Native radio inputs carry keyboard and screen-reader
// behavior; the visible tiles echo the progress-bar segments (releasing is
// the celebratory yellow, like the bar's final segment).

interface StatusPickerProps {
  value: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  labels: StatusLabels;
  legend: string;
  name?: string;
  className?: string;
}

export function StatusPicker({
  value,
  onChange,
  labels,
  legend,
  name = "status",
  className,
}: StatusPickerProps) {
  const selectedIndex = PROJECT_STATUSES.indexOf(value);

  return (
    <fieldset className={className}>
      <legend className="mb-2 text-sm font-medium text-ink">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {PROJECT_STATUSES.map((status, index) => {
          const selected = status === value;
          const reached = index <= selectedIndex;
          const isFinal = status === "releasing";
          return (
            <label key={status} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={status}
                checked={selected}
                onChange={() => onChange(status)}
                className="peer sr-only"
              />
              <span
                className={cx(
                  "flex flex-col gap-1.5 rounded-lg border px-2.5 py-2 transition-colors",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action",
                  selected
                    ? "border-action bg-action/10"
                    : "border-line hover:border-muted/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "h-1.5 rounded-full",
                    reached ? (isFinal ? "bg-mp-yellow" : "bg-action") : "bg-line",
                  )}
                />
                <span
                  className={cx(
                    "truncate text-xs font-medium",
                    selected ? "text-ink" : "text-muted",
                  )}
                >
                  {labels[status]}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
