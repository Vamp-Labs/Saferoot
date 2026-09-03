import type { ActivityEvent } from "@/domain/types";
import { formatDateTime, truncateAddress } from "@/lib/format";
import { NetworkBadge } from "@/components/layout/NetworkBadge";
import { Badge } from "@/components/ui/Feedback";
import { Disclosure } from "@/components/ui/Disclosure";
import { rejectionCopyLibrary } from "@/domain/copy";
import type { StatusTone } from "@/domain/statusLanguage";

const eventTone: Record<ActivityEvent["type"], StatusTone> = {
  PolicyDrafted: "neutral",
  SubmittedToSafe: "info",
  SafeSignatureAdded: "info",
  SafeThresholdReached: "info",
  SourceTransactionExecuted: "info",
  AttestcoinEvidenceAvailable: "info",
  PolicyVerifiedOnCreditcoin: "success",
  ActionSubmitted: "info",
  ActionExecuted: "success",
  ActionBlocked: "danger",
  GuardianPauseActivated: "danger",
  PolicyExpired: "neutral",
  NewPolicyVersionActivated: "info",
};

interface ActivityRowProps {
  event: ActivityEvent;
}

export function ActivityRow({ event }: ActivityRowProps) {
  const tone = eventTone[event.type];
  const rejection = event.rejectionReason ? rejectionCopyLibrary[event.rejectionReason] : null;

  return (
    <div className="border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{event.humanReadableMessage}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatDateTime(event.timestamp)} · {event.actor === "system" ? "SafeRoot" : truncateAddress(event.actor)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NetworkBadge network={event.network} />
          <Badge tone={tone} label={event.type.replace(/([A-Z])/g, " $1").trim()} />
        </div>
      </div>

      {rejection && (
        <p className="mt-3 border-l-2 border-danger bg-danger-tint px-3 py-2 text-xs text-danger">{rejection.headline} — {rejection.lines[0]}</p>
      )}

      <div className="mt-3">
        <Disclosure label="Technical detail" levelLabel="Level 3">
          <dl className="space-y-1.5 font-mono text-xs">
            {event.txHash && <DetailRow label="Transaction hash" value={event.txHash} />}
            {event.technicalDetails.policyVersion !== undefined && (
              <DetailRow label="Policy version" value={String(event.technicalDetails.policyVersion)} />
            )}
            {event.technicalDetails.sourceEmitter && <DetailRow label="Source emitter" value={event.technicalDetails.sourceEmitter} />}
            {event.technicalDetails.executor && <DetailRow label="Creditcoin executor" value={event.technicalDetails.executor} />}
            {event.technicalDetails.attestcoinProofRef && (
              <DetailRow label="Attestcoin proof reference" value={event.technicalDetails.attestcoinProofRef} />
            )}
            {event.technicalDetails.actionCommitment && (
              <DetailRow label="Action commitment" value={event.technicalDetails.actionCommitment} />
            )}
            {event.technicalDetails.creditcoinTxHash && (
              <DetailRow label="Creditcoin transaction hash" value={event.technicalDetails.creditcoinTxHash} />
            )}
            {event.technicalDetails.safeTxHash && <DetailRow label="Safe transaction hash" value={event.technicalDetails.safeTxHash} />}
          </dl>
        </Disclosure>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="max-w-[65%] truncate text-right text-text-primary" title={value}>
        {value}
      </dd>
    </div>
  );
}
