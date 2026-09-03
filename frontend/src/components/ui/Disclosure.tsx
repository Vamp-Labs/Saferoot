"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DisclosureProps {
  label: string;
  levelLabel?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Disclosure({ label, levelLabel, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-text-primary hover:text-tribe-blue transition-colors"
      >
        <span className="flex items-center gap-2">
          {label}
          {levelLabel && (
            <span className="bg-tribe-gray px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              {levelLabel}
            </span>
          )}
        </span>
        <svg
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
        </svg>
      </button>
      {open && <div className="mt-3 text-sm text-text-secondary">{children}</div>}
    </div>
  );
}
