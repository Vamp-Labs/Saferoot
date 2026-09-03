import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface ArrowIconProps {
  className?: string;
}

function ArrowIcon({ className }: ArrowIconProps) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-40";

const primaryClasses = "bg-tribe-blue text-white px-6 py-3 hover:bg-tribe-blue/90";
const secondaryClasses =
  "border border-text-primary text-text-primary px-6 py-3 hover:border-tribe-blue hover:text-tribe-blue";
const dangerClasses = "bg-danger text-white px-6 py-3 hover:bg-danger/90";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  withArrow?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", withArrow = false, className, children, ...rest }: ButtonProps) {
  const variantClasses =
    variant === "primary" ? primaryClasses : variant === "danger" ? dangerClasses : secondaryClasses;
  return (
    <button className={cn(baseClasses, variantClasses, className)} {...rest}>
      {children}
      {withArrow && <ArrowIcon />}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  withArrow?: boolean;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ href, variant = "primary", withArrow = false, className, children }: LinkButtonProps) {
  const variantClasses =
    variant === "primary" ? primaryClasses : variant === "danger" ? dangerClasses : secondaryClasses;
  return (
    <Link href={href} className={cn(baseClasses, variantClasses, className)}>
      {children}
      {withArrow && <ArrowIcon />}
    </Link>
  );
}

interface TextLinkProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  type?: "button";
}

export function TextLink({ href, onClick, className, children, type }: TextLinkProps) {
  const classes = cn(
    "group inline-flex items-center gap-2 text-sm font-medium text-text-primary border-b border-text-primary pb-1 hover:text-tribe-blue hover:border-tribe-blue transition-colors focus-ring",
    className,
  );
  const arrow = (
    <svg
      className="h-4 w-4 transform transition-transform group-hover:translate-x-1"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
  if (href) {
    const isExternal = /^https?:\/\//.test(href);
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
          {arrow}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
        {arrow}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} onClick={onClick} className={classes}>
      {children}
      {arrow}
    </button>
  );
}
