import { Contract } from "ethers";
import { loadContractSetup } from "./deployments";
import { getSepoliaProvider, getCreditcoinProvider, getWorkerWallet } from "./clients";

export function getPolicyRegistryContract(): Contract {
  const { deployments, policyRegistryAbi } = loadContractSetup();
  return new Contract(deployments.ethereumSepolia.policyRegistry, policyRegistryAbi, getSepoliaProvider());
}

export function getSafeRootPolicyExecutorReadContract(): Contract {
  const { deployments, safeRootPolicyExecutorAbi } = loadContractSetup();
  return new Contract(
    deployments.creditcoinCc3.safeRootPolicyExecutor,
    safeRootPolicyExecutorAbi,
    getCreditcoinProvider(),
  );
}

export function getSafeRootPolicyExecutorWriteContract(): Contract {
  const { deployments, safeRootPolicyExecutorAbi } = loadContractSetup();
  return new Contract(
    deployments.creditcoinCc3.safeRootPolicyExecutor,
    safeRootPolicyExecutorAbi,
    getWorkerWallet(),
  );
}
