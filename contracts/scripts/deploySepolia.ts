import { ethers, network } from "hardhat";
import { writeDeploymentsFile } from "./lib/deploymentsFile";

async function main() {
  const authoritySafe = process.env.AUTHORITY_SAFE_ADDRESS;
  if (!authoritySafe || !ethers.isAddress(authoritySafe)) {
    throw new Error("AUTHORITY_SAFE_ADDRESS environment variable must be a valid address");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying PolicyRegistry to ${network.name} from ${deployer.address}`);
  console.log(`Configured authority Safe: ${authoritySafe}`);

  const PolicyRegistry = await ethers.getContractFactory("PolicyRegistry");
  const registry = await PolicyRegistry.deploy(authoritySafe);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log(`PolicyRegistry deployed at ${registryAddress}`);

  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  writeDeploymentsFile({
    ethereumSepolia: {
      chainId,
      policyRegistry: registryAddress,
      authoritySafe
    }
  });

  console.log("Updated /contracts/deployments.json with the ethereumSepolia section.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
