import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPolicyDetail } from "@/lib/api/policies";
import { fetchSafeInfo } from "@/lib/api/safes";
import { JourneyIndicator } from "@/components/layout/JourneyIndicator";
import { ReviewApproveClient } from "@/components/policy/ReviewApproveClient";

export const metadata: Metadata = {
  title: "Review and Approve — SafeRoot Policy",
};

export default async function ReviewPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: policy } = await fetchPolicyDetail(id);
  if (!policy) notFound();

  const { data: safe } = await fetchSafeInfo(policy.authoritySafeAddress);

  return (
    <div className="flex flex-1 flex-col">
      <JourneyIndicator current="Approve" />
      <ReviewApproveClient initialPolicy={policy} safe={safe} />
    </div>
  );
}
