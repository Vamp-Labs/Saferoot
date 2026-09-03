import { decodeAbiParameters, encodeAbiParameters, formatUnits, parseUnits, toFunctionSelector, type Address, type Hex } from "viem";
import type { ActionTemplateType } from "./types";

export interface GrantFieldValues {
  recipientLabel: string;
  recipientAddress: Address;
  assetSymbol: string;
  assetDecimals: number;
  amount: string;
}

export interface RiskCapFieldValues {
  parameterLabel: string;
  newValuePercent: string;
}

export type PauseFieldValues = Record<string, never>;

export type ActionFieldValues = GrantFieldValues | RiskCapFieldValues | PauseFieldValues;

export interface ActionTemplateMeta {
  templateType: ActionTemplateType;
  title: string;
  outcomeVerb: string;
  functionSignature: string;
  selector: Hex;
}

export const actionTemplateMeta: Record<ActionTemplateType, ActionTemplateMeta> = {
  grant: {
    templateType: "grant",
    title: "Contributor grant",
    outcomeVerb: "Pay",
    functionSignature: "transfer(address,uint256)",
    selector: toFunctionSelector("transfer(address,uint256)"),
  },
  risk_cap: {
    templateType: "risk_cap",
    title: "Risk-cap change",
    outcomeVerb: "Set maximum LTV",
    functionSignature: "setMaxLTV(uint256)",
    selector: toFunctionSelector("setMaxLTV(uint256)"),
  },
  pause: {
    templateType: "pause",
    title: "Emergency pause",
    outcomeVerb: "Pause new deposits",
    functionSignature: "pauseNewDeposits()",
    selector: toFunctionSelector("pauseNewDeposits()"),
  },
};

export function encodeGrantParams(values: GrantFieldValues): Hex {
  return encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }],
    [values.recipientAddress, parseUnits(values.amount || "0", values.assetDecimals)],
  );
}

export function encodeRiskCapParams(values: RiskCapFieldValues): Hex {
  const percent = Number(values.newValuePercent || "0");
  const basisPoints = BigInt(Math.round(percent * 100));
  return encodeAbiParameters([{ type: "uint256" }], [basisPoints]);
}

export function encodePauseParams(): Hex {
  return "0x";
}

export interface DecodedGrantParams {
  recipient: Address;
  amount: bigint;
}

export function decodeGrantParams(params: Hex): DecodedGrantParams {
  const [recipient, amount] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params);
  return { recipient, amount };
}

export function formatGrantAmount(amount: bigint, decimals = 6): string {
  return formatUnits(amount, decimals);
}

export function describeGrant(values: GrantFieldValues): string {
  return `Pay ${values.amount || "0"} ${values.assetSymbol} to ${values.recipientLabel || "recipient"}`;
}

export function describeRiskCap(values: RiskCapFieldValues): string {
  return `Set ${values.parameterLabel || "maximum LTV"} to ${values.newValuePercent || "0"}%`;
}

export function describePause(): string {
  return "Pause new deposits";
}

export const defaultGrantValues: GrantFieldValues = {
  recipientLabel: "Alice DAO",
  recipientAddress: "0x000000000000000000000000000000000000dEaD",
  assetSymbol: "USDC",
  assetDecimals: 6,
  amount: "25000",
};

export const defaultRiskCapValues: RiskCapFieldValues = {
  parameterLabel: "maximum LTV",
  newValuePercent: "68",
};
