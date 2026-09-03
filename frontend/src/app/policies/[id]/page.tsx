import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Hex } from "viem";
import { fetchPolicyDetail } from "@/lib/api/policies";
import { fetchActivity } from "@/lib/api/activity";
import { journeyStageForStatus, policyStatusLanguage } from "@/domain/statusLanguage";
import { JourneyIndicator } from "@/components/layout/JourneyIndicator";
import { ImpactSummary } from "@/components/policy/ImpactSummary";
import { ActivityList } from "@/components/activity/ActivityList";
import { GuardianBanner } from "@/components/guardian/GuardianBanner";
import { GuardianPauseControl } from "@/components/guardian/GuardianPauseControl";
import { Badge } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Surfaces";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id} — SafeRoot Policy` };
}

const nextStepHref: Record<string, string> = {
  AwaitingApproval: "review",
  ApprovedOnEthereum: "verify",
  AwaitingEvidence: "verify",
  Verifying: "verify",
  Active: "execute",
  Paused: "execute",
};

const nextStepLabel: Record<string, string> = {
  AwaitingApproval: "Review and approve",
  ApprovedOnEthereum: "View verification progress",
  AwaitingEvidence: "View verification progress",
  Verifying: "View verification progress",
  Active: "Go to Action Center",
  Paused: "View Action Center",
};

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data: policy }, { data: activity }] = await Promise.all([fetchPolicyDetail(id), fetchActivity(id)]);

  if (!policy) notFound();

  const status = policyStatusLanguage[policy.status];
  const nextHref = nextStepHref[policy.status];

  return (
    <div className="flex flex-1 flex-col">
      <JourneyIndicator current={journeyStageForStatus(policy.status)} />
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 lg:px-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">{policy.name}</h1>
              <Badge tone={status.tone} label={status.label} />
            </div>
            <p className="mt-2 text-sm text-text-secondary">Version {policy.version} · Policy ID {policy.id}</p>
          </div>
          {nextHref && (
            <ButtonLink href={`/policies/${policy.id}/${nextHref}`} withArrow>
              {nextStepLabel[policy.status]}
            </ButtonLink>
          )}
        </div>

        {policy.status === "Paused" && (
          <div className="mt-6">
            <GuardianBanner />
          </div>
        )}

        <Card className="mt-8">
          <ImpactSummary policy={policy} />
        </Card>

        {policy.status === "Active" && (
          <Card className="mt-6">
            <Disclosure label="Emergency controls">
              <GuardianPauseControl policyId={policy.id as Hex} policyName={policy.name} />
            </Disclosure>
          </Card>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <TextLink href={`/policies/${policy.id}/protected`}>See how tampered actions are blocked</TextLink>
        </div>

        <div className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium text-text-primary">Policy activity</h2>
            <TextLink href={`/activity?policyId=${policy.id}`}>View full activity</TextLink>
          </div>
          <div className="mt-4">
            <ActivityList events={activity.slice(0, 6)} />
          </div>
        </div>
      </div>
    </div>
  );
}
