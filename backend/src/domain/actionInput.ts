import { AbiCoder, getBytes, hexlify } from "ethers";
import type { Action } from "@prisma/client";

export interface ActionInputStruct {
  actionId: string;
  target: string;
  selector: string;
  params: string;
  nativeValue: bigint;
  earliestExecution: bigint;
  expiry: bigint;
}

const ACTION_INPUT_TUPLE = "tuple(bytes32 actionId, address target, bytes4 selector, bytes params, uint256 nativeValue, uint256 earliestExecution, uint256 expiry)";

const abiCoder = AbiCoder.defaultAbiCoder();

export function decodeEncodedActions(encodedActions: string): ActionInputStruct[] {
  const [decoded] = abiCoder.decode([`${ACTION_INPUT_TUPLE}[]`], encodedActions);
  const rows = decoded as unknown as Array<{
    actionId: string;
    target: string;
    selector: string;
    params: string;
    nativeValue: bigint;
    earliestExecution: bigint;
    expiry: bigint;
  }>;
  return rows.map((row) => ({
    actionId: row.actionId,
    target: row.target,
    selector: row.selector,
    params: row.params,
    nativeValue: row.nativeValue,
    earliestExecution: row.earliestExecution,
    expiry: row.expiry,
  }));
}

export function actionToActionInput(action: Pick<Action, "id" | "targetContract" | "functionSelector" | "encodedParams" | "nativeValue" | "earliestExecution" | "expiry">): ActionInputStruct {
  return {
    actionId: action.id,
    target: action.targetContract,
    selector: action.functionSelector,
    params: normalizeHex(action.encodedParams),
    nativeValue: BigInt(action.nativeValue),
    earliestExecution: BigInt(Math.floor(action.earliestExecution.getTime() / 1000)),
    expiry: BigInt(Math.floor(action.expiry.getTime() / 1000)),
  };
}

export function actionsToActionInputs(
  actions: ReadonlyArray<
    Pick<Action, "id" | "targetContract" | "functionSelector" | "encodedParams" | "nativeValue" | "earliestExecution" | "expiry">
  >,
): ActionInputStruct[] {
  return actions.map(actionToActionInput);
}

export function normalizeHex(value: string): string {
  return hexlify(getBytes(value.startsWith("0x") ? value : `0x${value}`));
}

export function encodeActionInputs(actions: ReadonlyArray<ActionInputStruct>): string {
  return abiCoder.encode(
    [`${ACTION_INPUT_TUPLE}[]`],
    [
      actions.map((action) => [
        action.actionId,
        action.target,
        action.selector,
        action.params,
        action.nativeValue,
        action.earliestExecution,
        action.expiry,
      ]),
    ],
  );
}
