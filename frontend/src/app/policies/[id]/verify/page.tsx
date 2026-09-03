import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPolicyDetail } from "@/lib/api/policies";
import { JourneyIndicator } from "@/components/layout/JourneyIndicator";
import { VerifyTracker } from "@/components/policy/VerifyTracker";
import { Card } from "@/components/ui/Surfaces";

export const metadata: Metadata = {
  title: "Verify — SafeRoot Policy",
};

export default async function VerifyPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: policy } = await fetchPolicyDetail(id);
  if (!policy) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <JourneyIndicator current="Verify" />
      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-0">
        <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">Verify</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {policy.name} is moving from Ethereum Sepolia to Creditcoin CC3. This updates automatically — no action is
          required.
        </p>
        <Card className="mt-8">
          <VerifyTracker initialPolicy={policy} />
        </Card>
      </div>
    </div>
  );
}
