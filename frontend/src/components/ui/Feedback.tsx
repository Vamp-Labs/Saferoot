import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { StatusTone } from "@/domain/statusLanguage";

const toneStyles: Record<StatusTone, string> = {
  neutral: "bg-tribe-gray text-text-secondary",
  info: "bg-info-tint text-info",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
};

function ToneIcon({ tone }: { tone: StatusTone }) {
  const common = "h-3.5 w-3.5 shrink-0";
  switch (tone) {
    case "success":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" />
        </svg>
      );
    case "danger":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a1.5 1.5 0 0 0 1.3 2.25h17.76a1.5 1.5 0 0 0 1.3-2.25L13.7 3.86a1.5 1.5 0 0 0-2.6 0Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
        </svg>
      );
    case "warning":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
          <path d="M12 8v5m0 3h.01" strokeLinecap="round" strokeWidth="1.75" />
        </svg>
      );
    case "info":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
          <path d="M12 11v5m0-8h.01" strokeLinecap="round" strokeWidth="1.75" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="4" strokeWidth="1.75" />
        </svg>
      );
  }
}

interface BadgeProps {
  tone: StatusTone;
  label: string;
  className?: string;
}

export function Badge({ tone, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold tracking-wide",
        toneStyles[tone],
        className,
      )}
    >
      <ToneIcon tone={tone} />
      {label}
    </span>
  );
}

interface CalloutProps {
  tone: StatusTone;
  title: string;
  children?: ReactNode;
  className?: string;
}

export function Callout({ tone, title, children, className }: CalloutProps) {
  const borderTone: Record<StatusTone, string> = {
    neutral: "border-gray-300",
    info: "border-tribe-blue",
    success: "border-success",
    warning: "border-warning",
    danger: "border-danger",
  };
  const iconTone: Record<StatusTone, string> = {
    neutral: "text-text-secondary",
    info: "text-tribe-blue",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };
  return (
    <div className={cn("border-l-2 bg-white px-4 py-3", borderTone[tone], className)} role={tone === "danger" ? "alert" : undefined}>
      <div className={cn("flex items-start gap-2 text-sm font-semibold", iconTone[tone])}>
        <ToneIcon tone={tone} />
        <span>{title}</span>
      </div>
      {children && <div className="mt-1.5 pl-[22px] text-sm text-text-secondary leading-relaxed">{children}</div>}
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-gray-300 px-6 py-16 text-center">
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">{message}</p>
      {action}
    </div>
  );
}
