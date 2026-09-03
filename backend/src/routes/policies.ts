import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";
import { generateBytes32Id } from "../lib/ids";
import { recordActivity } from "../lib/activityLog";
import { activityMessage } from "../domain/activityMessages";
import { serializePolicySummary, serializePolicyDetail } from "../domain/serialize";
import { groupPolicies } from "../domain/policyGrouping";
import { BadRequestError, ConflictError, NotFoundError } from "../lib/httpErrors";
import { createPolicySchema, linkSafeTxSchema, updatePolicySchema } from "../lib/schemas";
import { loadContractSetup } from "../chain/deployments";

const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

async function resolveExecutorAddress(integrationId: string | undefined): Promise<string> {
  if (integrationId) {
    const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
    if (!integration) throw new BadRequestError(`Unknown integrationId ${integrationId}`);
    return integration.executorAddress;
  }
  const seeded = await prisma.integration.findFirst({ where: { verified: true } });
  if (seeded) return seeded.executorAddress;
  return loadContractSetup().deployments.creditcoinCc3.safeRootPolicyExecutor;
}

export async function policiesRoutes(app: FastifyInstance): Promise<void> {
  app.post("/policies", async (request, reply) => {
    const body = createPolicySchema.parse(request.body);
    const { deployments } = loadContractSetup();
    const executorAddress = await resolveExecutorAddress(body.integrationId);
    const policyId = generateBytes32Id();

    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.policy.create({
        data: {
          id: policyId,
          name: body.name,
          version: 1,
          authoritySafeAddress: body.authoritySafeAddress,
          authoritySafeChainId: ETHEREUM_SEPOLIA_CHAIN_ID,
          destinationChainId: deployments.creditcoinCc3.chainId,
          executorAddress,
          activationTime: body.activationTime,
          expiryTime: body.expiryTime,
          status: "Draft",
          actions: {
            create: body.actions.map((action) => ({
              id: generateBytes32Id(),
              templateType: action.templateType,
              label: action.label,
              targetContract: action.targetContract,
              functionSelector: action.functionSelector,
              encodedParams: action.encodedParams,
              nativeValue: action.nativeValue,
              earliestExecution: action.earliestExecution,
              expiry: action.expiry,
              state: "Draft",
            })),
          },
        },
        include: { actions: true },
      });

      await recordActivity(tx, {
        policyId: created.id,
        type: "PolicyDrafted",
        actor: body.authoritySafeAddress,
        network: "ethereum_sepolia",
        humanReadableMessage: activityMessage.PolicyDrafted({ policyName: created.name }),
        technicalDetails: { actionCount: created.actions.length },
      });

      return created;
    });

    reply.code(201);
    return serializePolicyDetail(policy, policy.actions, []);
  });

  app.patch<{ Params: { id: string } }>("/policies/:id", async (request) => {
    const body = updatePolicySchema.parse(request.body);
    const existing = await prisma.policy.findUnique({ where: { id: request.params.id } });
    if (!existing) throw new NotFoundError(`Policy ${request.params.id} not found`);
    if (existing.status !== "Draft") {
      throw new ConflictError(`Policy ${existing.id} can no longer be edited (status is ${existing.status})`);
    }

    const policy = await prisma.$transaction(async (tx) => {
      if (body.actions) {
        await tx.action.deleteMany({ where: { policyId: existing.id } });
      }

      const updated = await tx.policy.update({
        where: { id: existing.id },
        data: {
          name: body.name,
          authoritySafeAddress: body.authoritySafeAddress,
          activationTime: body.activationTime,
          expiryTime: body.expiryTime,
          ...(body.actions
            ? {
                actions: {
                  create: body.actions.map((action) => ({
                    id: generateBytes32Id(),
                    templateType: action.templateType,
                    label: action.label,
                    targetContract: action.targetContract,
                    functionSelector: action.functionSelector,
                    encodedParams: action.encodedParams,
                    nativeValue: action.nativeValue,
                    earliestExecution: action.earliestExecution,
                    expiry: action.expiry,
                    state: "Draft",
                  })),
                },
              }
            : {}),
        },
        include: { actions: true },
      });
      return updated;
    });

    const activity = await prisma.activityEvent.findMany({ where: { policyId: policy.id }, orderBy: { timestamp: "asc" } });
    return serializePolicyDetail(policy, policy.actions, activity);
  });

  app.post<{ Params: { id: string } }>("/policies/:id/link-safe-tx", async (request) => {
    const body = linkSafeTxSchema.parse(request.body);
    const existing = await prisma.policy.findUnique({ where: { id: request.params.id } });
    if (!existing) throw new NotFoundError(`Policy ${request.params.id} not found`);
    if (existing.status !== "Draft") {
      throw new ConflictError(`Policy ${existing.id} already has status ${existing.status}; cannot re-link a Safe transaction`);
    }

    const policy = await prisma.$transaction(async (tx) => {
      const updated = await tx.policy.update({
        where: { id: existing.id },
        data: { safeTxHash: body.safeTxHash, status: "AwaitingApproval" },
        include: { actions: true },
      });
      await tx.action.updateMany({ where: { policyId: existing.id, state: "Draft" }, data: { state: "Waiting" } });
      await recordActivity(tx, {
        policyId: existing.id,
        type: "SubmittedToSafe",
        actor: existing.authoritySafeAddress,
        network: "ethereum_sepolia",
        humanReadableMessage: activityMessage.SubmittedToSafe({ safeTxHash: body.safeTxHash }),
        technicalDetails: { safeTxHash: body.safeTxHash },
      });
      return updated;
    });

    const activity = await prisma.activityEvent.findMany({ where: { policyId: policy.id }, orderBy: { timestamp: "asc" } });
    return serializePolicyDetail(policy, policy.actions, activity);
  });

  app.get("/policies", async () => {
    const policies = await prisma.policy.findMany({
      include: { actions: true },
      orderBy: { updatedAt: "desc" },
    });
    const groups = groupPolicies(policies);
    return {
      needsAttention: groups.needsAttention.map((p) => serializePolicySummary(p, p.actions)),
      beingVerified: groups.beingVerified.map((p) => serializePolicySummary(p, p.actions)),
      ready: groups.ready.map((p) => serializePolicySummary(p, p.actions)),
      history: groups.history.map((p) => serializePolicySummary(p, p.actions)),
    };
  });

  app.get<{ Params: { id: string } }>("/policies/:id", async (request) => {
    const policy = await prisma.policy.findUnique({
      where: { id: request.params.id },
      include: { actions: true },
    });
    if (!policy) throw new NotFoundError(`Policy ${request.params.id} not found`);
    const activity = await prisma.activityEvent.findMany({ where: { policyId: policy.id }, orderBy: { timestamp: "asc" } });
    return serializePolicyDetail(policy, policy.actions, activity);
  });
}
