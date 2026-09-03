"use client";

import { useState } from "react";
import { useConnect, useConnection, useDisconnect } from "wagmi";
import { truncateAddress } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { CopyableAddress } from "@/components/ui/CopyableAddress";

export function WalletButton() {
  const connection = useConnection();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  if (connection.status !== "connected") {
    const injectedConnector = connectors[0];
    return (
      <div className="relative">
        <Button
          type="button"
          onClick={() => injectedConnector && connect({ connector: injectedConnector })}
          disabled={!injectedConnector || isPending}
          className="!px-4 !py-2"
        >
          {isPending ? "Connecting…" : "Connect wallet"}
        </Button>
        {error && (
          <p role="alert" className="absolute right-0 top-full mt-2 w-56 border border-danger bg-danger-tint px-3 py-2 text-xs text-danger">
            {error.message || "Could not connect. Is a wallet installed?"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="focus-ring flex items-center gap-2 border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-primary hover:border-tribe-blue transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        {truncateAddress(connection.address)}
      </button>
      {menuOpen && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-64 border border-gray-200 bg-white p-4 shadow-none">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Connected wallet</p>
          <div className="mt-1.5">
            <CopyableAddress address={connection.address} full />
          </div>
          <button
            type="button"
            onClick={() => {
              disconnect();
              setMenuOpen(false);
            }}
            className="focus-ring mt-4 w-full border border-text-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-primary hover:border-danger hover:text-danger transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
