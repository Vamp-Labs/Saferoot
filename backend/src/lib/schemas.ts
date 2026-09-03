import { z } from "zod";

const hexString = z.string().regex(/^0x[0-9a-fA-F]*$/, "Expected a 0x-prefixed hex string");
const addressLike = z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Expected a 20-byte hex address");

export const actionInputSchema = z.object({
  templateType: z.enum(["grant", "risk_cap", "pause"]),
  label: z.string().min(1).max(200),
  targetContract: addressLike,
  functionSelector: z
    .string()
    .regex(/^0x[0-9a-fA-F]{8}$/, "Expected a 4-byte hex function selector"),
  encodedParams: hexString,
  nativeValue: z.string().regex(/^\d+$/).default("0"),
  earliestExecution: z.coerce.date(),
  expiry: z.coerce.date(),
});

export const createPolicySchema = z.object({
  name: z.string().min(1).max(200),
  authoritySafeAddress: addressLike,
  activationTime: z.coerce.date(),
  expiryTime: z.coerce.date(),
  actions: z.array(actionInputSchema).min(1),
  integrationId: z.string().uuid().optional(),
});

export const updatePolicySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  authoritySafeAddress: addressLike.optional(),
  activationTime: z.coerce.date().optional(),
  expiryTime: z.coerce.date().optional(),
  actions: z.array(actionInputSchema).min(1).optional(),
});

export const linkSafeTxSchema = z.object({
  safeTxHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, "Expected a 32-byte hex safeTxHash"),
});

export const activityQuerySchema = z.object({
  policyId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
