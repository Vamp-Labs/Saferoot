# 02 — Backend Services

## Responsibilities

Own everything off-chain that is not the browser UI: the REST API the Frontend reads from, the
Postgres schema and indexer that keep it accurate, the Safe Transaction Service integration that
tracks signer progress, and the permissionless Attestcoin proof worker that automatically moves a
Safe-approved policy from "approved on Ethereum" to "active on Creditcoin" without any manual user
action — this last piece is explicitly required by PRD Feature 6 and UX §3.5/§17: "users do not
manually upload proof data during the normal flow."

You are the only role that submits `activatePolicy` transactions. You never submit
`executeAction` or `guardianPause` — those are Frontend's direct wallet transactions (see
`00-overview.md` §5.6).

## Scope

### In scope

- A Fastify (or equivalent minimal Node/TypeScript HTTP framework) REST API implementing every
  endpoint in §5.5 below.
- PostgreSQL schema (via Prisma) implementing the data model in §4 below.
- **Safe watcher**: polls the Safe Transaction Service API for Sepolia for the `safeTxHash`
  attached to each policy, writes `ActivityEvent`s for each signature added and threshold-reached,
  and updates `Policy.status` through `AwaitingApproval → ApprovedOnEthereum`.
- **Attestcoin proof worker**: once a policy's Safe transaction is confirmed executed on Ethereum,
  automatically generates or fetches an Attestcoin/USC inclusion proof for the
  `PolicyRegistry.PolicyApproved` event and submits `activatePolicy(...)` to
  `SafeRootPolicyExecutor` on Creditcoin CC3. Updates `Policy.status` through
  `AwaitingEvidence → Verifying → Active` (or records the specific failure).
- **Chain indexer**: subscribes to/polls `SafeRootPolicyExecutor` events (`PolicyActivated`,
  `ActionExecuted`, `GuardianPaused`) on Creditcoin CC3, and any failed/reverted `executeAction`
  attempts (see §3 below for how to capture these), writing `ActivityEvent`s and updating
  `Action.state`.
- Seeding the one verified `Integration` record for the MVP demo executor.
- Draft-policy persistence (`POST /policies`, `PATCH /policies/:id`) so the Frontend's policy
  builder has somewhere to save state before a real Safe transaction exists.

### Out of scope

- Any UI. You return JSON; you render nothing.
- Proposing the Safe transaction itself — the Frontend does that directly via
  `@safe-global/protocol-kit`, then calls your `link-safe-tx` endpoint with the resulting
  `safeTxHash`. You only watch it after that point.
- `executeAction` and `guardianPause` submission — Frontend's direct wallet transactions. You only
  index the results.
- Contract implementation — you consume the ABI and `deployments.json` published by Smart
  Contracts; you do not modify Solidity.
- Any notification delivery beyond in-app (email/Slack/webhook are explicitly roadmap, PRD §14/UX
  §14).

## Objectives

1. Make the entire Ethereum → Attestcoin → Creditcoin verification pipeline run without a human
   touching a proof, matching UX Feature 6's requirement that progress updates automatically.
2. Give the Frontend one reliable source of truth for policy/action/activity state so it never has
   to reconstruct the state machine itself from raw chain data.
3. Record every execution attempt — successful or blocked — so the Activity page and Screen 6
   ("Protected") can show the tampered-vs-approved comparison from real data, not a scripted
   fixture.

## Requirements

### 1. Data model

Implement exactly the Prisma schema described in `00-overview.md` §5.1: `Policy`, `Action`,
`ActivityEvent`, `Integration`. Reproduced here:

- **Policy**: `id, name, version, authoritySafeAddress, authoritySafeChainId (11155111),
  destinationChainId (102031), executorAddress, activationTime, expiryTime, status
  (Draft|AwaitingApproval|ApprovedOnEthereum|AwaitingEvidence|Verifying|Active|Paused|Expired|
  Completed|Superseded), safeTxHash?, ethereumTxHash?, attestcoinProofRef?,
  creditcoinActivationTxHash?, createdAt, updatedAt`.
- **Action**: `id, policyId, templateType (grant|risk_cap|pause), label, targetContract,
  functionSelector, encodedParams, nativeValue, earliestExecution, expiry, state
  (Draft|Waiting|Ready|Executed|Expired|Paused|Blocked), executionTxHash?`.
- **ActivityEvent**: `id, policyId, actionId?, type (PolicyDrafted|SubmittedToSafe|
  SafeSignatureAdded|SafeThresholdReached|SourceTransactionExecuted|AttestcoinEvidenceAvailable|
  PolicyVerifiedOnCreditcoin|ActionSubmitted|ActionExecuted|ActionBlocked|GuardianPauseActivated|
  PolicyExpired|NewPolicyVersionActivated), timestamp, actor, network
  (ethereum-sepolia|creditcoin-cc3), txHash?, humanReadableMessage, rejectionReason?,
  technicalDetails (JSON)`.
- **Integration**: `id, name, network, executorAddress, verified, supportedActions (JSON)`.

`Policy.status` transitions must follow PRD §11's state table, including the state-priority rule:
`Paused → Superseded → Expired → Completed → Active → Verifying → Awaiting evidence → Approved →
Awaiting approval → Draft`. Compute the user-facing status by applying that priority whenever more
than one condition is true (e.g. an `Active` policy that is also `Paused` must display `Paused`).

`rejectionReason` on `ActivityEvent` must be one of the exact PRD Feature 10 reasons: `Policy not
active, Policy expired, Executor paused, Wrong destination chain, Wrong executor, Wrong target,
Function not allowed, Calldata differs from approval, Amount exceeds approval, Action already
executed, Policy version is stale, Proof already used, Source transaction failed, Source emitter
not approved, Source Safe does not match`. Map on-chain custom-error names (from Smart Contracts'
`01-smart-contracts.md`) to these exact strings — build one explicit lookup table, do not
paraphrase per-event.

### 2. Safe Transaction Service integration

Use Safe's public Transaction Service for Sepolia to read Safe metadata (owners, threshold) and
transaction status/signature progress for a given `safeTxHash`. Confirm the current base URL and
API shape at build time (it has historically been `https://safe-transaction-sepolia.safe.global`,
but verify against Safe's current developer docs before wiring it in, since endpoints have moved
before). Poll on a short interval (a few seconds) while a policy is in `AwaitingApproval` or
`ApprovedOnEthereum` without a confirmed `ethereumTxHash` yet; back off once resolved.

For every new signature observed, write an `ActivityEvent` of type `SafeSignatureAdded`. When the
signature count reaches the Safe's threshold, write `SafeThresholdReached`. When the underlying
Ethereum transaction is mined and successful, write `SourceTransactionExecuted`, set
`ethereumTxHash`, and move `status` to `ApprovedOnEthereum`. If the Ethereum transaction reverts
or fails, move `status` appropriately (it cannot proceed to activation — this directly satisfies
PRD Feature 5's acceptance criterion "A failed source transaction cannot activate a policy") and
record why.

### 3. Attestcoin proof worker

Once `status = ApprovedOnEthereum`:
1. Move to `AwaitingEvidence`, write `AttestcoinEvidenceAvailable` once evidence exists (poll or
   subscribe to whatever the USC infrastructure exposes — a proof-generation API and/or GraphQL
   indexer endpoint per network, referenced in `github.com/gluwa/creditcoin-usc-networks`'s
   `networks.json`; confirm exact fields at build time).
2. Generate/obtain the inclusion proof for the `PolicyRegistry.PolicyApproved` event using
   `@gluwa/usc-sdk` (or whatever the current equivalent package/API is — the exact SDK surface
   was not resolvable at planning time; treat `docs.creditcoin.org/usc` as the source of truth and
   adapt).
3. Submit `activatePolicy(proof, policyId, version, safe, destinationChainId, executor,
   activation, expiry, actions)` to `SafeRootPolicyExecutor` on Creditcoin CC3 from a funded
   worker wallet. Move `status` to `Verifying` while the transaction is pending, then to `Active`
   on success, writing `PolicyVerifiedOnCreditcoin`.
4. On revert, translate the contract's custom error to one of the exact rejection reasons above
   and record it — do not leave the policy silently stuck with no explanation, since UX §4 (Verify
   screen) requires distinguishing waiting from failure.
5. This worker must be safe to run more than once without double-activating a policy (the contract
   itself rejects a reused proof — see `01-smart-contracts.md` `ProofAlreadyUsed` — but the worker
   should also avoid firing redundant transactions once it observes `PolicyActivated` for a
   `policyId`/`version` it already knows about).

This worker is explicitly the "permissionless proof worker" the PRD describes (Feature 6,
PRD §14 "Permissionless Attestcoin proof worker"). Model it as something anyone could run — no
special key requirement beyond gas funds and read access to public chain data — even though for
the hackathon only your instance runs it.

### 4. Chain indexer (Creditcoin CC3)

Watch `SafeRootPolicyExecutor` for `PolicyActivated`, `ActionExecuted`, `GuardianPaused`. On each:
- `PolicyActivated` → ensure `Policy.status = Active` (redundant with §3 but must also handle the
  case where activation happened by a different worker instance).
- `ActionExecuted` → set the matching `Action.state = Executed`, `executionTxHash`, write
  `ActionExecuted` activity.
- `GuardianPaused` → set `Policy.status = Paused`, write `GuardianPauseActivated` with the
  recorded reason and guardian address, and set every remaining unused `Action.state = Paused`.

For **blocked/tampered `executeAction` attempts** (adversarial demo path, Screen 6): these revert
on-chain and emit no success event, so they will not appear via event subscription alone. Index
them by watching for failed transactions sent to `SafeRootPolicyExecutor.executeAction` (e.g. via
`eth_getTransactionReceipt` status `0` for transactions targeting the contract, decoding the
attempted calldata to recover the submitted parameters, and simulating/`eth_call`-ing to recover
the revert reason). Write an `ActionBlocked` `ActivityEvent` with the exact `rejectionReason` and
both the approved and submitted values in `technicalDetails`, so Frontend's Screen 6 comparison
table (Approved vs Submitted) can be built from real data.

### 5. REST API

Implement exactly the endpoints in `00-overview.md` §5.5:

```
GET   /api/safes/:address
GET   /api/integrations
POST  /api/policies
PATCH /api/policies/:id
POST  /api/policies/:id/link-safe-tx
GET   /api/policies
GET   /api/policies/:id
GET   /api/activity
```

`GET /api/policies` must group results per UX §7: needs attention (waiting for Safe signatures,
expiring soon, guardian pause active, failed verification), being verified (Ethereum
confirming/Attestcoin pending/Creditcoin verification pending), ready (active with unused
actions), history (completed/expired/paused/superseded). Either return pre-grouped sections or a
flat list with enough fields for Frontend to group correctly — decide and document which, since
both roles must agree; pre-grouped sections are recommended so the grouping logic lives in one
place.

`PATCH /policies/:id` must reject edits once `status` has moved past `Draft`.

## Dependencies

- Smart Contracts' `deployments.json` and `abi/*.json` (`00-overview.md` §5.4) for contract
  addresses and event/function signatures. Until published, build against the interface spec in
  `01-smart-contracts.md` directly and swap in real values when available.
- Safe Transaction Service's public API for Sepolia (verify current base URL/shape at build time).
- Attestcoin/USC's proof-generation and verification tooling (`docs.creditcoin.org/usc`,
  `@gluwa/usc-sdk`, `github.com/gluwa/creditcoin-usc-networks`). If Smart Contracts had to ship an
  interim (non-real) verifier because the real one wasn't reachable in time, your proof worker
  must produce whatever that interim verifier expects, and this must be clearly flagged in your
  own final report so the demo script and Frontend copy don't overclaim.
- A funded worker wallet on Creditcoin CC3 testnet (get CTC from the network's faucet) to pay for
  `activatePolicy` submissions.

## Constraints

- TypeScript, strict mode, no `any`.
- No code comments beyond the single-line `// TEMPORARY` exception.
- Fastify + Prisma + PostgreSQL are pre-approved; anything else (a queue system, Redis, a
  different ORM/framework) needs a check-in first — the polling/worker-loop approach described
  above does not require a queue for this scale (three actions, one policy at a time in the
  hackathon demo).
- Never log or expose private keys; the worker wallet's key must be read from an environment
  variable, never committed, never echoed in logs or API responses.
- Do not build brokered `executeAction`/`guardianPause` submission — those stay client-side per
  `00-overview.md` §5.6.

## Deliverables

- `/backend` Node/TypeScript project (Fastify + Prisma), with a `docker-compose.yml` or equivalent
  for local Postgres if that's the simplest path to a runnable dev environment.
- Prisma schema and migrations implementing the data model above.
- The Safe watcher, Attestcoin proof worker, and chain indexer as long-running processes (can be
  one process with three internal loops, or several — your call, document the choice).
- All REST endpoints listed above, implemented and returning data matching the shapes Frontend
  needs (coordinate the exact JSON field names with `03-frontend.md` §5's API expectations —they
  are written to match this file, but confirm no drift once both roles are underway).
- A seed script populating the one verified `Integration` record for the demo executor.
- A short setup README inside `/backend` covering environment variables needed (RPC URLs, worker
  private key, database URL, Safe Transaction Service base URL).

## Acceptance criteria

- Creating a draft policy via `POST /policies`, linking a real `safeTxHash` via
  `POST /policies/:id/link-safe-tx`, and then executing that Safe transaction for real on Sepolia
  results — with no manual intervention — in the policy reaching `status = Active` in the database,
  matching an on-chain `Active` policy on Creditcoin CC3.
- `GET /policies/:id` for that policy shows a complete, correctly ordered `ActivityEvent` history
  from `SubmittedToSafe` through `PolicyVerifiedOnCreditcoin`.
- After a real `executeAction` transaction succeeds on-chain, `GET /policies/:id` shows the
  matching `Action.state = Executed` within the worker's normal polling interval, without a manual
  refresh trigger.
- After a real tampered `executeAction` attempt reverts on-chain (e.g. altered amount), an
  `ActionBlocked` `ActivityEvent` appears with `rejectionReason = "Amount exceeds approval"` and
  both approved/submitted values present in `technicalDetails`.
- After a real `guardianPause` transaction, the policy's status becomes `Paused` and every
  remaining `Action.state` becomes `Paused` within the indexer's normal polling interval.
- No private key, RPC API key, or database credential appears in source control or in any API
  response.
