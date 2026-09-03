import { expect } from "chai";
import { ethers } from "hardhat";
import {
  ActionInput,
  PolicyApprovedArgs,
  nowSeconds,
  validMockProofFor,
  encodeMockProof,
  expectedTopics,
  expectedData,
  SEPOLIA_CHAIN_ID,
  FAR_FUTURE_TIMESTAMP
} from "./helpers";

const GRANT_AMOUNT = 25_000n * 10n ** 6n;

describe("SafeRootPolicyExecutor", () => {
  async function deployFixture() {
    const [deployer, authoritySafe, guardian, relayer, aliceDao, stranger] = await ethers.getSigners();

    const PolicyRegistry = await ethers.getContractFactory("PolicyRegistry");
    const registry = await PolicyRegistry.deploy(authoritySafe.address);
    await registry.waitForDeployment();

    const MockAttestcoinVerifier = await ethers.getContractFactory("MockAttestcoinVerifier");
    const verifier = await MockAttestcoinVerifier.deploy();
    await verifier.waitForDeployment();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();

    const rogueToken = await MockUSDC.deploy();
    await rogueToken.waitForDeployment();

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
    const noopSelector = lendingPool.interface.getFunction("noop").selector;

    await executor.connect(deployer).setAllowedCall(await mockUsdc.getAddress(), transferSelector, true);
    await executor.connect(deployer).setAllowedCall(await lendingPool.getAddress(), setMaxLtvSelector, true);
    await executor.connect(deployer).setAllowedCall(await lendingPool.getAddress(), pauseSelector, true);

    await mockUsdc.connect(deployer).mint(await executor.getAddress(), GRANT_AMOUNT * 2n);

    const coder = ethers.AbiCoder.defaultAbiCoder();

    const grantAction: ActionInput = {
      actionId: ethers.id("grant-action"),
      target: await mockUsdc.getAddress(),
      selector: transferSelector,
      params: coder.encode(["address", "uint256"], [aliceDao.address, GRANT_AMOUNT]),
      nativeValue: 0n,
      earliestExecution: 0n,
      expiry: FAR_FUTURE_TIMESTAMP
    };

    const riskCapAction: ActionInput = {
      actionId: ethers.id("risk-cap-action"),
      target: await lendingPool.getAddress(),
      selector: setMaxLtvSelector,
      params: coder.encode(["uint256"], [6800n]),
      nativeValue: 0n,
      earliestExecution: 0n,
      expiry: FAR_FUTURE_TIMESTAMP
    };

    const pauseAction: ActionInput = {
      actionId: ethers.id("pause-action"),
      target: await lendingPool.getAddress(),
      selector: pauseSelector,
      params: "0x",
      nativeValue: 0n,
      earliestExecution: 0n,
      expiry: FAR_FUTURE_TIMESTAMP
    };

    return {
      deployer,
      authoritySafe,
      guardian,
      relayer,
      aliceDao,
      stranger,
      registry,
      verifier,
      mockUsdc,
      rogueToken,
      lendingPool,
      executor,
      transferSelector,
      setMaxLtvSelector,
      pauseSelector,
      noopSelector,
      grantAction,
      riskCapAction,
      pauseAction,
      coder
    };
  }

  async function activePolicyArgs(
    fixture: Awaited<ReturnType<typeof deployFixture>>,
    overrides: Partial<PolicyApprovedArgs> = {}
  ): Promise<PolicyApprovedArgs> {
    const now = await nowSeconds();
    return {
      policyId: ethers.id("policy-a"),
      version: 1n,
      safe: fixture.authoritySafe.address,
      destinationChainId: 31337n,
      executor: await fixture.executor.getAddress(),
      activation: now - 10n,
      expiry: now + 1_000_000n,
      actions: [fixture.grantAction, fixture.riskCapAction, fixture.pauseAction],
      ...overrides
    };
  }

  async function activate(
    fixture: Awaited<ReturnType<typeof deployFixture>>,
    args: PolicyApprovedArgs,
    proof?: string
  ) {
    const registryAddress = await fixture.registry.getAddress();
    const attestcoinProof = proof ?? validMockProofFor(registryAddress, args);
    return fixture.executor
      .connect(fixture.relayer)
      .activatePolicy(
        attestcoinProof,
        args.policyId,
        args.version,
        args.safe,
        args.destinationChainId,
        args.executor,
        args.activation,
        args.expiry,
        args.actions
      );
  }

  describe("case 1: valid Safe policy activates", () => {
    it("activates a policy proved by a genuine PolicyApproved event", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);

      await expect(activate(fixture, args))
        .to.emit(fixture.executor, "PolicyActivated")
        .withArgs(args.policyId, args.version, args.safe, args.activation, args.expiry);

      const record = await fixture.executor.getPolicy(args.policyId);
      expect(record.active).to.equal(true);
      expect(record.paused).to.equal(false);
      expect(record.version).to.equal(args.version);
    });
  });

  describe("cases 2-4: independent valid action execution", () => {
    it("case 2: the contributor grant action executes and moves funds", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      await expect(
        fixture.executor
          .connect(fixture.relayer)
          .executeAction(
            args.policyId,
            fixture.grantAction.actionId,
            fixture.grantAction.target,
            fixture.grantAction.selector,
            fixture.grantAction.params,
            fixture.grantAction.nativeValue
          )
      )
        .to.emit(fixture.executor, "ActionExecuted")
        .withArgs(args.policyId, fixture.grantAction.actionId, fixture.grantAction.target, true);

      expect(await fixture.mockUsdc.balanceOf(fixture.aliceDao.address)).to.equal(GRANT_AMOUNT);
    });

    it("case 3: the risk-cap action executes independently of the grant", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      await fixture.executor
        .connect(fixture.relayer)
        .executeAction(
          args.policyId,
          fixture.riskCapAction.actionId,
          fixture.riskCapAction.target,
          fixture.riskCapAction.selector,
          fixture.riskCapAction.params,
          fixture.riskCapAction.nativeValue
        );

      expect(await fixture.lendingPool.maxLtvBps()).to.equal(6800n);
      expect(await fixture.mockUsdc.balanceOf(fixture.aliceDao.address)).to.equal(0n);
    });

    it("case 4: the emergency pause action executes independently of the other two", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      await fixture.executor
        .connect(fixture.relayer)
        .executeAction(
          args.policyId,
          fixture.pauseAction.actionId,
          fixture.pauseAction.target,
          fixture.pauseAction.selector,
          fixture.pauseAction.params,
          fixture.pauseAction.nativeValue
        );

      expect(await fixture.lendingPool.newDepositsPaused()).to.equal(true);
      expect(await fixture.lendingPool.maxLtvBps()).to.equal(0n);
    });
  });

  describe("case 5: spoofed policy emitter is rejected", () => {
    it("rejects a proof whose log was not emitted by the configured PolicyRegistry", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      const spoofedProof = encodeMockProof({
        claimedSourceChainId: SEPOLIA_CHAIN_ID,
        receiptStatus: 1,
        logEmitter: fixture.stranger.address,
        logTopics: expectedTopics(args),
        logData: expectedData(args)
      });

      await expect(activate(fixture, args, spoofedProof)).to.be.revertedWithCustomError(
        fixture.executor,
        "EmitterNotApproved"
      );
    });
  });

  describe("case 6: failed source transaction is rejected", () => {
    it("rejects a proof whose source transaction reverted", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      const registryAddress = await fixture.registry.getAddress();
      const failedProof = encodeMockProof({
        claimedSourceChainId: SEPOLIA_CHAIN_ID,
        receiptStatus: 0,
        logEmitter: registryAddress,
        logTopics: expectedTopics(args),
        logData: expectedData(args)
      });

      await expect(activate(fixture, args, failedProof)).to.be.revertedWithCustomError(
        fixture.verifier,
        "SourceTransactionFailed"
      );
    });
  });

  describe("case 7: wrong authority Safe is rejected", () => {
    it("rejects a proven policy approved by a different Safe", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture, { safe: fixture.stranger.address });

      await expect(activate(fixture, args)).to.be.revertedWithCustomError(fixture.executor, "SafeMismatch");
    });
  });

  describe("case 8: wrong destination chain is rejected", () => {
    it("rejects a proven policy targeting a different destination chain", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture, { destinationChainId: 999999n });

      await expect(activate(fixture, args)).to.be.revertedWithCustomError(
        fixture.executor,
        "WrongDestinationChain"
      );
    });
  });

  describe("case 9: wrong executor is rejected", () => {
    it("rejects a proven policy naming a different executor address", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture, { executor: fixture.stranger.address });

      await expect(activate(fixture, args)).to.be.revertedWithCustomError(fixture.executor, "WrongExecutor");
    });
  });

  describe("action tampering", () => {
    it("case 10: altered target is rejected", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      await expect(
        fixture.executor
          .connect(fixture.stranger)
          .executeAction(
            args.policyId,
            fixture.grantAction.actionId,
            await fixture.rogueToken.getAddress(),
            fixture.grantAction.selector,
            fixture.grantAction.params,
            fixture.grantAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "TargetMismatch");
    });

    it("case 11: altered function is rejected", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      await expect(
        fixture.executor
          .connect(fixture.stranger)
          .executeAction(
            args.policyId,
            fixture.grantAction.actionId,
            fixture.grantAction.target,
            fixture.noopSelector,
            fixture.grantAction.params,
            fixture.grantAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "FunctionNotAllowed");
    });

    it("case 12: altered calldata is rejected", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      const tamperedParams = fixture.coder.encode(["address", "uint256"], [fixture.stranger.address, GRANT_AMOUNT]);

      await expect(
        fixture.executor
          .connect(fixture.stranger)
          .executeAction(
            args.policyId,
            fixture.grantAction.actionId,
            fixture.grantAction.target,
            fixture.grantAction.selector,
            tamperedParams,
            fixture.grantAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "CalldataMismatch");
    });

    it("case 13: increased grant amount is rejected", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      const inflatedParams = fixture.coder.encode(
        ["address", "uint256"],
        [fixture.aliceDao.address, 100_000n * 10n ** 6n]
      );

      await expect(
        fixture.executor
          .connect(fixture.stranger)
          .executeAction(
            args.policyId,
            fixture.grantAction.actionId,
            fixture.grantAction.target,
            fixture.grantAction.selector,
            inflatedParams,
            fixture.grantAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "CalldataMismatch");

      expect(await fixture.mockUsdc.balanceOf(fixture.aliceDao.address)).to.equal(0n);
    });

    it("case 14: invalid action membership evidence is rejected", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      await expect(
        fixture.executor
          .connect(fixture.stranger)
          .executeAction(
            args.policyId,
            ethers.id("never-registered-action"),
            fixture.grantAction.target,
            fixture.grantAction.selector,
            fixture.grantAction.params,
            fixture.grantAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "ActionNotFound");
    });

    it("case 15: duplicate action is rejected", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      const call = () =>
        fixture.executor
          .connect(fixture.relayer)
          .executeAction(
            args.policyId,
            fixture.grantAction.actionId,
            fixture.grantAction.target,
            fixture.grantAction.selector,
            fixture.grantAction.params,
            fixture.grantAction.nativeValue
          );

      await call();
      await expect(call()).to.be.revertedWithCustomError(fixture.executor, "ActionAlreadyExecuted");
    });

    it("case 20: disallowed target is rejected even when the action record matches exactly", async () => {
      const fixture = await deployFixture();
      const rogueAction: ActionInput = {
        actionId: ethers.id("rogue-target-action"),
        target: await fixture.rogueToken.getAddress(),
        selector: fixture.transferSelector,
        params: fixture.coder.encode(["address", "uint256"], [fixture.aliceDao.address, 1n]),
        nativeValue: 0n,
        earliestExecution: 0n,
        expiry: FAR_FUTURE_TIMESTAMP
      };
      const args = await activePolicyArgs(fixture, { actions: [rogueAction] });
      await activate(fixture, args);

      await expect(
        fixture.executor
          .connect(fixture.stranger)
          .executeAction(
            args.policyId,
            rogueAction.actionId,
            rogueAction.target,
            rogueAction.selector,
            rogueAction.params,
            rogueAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "FunctionNotAllowed");
    });

    it("case 21: disallowed function is rejected on an otherwise-allowed target", async () => {
      const fixture = await deployFixture();
      const noopAction: ActionInput = {
        actionId: ethers.id("noop-action"),
        target: await fixture.lendingPool.getAddress(),
        selector: fixture.noopSelector,
        params: "0x",
        nativeValue: 0n,
        earliestExecution: 0n,
        expiry: FAR_FUTURE_TIMESTAMP
      };
      const args = await activePolicyArgs(fixture, { actions: [noopAction] });
      await activate(fixture, args);

      await expect(
        fixture.executor
          .connect(fixture.stranger)
          .executeAction(
            args.policyId,
            noopAction.actionId,
            noopAction.target,
            noopAction.selector,
            noopAction.params,
            noopAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "FunctionNotAllowed");
    });

    it("case 22: native-value overflow / mismatch is rejected without moving funds", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      await expect(
        fixture.executor
          .connect(fixture.stranger)
          .executeAction(
            args.policyId,
            fixture.grantAction.actionId,
            fixture.grantAction.target,
            fixture.grantAction.selector,
            fixture.grantAction.params,
            ethers.MaxUint256
          )
      ).to.be.revertedWithCustomError(fixture.executor, "AmountExceedsApproval");

      expect(await fixture.mockUsdc.balanceOf(fixture.aliceDao.address)).to.equal(0n);
    });
  });

  describe("case 16: duplicate Attestcoin proof is rejected", () => {
    it("rejects reuse of the exact same proof bytes", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      const registryAddress = await fixture.registry.getAddress();
      const proof = validMockProofFor(registryAddress, args);

      await activate(fixture, args, proof);

      await expect(activate(fixture, args, proof)).to.be.revertedWithCustomError(
        fixture.executor,
        "ProofAlreadyUsed"
      );
    });
  });

  describe("case 17: expired policy is rejected", () => {
    it("rejects activation once the policy expiry has already passed", async () => {
      const fixture = await deployFixture();
      const now = await nowSeconds();
      const args = await activePolicyArgs(fixture, {
        policyId: ethers.id("policy-expired"),
        activation: now - 1000n,
        expiry: now - 100n
      });

      await expect(activate(fixture, args)).to.be.revertedWithCustomError(fixture.executor, "PolicyAlreadyExpired");
    });
  });

  describe("case 18: not-yet-active policy is rejected", () => {
    it("rejects executeAction before the policy's activation time arrives", async () => {
      const fixture = await deployFixture();
      const now = await nowSeconds();
      const args = await activePolicyArgs(fixture, {
        policyId: ethers.id("policy-future"),
        activation: now + 1_000_000n
      });
      await activate(fixture, args);

      await expect(
        fixture.executor
          .connect(fixture.relayer)
          .executeAction(
            args.policyId,
            fixture.grantAction.actionId,
            fixture.grantAction.target,
            fixture.grantAction.selector,
            fixture.grantAction.params,
            fixture.grantAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "PolicyNotYetValid");
    });
  });

  describe("case 19: stale policy version is rejected", () => {
    it("rejects a re-registration at a version that does not exceed the stored version", async () => {
      const fixture = await deployFixture();
      const policyId = ethers.id("policy-versioned");
      const args = await activePolicyArgs(fixture, { policyId });
      await activate(fixture, args);

      const staleArgs = { ...args, expiry: args.expiry + 500n };

      await expect(activate(fixture, staleArgs)).to.be.revertedWithCustomError(
        fixture.executor,
        "StalePolicyVersion"
      );
    });

    it("accepts a strictly higher version and supersedes the prior one's actions", async () => {
      const fixture = await deployFixture();
      const policyId = ethers.id("policy-supersede");
      const v1Args = await activePolicyArgs(fixture, { policyId, actions: [fixture.grantAction] });
      await activate(fixture, v1Args);

      const v2Args = await activePolicyArgs(fixture, {
        policyId,
        version: 2n,
        actions: [fixture.riskCapAction]
      });
      await activate(fixture, v2Args);

      await expect(
        fixture.executor
          .connect(fixture.relayer)
          .executeAction(
            policyId,
            fixture.grantAction.actionId,
            fixture.grantAction.target,
            fixture.grantAction.selector,
            fixture.grantAction.params,
            fixture.grantAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "ActionNotFound");

      await fixture.executor
        .connect(fixture.relayer)
        .executeAction(
          policyId,
          fixture.riskCapAction.actionId,
          fixture.riskCapAction.target,
          fixture.riskCapAction.selector,
          fixture.riskCapAction.params,
          fixture.riskCapAction.nativeValue
        );

      expect(await fixture.lendingPool.maxLtvBps()).to.equal(6800n);
    });
  });

  describe("case 23: reentrancy cannot execute an action twice", () => {
    it("blocks a reentrant executeAction call from within the target call", async () => {
      const fixture = await deployFixture();

      const MaliciousReentrantTarget = await ethers.getContractFactory("MaliciousReentrantTarget");
      const malicious = await MaliciousReentrantTarget.deploy(await fixture.executor.getAddress());
      await malicious.waitForDeployment();

      const triggerSelector = malicious.interface.getFunction("trigger").selector;
      await fixture.executor.connect(fixture.deployer).setAllowedCall(await malicious.getAddress(), triggerSelector, true);

      const reentrantAction: ActionInput = {
        actionId: ethers.id("reentrant-action"),
        target: await malicious.getAddress(),
        selector: triggerSelector,
        params: "0x",
        nativeValue: 0n,
        earliestExecution: 0n,
        expiry: FAR_FUTURE_TIMESTAMP
      };
      const args = await activePolicyArgs(fixture, {
        policyId: ethers.id("policy-reentrancy"),
        actions: [reentrantAction]
      });
      await activate(fixture, args);

      await malicious.arm(args.policyId, reentrantAction.actionId, "0x");

      await expect(
        fixture.executor
          .connect(fixture.relayer)
          .executeAction(
            args.policyId,
            reentrantAction.actionId,
            reentrantAction.target,
            reentrantAction.selector,
            reentrantAction.params,
            reentrantAction.nativeValue
          )
      )
        .to.emit(fixture.executor, "ActionExecuted")
        .withArgs(args.policyId, reentrantAction.actionId, reentrantAction.target, true);

      expect(await malicious.attempted()).to.equal(true);
      expect(await malicious.reentrySucceeded()).to.equal(false);

      const record = await fixture.executor.getAction(args.policyId, reentrantAction.actionId);
      expect(record.executed).to.equal(true);

      await expect(
        fixture.executor
          .connect(fixture.relayer)
          .executeAction(
            args.policyId,
            reentrantAction.actionId,
            reentrantAction.target,
            reentrantAction.selector,
            reentrantAction.params,
            reentrantAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "ActionAlreadyExecuted");
    });
  });

  describe("guardian pause", () => {
    it("case 24: guardian pause blocks unused actions but leaves executed ones untouched", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture);
      await activate(fixture, args);

      await fixture.executor
        .connect(fixture.relayer)
        .executeAction(
          args.policyId,
          fixture.grantAction.actionId,
          fixture.grantAction.target,
          fixture.grantAction.selector,
          fixture.grantAction.params,
          fixture.grantAction.nativeValue
        );

      await expect(fixture.executor.connect(fixture.stranger).guardianPause(args.policyId, "compromised key"))
        .to.be.revertedWithCustomError(fixture.executor, "NotGuardian");

      await expect(fixture.executor.connect(fixture.guardian).guardianPause(args.policyId, "compromised key"))
        .to.emit(fixture.executor, "GuardianPaused");

      await expect(
        fixture.executor
          .connect(fixture.relayer)
          .executeAction(
            args.policyId,
            fixture.riskCapAction.actionId,
            fixture.riskCapAction.target,
            fixture.riskCapAction.selector,
            fixture.riskCapAction.params,
            fixture.riskCapAction.nativeValue
          )
      ).to.be.revertedWithCustomError(fixture.executor, "ExecutorPaused");

      expect(await fixture.mockUsdc.balanceOf(fixture.aliceDao.address)).to.equal(GRANT_AMOUNT);
    });

    it("case 25: guardian cannot create or alter a policy", async () => {
      const fixture = await deployFixture();
      const args = await activePolicyArgs(fixture, { safe: fixture.stranger.address });

      await expect(
        fixture.executor
          .connect(fixture.guardian)
          .activatePolicy(
            validMockProofFor(await fixture.registry.getAddress(), args),
            args.policyId,
            args.version,
            args.safe,
            args.destinationChainId,
            args.executor,
            args.activation,
            args.expiry,
            args.actions
          )
      ).to.be.revertedWithCustomError(fixture.executor, "SafeMismatch");

      await expect(
        fixture.executor
          .connect(fixture.guardian)
          .setAllowedCall(fixture.grantAction.target, fixture.grantAction.selector, false)
      ).to.be.revertedWithCustomError(fixture.executor, "OwnableUnauthorizedAccount");
    });
  });

  describe("configuration invariants", () => {
    it("rejects a guardian address equal to the authority Safe at deploy time", async () => {
      const fixture = await deployFixture();
      const SafeRootPolicyExecutor = await ethers.getContractFactory("SafeRootPolicyExecutor");
      await expect(
        SafeRootPolicyExecutor.deploy(
          fixture.authoritySafe.address,
          await fixture.registry.getAddress(),
          fixture.authoritySafe.address,
          await fixture.verifier.getAddress(),
          fixture.deployer.address
        )
      ).to.be.revertedWithCustomError(SafeRootPolicyExecutor, "GuardianMustDifferFromAuthoritySafe");
    });
  });
});
