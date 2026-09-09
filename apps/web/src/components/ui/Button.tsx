import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-action text-on-action font-semibold hover:brightness-95 active:translate-y-px",
  secondary:
    "border border-line bg-raised text-ink font-medium hover:border-muted active:translate-y-px",
  ghost: "text-ink font-medium hover:bg-line/50 active:translate-y-px",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
}

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function classesFor(variant: Variant, size: Size, className?: string) {
  return cx(
    "inline-flex items-center justify-center whitespace-nowrap transition-[background-color,border-color,filter] disabled:pointer-events-none disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, ...rest } = props;

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as ButtonAsLink;
    return (
      <Link
        href={href}
        {...anchorProps}
        className={classesFor(variant, size, className)}
      />
    );
  }

  const buttonProps = rest as ButtonAsButton;
  return (
    <button
      type={buttonProps.type ?? "button"}
      {...buttonProps}
      className={classesFor(variant, size, className)}
    />
  );
}
