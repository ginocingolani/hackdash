import { cx } from "@/lib/cx";
import type { ReactNode } from "react";

// The one discovery grid: 1 column below 640, 2 below 1024, 3 below 1440,
// 4 above (improvement plan §3.2). Every entity card renders inside it.
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
