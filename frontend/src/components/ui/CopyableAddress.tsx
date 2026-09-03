"use client";

import { useState } from "react";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/cn";

interface CopyableAddressProps {
  address: string;
  className?: string;
  full?: boolean;
}

export function CopyableAddress({ address, className, full = false }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-tribe-blue transition-colors focus-ring",
        className,
      )}
      title={address}
      aria-label={`Copy address ${address}`}
    >
      <span>{full ? address : truncateAddress(address)}</span>
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        {copied ? (
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="1" strokeWidth="1.5" />
            <path d="M5 15V5a1 1 0 0 1 1-1h10" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
