"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { NetworkId } from "@/domain/types";
import { NetworkBadge } from "./NetworkBadge";
import { SafeContextPanel } from "./SafeContextPanel";
import { WalletButton } from "./WalletButton";

const navLinks = [
  { href: "/policies", label: "Policies" },
  { href: "/activity", label: "Activity" },
  { href: "/docs", label: "Docs" },
];

function networkForPath(pathname: string): NetworkId | null {
  if (pathname.includes("/verify") || pathname.includes("/execute") || pathname.includes("/protected")) {
    return "creditcoin-cc3";
  }
  if (pathname === "/select-safe" || pathname.includes("/new") || pathname.includes("/review")) {
    return "ethereum-sepolia";
  }
  return null;
}

export function TopBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const network = networkForPath(pathname);

  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex h-24 max-w-[1400px] items-center justify-between px-6 lg:px-12">
        <Link href="/policies" className="font-display text-xl font-bold uppercase tracking-tight text-text-primary focus-ring">
          SafeRoot
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-wider md:flex">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "focus-ring transition-colors",
                  active ? "text-tribe-blue" : "text-text-primary hover:text-tribe-blue",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {network && <NetworkBadge network={network} />}
          <SafeContextPanel />
          <WalletButton />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
          className="focus-ring border border-gray-300 p-2 text-text-primary md:hidden"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeWidth="1.75" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-xs font-semibold uppercase tracking-wider">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "focus-ring",
                  pathname.startsWith(link.href) ? "text-tribe-blue" : "text-text-primary",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            {network && <NetworkBadge network={network} />}
            <SafeContextPanel />
          </div>
          <WalletButton />
        </div>
      )}
    </header>
  );
}
