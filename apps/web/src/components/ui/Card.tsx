import { cx } from "@/lib/cx";
import type { HTMLAttributes } from "react";

// Base card: the raised surface every entity card (dashboard, project, user,
// collection) will build on. Raised over the page ground in both themes.

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover lift for cards that act as links. */
  interactive?: boolean;
  /** Removes the default padding for full-bleed content (covers, media). */
  flush?: boolean;
}

export function Card({
  interactive = false,
  flush = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cx(
        "overflow-hidden rounded-2xl border border-line bg-raised",
        !flush && "p-4",
        interactive &&
          "transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-muted/60 hover:shadow-[0_6px_20px_-8px_color-mix(in_srgb,var(--ink)_25%,transparent)] motion-reduce:hover:translate-y-0",
        className,
      )}
    />
  );
}
