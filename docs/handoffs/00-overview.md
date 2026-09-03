# 00 — SafeRoot Policy: Delivery Overview

**Source documents:**
- `docs/SafeRoot_Policy_PRD.md` (product requirements — cited as "PRD §N")
- `docs/SafeRoot_UX_Flow.md` (UX flow spec — cited as "UX §N")
- `docs/code.html` and `docs/screen.png` (design-system reference — cited as "code.html")

This overview is the shared contract between all three roles. Every role file repeats the parts
of this document it directly needs, but this file is the single place where cross-role
architecture decisions are made. If a role file and this file ever disagree, this file wins and
the discrepancy should be flagged back to the PM.

---

## 1. Role map

| # | Role | One-line scope | Handoff file |
|---|------|-----------------|--------------|
| 1 | Smart Contracts | Solidity contracts on Ethereum Sepolia (PolicyRegistry) and Creditcoin CC3 (SafeRootPolicyExecutor) plus the demo target contracts and the full adversarial test suite | `01-smart-contracts.md` |
| 2 | Backend Services | Node/TypeScript API + indexer + the permissionless Attestcoin proof worker + Safe Transaction Service integration | `02-backend-services.md` |
| 3 | Frontend | Next.js application implementing every screen in the UX flow spec against the design-system reference | `03-frontend.md` |

Only three roles are defined. A fourth (e.g. a dedicated "DevOps/demo" role) was considered and
rejected: demo seeding and adversarial-attempt scripting are Solidity-test-shaped work and belong
inside Smart Contracts; deployment scripting is a few lines inside each role's own deliverables.
Splitting it out would create a role with no independent acceptance criteria.

## 2. Dependency graph and dispatch order

```
Smart Contracts ──(ABI + deployed addresses)──▶ Backend Services
Smart Contracts ──(ABI + deployed addresses)──▶ Frontend
Backend Services ──(REST API)──────────────────▶ Frontend
```

All three roles can **start immediately in parallel** because the ABI/event/API shapes needed to
begin work are fully specified in §5–§7 of this document. Nobody has to wait on another role's
code to start.

The only hard gate is **integration**: Backend and Frontend cannot point at real deployed
contracts until Smart Contracts has deployed to Ethereum Sepolia and Creditcoin CC3 and published
the deployment JSON described in §5.4. Until then, Backend and Frontend build against the
documented interfaces using mocks/fixtures.

Recommended dispatch: launch all three concurrently. Smart Contracts should treat "deploy to
testnets and publish `deployments.json`" as its highest-priority deliverable, ahead of finishing
the full adversarial test suite, so the other two roles can integrate as early as possible.

## 3. Shared conventions (all roles)

- **Language:** TypeScript everywhere off-chain (Backend, Frontend). Solidity for contracts.
- **English only**: identifiers, copy, commits, comments-that-would-otherwise-not-exist.
- **No code comments**, per standing rules, except the single-line `// TEMPORARY` exception.
- **Strict TypeScript**: no `any`, no `@ts-ignore`, no non-null assertion to silence a real
  nullable.
- **Monorepo layout** (single repository, no separate repos per role):
  ```
  /contracts        - Smart Contracts role
  /backend           - Backend Services role
  /frontend          - Frontend role
  /docs              - existing product docs + these handoffs
  ```
- **Package manager:** npm workspaces at the repo root tying `/contracts`, `/backend`,
  `/frontend` together, so shared types/ABI can be imported without publishing packages. Each
  role's handoff explains what it owns inside its directory. Nobody edits another role's
  directory.
- **Networks** (fixed for the whole project, do not introduce others):
  - Source/authority chain: **Ethereum Sepolia**, chain ID `11155111`.
  - Destination chain: **Creditcoin CC3 Testnet**, chain ID `102031`, RPC
    `https://rpc.cc3-testnet.creditcoin.network`, explorer
    `https://creditcoin-testnet.blockscout.com/`.
  - Verification layer: **Attestcoin Protocol**, Creditcoin's Universal Smart Contract (USC)
    oracle. USC lets a Creditcoin CC3 contract trustlessly verify that a specific transaction/event
    occurred on Ethereum Sepolia, via attestors (who build consensus on Sepolia history) and
    provers (permissionless parties who generate a proof that a transaction/event exists in that
    attested history and submit it on-chain). Reference docs: `docs.creditcoin.org/usc`,
    `github.com/gluwa/creditcoin-usc-networks`, package `@gluwa/usc-sdk`. The exact SDK function
    signatures were not resolvable at planning time (the specific doc pages returned 404) — both
    Smart Contracts and Backend Services must pull the current SDK/API from those sources as a
    first step and treat the interface in this document (`IAttestcoinVerifier`, §5.2) as the
    contract-side abstraction they implement against, adapting the internal call to whatever the
    real SDK/verifier contract exposes.
- **No new dependency without asking.** Because this is a from-scratch repository (no existing
  `package.json`), the dependencies named in each role's handoff are pre-approved as the MVP
  baseline (they were reasoned about at planning time — see §4). Anything beyond that list needs
  a check-in before it's added.

## 4. Technology decisions and reasoning

### Frontend: Next.js (App Router, TypeScript) — mandated, not a choice.
Server Components by default; `use client` only on interactive leaves. Tailwind CSS because the
design reference (`code.html`) is already authored in Tailwind with a defined token
configuration — reusing that config avoids re-deriving tokens in a second system. `wagmi` +
`viem` for wallet/chain interaction (no realistic alternative for typed EVM contract calls from
React). `@safe-global/protocol-kit` + `@safe-global/api-kit` to propose the policy transaction to
the real Safe Transaction Service and read signer/threshold progress, because PRD §9/Feature 5 and
UX §1 both require **reusing** Safe's own approval process rather than rebuilding multisig signing
UI — rebuilding signing would violate the explicit non-goal "Replacing Safe's signer or
transaction experience" (PRD §5). No prebuilt wallet-connect UI kit (e.g. RainbowKit/ConnectKit)
is used — the design system in `code.html` is a bespoke visual language, and a prebuilt kit's
default UI would fight it; a minimal custom connect surface is cheap to build directly.

### Backend: Node.js + TypeScript, Fastify, PostgreSQL via Prisma.
Reasoning:
- **Data shape** is small and strongly relational (Policy → Actions → ActivityEvents, with clear
  foreign keys and a well-defined state machine per PRD §11) — a relational database with a
  typed ORM is a better fit than a document store or a subgraph-style indexer, and is far faster
  to stand up in a hackathon timeline than deploying a custom subgraph.
- **Team/stack speed**: keeping the whole off-chain surface in TypeScript (matching Frontend and
  the contracts' test tooling) means ABI types, event decoding, and validation logic can be
  shared or at least stay in one mental model, which matters when the same short timeline has to
  cover an indexer, a worker process, and a REST API.
- **Realtime needs are modest.** The UX spec explicitly avoids promising instant cross-chain
  state (PRD §13 "Revocation is not instantaneous") and describes polling-friendly "waiting"
  states, not a live feed. Fastify + short-interval polling from the Frontend (or simple SSE) is
  sufficient; a heavier realtime stack (WebSocket infra, Redis pub/sub) is not justified for MVP
  and is explicitly deferred.
- **Rejected alternatives:**
  - *Python/FastAPI or Go* — no shared types with the Next.js/contracts TypeScript codebase,
    slower iteration for a small hackathon team, no compensating benefit given the workload is
    I/O-bound (RPC calls, HTTP, Postgres), not compute-bound.
  - *The Graph (subgraph indexer)* — more infrastructure and deployment ceremony than a 3-day
    build can absorb, and CC3 testnet subgraph support is unverified; a hand-rolled indexer over
    a small number of contract events is simpler and fully within the team's control. Listed as a
    Phase-2 roadmap item, not MVP.
  - *Serverless functions only (no persistent worker)* — the Attestcoin proof worker and Safe
    watcher need to poll continuously; a long-running Node process is simpler than reassembling
    that behavior out of scheduled functions for a hackathon.

## 5. Architecture spec

### 5.1 Data model (Backend Postgres schema — Prisma model names)

**Policy**
| Field | Type | Notes |
|---|---|---|
| id | string (policyId, bytes32 hex) | primary key |
| name | string | author-entered |
| version | int | monotonically increasing per policyId lineage |
| authoritySafeAddress | string | Ethereum address |
| authoritySafeChainId | int | `11155111` |
| destinationChainId | int | `102031` |
| executorAddress | string | Creditcoin CC3 address |
| activationTime | datetime | |
| expiryTime | datetime | |
| status | enum | see PRD §11 exactly: `Draft, AwaitingApproval, ApprovedOnEthereum, AwaitingEvidence, Verifying, Active, Paused, Expired, Completed, Superseded` |
| safeTxHash | string, nullable | Safe Transaction Service's `safeTxHash` |
| ethereumTxHash | string, nullable | on-chain Ethereum execution hash once the Safe tx executes |
| attestcoinProofRef | string, nullable | opaque reference/id for the submitted proof |
| creditcoinActivationTxHash | string, nullable | `activatePolicy` tx hash on CC3 |
| createdAt / updatedAt | datetime | |

**Action** (child of Policy)
| Field | Type | Notes |
|---|---|---|
| id | string (actionId, bytes32 hex) | primary key |
| policyId | string | FK |
| templateType | enum | `grant \| risk_cap \| pause` |
| label | string | human-readable, e.g. "Pay 25,000 USDC to Alice DAO" |
| targetContract | string | Creditcoin address |
| functionSelector | string | 4-byte hex |
| encodedParams | string | hex-encoded ABI params |
| nativeValue | string (uint) | usually `0` for MVP |
| earliestExecution | datetime | |
| expiry | datetime | |
| state | enum | PRD Feature 8 exactly: `Draft, Waiting, Ready, Executed, Expired, Paused, Blocked` |
| executionTxHash | string, nullable | |

**ActivityEvent**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| policyId | string | FK |
| actionId | string, nullable | FK |
| type | enum | PRD §12 list: `PolicyDrafted, SubmittedToSafe, SafeSignatureAdded, SafeThresholdReached, SourceTransactionExecuted, AttestcoinEvidenceAvailable, PolicyVerifiedOnCreditcoin, ActionSubmitted, ActionExecuted, ActionBlocked, GuardianPauseActivated, PolicyExpired, NewPolicyVersionActivated` |
| timestamp | datetime | |
| actor | string | address or `system` |
| network | enum | `ethereum-sepolia \| creditcoin-cc3` |
| txHash | string, nullable | |
| humanReadableMessage | string | plain-language sentence, see UX §8/§11 copy library |
| rejectionReason | enum, nullable | one of the PRD Feature 10 reasons, when `type = ActionBlocked` |
| technicalDetails | JSON | safeTxHash, policyVersion, sourceEmitter, executor, attestcoinProofRef, actionCommitment, creditcoin tx hash |

**Integration** (Creditcoin integration allowlist, seeded not user-authored for MVP)
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | e.g. "SafeRoot Demo Executor" |
| network | string | `creditcoin-cc3` |
| executorAddress | string | |
| verified | boolean | `true` for the seeded MVP integration |
| supportedActions | JSON | list of `{templateType, targetContract, functionSelector, description}` |

### 5.2 Smart contract interfaces (both roles must code against these exact signatures)

**`PolicyRegistry.sol`** — deployed on Ethereum Sepolia. Callable only by the configured authority
Safe (the Safe's `execTransaction` makes the Safe itself `msg.sender`, so a simple
`require(msg.sender == authoritySafe)` is sufficient — no extra signature-checking is needed on
the Ethereum side).

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
) external; // reverts unless msg.sender == authoritySafe
```

**`SafeRootPolicyExecutor.sol`** — deployed on Creditcoin CC3. Holds the demo `MockUSDC` balance
that funds the contributor-grant action.

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

function guardianPause(bytes32 policyId, string calldata reason) external; // onlyGuardian, no resume function in MVP

function getPolicy(bytes32 policyId) external view returns (PolicyRecord memory);
function getAction(bytes32 policyId, bytes32 actionId) external view returns (ActionRecord memory);
```

Required revert reasons for `executeAction` (custom errors, one per PRD Feature 10 case actually
reachable on-chain): `PolicyNotActive`, `PolicyExpired`, `ExecutorPaused`, `ActionNotFound`,
`ActionAlreadyExecuted`, `TargetMismatch`, `FunctionNotAllowed`, `CalldataMismatch`,
`AmountExceedsApproval`, `NotYetEligible`, `ActionExpired`. Required revert reasons for
`activatePolicy`: `UnsupportedSourceChain`, `SourceTransactionFailed`, `EmitterNotApproved`,
`SafeMismatch`, `WrongDestinationChain`, `WrongExecutor`, `StalePolicyVersion`,
`PolicyNotYetValid`, `PolicyAlreadyExpired`, `ProofAlreadyUsed`.

### 5.3 Demo action definitions (fixed, exact — used by every role)

1. **Contributor grant** — target = `MockUSDC` address, selector = `transfer(address,uint256)`,
   params = `abi.encode(aliceDaoAddress, 25000 * 10**6)`. The `SafeRootPolicyExecutor` contract
   itself must hold at least 25,000 MockUSDC before this action can succeed (pre-funded at
   deploy/setup time by Smart Contracts).
2. **Risk-cap change** — target = `LendingPoolMock` address, selector = `setMaxLTV(uint256)`,
   params = `abi.encode(6800)` (68.00% expressed in basis points).
3. **Emergency pause** — target = `LendingPoolMock` address, selector = `pauseNewDeposits()`,
   params = `0x` (empty).

`MockUSDC` (ERC20, 6 decimals, mintable by deployer) and `LendingPoolMock` (owner-agnostic,
`setMaxLTV(uint256)` and `pauseNewDeposits()` simply store values with no further logic) are
demo target contracts owned by the Smart Contracts role. Swapping in a real Creditcoin protocol
later only requires updating the `Integration.supportedActions` allowlist — this is a should-ship
item, not required for MVP.

### 5.4 Deployment artifact contract

Smart Contracts publishes `/contracts/deployments.json` as soon as both contracts are deployed to
testnet:

```json
{
  "ethereumSepolia": {
    "chainId": 11155111,
    "policyRegistry": "0x...",
    "authoritySafe": "0x..."
  },
  "creditcoinCc3": {
    "chainId": 102031,
    "rpcUrl": "https://rpc.cc3-testnet.creditcoin.network",
    "safeRootPolicyExecutor": "0x...",
    "mockUsdc": "0x...",
    "lendingPoolMock": "0x...",
    "guardian": "0x..."
  }
}
```

Backend and Frontend read this file directly (via the npm workspace) rather than hardcoding
addresses. ABI JSON files live in `/contracts/abi/*.json`, generated by the contracts' own build
step (Hardhat or Foundry artifact output copied/exported), and are consumed the same way.

### 5.5 Backend REST API (Frontend's only data source besides direct chain reads)

Base path `/api`. All responses JSON.

| Method | Path | Purpose |
|---|---|---|
| GET | `/safes/:address` | Proxy Safe Transaction Service: name (if available), owners, threshold, network |
| GET | `/integrations` | List verified Creditcoin integrations (the seeded MVP one) |
| POST | `/policies` | Create a draft policy `{name, actions[], activationTime, expiryTime, authoritySafeAddress}` |
| PATCH | `/policies/:id` | Update a draft policy (only while `status = Draft`) |
| POST | `/policies/:id/link-safe-tx` | Attach `{safeTxHash}` once the author has proposed the real Safe transaction — moves status to `AwaitingApproval` |
| GET | `/policies` | List, grouped per UX §7: needs attention / being verified / ready / history |
| GET | `/policies/:id` | Full detail: policy + actions + activity |
| GET | `/activity` | Global activity feed, `?policyId=` filter supported |

Frontend reads live chain state directly (via `viem`) only for the two explicit on-chain writes
it performs itself: `executeAction` and `guardianPause` (see §5.6). Everything else — including
all status/progress display — comes from this API so the UI never has to re-derive the state
machine itself.

### 5.6 Who submits which transaction

- **Propose policy to Safe** — Frontend, using `@safe-global/protocol-kit`/`api-kit`, on the
  connected wallet, on Ethereum Sepolia. This is the only step where the Frontend writes to
  Ethereum.
- **Safe signing** — happens in Safe{Wallet} itself (owners sign there); SafeRoot only displays
  progress. SafeRoot never builds its own multisig signing UI.
- **`registerPolicy` on `PolicyRegistry`** — bundled inside the Safe transaction the author
  proposes (the Safe's batched/execTransaction call targets `PolicyRegistry.registerPolicy`
  directly); no separate submitter.
- **Attestcoin proof generation + `activatePolicy`** — Backend Services' permissionless proof
  worker, automatically, once the Safe transaction is confirmed executed on Ethereum. This is the
  one piece of on-chain submission Backend owns.
- **`executeAction`** — Frontend, from the connected wallet, on Creditcoin CC3. The relayer role
  described in the PRD is demonstrated by "any connected wallet can click Execute," which is
  literally true since the contract enforces boundaries regardless of caller.
- **`guardianPause`** — Frontend, from the guardian's connected wallet, on Creditcoin CC3.
- **Tampered/adversarial execution attempts (for the demo)** — Frontend must expose an
  advanced/Level-3 control that lets an operator submit an `executeAction` call with a
  deliberately altered parameter (e.g. amount), so Screen 6 ("Protected") can show a live
  rejection. This is a required Frontend deliverable, not just a contract test.

## 6. Design-system inventory (source: `docs/code.html`, `docs/screen.png`)

This is the full inventory. It is also embedded verbatim in `03-frontend.md` so that role never
needs to reopen this file.

**Important caveat, stated plainly:** `code.html` is a single marketing hero section for a
fictitious VC firm ("Tribe Capital"), not an application design system. It establishes brand
tone, a color/type pairing, spacing rhythm, and two component patterns (nav bar, two button
styles) — it does **not** contain cards, tables, forms, modals, badges, or any state styling
(hover/focus/disabled/loading/empty/error). The Frontend role must extend these primitives
consistently to build the missing application components; §6.6 below gives explicit direction on
how to do that in a way that matches the reference and the UX flow spec's institutional, calm
tone (UX §1).

### 6.1 Color tokens (code.html lines 21–26)
| Token | Value | Observed usage |
|---|---|---|
| `tribe-blue` | `#2E35FF` | Primary accent: active nav link, primary button background, hover color for secondary link/icon |
| `tribe-gray` | `#F5F5F5` | Section background (image/halftone section) |
| `text-primary` | `#1A1A1A` | Headlines, primary body text |
| `text-secondary` | `#666666` | Meta/supporting text (e.g. "Founded June 2018") |
| (implicit) white | `#FFFFFF` | Page background (`bg-white`) |
| (implicit) `gray-200` | Tailwind default | Header bottom border only, no shadow |

No red, green, or yellow tokens exist in the reference. The Frontend role must choose a success
green / danger red / warning amber that sit comfortably next to `#2E35FF` on a white background,
and must pair every color state with text and an icon per UX §15 ("never communicate state
through color alone").

### 6.2 Typography (code.html lines 6–15, 37, 64–77)
- Two-typeface pairing: **Playfair Display** (700, serif) for the wordmark/brand mark only,
  uppercase, tight tracking; **Inter** (400/500/600) for everything else.
  - Defect to fix, not preserve: the reference's CSS declares
    `font-family: 'Playfair+Display'` (literal plus sign) which does not match the Google Fonts
    family name `'Playfair Display'` and silently falls back to the default serif. Frontend must
    load and apply the font correctly.
- Hero headline: `text-3xl` → `md:text-4xl` → `lg:text-[44px]`, `leading-tight`, `font-medium`,
  constrained to `max-w-3xl` for line length control.
- Nav links / button labels: `text-xs`, `font-semibold`, `tracking-wider`, `uppercase`.
- Secondary/meta text: `text-sm`, `leading-relaxed`, `text-secondary` color.
- Inline text link: `text-sm`, `font-medium`.

### 6.3 Spacing, grid, layout (code.html lines 35, 60–69, 85)
- Content container: `max-w-[1400px] mx-auto`, horizontal padding `px-6` (`lg:px-12`).
- Header height: `h-24` (96px), bottom border only, no shadow, no background color change.
- Hero vertical rhythm: `py-24` (`lg:py-32`).
- 12-column grid (`grid-cols-12`, `gap-12`); asymmetric split, e.g. `lg:col-span-8` /
  `lg:col-span-4`.
- Full-bleed image/illustration section with fixed responsive heights:
  `h-[400px] md:h-[500px] lg:h-[600px]`.
- No visible radius or shadow anywhere in the reference — flat, bordered, editorial surface
  treatment, not card-elevation based.

### 6.4 Component vocabulary present in the reference
- **Top nav bar**: brand mark left, links centered-left, primary CTA button right, bottom border
  only, fixed height, no sidebar (this matches UX §4's explicit requirement: "must not use a
  generic left-hand dashboard sidebar").
- **Primary button (solid)**: `bg-tribe-blue`, white text, `px-6 py-3`, uppercase
  `text-xs font-semibold tracking-wider`, trailing arrow icon, `hover:bg-tribe-blue/90`.
- **Secondary/text link with icon**: bottom border only (no background), icon translates right on
  hover (`group-hover:translate-x-1`), text and icon shift to `tribe-blue` on hover.
- **Nav link states**: default `text-primary`, current/active `tribe-blue`, hover `tribe-blue`.

### 6.5 Interaction/state patterns present
Only `hover` and color/transform transitions are demonstrated (`transition-colors`,
`transition-transform`). **Focus, active, disabled, loading, empty, and error states are not
represented in the reference and must be designed by Frontend**, consistent with:
- the flat, bordered, no-shadow surface language above,
- `tribe-blue` as the one accent color (so focus rings should use it),
- UX §15's accessibility requirements (visible keyboard focus, state never conveyed by color
  alone, error messages stay visible until dismissed).

### 6.6 Extending the system to application components (Frontend's job, direction given here)
The reference is a landing page; SafeRoot is a status-heavy application (policy cards, action
cards, progress trackers, comparison tables, activity feed rows, status badges, a guardian-pause
banner, forms). Frontend must invent these using only the primitives above:
- Cards/rows: flat surfaces, `border` (not shadow) to separate from background, generous padding,
  no rounded corners beyond a small consistent radius if any is introduced — stay flat and
  bordered rather than inventing elevation.
- Status badges (Draft/Waiting/Ready/Executed/Expired/Paused/Blocked): text + icon + a background
  tint of the relevant state color at low opacity, never color alone (UX §15).
  - Green reserved for **verified success only** (UX Screen 6 requirement).
  - Red reserved for **blocked/invalid attempts only** (UX Screen 6 requirement).
- Progress tracker (Safe approved → Ethereum confirmed → Attestcoin evidence → Verified →
  Active): a horizontal step indicator using `tribe-blue` for completed/current steps and
  `text-secondary`/gray for pending ones, matching Across's cross-chain progress pattern named
  in UX §2.
- Buttons: reuse the exact primary/secondary button styles verbatim for all primary/secondary
  actions across the app (Continue with this Safe, Review policy, Submit to Safe, Execute
  approved action, Pause all remaining actions, etc.) rather than inventing new button styles.
- Tables (e.g. the Approved vs Submitted comparison in Screen 6): plain bordered table, no zebra
  striping unless needed for scanability, `text-sm`, header row in `font-semibold` +
  `text-secondary`.

## 7. Adversarial requirements checklist (PRD §16 — shared reference)

All 25 cases below must be demonstrable end to end. Smart Contracts owns proving each one at the
contract level (unit/integration tests); Frontend owns making the outcome visible and
understandable in the UI for at least the demo-critical subset (tampered amount, replay,
guardian pause); Backend owns recording every attempt — successful or blocked — in the activity
trail.

1. Valid Safe policy activates. 2. Valid action executes. 3–4. Second/third valid actions execute
independently. 5. Spoofed policy emitter rejected. 6. Failed source transaction rejected. 7. Wrong
authority Safe rejected. 8. Wrong destination chain rejected. 9. Wrong executor rejected. 10.
Altered target rejected. 11. Altered function rejected. 12. Altered calldata rejected. 13.
Increased grant amount rejected. 14. Invalid action membership evidence rejected. 15. Duplicate
action rejected. 16. Duplicate Attestcoin proof rejected. 17. Expired policy rejected. 18.
Not-yet-active policy rejected. 19. Stale policy version rejected. 20. Disallowed target rejected.
21. Disallowed function rejected. 22. Native-value overflow rejected. 23. Reentrancy cannot
execute an action twice. 24. Guardian pause blocks unused actions. 25. Guardian cannot create or
alter policy.

## 8. What "done" means for this whole project

Per PRD §24, the MVP is complete only when all seven outcomes are demonstrated: a real 2-of-3 Safe
approves the policy; Creditcoin verifies the Safe approval through Attestcoin; the policy becomes
active only on its bound executor; three approved actions execute successfully; an altered action
is rejected and moves no funds; an already-used action cannot execute again; guardian pause blocks
all remaining actions without granting new authority. Every role's acceptance criteria trace back
to one or more of these seven outcomes.
