"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Integration } from "@/domain/types";
import {
  actionTemplateMeta,
  defaultGrantValues,
  defaultRiskCapValues,
  describeGrant,
  describePause,
  describeRiskCap,
  encodeGrantParams,
  encodePauseParams,
  encodeRiskCapParams,
  type GrantFieldValues,
  type RiskCapFieldValues,
} from "@/domain/actionTemplates";
import { createDraftPolicy, type CreatePolicyPayload } from "@/lib/api/policies";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Surfaces";
import { Callout } from "@/components/ui/Feedback";
import { Disclosure } from "@/components/ui/Disclosure";

interface PolicyBuilderFormProps {
  integration: Integration;
}

type TemplateFlags = { grant: boolean; risk_cap: boolean; pause: boolean };

function defaultExpiry(hoursFromNow: number): string {
  const date = new Date(Date.now() + hoursFromNow * 3_600_000);
  date.setSeconds(0, 0);
  return date.toISOString().slice(0, 16);
}

export function PolicyBuilderForm({ integration }: PolicyBuilderFormProps) {
  const router = useRouter();
  const { selectedSafe, saveDraftPolicyJson } = useAppState();

  const [policyName, setPolicyName] = useState("Protocol Operations");
  const [expiry, setExpiry] = useState(defaultExpiry(24));
  const [included, setIncluded] = useState<TemplateFlags>({ grant: true, risk_cap: true, pause: true });
  const [grantValues, setGrantValues] = useState<GrantFieldValues>(defaultGrantValues);
  const [riskCapValues, setRiskCapValues] = useState<RiskCapFieldValues>(defaultRiskCapValues);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const grantSupported = integration.supportedActions.some((action) => action.templateType === "grant");
  const riskCapSupported = integration.supportedActions.some((action) => action.templateType === "risk_cap");
  const pauseSupported = integration.supportedActions.some((action) => action.templateType === "pause");

  const activeCount = Number(included.grant) + Number(included.risk_cap) + Number(included.pause);
  const maxExposure = included.grant ? `${grantValues.amount || "0"} ${grantValues.assetSymbol}` : "0";

  useEffect(() => {
    const snapshot = { policyName, expiry, included, grantValues, riskCapValues };
    saveDraftPolicyJson(JSON.stringify(snapshot));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyName, expiry, included, grantValues, riskCapValues]);

  const grantTarget = integration.supportedActions.find((action) => action.templateType === "grant");
  const riskCapTarget = integration.supportedActions.find((action) => action.templateType === "risk_cap");
  const pauseTarget = integration.supportedActions.find((action) => action.templateType === "pause");

  const grantParams = useMemo(() => {
    try {
      return encodeGrantParams(grantValues);
    } catch {
      return null;
    }
  }, [grantValues]);

  const riskCapParams = useMemo(() => encodeRiskCapParams(riskCapValues), [riskCapValues]);
  const pauseParams = useMemo(() => encodePauseParams(), []);

  function validate(): string[] {
    const errors: string[] = [];
    if (activeCount === 0) errors.push("Add at least one action before reviewing this policy.");
    if (!expiry) {
      errors.push("Set a policy expiry.");
    } else if (new Date(expiry).getTime() <= Date.now()) {
      errors.push("Policy expiry must be in the future.");
    }
    if (included.grant) {
      if (!/^0x[0-9a-fA-F]{40}$/.test(grantValues.recipientAddress)) {
        errors.push("The contributor grant recipient address is invalid.");
      }
      if (!(Number(grantValues.amount) > 0)) {
        errors.push("The contributor grant amount must be greater than zero.");
      }
      if (!grantTarget) errors.push("The selected integration does not support the contributor grant action.");
    }
    if (included.risk_cap) {
      const percent = Number(riskCapValues.newValuePercent);
      if (!(percent > 0 && percent <= 100)) {
        errors.push("The maximum LTV must be a percentage between 0 and 100.");
      }
      if (!riskCapTarget) errors.push("The selected integration does not support the risk-cap action.");
    }
    if (included.pause && !pauseTarget) {
      errors.push("The selected integration does not support the emergency pause action.");
    }
    return errors;
  }

  async function handleSubmit() {
    const errors = validate();
    setValidationErrors(errors);
    if (errors.length > 0) return;

    setSubmitting(true);
    const expiryIso = new Date(expiry).toISOString();
    const earliestExecutionIso = new Date().toISOString();

    const actions: CreatePolicyPayload["actions"] = [];
    if (included.grant && grantTarget && grantParams) {
      actions.push({
        templateType: "grant",
        label: describeGrant(grantValues),
        targetContract: grantTarget.targetContract,
        functionSelector: actionTemplateMeta.grant.selector,
        encodedParams: grantParams,
        nativeValue: "0",
        earliestExecution: earliestExecutionIso,
        expiry: expiryIso,
      });
    }
    if (included.risk_cap && riskCapTarget) {
      actions.push({
        templateType: "risk_cap",
        label: describeRiskCap(riskCapValues),
        targetContract: riskCapTarget.targetContract,
        functionSelector: actionTemplateMeta.risk_cap.selector,
        encodedParams: riskCapParams,
        nativeValue: "0",
        earliestExecution: earliestExecutionIso,
        expiry: expiryIso,
      });
    }
    if (included.pause && pauseTarget) {
      actions.push({
        templateType: "pause",
        label: describePause(),
        targetContract: pauseTarget.targetContract,
        functionSelector: actionTemplateMeta.pause.selector,
        encodedParams: pauseParams,
        nativeValue: "0",
        earliestExecution: earliestExecutionIso,
        expiry: expiryIso,
      });
    }

    try {
      const { data: policy } = await createDraftPolicy({
        name: policyName,
        actions,
        activationTime: earliestExecutionIso,
        expiryTime: expiryIso,
        authoritySafeAddress: selectedSafe?.address ?? "",
      });
      router.push(`/policies/${policy.id}/review`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveDraft() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-0">
      <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">Create policy</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">
        Package several Creditcoin actions into one bounded Safe approval. This policy will be submitted to{" "}
        <span className="font-medium text-text-primary">{selectedSafe?.name ?? "your Safe"}</span> for approval.
      </p>

      <Card className="mt-8">
        <label htmlFor="policy-name" className="text-sm font-medium text-text-primary">
          Policy name
        </label>
        <input
          id="policy-name"
          type="text"
          value={policyName}
          onChange={(event) => setPolicyName(event.target.value)}
          className="focus-ring mt-2 w-full border border-gray-300 px-3 py-2.5 text-sm text-text-primary"
        />

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <span className="text-sm font-medium text-text-primary">Destination</span>
            <p className="mt-2 border border-gray-200 bg-tribe-gray px-3 py-2.5 text-sm text-text-secondary">Creditcoin CC3</p>
          </div>
          <div>
            <span className="text-sm font-medium text-text-primary">Executor</span>
            <p className="mt-2 truncate border border-gray-200 bg-tribe-gray px-3 py-2.5 font-mono text-xs text-text-secondary">
              {integration.name} · {integration.executorAddress}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="policy-expiry" className="text-sm font-medium text-text-primary">
            Policy expiry
          </label>
          <input
            id="policy-expiry"
            type="datetime-local"
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            className="focus-ring mt-2 w-full max-w-xs border border-gray-300 px-3 py-2.5 text-sm text-text-primary"
          />
        </div>
      </Card>

      <div className="mt-8 flex items-center justify-between border-y border-gray-200 py-4 text-sm">
        <span className="text-text-secondary">
          <span className="font-medium text-text-primary">{activeCount}</span> action{activeCount === 1 ? "" : "s"} in this policy
        </span>
        <span className="text-text-secondary">
          Maximum financial exposure: <span className="font-medium text-text-primary">{maxExposure}</span>
        </span>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <ActionTemplateCard
          title={actionTemplateMeta.grant.title}
          outcome={describeGrant(grantValues)}
          supported={grantSupported}
          included={included.grant}
          onToggle={() => setIncluded((value) => ({ ...value, grant: !value.grant }))}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Recipient identity">
              <input
                value={grantValues.recipientLabel}
                onChange={(event) => setGrantValues((v) => ({ ...v, recipientLabel: event.target.value }))}
                className="focus-ring w-full border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Recipient address">
              <input
                value={grantValues.recipientAddress}
                onChange={(event) => setGrantValues((v) => ({ ...v, recipientAddress: event.target.value as `0x${string}` }))}
                className="focus-ring w-full border border-gray-300 px-3 py-2 font-mono text-xs"
              />
            </Field>
            <Field label="Asset">
              <input
                value={grantValues.assetSymbol}
                onChange={(event) => setGrantValues((v) => ({ ...v, assetSymbol: event.target.value }))}
                className="focus-ring w-full border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Exact amount">
              <input
                value={grantValues.amount}
                onChange={(event) => setGrantValues((v) => ({ ...v, amount: event.target.value }))}
                inputMode="decimal"
                className="focus-ring w-full border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Disclosure label="Advanced details" levelLabel="Level 3">
            <dl className="space-y-1.5 font-mono text-xs">
              <Row label="Target contract" value={grantTarget?.targetContract ?? "Not supported by this integration"} />
              <Row label="Function selector" value={actionTemplateMeta.grant.selector} />
              <Row label="Encoded params" value={grantParams ?? "—"} />
            </dl>
          </Disclosure>
        </ActionTemplateCard>

        <ActionTemplateCard
          title={actionTemplateMeta.risk_cap.title}
          outcome={describeRiskCap(riskCapValues)}
          supported={riskCapSupported}
          included={included.risk_cap}
          onToggle={() => setIncluded((value) => ({ ...value, risk_cap: !value.risk_cap }))}
        >
          <Field label="New maximum LTV (%)">
            <input
              value={riskCapValues.newValuePercent}
              onChange={(event) => setRiskCapValues((v) => ({ ...v, newValuePercent: event.target.value }))}
              inputMode="decimal"
              className="focus-ring w-full max-w-[10rem] border border-gray-300 px-3 py-2 text-sm"
            />
          </Field>
          <Disclosure label="Advanced details" levelLabel="Level 3">
            <dl className="space-y-1.5 font-mono text-xs">
              <Row label="Target contract" value={riskCapTarget?.targetContract ?? "Not supported by this integration"} />
              <Row label="Function selector" value={actionTemplateMeta.risk_cap.selector} />
              <Row label="Encoded params" value={riskCapParams} />
            </dl>
          </Disclosure>
        </ActionTemplateCard>

        <ActionTemplateCard
          title={actionTemplateMeta.pause.title}
          outcome={describePause()}
          supported={pauseSupported}
          included={included.pause}
          onToggle={() => setIncluded((value) => ({ ...value, pause: !value.pause }))}
        >
          <p className="text-sm text-text-secondary">This action takes no parameters. It pauses new deposits exactly once.</p>
          <Disclosure label="Advanced details" levelLabel="Level 3">
            <dl className="space-y-1.5 font-mono text-xs">
              <Row label="Target contract" value={pauseTarget?.targetContract ?? "Not supported by this integration"} />
              <Row label="Function selector" value={actionTemplateMeta.pause.selector} />
              <Row label="Encoded params" value={pauseParams} />
            </dl>
          </Disclosure>
        </ActionTemplateCard>
      </div>

      {validationErrors.length > 0 && (
        <div className="mt-8">
          <Callout tone="danger" title="This policy cannot be reviewed yet">
            <ul className="list-disc space-y-1 pl-4">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Callout>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Button type="button" onClick={handleSubmit} disabled={submitting} withArrow>
          {submitting ? "Preparing…" : "Review policy"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleSaveDraft} className="!px-5 !py-2.5">
          {saved ? "Draft saved" : "Save draft"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-text-primary">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="max-w-[70%] truncate text-right text-text-primary" title={value}>
        {value}
      </dd>
    </div>
  );
}

function ActionTemplateCard({
  title,
  outcome,
  supported,
  included,
  onToggle,
  children,
}: {
  title: string;
  outcome: string;
  supported: boolean;
  included: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{title}</p>
          <p className="mt-1 text-base font-medium text-text-primary">{outcome}</p>
          {!supported && <p className="mt-1 text-xs text-danger">Not supported by the selected integration.</p>}
        </div>
        <Button type="button" variant={included ? "secondary" : "primary"} onClick={onToggle} className="!px-4 !py-2 shrink-0">
          {included ? "Remove" : "Add action"}
        </Button>
      </div>
      {included && <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-5">{children}</div>}
    </Card>
  );
}
