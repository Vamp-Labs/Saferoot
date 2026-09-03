import type { NetworkId } from "@/domain/types";
import { cn } from "@/lib/cn";

const networkLabel: Record<NetworkId, string> = {
  "ethereum-sepolia": "Ethereum Sepolia",
  "creditcoin-cc3": "Creditcoin CC3",
};

interface NetworkBadgeProps {
  network: NetworkId;
  className?: string;
}

export function NetworkBadge({ network, className }: NetworkBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-gray-300 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-text-secondary",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", network === "ethereum-sepolia" ? "bg-tribe-blue" : "bg-text-primary")} />
      {networkLabel[network]}
    </span>
  );
}
