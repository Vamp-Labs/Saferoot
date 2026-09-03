import type { Metadata } from "next";
import { fetchActivity } from "@/lib/api/activity";
import { ActivityList } from "@/components/activity/ActivityList";
import { TextLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Activity — SafeRoot Policy",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ policyId?: string }>;
}) {
  const { policyId } = await searchParams;
  const { data: events, isLive } = await fetchActivity(policyId);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
      <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">Activity</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
        Every Safe approval, verification step, execution, and blocked attempt across Ethereum and Creditcoin, in one history.
      </p>

      {policyId && (
        <div className="mt-4">
          <TextLink href="/activity">Clear policy filter</TextLink>
        </div>
      )}

      {!isLive && (
        <p className="mt-6 border border-gray-200 bg-tribe-gray px-4 py-2.5 text-xs text-text-secondary">
          Showing example data — connect the SafeRoot API (NEXT_PUBLIC_API_BASE_URL) to see live activity.
        </p>
      )}

      <div className="mt-8">
        <ActivityList events={events} />
      </div>
    </div>
  );
}
