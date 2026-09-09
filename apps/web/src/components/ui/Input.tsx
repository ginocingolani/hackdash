import { cx } from "@/lib/cx";
import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cx(
        "h-10 w-full rounded-lg border border-line bg-raised px-3 text-sm text-ink transition-colors placeholder:text-muted hover:border-muted/60 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    />
  );
}

export interface SearchInputProps extends InputProps {
  /** Accessible name for the field (there is no visible label). */
  label?: string;
}

export function SearchInput({
  label = "Search",
  className,
  ...props
}: SearchInputProps) {
  return (
    <span className={cx("relative block", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
      >
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="m13.5 13.5 3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <Input type="search" aria-label={label} {...props} className="pl-9" />
    </span>
  );
}
