import type { Metadata } from "next";
import { fetchPoliciesGrouped } from "@/lib/api/policies";
import { PolicySection } from "@/components/policy/PolicySection";
import { EmptyState } from "@/components/ui/Feedback";
import { ButtonLink } from "@/components/ui/Button";
import { emptyStateCopy } from "@/domain/copy";

export const metadata: Metadata = {
  title: "Policies — SafeRoot Policy",
};

export default async function PoliciesPage() {
  const { data: grouped, isLive } = await fetchPoliciesGrouped();
  const totalPolicies =
    grouped.needsAttention.length + grouped.beingVerified.length + grouped.ready.length + grouped.history.length;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">Policies</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
            Every Creditcoin policy your Safe has authorized, organized like a transaction queue.
          </p>
        </div>
        <ButtonLink href="/policies/new" withArrow>
          New policy
        </ButtonLink>
      </div>

      {!isLive && (
        <p className="mt-6 border border-gray-200 bg-tribe-gray px-4 py-2.5 text-xs text-text-secondary">
          Showing example data — connect the SafeRoot API (NEXT_PUBLIC_API_BASE_URL) to see live policies.
        </p>
      )}

      {totalPolicies === 0 ? (
        <div className="mt-12">
          <EmptyState
            message={emptyStateCopy.noPolicies}
            action={
              <ButtonLink href="/policies/new" withArrow>
                Create a policy
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          <PolicySection
            title="Needs attention"
            description="Waiting for Safe signatures, expiring soon, guardian pause active, or failed verification."
            policies={grouped.needsAttention}
            emptyLabel="Nothing needs your attention."
          />
          <PolicySection
            title="Being verified"
            description="Confirming on Ethereum or waiting on Attestcoin and Creditcoin verification."
            policies={grouped.beingVerified}
            emptyLabel="No policies are currently being verified."
          />
          <PolicySection
            title="Ready"
            description="Active policies with unused actions."
            policies={grouped.ready}
            emptyLabel="No active policies with unused actions."
          />
          <PolicySection
            title="History"
            description="Completed, expired, paused, or superseded policies."
            policies={grouped.history}
            emptyLabel="No completed policies yet."
          />
        </div>
      )}
    </div>
  );
}
