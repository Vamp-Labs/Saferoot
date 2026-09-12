# SafeRoot Policy — Hackathon Submission

**Event:** BUIDL CTC 2026 Fall (Creditcoin)
**Repo:** https://github.com/Vamp-Labs/Saferoot
**Live app:** https://frontend-production-78b3.up.railway.app
**Demo video script:** [`DEMO_SCRIPT_3MIN.md`](DEMO_SCRIPT_3MIN.md) · **Full walkthrough:** [`DEMO_GUIDE.md`](DEMO_GUIDE.md)

---

## The hook

> Your DAO's treasury trusts one thing: your Safe multisig on Ethereum. The moment you want
> that approval to *do* something on another chain, you're suddenly trusting something new —
> a bridge, a relayer, a second set of signers. That new thing is usually where the money
> disappears.
>
> **SafeRoot makes your existing Safe the only thing you ever have to trust — on Creditcoin
> too.** One approval. A trustless proof. A contract that refuses to execute anything that
> wasn't exactly, byte-for-byte, what your Safe signed.

---

## The problem

Cross-chain treasury operations today force a DAO into a bad trade-off:

- **Bridge the assets** — now a bridge contract or its operators are a single point of
  failure holding your funds. Bridges are, by dollar value, the single most exploited
  category of smart contract in crypto history.
- **Deploy a second signer set on the destination chain** — now you're running and
  trusting *two* multisigs instead of one, doubling your key-management surface and your
  governance overhead.
- **Use a centralized relayer/custodian** — now a single company or server is a trusted
  intermediary between your governance decision and the funds moving.

None of these actually need to exist. A DAO doesn't need to move assets cross-chain to act
cross-chain — it needs the *destination chain* to be convinced, cryptographically, that an
approval genuinely happened on the source chain. That's a proof problem, not a bridging
problem.

## The solution

SafeRoot treats a Safe approval as a piece of state that gets **proven**, not **relayed**.

1. **Approve once, on the chain you already trust.** A Safe on Ethereum Sepolia calls
   `PolicyRegistry.registerPolicy(...)` with an explicit, bounded *policy*: which contract
   on Creditcoin, which function, exact calldata, a value cap, an activation window, and an
   expiry. This is an ordinary Safe transaction — no new module, no new signer, nothing
   installed on the Safe itself.
2. **Prove it happened, trustlessly.** Creditcoin's own decentralized oracle, **Attestcoin
   (USC)**, builds consensus over Ethereum's history and produces a cryptographic inclusion
   proof for that transaction. Nobody has to vouch for it — it's verified against
   Attestcoin's attestor consensus.
3. **Verify the proof on-chain, natively.** `SafeRootPolicyExecutor` on Creditcoin CC3 hands
   that proof to Creditcoin's **native `0xFD2` Query Verifier precompile** — a chain-level
   primitive, not a third-party oracle contract — and only activates the policy if the
   precompile confirms it.
4. **Execute under hard, on-chain constraints.** Anyone can call `executeAction(...)` — the
   caller doesn't need to be trusted, because the *contract* re-derives and checks every
   parameter against what the Safe approved. Change the amount, the recipient, the target,
   the function, replay an old call, call before the window opens — every single deviation
   is rejected with a specific, named on-chain error before any state changes.

The result: a DAO's Ethereum Safe becomes the source of authority for actions on
Creditcoin, with **zero new trusted parties** in between.

---

## Why this fits Creditcoin specifically

This isn't a generic "cross-chain messaging" demo retrofitted onto Creditcoin — it's built
around what makes Creditcoin's stack distinct:

- **Attestcoin / USC** is Creditcoin's answer to trustless cross-chain data — SafeRoot is a
  direct, real integration of it (`@gluwa/usc-sdk` on the backend, `@gluwa/asc-contracts`
  proof types on-chain), not a mock of the interface.
- The **native `0xFD2` Query Verifier precompile** is verified against directly in
  `AttestcoinVerifierAdapter.sol` — proof verification happens at the chain level, which is
  exactly the trust-minimization story Creditcoin is built to enable.
- Getting this working surfaced a real, subtle integration detail worth calling out: **the
  Attestcoin `chainKey` for a source chain is not the same as its EVM `chainId`** (Sepolia's
  EVM chainId is `11155111`; its Attestcoin chainKey is `1`). We hit this as a real
  production bug — a misconfigured adapter caused every proof verification to revert with
  `UnsupportedSourceChain` until we root-caused it by decoding the raw revert data. It's
  documented here because it's exactly the kind of trap a team using Attestcoin for the
  first time will hit.

---

## What's actually live (not a mockup)

| Claim | Evidence |
|---|---|
| Real contracts on two real testnets | Addresses in [`README.md`](../README.md#deployed-contracts-testnet-live), verifiable on Etherscan / Blockscout |
| A policy has genuinely completed its full lifecycle | Policy `0x46ed58b5...` — Safe approval, Attestcoin attestation, on-chain verification, and a real 2,500 MockUSDC payout, each step with its own tx hash (see `DEMO_GUIDE.md` §2) |
| The security model is enforced by the contract, not the UI | 10 adversarial scenarios (tampered amount, recipient, target, selector, replay, expiry, unauthorized pause, unauthorized config change, etc.) verified directly against the live contract — see `DEMO_GUIDE.md` §4 |
| The whole stack is deployed and reachable | Frontend + backend + Postgres running on Railway, not localhost |
| It's been tested end-to-end, not just "it compiles" | 38 Hardhat contract tests + 115 E2E checks (API/SSR, browser interaction, on-chain adversarial, Safe-selection regression) run against the live production deployment — see `DEMO_GUIDE.md` §7 |
| Bugs found were real production bugs, and they're documented | Three bugs found via genuine E2E testing (response-shape mismatches causing 500s, and a React infinite-render-loop crash after selecting a Safe) are listed with root cause and fix in `DEMO_GUIDE.md` §7 — we're not hiding that this got debugged for real |

---

## Architecture at a glance

```
Safe (Ethereum Sepolia)  →  PolicyRegistry.registerPolicy()
        │
        ▼
Attestcoin (USC oracle)  →  inclusion proof for that tx
        │
        ▼
AttestcoinVerifierAdapter  →  verified via Creditcoin's native 0xFD2 precompile
        │
        ▼
SafeRootPolicyExecutor (Creditcoin CC3)
        │  activatePolicy()  — proof accepted, policy goes live
        │  executeAction()   — re-checks target/selector/calldata/value, executes or reverts
        ▼
MockUSDC / LendingPoolMock  — the actual integration the policy acts on
```

Off-chain, a Fastify backend watches the Safe Transaction Service for signature progress,
requests Attestcoin proofs, and submits the on-chain transactions; a Next.js frontend
renders the full lifecycle and a live "attempt a tampered execution" control that fires a
real transaction and shows the rejection in real time. Full breakdown in
[`README.md`](../README.md#architecture).

---

## What we'd build next

- **Guardian rotation & multi-guardian quorum** — today a single guardian address can pause;
  a natural extension is a small guardian committee with its own threshold.
- **Policy templates as a public registry** — let any Creditcoin protocol publish an
  "integration" (target + allowed selectors) so more DAOs can point a policy at it without
  custom backend wiring.
- **Batch policies** — one Safe approval authorizing a sequence of dependent actions across
  multiple Creditcoin contracts, not just parallel independent actions.
- **Mainnet hardening** — formal audit of `SafeRootPolicyExecutor`'s replay/expiry/reentrancy
  boundaries before any real-value mainnet deployment.

---

## Team notes for judges

- Everything in this document and in `README.md` is verifiable directly: contract addresses
  are checkable on-chain, the app is live, and the demo video follows a script that only
  references transactions we've already confirmed on-chain (`DEMO_SCRIPT_3MIN.md`).
- `DEMO_GUIDE.md` §7 contains the raw pass/fail counts from our final verification pass and
  an honest list of the bugs that testing caught — we'd rather show that the system was
  actually exercised than present a suspiciously clean changelog.
