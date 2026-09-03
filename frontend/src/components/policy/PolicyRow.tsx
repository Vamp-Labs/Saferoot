import Link from "next/link";
import type { Policy } from "@/domain/types";
import { policyStatusLanguage, highestPriorityWarning, readyActionCount } from "@/domain/statusLanguage";
import { truncateAddress } from "@/lib/format";
import { formatCountdown } from "@/lib/format";
import { Badge } from "@/components/ui/Feedback";

interface PolicyRowProps {
  policy: Policy;
}

export function PolicyRow({ policy }: PolicyRowProps) {
  const status = policyStatusLanguage[policy.status];
  const warning = highestPriorityWarning(policy);
  const ready = readyActionCount(policy);

  return (
    <Link
      href={`/policies/${policy.id}`}
      className="focus-ring flex flex-col gap-3 border border-gray-200 bg-white p-5 transition-colors hover:border-tribe-blue sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{policy.name}</p>
        <p className="mt-1 text-xs text-text-secondary">
          {truncateAddress(policy.authoritySafeAddress)} · {policy.actions.length} action
          {policy.actions.length === 1 ? "" : "s"}
          {ready > 0 ? ` · ${ready} ready` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {warning && <Badge tone={warning.tone} label={warning.label} />}
        <Badge tone={status.tone} label={status.label} />
        <span className="whitespace-nowrap text-xs text-text-secondary">{formatCountdown(policy.expiryTime)}</span>
      </div>
    </Link>
  );
}
