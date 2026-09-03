import type { Policy } from "@/domain/types";
import { truncateAddress, formatDateTime } from "@/lib/format";
import { CopyableAddress } from "@/components/ui/CopyableAddress";

interface ImpactSummaryProps {
  policy: Policy;
}

function maxExposureLabel(policy: Policy): string {
  const grant = policy.actions.find((action) => action.templateType === "grant");
  if (grant?.amountLabel && grant.assetLabel) return `${grant.amountLabel} ${grant.assetLabel}`;
  return "No direct value transfer";
}

export function ImpactSummary({ policy }: ImpactSummaryProps) {
  return (
    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Creditcoin actions</dt>
        <dd className="mt-1 text-xl font-medium text-text-primary">{policy.actions.length}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Maximum transfer</dt>
        <dd className="mt-1 text-xl font-medium text-text-primary">{maxExposureLabel(policy)}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Destination</dt>
        <dd className="mt-1 text-xl font-medium text-text-primary">Creditcoin CC3</dd>
      </div>
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Expiry</dt>
        <dd className="mt-1 text-sm font-medium text-text-primary">{formatDateTime(policy.expiryTime)}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Executor identity</dt>
        <dd className="mt-1">
          <CopyableAddress address={policy.executorAddress || truncateAddress("0x0")} full={false} />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Authority Safe</dt>
        <dd className="mt-1">
          <CopyableAddress address={policy.authoritySafeAddress} full={false} />
        </dd>
      </div>
    </dl>
  );
}
