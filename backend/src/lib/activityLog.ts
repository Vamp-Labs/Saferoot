import type { Prisma, PrismaClient } from "@prisma/client";
import type { RejectionReason } from "../domain/rejectionReasons";

export type ActivityDbClient = PrismaClient | Prisma.TransactionClient;

export interface RecordActivityInput {
  policyId: string;
  actionId?: string | null;
  type: Prisma.ActivityEventCreateInput["type"];
  actor: string;
  network: Prisma.ActivityEventCreateInput["network"];
  txHash?: string | null;
  humanReadableMessage: string;
  rejectionReason?: RejectionReason | null;
  technicalDetails?: Prisma.InputJsonValue;
  timestamp?: Date;
}

export async function recordActivity(db: ActivityDbClient, input: RecordActivityInput) {
  return db.activityEvent.create({
    data: {
      policyId: input.policyId,
      actionId: input.actionId ?? null,
      type: input.type,
      actor: input.actor,
      network: input.network,
      txHash: input.txHash ?? null,
      humanReadableMessage: input.humanReadableMessage,
      rejectionReason: input.rejectionReason ?? null,
      technicalDetails: input.technicalDetails ?? {},
      ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    },
  });
}
