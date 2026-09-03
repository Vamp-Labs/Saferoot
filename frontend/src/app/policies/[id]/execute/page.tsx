import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPolicyDetail } from "@/lib/api/policies";
import { JourneyIndicator } from "@/components/layout/JourneyIndicator";
import { ExecuteScreenClient } from "@/components/policy/ExecuteScreenClient";

export const metadata: Metadata = {
  title: "Execute — SafeRoot Policy",
};

export default async function ExecutePolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: policy } = await fetchPolicyDetail(id);
  if (!policy) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <JourneyIndicator current="Execute" />
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-0">
        <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">Execute</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">
          Anyone can relay an approved action from {policy.name}, but nobody can change what the Safe approved.
        </p>
        <div className="mt-8">
          <ExecuteScreenClient policy={policy} />
        </div>
      </div>
    </div>
  );
}
