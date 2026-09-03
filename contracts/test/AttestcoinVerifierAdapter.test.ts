import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  encodeEvmV1Transaction,
  encodeRealProof,
  POLICY_APPROVED_SIGNATURE
} from "./helpers";

const NATIVE_QUERY_VERIFIER_PRECOMPILE = "0x0000000000000000000000000000000000000FD2";
const SEPOLIA_CHAIN_KEY = 11155111n;

describe("AttestcoinVerifierAdapter", () => {
  async function deployFixture() {
    const [, , , registryStandIn, otherEmitter] = await ethers.getSigners();

    const MockNativeQueryVerifier = await ethers.getContractFactory("MockNativeQueryVerifier");
    const mockPrecompileImpl = await MockNativeQueryVerifier.deploy();
    await mockPrecompileImpl.waitForDeployment();

    const deployedCode = await ethers.provider.getCode(await mockPrecompileImpl.getAddress());
    await network.provider.send("hardhat_setCode", [NATIVE_QUERY_VERIFIER_PRECOMPILE, deployedCode]);

    const precompile = MockNativeQueryVerifier.attach(NATIVE_QUERY_VERIFIER_PRECOMPILE) as Awaited<
      ReturnType<typeof MockNativeQueryVerifier.deploy>
    >;
    await precompile.setShouldVerify(true);

    const AttestcoinVerifierAdapter = await ethers.getContractFactory("AttestcoinVerifierAdapter");
    const adapter = await AttestcoinVerifierAdapter.deploy(SEPOLIA_CHAIN_KEY);
    await adapter.waitForDeployment();

    const policyId = ethers.id("policy-real");
    const safeTopic = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [registryStandIn.address]);
    const expectedTopics = [POLICY_APPROVED_SIGNATURE, policyId, safeTopic];
    const expectedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256", "address", "uint256", "uint256", "bytes"],
      [1n, 102031n, ethers.ZeroAddress, 0n, 999999999n, "0x1234"]
    );

    return { precompile, adapter, registryStandIn, otherEmitter, policyId, expectedTopics, expectedData };
  }

  it("verifies a well-formed proof whose log matches emitter, topics and data", async () => {
    const fixture = await deployFixture();
    const tx = encodeEvmV1Transaction({
      receiptStatus: 1,
      logs: [
        {
          address: fixture.registryStandIn.address,
          topics: fixture.expectedTopics,
          data: fixture.expectedData
        }
      ]
    });
    const proof = encodeRealProof({
      chainKey: SEPOLIA_CHAIN_KEY,
      blockHeight: 100n,
      encodedTransaction: tx,
      merkleRoot: ethers.ZeroHash,
      siblings: [],
      lowerEndpointDigest: ethers.ZeroHash,
      continuityRoots: []
    });

    const verified = await fixture.adapter.verifyEventInclusion(
      proof,
      fixture.registryStandIn.address,
      11155111n,
      fixture.expectedTopics,
      fixture.expectedData
    );
    expect(verified).to.equal(true);
  });

  it("reverts UnsupportedSourceChain when the proof's chainKey does not match Sepolia", async () => {
    const fixture = await deployFixture();
    const tx = encodeEvmV1Transaction({
      receiptStatus: 1,
      logs: [{ address: fixture.registryStandIn.address, topics: fixture.expectedTopics, data: fixture.expectedData }]
    });
    const proof = encodeRealProof({
      chainKey: 999n,
      blockHeight: 100n,
      encodedTransaction: tx,
      merkleRoot: ethers.ZeroHash,
      siblings: [],
      lowerEndpointDigest: ethers.ZeroHash,
      continuityRoots: []
    });

    await expect(
      fixture.adapter.verifyEventInclusion(
        proof,
        fixture.registryStandIn.address,
        11155111n,
        fixture.expectedTopics,
        fixture.expectedData
      )
    ).to.be.revertedWithCustomError(fixture.adapter, "UnsupportedSourceChain");
  });

  it("reverts SourceTransactionFailed when the native verifier rejects inclusion", async () => {
    const fixture = await deployFixture();
    await fixture.precompile.setShouldVerify(false);

    const tx = encodeEvmV1Transaction({
      receiptStatus: 1,
      logs: [{ address: fixture.registryStandIn.address, topics: fixture.expectedTopics, data: fixture.expectedData }]
    });
    const proof = encodeRealProof({
      chainKey: SEPOLIA_CHAIN_KEY,
      blockHeight: 100n,
      encodedTransaction: tx,
      merkleRoot: ethers.ZeroHash,
      siblings: [],
      lowerEndpointDigest: ethers.ZeroHash,
      continuityRoots: []
    });

    await expect(
      fixture.adapter.verifyEventInclusion(
        proof,
        fixture.registryStandIn.address,
        11155111n,
        fixture.expectedTopics,
        fixture.expectedData
      )
    ).to.be.revertedWithCustomError(fixture.adapter, "SourceTransactionFailed");
  });

  it("reverts SourceTransactionFailed when the proved source transaction did not succeed", async () => {
    const fixture = await deployFixture();
    const tx = encodeEvmV1Transaction({
      receiptStatus: 0,
      logs: [{ address: fixture.registryStandIn.address, topics: fixture.expectedTopics, data: fixture.expectedData }]
    });
    const proof = encodeRealProof({
      chainKey: SEPOLIA_CHAIN_KEY,
      blockHeight: 100n,
      encodedTransaction: tx,
      merkleRoot: ethers.ZeroHash,
      siblings: [],
      lowerEndpointDigest: ethers.ZeroHash,
      continuityRoots: []
    });

    await expect(
      fixture.adapter.verifyEventInclusion(
        proof,
        fixture.registryStandIn.address,
        11155111n,
        fixture.expectedTopics,
        fixture.expectedData
      )
    ).to.be.revertedWithCustomError(fixture.adapter, "SourceTransactionFailed");
  });

  it("returns false when no log matches the configured emitter", async () => {
    const fixture = await deployFixture();
    const tx = encodeEvmV1Transaction({
      receiptStatus: 1,
      logs: [{ address: fixture.otherEmitter.address, topics: fixture.expectedTopics, data: fixture.expectedData }]
    });
    const proof = encodeRealProof({
      chainKey: SEPOLIA_CHAIN_KEY,
      blockHeight: 100n,
      encodedTransaction: tx,
      merkleRoot: ethers.ZeroHash,
      siblings: [],
      lowerEndpointDigest: ethers.ZeroHash,
      continuityRoots: []
    });

    const verified = await fixture.adapter.verifyEventInclusion(
      proof,
      fixture.registryStandIn.address,
      11155111n,
      fixture.expectedTopics,
      fixture.expectedData
    );
    expect(verified).to.equal(false);
  });

  it("returns false when the log data was tampered with", async () => {
    const fixture = await deployFixture();
    const tamperedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256", "address", "uint256", "uint256", "bytes"],
      [1n, 102031n, ethers.ZeroAddress, 0n, 999999999n, "0xffff"]
    );
    const tx = encodeEvmV1Transaction({
      receiptStatus: 1,
      logs: [{ address: fixture.registryStandIn.address, topics: fixture.expectedTopics, data: tamperedData }]
    });
    const proof = encodeRealProof({
      chainKey: SEPOLIA_CHAIN_KEY,
      blockHeight: 100n,
      encodedTransaction: tx,
      merkleRoot: ethers.ZeroHash,
      siblings: [],
      lowerEndpointDigest: ethers.ZeroHash,
      continuityRoots: []
    });

    const verified = await fixture.adapter.verifyEventInclusion(
      proof,
      fixture.registryStandIn.address,
      11155111n,
      fixture.expectedTopics,
      fixture.expectedData
    );
    expect(verified).to.equal(false);
  });
});
