"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { CopyableAddress } from "@/components/ui/CopyableAddress";

export function SafeContextPanel() {
  const { selectedSafe, setSelectedSafe } = useAppState();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!selectedSafe) {
    return (
      <button
        type="button"
        onClick={() => router.push("/select-safe")}
        className="focus-ring border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:border-tribe-blue hover:text-tribe-blue transition-colors"
      >
        Select Safe
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="focus-ring border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-primary hover:border-tribe-blue transition-colors"
      >
        {selectedSafe.name ?? "Authority Safe"}
      </button>
      {open && (
        <div role="dialog" className="absolute right-0 top-full z-40 mt-2 w-72 border border-gray-200 bg-white p-4 shadow-none">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Authority Safe</p>
          <p className="mt-1 text-sm font-medium text-text-primary">{selectedSafe.name ?? "Unnamed Safe"}</p>
          <div className="mt-1.5">
            <CopyableAddress address={selectedSafe.address} full />
          </div>
          <dl className="mt-3 space-y-1 text-xs text-text-secondary">
            <div className="flex justify-between">
              <dt>Network</dt>
              <dd className="text-text-primary">Ethereum Sepolia</dd>
            </div>
            <div className="flex justify-between">
              <dt>Owners</dt>
              <dd className="text-text-primary">{selectedSafe.owners.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Threshold</dt>
              <dd className="text-text-primary">
                {selectedSafe.threshold}-of-{selectedSafe.owners.length}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              setSelectedSafe(null);
              setOpen(false);
              router.push("/select-safe");
            }}
            className="focus-ring mt-4 w-full border border-text-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-primary hover:border-tribe-blue hover:text-tribe-blue transition-colors"
          >
            Change Safe
          </button>
        </div>
      )}
    </div>
  );
}
