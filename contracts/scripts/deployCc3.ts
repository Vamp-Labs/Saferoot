import { ethers, network } from "hardhat";
import { readDeploymentsFile, writeDeploymentsFile } from "./lib/deploymentsFile";

const GRANT_FUNDING_AMOUNT = 30_000n * 10n ** 6n;

async function main() {
  const authoritySafe = process.env.AUTHORITY_SAFE_ADDRESS;
  const guardian = process.env.GUARDIAN_ADDRESS;
  const sepoliaChainKey = BigInt(process.env.SEPOLIA_CHAIN_KEY ?? "11155111");
  const existing = readDeploymentsFile();
  const policyRegistry = process.env.SEPOLIA_POLICY_REGISTRY_ADDRESS ?? existing.ethereumSepolia?.policyRegistry;

  if (!authoritySafe || !ethers.isAddress(authoritySafe)) {
    throw new Error("AUTHORITY_SAFE_ADDRESS environment variable must be a valid address");
  }
  if (!guardian || !ethers.isAddress(guardian)) {
    throw new Error("GUARDIAN_ADDRESS environment variable must be a valid address");
  }
  if (!policyRegistry || !ethers.isAddress(policyRegistry)) {
    throw new Error(
      "SEPOLIA_POLICY_REGISTRY_ADDRESS must be set, or /contracts/deployments.json must already contain " +
        "ethereumSepolia.policyRegistry from a prior deploySepolia run"
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying to ${network.name} from ${deployer.address}`);
  console.log(`Configured authority Safe: ${authoritySafe}`);
  console.log(`Configured guardian: ${guardian}`);
  console.log(`Trusted Sepolia PolicyRegistry emitter: ${policyRegistry}`);

  const AttestcoinVerifierAdapter = await ethers.getContractFactory("AttestcoinVerifierAdapter");
  const verifier = await AttestcoinVerifierAdapter.deploy(sepoliaChainKey);
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`AttestcoinVerifierAdapter deployed at ${verifierAddress}`);

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();
  const mockUsdcAddress = await mockUsdc.getAddress();
  console.log(`MockUSDC deployed at ${mockUsdcAddress}`);

  const LendingPoolMock = await ethers.getContractFactory("LendingPoolMock");
  const lendingPool = await LendingPoolMock.deploy();
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log(`LendingPoolMock deployed at ${lendingPoolAddress}`);

  const SafeRootPolicyExecutor = await ethers.getContractFactory("SafeRootPolicyExecutor");
  const executor = await SafeRootPolicyExecutor.deploy(
    authoritySafe,
    policyRegistry,
    guardian,
    verifierAddress,
    deployer.address
  );
  await executor.waitForDeployment();
  const executorAddress = await executor.getAddress();
  console.log(`SafeRootPolicyExecutor deployed at ${executorAddress}`);

  const transferSelector = mockUsdc.interface.getFunction("transfer").selector;
  const setMaxLtvSelector = lendingPool.interface.getFunction("setMaxLTV").selector;
  const pauseSelector = lendingPool.interface.getFunction("pauseNewDeposits").selector;

  await (await executor.setAllowedCall(mockUsdcAddress, transferSelector, true)).wait();
  await (await executor.setAllowedCall(lendingPoolAddress, setMaxLtvSelector, true)).wait();
  await (await executor.setAllowedCall(lendingPoolAddress, pauseSelector, true)).wait();
  console.log("Configured the allowlist for the three demo actions.");

  await (await mockUsdc.mint(executorAddress, GRANT_FUNDING_AMOUNT)).wait();
  console.log(`Minted ${GRANT_FUNDING_AMOUNT.toString()} units of MockUSDC to the executor.`);

  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  writeDeploymentsFile({
    creditcoinCc3: {
      chainId,
      rpcUrl: process.env.CREDITCOIN_CC3_RPC_URL ?? "https://rpc.cc3-testnet.creditcoin.network",
      safeRootPolicyExecutor: executorAddress,
      attestcoinVerifierAdapter: verifierAddress,
      mockUsdc: mockUsdcAddress,
      lendingPoolMock: lendingPoolAddress,
      guardian
    }
  });

  console.log("Updated /contracts/deployments.json with the creditcoinCc3 section.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
