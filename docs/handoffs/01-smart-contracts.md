# 01 — Smart Contracts

## Responsibilities

Own every line of Solidity in the project: the Ethereum Sepolia policy-registration contract, the
Creditcoin CC3 policy executor, the two demo target contracts actions execute against, the full
adversarial test suite, and the deployment scripts that produce the deployment artifact the other
two roles consume.

You are building the security core of the product. PRD §24 states the MVP is only complete when
seven outcomes are demonstrated — six of the seven are contract-level invariants you are
responsible for proving: a real Safe approval activates a policy, that activation is bound to the
correct executor, three actions execute successfully, an altered action is rejected and moves no
funds, an already-used action cannot execute again, and guardian pause blocks remaining actions
without creating new authority.

## Scope

### In scope

- `PolicyRegistry.sol`, deployed to Ethereum Sepolia.
- `SafeRootPolicyExecutor.sol`, deployed to Creditcoin CC3 Testnet.
- `MockUSDC.sol` (ERC20, 6 decimals, deployer-mintable) and `LendingPoolMock.sol`
  (`setMaxLTV(uint256)`, `pauseNewDeposits()`), both on Creditcoin CC3, used as the demo action
  targets.
- Research and integrate the real Attestcoin/USC verification mechanism (see Dependencies below)
  behind a clean `IAttestcoinVerifier` interface used inside `activatePolicy`.
- A Hardhat or Foundry project at `/contracts` with a full test suite covering every case in
  PRD §16 (also listed in `00-overview.md` §7) that is reachable at the contract level.
- Deployment scripts for both networks, including pre-funding `SafeRootPolicyExecutor` with
  25,000+ MockUSDC and configuring the allowlist for the three demo actions.
- Publishing `/contracts/deployments.json` and `/contracts/abi/*.json` as described in
  `00-overview.md` §5.4, as early as possible — this unblocks Backend and Frontend integration.
- Guardian address configuration (a distinct EOA from the authority Safe and from any relayer
  address used in testing).

### Out of scope

- Any off-chain proof-generation service, Safe Transaction Service polling, or event indexing —
  that is Backend Services' job. You only define and implement the on-chain verification
  interface; Backend is responsible for producing a valid proof and calling `activatePolicy` with
  it.
- Any UI, including the "attempt a tampered execution" demo control — that is Frontend's job. You
  only need to make sure `executeAction` correctly rejects a tampered call when invoked directly.
- A real, non-mock Creditcoin protocol integration. `LendingPoolMock` is sufficient for MVP; a
  real integration is a should-ship item explicitly out of required scope (PRD §14).
- Creating the actual 2-of-3 Safe on Sepolia. That is a manual account-setup step (via
  `app.safe.global`) done outside application code; you only need its address as a deploy-time
  configuration value.

## Objectives

1. Prove that only a policy approved by the configured Safe, for the configured destination chain
   and executor, at a valid version, can ever become active.
2. Prove that every approved action executes exactly once, exactly as approved, and that any
   deviation in target, function, calldata, amount, or timing is rejected without moving funds or
   changing destination state.
3. Prove that a paused policy cannot execute remaining actions, and that the guardian cannot do
   anything beyond pausing.
4. Ship contracts other roles can integrate against within hours, not days — the interface is
   fixed (see below); prioritize a working deployment over a fully polished internal
   implementation.

## Requirements

### `PolicyRegistry.sol` (Ethereum Sepolia)

Exact interface (also defined in `00-overview.md` §5.2 — reproduced here so this file is
self-contained):

```solidity
struct ActionInput {
    bytes32 actionId;
    address target;
    bytes4 selector;
    bytes params;
    uint256 nativeValue;
    uint256 earliestExecution;
    uint256 expiry;
}

event PolicyApproved(
    bytes32 indexed policyId,
    uint256 version,
    address indexed safe,
    uint256 destinationChainId,
    address executor,
    uint256 activation,
    uint256 expiry,
    bytes encodedActions // abi.encode(ActionInput[])
);

function registerPolicy(
    bytes32 policyId,
    uint256 version,
    uint256 destinationChainId,
    address executor,
    uint256 activation,
    uint256 expiry,
    ActionInput[] calldata actions
) external; // must revert unless msg.sender == authoritySafe
```

- `authoritySafe` is set once at deploy time (constructor arg), immutable.
- No signature checking is needed inside this contract: when the Safe executes a batched
  transaction via `execTransaction`, the Safe contract itself is `msg.sender` at the target
  contract. A plain `require(msg.sender == authoritySafe)` correctly reflects "the configured Safe
  authorized this call" (PRD Feature 7 requirement "Call authorized by the configured Safe").
- Store nothing beyond what is needed to prevent trivial replay at this layer (a `version` per
  `policyId` mapping is enough); the strict version/expiry/uniqueness enforcement is Creditcoin's
  job in `activatePolicy`, not this contract's.

### `SafeRootPolicyExecutor.sol` (Creditcoin CC3)

Exact interface (also defined in `00-overview.md` §5.2):

```solidity
struct ActionRecord {
    bytes32 actionId;
    address target;
    bytes4 selector;
    bytes params;
    uint256 nativeValue;
    uint256 earliestExecution;
    uint256 expiry;
    bool executed;
}

event PolicyActivated(bytes32 indexed policyId, uint256 version, address safe, uint256 activation, uint256 expiry);
event ActionExecuted(bytes32 indexed policyId, bytes32 indexed actionId, address target, bool success);
event GuardianPaused(bytes32 indexed policyId, address guardian, string reason, uint256 timestamp);

function activatePolicy(
    bytes calldata attestcoinProof,
    bytes32 policyId,
    uint256 version,
    address safe,
    uint256 destinationChainId,
    address executor,
    uint256 activation,
    uint256 expiry,
    ActionInput[] calldata actions
) external;

function executeAction(
    bytes32 policyId,
    bytes32 actionId,
    address target,
    bytes4 selector,
    bytes calldata params,
    uint256 nativeValue
) external payable;

function guardianPause(bytes32 policyId, string calldata reason) external; // onlyGuardian

function getPolicy(bytes32 policyId) external view returns (PolicyRecord memory);
function getAction(bytes32 policyId, bytes32 actionId) external view returns (ActionRecord memory);
```

**`activatePolicy` checks, in order, each with a distinct custom error:**
1. `attestcoinProof` verifies (via `IAttestcoinVerifier`, see Dependencies) that
   `PolicyRegistry.PolicyApproved(policyId, version, safe, destinationChainId, executor,
   activation, expiry, abi.encode(actions))` was emitted in a **successful** transaction on the
   supported source chain (`11155111`) — failure: `SourceTransactionFailed` /
   `UnsupportedSourceChain` / `EmitterNotApproved` as appropriate.
2. `safe == authoritySafe` (config value) — else `SafeMismatch`.
3. `destinationChainId == block.chainid` — else `WrongDestinationChain`.
4. `executor == address(this)` — else `WrongExecutor`.
5. `version > storedVersion[policyId]` (or this is a first activation) — else
   `StalePolicyVersion`. A higher version for a previously-known `policyId` supersedes the older
   one (mark the prior version's remaining actions unusable).
6. Proof has not been used before (`usedProofHash[keccak256(attestcoinProof)]`) — else
   `ProofAlreadyUsed`. This must be checked and set atomically with activation.
7. `block.timestamp <= expiry` — else `PolicyAlreadyExpired`. (Activation may occur before
   `activation` time; individual actions still enforce `earliestExecution` in `executeAction`.)

On success: persist the `PolicyRecord` and one `ActionRecord` per input action, mark active, emit
`PolicyActivated`.

**`executeAction` checks, in order, each with a distinct custom error, matching PRD Feature 10:**
`PolicyNotActive`, `PolicyExpired`, `ExecutorPaused`, `ActionNotFound`,
`ActionAlreadyExecuted`, `TargetMismatch`, `FunctionNotAllowed` (cross-check against the
target/selector allowlist described below), `CalldataMismatch` (submitted `params` must equal the
stored `ActionRecord.params` exactly, byte for byte), `AmountExceedsApproval` (submitted
`nativeValue` must equal the stored value exactly — MVP uses exact values only, per PRD §22 open
decision 1), `NotYetEligible` (`block.timestamp < earliestExecution`), `ActionExpired`
(`block.timestamp > ActionRecord.expiry`).

Effects-before-interaction: set `executed = true` **before** the external call, and use a
reentrancy guard (OpenZeppelin `ReentrancyGuard` or an equivalent manual guard) on `executeAction`
— this is what proves adversarial case 23 (reentrancy cannot execute an action twice).

Perform the external call as `target.call{value: nativeValue}(abi.encodePacked(selector,
params))`. Emit `ActionExecuted(policyId, actionId, target, success)` regardless of the inner
call's success/failure — but if you choose to revert the whole transaction on inner-call failure
instead, document that choice in your PR description; either is acceptable as long as it is
consistent and tested.

**Target/function allowlist:** a `mapping(address => mapping(bytes4 => bool)) public
allowedCalls;` populated at deploy/setup time for exactly the three demo action target+selector
pairs (`MockUSDC.transfer`, `LendingPoolMock.setMaxLTV`, `LendingPoolMock.pauseNewDeposits`).
`executeAction` must check this mapping and revert `FunctionNotAllowed` if the pair is not
allowed, even if the action otherwise matches a stored `ActionRecord` — this is what proves
adversarial cases 20–21 (disallowed target/function rejected) as a defense-in-depth layer
independent of the stored-action comparison.

**`guardianPause`:** `onlyGuardian` (a single configured address, distinct from `authoritySafe`),
sets `policies[policyId].paused = true`, emits `GuardianPaused`. No resume function exists in the
MVP (PRD §22 open decision 3) — do not add one. `executeAction` must check `paused` and revert
`ExecutorPaused` for any policy in that state. Guardian must have no other privileged function —
prove this with a test that any guardian-signed call to anything except `guardianPause` fails or
simply does not exist as a callable path (adversarial case 25).

### Demo target contracts

- `MockUSDC.sol`: standard ERC20, 6 decimals, a `mint(address, uint256)` restricted to the
  deployer for setup convenience. Deploy script mints and transfers at least 25,000 * 10^6 units
  to `SafeRootPolicyExecutor`'s own address before the demo.
- `LendingPoolMock.sol`: `setMaxLTV(uint256 newMaxLtvBps)` and `pauseNewDeposits()`, each simply
  storing the value/flag and emitting its own event for readability. No owner restriction is
  required on this mock — the security boundary is enforced entirely by
  `SafeRootPolicyExecutor`'s allowlist and action matching, not by the target contract, since in
  production a real Creditcoin protocol would grant the executor a scoped role rather than trust
  the executor's own internal logic. Document this assumption clearly in the contract's
  top-of-file docstring-equivalent (a plain statement above the contract, not an inline comment
  inside logic, or simply in the PR description).

### Test suite

Cover, at minimum, every one of the 25 cases in PRD §16 / `00-overview.md` §7 that is reachable
without off-chain infrastructure (all except case 6 "failed source transaction is rejected" and
case 16 "duplicate Attestcoin proof is rejected" may need a mocked `IAttestcoinVerifier` to
simulate both valid and invalid/failed proofs — build that mock as part of the test suite). Two
independent valid policies/action sets should be used across the suite so that "second/third
valid action executes independently" (cases 3–4) is proven with real distinct actions, not just
asserted.

## Dependencies

- **Attestcoin/USC verification mechanism** — research `docs.creditcoin.org/usc`,
  `github.com/gluwa/creditcoin-usc-networks`, and the `@gluwa/usc-sdk` package as your first task.
  At planning time, the specific documentation pages describing the on-chain verifier contract's
  Solidity interface were unreachable (404), so the exact shape of `IAttestcoinVerifier` could not
  be pinned down here. Design `IAttestcoinVerifier` as a small interface
  (`function verifyEventInclusion(bytes calldata proof, address emitter, uint256 sourceChainId,
  bytes calldata expectedEventData) external view returns (bool)` or the closest real equivalent
  you find) and adapt `activatePolicy` to call whatever the actual USC verifier contract/precompile
  on Creditcoin CC3 exposes. If the real verifier cannot be integrated in time, ship a
  clearly-labeled interim implementation that trusts a configured "attestor" signer's signature
  over the same event data (a stand-in, not a silent shortcut — flag this explicitly in your
  handoff back to the PM if you have to take this path, so Frontend/Backend and the demo script
  can be told plainly which parts are real Attestcoin verification and which are a placeholder).
- **Authority Safe address** — provided by whoever sets up the real 2-of-3 Safe on Sepolia
  (outside this role's scope); you need this address as a deploy-time config value for both
  contracts.
- **Guardian address** — any EOA you control for testing; document it in `deployments.json`.

## Constraints

- Solidity, strict compiler settings (no unchecked overflow — Solidity ≥0.8 default checked math
  covers this and directly addresses adversarial case 22, native-value overflow).
- No code comments other than the single-line `// TEMPORARY` exception from the standing rules.
- No new off-chain dependency without asking — Hardhat/Foundry, OpenZeppelin contracts, and
  whatever `@gluwa/usc-sdk`/USC verifier package the Attestcoin integration requires are
  pre-approved; anything else, check first.
- Do not implement a guardian resume path, arbitrary calldata for normal users, or multichain
  destination support — all explicit non-goals (PRD §5, §14).
- Keep `MockUSDC`/`LendingPoolMock` genuinely minimal — they exist only to make the three demo
  actions real, not to become a mini-protocol.

## Deliverables

- `/contracts` Hardhat or Foundry project, compiling cleanly.
- `PolicyRegistry.sol`, `SafeRootPolicyExecutor.sol`, `MockUSDC.sol`, `LendingPoolMock.sol`.
- `IAttestcoinVerifier` interface plus its real or clearly-labeled interim implementation.
- Full test suite covering every contract-reachable case from PRD §16.
- Deploy scripts for Ethereum Sepolia and Creditcoin CC3, including allowlist setup and MockUSDC
  pre-funding.
- `/contracts/deployments.json` and `/contracts/abi/*.json`, published as early as possible.
- A short written note (in your final report, not a new doc file) on which parts of Attestcoin
  verification are real versus interim/mocked, if that distinction applies.

## Acceptance criteria

- All tests pass (`npx hardhat test` or `forge test`), and the suite visibly maps to the 25
  adversarial cases (test names or a comment-free grouping structure make this traceable).
- A real transaction sequence on Sepolia testnet (Safe → `PolicyRegistry.registerPolicy`) followed
  by a real `activatePolicy` call on Creditcoin CC3 testnet (using at least the interim verifier if
  the real one isn't ready) results in an `Active` policy on-chain.
- All three demo actions (`MockUSDC.transfer` 25,000 units, `LendingPoolMock.setMaxLTV(6800)`,
  `LendingPoolMock.pauseNewDeposits()`) execute successfully exactly once each against the
  activated policy.
- A call to `executeAction` with the grant's amount changed to 100,000 units reverts with
  `AmountExceedsApproval` (or `CalldataMismatch`, depending on how you encode the amount) and
  `MockUSDC`'s balances are unchanged.
- A second call to `executeAction` for an already-executed action reverts with
  `ActionAlreadyExecuted`.
- `guardianPause` on an active policy causes every remaining `executeAction` call for that policy
  to revert with `ExecutorPaused`; a non-guardian address calling `guardianPause` reverts.
- `deployments.json` and `abi/*.json` exist, are valid JSON, and match what is actually deployed
  on both networks.
