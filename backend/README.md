# SafeRoot Policy — Backend Services

Fastify + Prisma/PostgreSQL REST API, Safe watcher, Attestcoin proof worker, and Creditcoin CC3
chain indexer. Implements `docs/handoffs/02-backend-services.md` against the shared contract in
`docs/handoffs/00-overview.md`.

## Architecture

One Node process (`src/index.ts`) that:

1. Serves the REST API under `/api` (Fastify) — `src/routes/*`.
2. Runs three independent polling loops (`src/workers/*`), each safe to run standalone:
   - **Safe watcher** (`safeWatcher.ts`) — polls the Safe Transaction Service for Sepolia,
     records `SafeSignatureAdded` / `SafeThresholdReached` / `SourceTransactionExecuted`
     activity, and advances `Policy.status` from `AwaitingApproval` to `ApprovedOnEthereum`.
   - **Attestcoin proof worker** (`attestcoinWorker.ts`) — the permissionless proof worker.
     Fetches a real USC inclusion proof for the Sepolia `PolicyApproved` transaction via
     `@gluwa/usc-sdk`, encodes it, and submits `activatePolicy(...)` to `SafeRootPolicyExecutor`
     on Creditcoin CC3 from the worker wallet. See "Attestcoin/USC integration" below.
   - **Chain indexer** (`chainIndexer.ts`) — polls Creditcoin CC3 for `PolicyActivated`,
     `ActionExecuted`, `GuardianPaused`, plus failed/reverted `executeAction` attempts (decoded
     from block transactions whose receipt status is `0`), and keeps `Action.state` /
     `Policy.status` / the activity trail in sync. Also sweeps policies past `expiryTime` to
     record `PolicyExpired`.

All three loops are started from `src/workers/index.ts` and share one Postgres connection and one
set of ethers providers (`src/chain/clients.ts`).

## Running locally

```bash
cd backend
cp .env.example .env        # fill in RPC URLs / worker key, see below
docker compose up -d        # local Postgres
npm install                 # from repo root also works (npm workspaces)
npx prisma migrate deploy   # applies the committed migration in prisma/migrations
npm run seed                # seeds the one verified Integration row
npm run dev                 # tsx watch src/index.ts, listens on :4000
```

Production build: `npm run build && npm start`.

Useful scripts: `npm run typecheck`, `npm run prisma:studio`, `npm run prisma:migrate` (creates a
new migration from schema changes during development).

## Environment variables

See `.env.example` for the full list with defaults. The required ones with no safe default:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `ETHEREUM_SEPOLIA_RPC_URL` | Read-only RPC for Sepolia (Safe watcher reads receipts via this if ever needed; USC evidence timing) |
| `WORKER_WALLET_PRIVATE_KEY` | Funded Creditcoin CC3 testnet wallet that submits `activatePolicy`. **Never committed, never logged, never returned by any API response.** |

Everything else has a documented default (Safe Transaction Service base URL, Creditcoin CC3 RPC,
USC prover URL, poll intervals).

## Deployment artifact contract (`/contracts/deployments.json`, `/contracts/abi/*.json`)

`src/chain/deployments.ts` reads `../contracts/deployments.json` and `../contracts/abi/*.json`
relative to this package (the npm workspace sibling), exactly per `00-overview.md` §5.4. **As of
this writing those files do not exist yet** (Smart Contracts' work was still in progress in
`/contracts` when this was built — `contracts/contracts/*.sol` exist but no compiled
`deployments.json`/`abi` output yet). Until they appear, the loader falls back to:

- `src/chain/fallbackAbi.ts` — hand-written ABI fragments matching the exact function/event/error
  signatures specified in `00-overview.md` §5.2.
- A placeholder fixture deployment (`FIXTURE_DEPLOYMENTS` in `deployments.ts`) with dummy
  `0x000...00N` addresses, purely so the app boots and the REST API is fully testable end to end
  without real contracts.

This is logged loudly on startup (`"Running against placeholder fixture contract addresses..."`).
**No code change is needed once `deployments.json`/`abi` are published** — the loader picks up the
real files automatically on next process start (it checks `fs.existsSync` first). This was
verified against the real, live Creditcoin CC3 RPC and the real Safe Transaction Service during
development (see "What was actually verified" below).

## Attestcoin/USC integration — what's real vs. what's a fallback

This was the one genuinely open integration point flagged in both handoffs. Research findings,
done as the first task per the handoff instructions:

- **`@gluwa/usc-sdk` is real, published, and works.** `docs.creditcoin.org/usc/dapp-builder-infrastructure/usc-sdk`
  now resolves (it 404'd at planning time), and the npm package `@gluwa/usc-sdk@0.18.0` is a real,
  actively maintained TypeScript SDK. `src/usc/attestcoinClient.ts` uses it directly:
  - `chainInfo.PrecompileChainInfoProvider` (reads the `ChainInfo` precompile at
    `0x00...0fd3` on Creditcoin CC3) to resolve Ethereum Sepolia's USC `chainKey` dynamically —
    **verified live**: this returned `chainKey = 1` against the real CC3 testnet RPC during
    development, no hardcoded chain key anywhere.
  - `proofProvider.service.ProofBuilder` to fetch a real inclusion proof
    (`{chainKey, headerNumber, txBytes, merkleProof, continuityProof}`) for a given Ethereum
    Sepolia transaction hash from the hosted prover service — **verified live**: the default
    prover URL `https://prover.cc3-testnet.creditcoin.network` responded with a real attested
    height for chain key 1 during development.
  - `blockProver.PrecompileBlockProver` is wired in (imported, ready to use for an off-chain
    pre-flight `verifySingle` check) but not yet exercised end to end for lack of a real Sepolia
    `PolicyApproved` transaction hash to prove.

- **The one thing that is still genuinely undetermined**: exactly what bytes format
  `SafeRootPolicyExecutor.activatePolicy`'s `attestcoinProof` parameter expects, because
  `IAttestcoinVerifier`'s Solidity-side implementation is owned by the Smart Contracts role and
  wasn't published as of this build. `encodeUscProof` in `attestcoinClient.ts` ABI-encodes the raw
  USC proof tuple (`chainKey, headerNumber, txBytes, merkleProof, continuityProof`) as the
  documented, best-guess default — the natural shape for a Solidity verifier that itself calls the
  `BlockProver` precompile's `verify(...)` on-chain. **This is the one seam to double-check once
  `/contracts/abi/SafeRootPolicyExecutor.json` is published** — if the real `IAttestcoinVerifier`
  expects a different encoding, only `encodeUscProof` needs to change, nothing else in the worker.

- **Interim fallback mode**, for the scenario where Smart Contracts had to ship a non-real
  verifier: set `ATTESTCOIN_MODE=interim` and `ATTESTCOIN_INTERIM_ATTESTOR_PRIVATE_KEY`.
  `src/usc/interimAttestor.ts` then signs the expected `PolicyApproved` event data directly
  (`ecrecover`-style digest signature, documented in that file as
  `SAFEROOT_INTERIM_ATTESTATION_V1`) instead of fetching a real USC proof. This is clearly labeled
  in logs, in `technicalDetails.mode` on every `AttestcoinEvidenceAvailable` /
  `PolicyVerifiedOnCreditcoin` activity event, and here in this README — **it is never silently
  used**; `ATTESTCOIN_MODE` defaults to `usc` (the real path).

## What was actually verified end to end during this build

With a local Postgres, no real contracts deployed yet:

- Full migration applies cleanly (`prisma/migrations/20260902201328_init`).
- `POST /policies` → `PATCH /policies/:id` (rejected once non-Draft, confirmed) →
  `POST /policies/:id/link-safe-tx` (status moves `Draft → AwaitingApproval`, actions
  `Draft → Waiting`, `SubmittedToSafe` activity recorded) → `GET /policies` (correctly grouped
  under `needsAttention`) → `GET /policies/:id` → `GET /activity`.
- Safe watcher polled the real `https://safe-transaction-sepolia.safe.global/api/v1` for a
  (nonexistent, by construction) `safeTxHash` and handled the 404 gracefully without crashing,
  confirming the base URL and client are correctly wired against the live service.
- Chain indexer connected to the real Creditcoin CC3 RPC (`https://rpc.cc3-testnet.creditcoin.network`),
  fetched the current block number, and persisted its `WorkerCursor` — confirmed via a direct DB
  query.
- USC SDK chain-key resolution and prover-service reachability, as described above.

Not yet exercised end to end (blocked on `/contracts/deployments.json` and a real funded Safe/
worker wallet, both outside this role's scope): a real `activatePolicy` submission, a real
`executeAction`/tampered-`executeAction` pair, and a real `guardianPause`. The code paths for all
three are implemented and typecheck cleanly against the documented interfaces; wiring in the real
deployment is expected to be a config change (`.env` + `deployments.json` appearing), not a code
change.

## Schema deviations from the literal field list in `00-overview.md` §5.1

All additions are additive, nullable, and non-breaking. Reasoning for each, since the literal
field list didn't fully cover every acceptance criterion:

- `Policy.supersededById`, `Policy.verificationFailureReason`, `Policy.verificationFailedAt`,
  `Policy.lastActivationAttemptAt` — the state table requires a `Superseded` status and requires
  the Verify screen to "distinguish waiting from failure" (UX §4), but the fixed `ActivityType`
  enum has no failure-flavored variant and the fixed `PolicyStatus` enum has no `Failed` value.
  Rather than invent a new status or activity type, failures are recorded as `ActionBlocked`
  activity events (with `actionId = null` for policy-level failures) *and* surfaced as a
  queryable flag on the policy row, which is what `GET /policies`' `needsAttention` grouping and
  `computeDisplayStatus` (`src/domain/status.ts`) key off.
- `Policy.guardianAddress`, `Policy.guardianPauseReason`, `Policy.guardianPausedAt` — denormalized
  from the `GuardianPaused` event/activity so the policy list and detail views don't need a second
  query to show the pause banner everywhere it's required (PRD Feature 11).
- `WorkerCursor` — a one-row-per-worker table so the chain indexer polls Creditcoin CC3 by
  incremental block range instead of re-scanning from genesis every tick.

`Policy.status` is stored as the last real workflow stage a worker explicitly set (`Draft` through
`Active`, plus terminal `Paused`); `Expired`, `Completed`, and `Superseded` are derived at read
time by `computeDisplayStatus` applying the exact PRD §11 state-priority rule. This keeps a single
write path per transition while still satisfying the "compute the user-facing status by priority"
requirement.

## `GET /policies` grouping — resolved ambiguity

`02-backend-services.md`'s own grouping description lists "paused" in both `needsAttention`
("guardian pause active") and `history` ("completed/expired/paused/superseded"). Since MVP has no
guardian-resume path, a paused policy is permanently actionable-looking, so this build puts
`Paused` policies in `needsAttention` only (never duplicated into `history`). `Draft` policies
(not mentioned in either bucket list) are also placed in `needsAttention`, since an unfinished
draft is exactly the kind of thing an author needs to act on next. Documented here per the
handoff's instruction to flag resolved ambiguities.

## Rejection reason mapping

`src/domain/rejectionReasons.ts` is the single lookup table from Solidity custom error name to one
of the exact 15 PRD Feature 10 strings, as required. A few contract errors (`ActionNotFound`,
`NotYetEligible`, `ActionExpired`, `UnsupportedSourceChain`, `PolicyNotYetValid`,
`PolicyAlreadyExpired`) don't have a 1:1 named PRD string; each is mapped to its closest existing
string (documented inline via the table itself) rather than inventing new vocabulary outside the
fixed 15-item list.

## Deviations from the handoff, with reasoning

- **ethers v6, not viem, for all backend chain interaction.** `00-overview.md` §4 mandates `viem`
  for the *Frontend* only; nothing pins Backend to a chain library. `@gluwa/usc-sdk` is built on
  ethers v6 (`JsonRpcProvider`, `Wallet`, `Contract` are its own public API surface), so using
  ethers throughout avoids running two chain libraries side by side for one process.
- **`@fastify/cors`, `ethers`, `axios`, `pino`/`pino-pretty` added as dependencies.** All are
  either a direct, unavoidable consequence of the two explicitly-required integrations
  (`@gluwa/usc-sdk` depends on `ethers`/`axios`; Fastify's own logger is pino) or a minimal,
  clearly-scoped addition (`@fastify/cors`, since the API is consumed cross-origin by a separate
  Next.js dev server). None of these are a new architectural choice.
- **`WorkerCursor` table and a handful of nullable `Policy` fields** — see "Schema deviations"
  above.

## What's stubbed / pending

- **Contract addresses and ABI**: fixture until `/contracts/deployments.json` is published (see
  above) — no code change needed once it lands, only remove/ignore the startup warning.
- **`encodeUscProof`'s exact byte layout**: best-guess default pending the real
  `IAttestcoinVerifier` ABI, isolated to one function (see "Attestcoin/USC integration" above).
- **Interim attestation mode**: implemented and available (`ATTESTCOIN_MODE=interim`) but not the
  default, and not needed unless Smart Contracts ships a non-USC interim verifier.
