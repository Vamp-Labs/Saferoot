import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPolicyDetail } from "@/lib/api/policies";
import { fetchActivity } from "@/lib/api/activity";
import { TamperedExecutionPanel } from "@/components/policy/TamperedExecutionPanel";
import { GuardianBanner } from "@/components/guardian/GuardianBanner";
import { Card } from "@/components/ui/Surfaces";
import { Callout } from "@/components/ui/Feedback";
import { formatDateTime, truncateAddress } from "@/lib/format";

export const metadata: Metadata = {
  title: "Protected — SafeRoot Policy",
};

export default async function ProtectedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data: policy }, { data: activity }] = await Promise.all([fetchPolicyDetail(id), fetchActivity(id)]);
  if (!policy) notFound();

  const grantAction = policy.actions.find((action) => action.templateType === "grant") ?? policy.actions[0];
  const guardianEvent = activity.find((event) => event.type === "GuardianPauseActivated");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-0">
      <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">Protected</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">
        SafeRoot enforces exactly what {policy.name}&apos;s authority Safe approved. An altered attempt is rejected before any
        funds move.
      </p>

      <div className="mt-10">
        {grantAction ? (
          <TamperedExecutionPanel policy={policy} action={grantAction} />
        ) : (
          <Callout tone="neutral" title="No grant action on this policy">
            Add a contributor grant action to demonstrate a tampered-amount rejection.
          </Callout>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium text-text-primary">Guardian</h2>
        {policy.status === "Paused" ? (
          <div className="mt-4 flex flex-col gap-3">
            <GuardianBanner />
            {guardianEvent && (
              <Card>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Guardian</dt>
                    <dd className="font-mono text-xs text-text-primary">{truncateAddress(guardianEvent.actor)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Activated</dt>
                    <dd className="text-text-primary">{formatDateTime(guardianEvent.timestamp)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Affected policy</dt>
                    <dd className="text-text-primary">{policy.name}</dd>
                  </div>
                </dl>
              </Card>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">No guardian pause is active on this policy.</p>
        )}
      </div>
    </div>
  );
}
