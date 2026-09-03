import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const GRANT_FUNDING_AMOUNT = 30_000n * 10n ** 6n;

async function main() {
  const [deployer, authoritySafe, guardian] = await ethers.getSigners();

  const PolicyRegistry = await ethers.getContractFactory("PolicyRegistry");
  const registry = await PolicyRegistry.deploy(authoritySafe.address);
  await registry.waitForDeployment();

  const MockAttestcoinVerifier = await ethers.getContractFactory("MockAttestcoinVerifier");
  const verifier = await MockAttestcoinVerifier.deploy();
  await verifier.waitForDeployment();

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();

  const LendingPoolMock = await ethers.getContractFactory("LendingPoolMock");
  const lendingPool = await LendingPoolMock.deploy();
  await lendingPool.waitForDeployment();

  const SafeRootPolicyExecutor = await ethers.getContractFactory("SafeRootPolicyExecutor");
  const executor = await SafeRootPolicyExecutor.deploy(
    authoritySafe.address,
    await registry.getAddress(),
    guardian.address,
    await verifier.getAddress(),
    deployer.address
  );
  await executor.waitForDeployment();

  const transferSelector = mockUsdc.interface.getFunction("transfer").selector;
  const setMaxLtvSelector = lendingPool.interface.getFunction("setMaxLTV").selector;
  const pauseSelector = lendingPool.interface.getFunction("pauseNewDeposits").selector;

  await executor.setAllowedCall(await mockUsdc.getAddress(), transferSelector, true);
  await executor.setAllowedCall(await lendingPool.getAddress(), setMaxLtvSelector, true);
  await executor.setAllowedCall(await lendingPool.getAddress(), pauseSelector, true);

  await mockUsdc.mint(await executor.getAddress(), GRANT_FUNDING_AMOUNT);

  const summary = {
    note:
      "Local Hardhat network only, using MockAttestcoinVerifier in place of the real Attestcoin " +
      "precompile. Not a substitute for /contracts/deployments.json, which is only written by " +
      "deploySepolia.ts and deployCc3.ts against real testnets.",
    deployer: deployer.address,
    authoritySafe: authoritySafe.address,
    guardian: guardian.address,
    policyRegistry: await registry.getAddress(),
    mockAttestcoinVerifier: await verifier.getAddress(),
    safeRootPolicyExecutor: await executor.getAddress(),
    mockUsdc: await mockUsdc.getAddress(),
    lendingPoolMock: await lendingPool.getAddress()
  };

  const outPath = path.join(__dirname, "..", "deployments.local.json");
  fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
