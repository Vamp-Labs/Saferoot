import { expect } from "chai";
import { ethers } from "hardhat";
import { ActionInput, encodeActions } from "./helpers";

describe("PolicyRegistry", () => {
  async function deploy() {
    const [authoritySafe, other] = await ethers.getSigners();
    const PolicyRegistry = await ethers.getContractFactory("PolicyRegistry");
    const registry = await PolicyRegistry.deploy(authoritySafe.address);
    await registry.waitForDeployment();
    return { registry, authoritySafe, other };
  }

  function sampleActions(): ActionInput[] {
    return [
      {
        actionId: ethers.id("action-1"),
        target: "0x0000000000000000000000000000000000000123",
        selector: "0xa9059cbb",
        params: "0x",
        nativeValue: 0n,
        earliestExecution: 0n,
        expiry: 0n
      }
    ];
  }

  it("rejects registration from a non-authority-safe caller", async () => {
    const { registry, other } = await deploy();
    await expect(
      registry
        .connect(other)
        .registerPolicy(ethers.id("p1"), 1, 102031, ethers.ZeroAddress, 0, 0, sampleActions())
    ).to.be.revertedWithCustomError(registry, "NotAuthoritySafe");
  });

  it("registers a valid policy and emits PolicyApproved", async () => {
    const { registry, authoritySafe } = await deploy();
    const policyId = ethers.id("p1");
    const actions = sampleActions();

    await expect(
      registry.connect(authoritySafe).registerPolicy(policyId, 1, 102031n, ethers.ZeroAddress, 100n, 200n, actions)
    )
      .to.emit(registry, "PolicyApproved")
      .withArgs(policyId, 1n, authoritySafe.address, 102031n, ethers.ZeroAddress, 100n, 200n, encodeActions(actions));

    expect(await registry.latestVersion(policyId)).to.equal(1n);
  });

  it("rejects a non-increasing version", async () => {
    const { registry, authoritySafe } = await deploy();
    const policyId = ethers.id("p1");
    const actions = sampleActions();

    await registry.connect(authoritySafe).registerPolicy(policyId, 1, 102031n, ethers.ZeroAddress, 100n, 200n, actions);

    await expect(
      registry.connect(authoritySafe).registerPolicy(policyId, 1, 102031n, ethers.ZeroAddress, 100n, 200n, actions)
    ).to.be.revertedWithCustomError(registry, "VersionNotIncreasing");
  });

  it("accepts a strictly higher version as a supersede", async () => {
    const { registry, authoritySafe } = await deploy();
    const policyId = ethers.id("p1");
    const actions = sampleActions();

    await registry.connect(authoritySafe).registerPolicy(policyId, 1, 102031n, ethers.ZeroAddress, 100n, 200n, actions);
    await registry.connect(authoritySafe).registerPolicy(policyId, 2, 102031n, ethers.ZeroAddress, 100n, 200n, actions);

    expect(await registry.latestVersion(policyId)).to.equal(2n);
  });

  it("rejects a zero-address authority safe at deploy time", async () => {
    const PolicyRegistry = await ethers.getContractFactory("PolicyRegistry");
    await expect(PolicyRegistry.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      PolicyRegistry,
      "ZeroAuthoritySafe"
    );
  });
});
