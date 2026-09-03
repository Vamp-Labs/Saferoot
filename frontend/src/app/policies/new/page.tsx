import type { Metadata } from "next";
import { fetchIntegrations } from "@/lib/api/integrations";
import { JourneyIndicator } from "@/components/layout/JourneyIndicator";
import { PolicyBuilderForm } from "@/components/policy/PolicyBuilderForm";
import { Callout } from "@/components/ui/Feedback";

export const metadata: Metadata = {
  title: "Create Policy — SafeRoot Policy",
};

export default async function NewPolicyPage() {
  const { data: integrations } = await fetchIntegrations();
  const integration = integrations.find((item) => item.verified) ?? integrations[0];

  return (
    <div className="flex flex-1 flex-col">
      <JourneyIndicator current="Build" />
      {integration ? (
        <PolicyBuilderForm integration={integration} />
      ) : (
        <div className="mx-auto max-w-2xl px-6 py-16">
          <Callout tone="warning" title="No verified Creditcoin integration is available">
            SafeRoot needs at least one verified integration before a policy can be built.
          </Callout>
        </div>
      )}
    </div>
  );
}
