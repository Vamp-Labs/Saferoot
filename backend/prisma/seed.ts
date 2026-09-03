import "dotenv/config";
import { id as keccakId } from "ethers";
import { PrismaClient } from "@prisma/client";
import { loadContractSetup } from "../src/chain/deployments";

const prisma = new PrismaClient();

const TRANSFER_SELECTOR = keccakId("transfer(address,uint256)").slice(0, 10);
const SET_MAX_LTV_SELECTOR = keccakId("setMaxLTV(uint256)").slice(0, 10);
const PAUSE_NEW_DEPOSITS_SELECTOR = keccakId("pauseNewDeposits()").slice(0, 10);

async function main(): Promise<void> {
  const { deployments } = loadContractSetup();
  const { creditcoinCc3 } = deployments;

  await prisma.integration.upsert({
    where: {
      network_executorAddress: {
        network: "creditcoin-cc3",
        executorAddress: creditcoinCc3.safeRootPolicyExecutor,
      },
    },
    update: {
      name: "SafeRoot Demo Executor",
      verified: true,
      supportedActions: [
        {
          templateType: "grant",
          targetContract: creditcoinCc3.mockUsdc,
          functionSelector: TRANSFER_SELECTOR,
          description: "Pay an exact MockUSDC amount to a named recipient.",
        },
        {
          templateType: "risk_cap",
          targetContract: creditcoinCc3.lendingPoolMock,
          functionSelector: SET_MAX_LTV_SELECTOR,
          description: "Set the lending pool's maximum LTV, expressed in basis points.",
        },
        {
          templateType: "pause",
          targetContract: creditcoinCc3.lendingPoolMock,
          functionSelector: PAUSE_NEW_DEPOSITS_SELECTOR,
          description: "Pause new deposits on the lending pool.",
        },
      ],
    },
    create: {
      name: "SafeRoot Demo Executor",
      network: "creditcoin-cc3",
      executorAddress: creditcoinCc3.safeRootPolicyExecutor,
      verified: true,
      supportedActions: [
        {
          templateType: "grant",
          targetContract: creditcoinCc3.mockUsdc,
          functionSelector: TRANSFER_SELECTOR,
          description: "Pay an exact MockUSDC amount to a named recipient.",
        },
        {
          templateType: "risk_cap",
          targetContract: creditcoinCc3.lendingPoolMock,
          functionSelector: SET_MAX_LTV_SELECTOR,
          description: "Set the lending pool's maximum LTV, expressed in basis points.",
        },
        {
          templateType: "pause",
          targetContract: creditcoinCc3.lendingPoolMock,
          functionSelector: PAUSE_NEW_DEPOSITS_SELECTOR,
          description: "Pause new deposits on the lending pool.",
        },
      ],
    },
  });

  console.log("Seeded SafeRoot Demo Executor integration");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
