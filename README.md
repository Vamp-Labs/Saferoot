# SafeRoot Policy

**One Safe approval on Ethereum. Trustless execution on Creditcoin. No bridge.**

SafeRoot lets a Gnosis **Safe** multisig on Ethereum Sepolia approve a bounded set of
actions once, then have that approval verified **trustlessly** — via Creditcoin's
**Attestcoin (USC)** oracle and the native `0xFD2` Query Verifier precompile — and executed
on **Creditcoin CC3** by a contract that rejects anything that deviates from what was
signed.

🔴 **Live demo:** https://frontend-production-78b3.up.railway.app
▶️ **Demo video:** https://youtu.be/6N_fVw4CcgM
📄 **Whitepaper (PDF, viewable in-app):** https://frontend-production-78b3.up.railway.app/docs
📄 **Hackathon submission writeup:** [`docs/HACKATHON_SUBMISSION.md`](docs/HACKATHON_SUBMISSION.md)
🎬 **Demo recording script:** [`docs/DEMO_SCRIPT_3MIN.md`](docs/DEMO_SCRIPT_3MIN.md)
📖 **Full demo/reference guide:** [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md)

---

## The problem

Safe multisig is the de-facto standard for DAO and protocol treasuries — but its authority
stops at the chain it's deployed on. The moment a team wants an approved action to affect
*another* chain, the usual answers are a trusted bridge or a separate signer set on the
destination chain. Both add a new party the treasury has to trust, and both have been the
root cause of some of the largest exploits in crypto.

## The solution

SafeRoot doesn't move assets across chains and doesn't introduce a new signer system. It
moves **proof that a Safe approval happened**, verified cryptographically:

1. A Safe on **Ethereum Sepolia** approves a *policy* — a bounded set of actions (which
   contract, which function, exact parameters, a time window, an expiry) — by calling
   `PolicyRegistry.registerPolicy(...)`.
2. **Attestcoin**, Creditcoin's decentralized oracle, attests that this transaction really
   happened on Ethereum and produces a cryptographic inclusion proof.
3. `SafeRootPolicyExecutor` on **Creditcoin CC3** verifies that proof through Creditcoin's
   native `0xFD2` Query Verifier precompile — no relayer or bridge operator needs to be
   trusted — and activates the policy.
4. Anyone can then call `executeAction(...)`. The contract independently re-checks the
   target contract, function selector, calldata, and value against what the Safe approved.
   Anything that doesn't match — a different amount, a different recipient, a swapped
   function, a replay — is rejected with a specific on-chain error before any funds move.

## What makes it real, not a mockup

- Two real smart contracts deployed on two real testnets (addresses below), not local-only.
- A production policy (`0x46ed58b5...`) has genuinely gone through the full lifecycle —
  Safe approval → Attestcoin attestation → on-chain verification → action execution — with
  verifiable transaction hashes on both chains.
- 38 Hardhat test cases (`contracts/test/`) covering the executor, registry, and Attestcoin
  verifier adapter, including adversarial/tampering scenarios.
- A live, deployed backend + frontend on Railway, backed by a real Postgres database and a
  real Safe Transaction Service integration (not fixture data) — see `docs/DEMO_GUIDE.md`
  §7 for the full end-to-end verification run (115/115 checks passing against production).

---

## Architecture
<img width="1448" height="1086" alt="image" src="https://github.com/user-attachments/assets/958ba48d-7208-45a1-b161-66a7aa99a918" />


**Contracts** (`contracts/`)
- `PolicyRegistry.sol` (Sepolia) — the only thing a Safe ever calls. Records an
  approved policy hash + action list as an event; enforces monotonically increasing
  versions per policy.
- `SafeRootPolicyExecutor.sol` (Creditcoin CC3) — verifies the Attestcoin proof, activates
  the policy, and enforces every constraint (target, selector, calldata, value, time
  window, expiry, guardian pause, replay protection, reentrancy guard) on execution.
- `AttestcoinVerifierAdapter.sol` — thin adapter around Creditcoin's `0xFD2` Native Query
  Verifier precompile and the `@gluwa/asc-contracts` proof format.
- `MockUSDC.sol` / `LendingPoolMock.sol` — demo-integration contracts the executor acts on
  (a grant payout and a lending-pool risk parameter, respectively).

**Backend** (`backend/`) — Fastify + Prisma/Postgres. Watches the Safe Transaction Service
for signature progress, requests Attestcoin inclusion proofs via `@gluwa/usc-sdk`, submits
`activatePolicy`/`executeAction` transactions, and serves the REST API the frontend reads.

**Frontend** (`frontend/`) — Next.js 16 + React 19, wagmi/viem for wallet + contract calls,
`@safe-global/protocol-kit` for Safe interaction. Renders the policy lifecycle, an activity
timeline sourced from real on-chain events, and a live adversarial "Protected" page that
submits a tampered `executeAction` call and shows the contract's rejection in real time.

---

## Deployed contracts (testnet, live)

| Contract | Chain | Address |
|---|---|---|
| `PolicyRegistry` | Ethereum Sepolia | `0xEE1920869bfCB8b24C1b5AAE45927E7ad12f07F0` |
| Authority Safe (2-of-3) | Ethereum Sepolia | `0xf4b6a941B0bB4699cba45970cBf7c476ccE49dDd` |
| `SafeRootPolicyExecutor` | Creditcoin CC3 | `0x57dE3c48b747A812fD643900568EA9FbCE6dF7cB` |
| `AttestcoinVerifierAdapter` | Creditcoin CC3 | `0x8964F00624b3aAF3f74d51db2016571dC398374d` |
| `MockUSDC` | Creditcoin CC3 | `0x3773a72021e0f923f58cA02643f0D22936a30303` |
| `LendingPoolMock` | Creditcoin CC3 | `0x80298359FAd5b1ee10f2fd60422E53F55e2e8D45` |

Explorers: [Sepolia Etherscan](https://sepolia.etherscan.io) ·
[Creditcoin CC3 Blockscout](https://creditcoin-testnet.blockscout.com)

## Live deployment (Railway)

| Service | URL |
|---|---|
| Frontend | https://frontend-production-78b3.up.railway.app |
| Backend API | https://backend-production-1ff6f.up.railway.app |

---

## Tech stack

| Layer | Stack |
|---|---|
| Contracts | Solidity 0.8.28, Hardhat, OpenZeppelin 5, `@gluwa/asc-contracts` |
| Backend | Fastify 5, Prisma + Postgres, ethers v6, `@gluwa/usc-sdk`, pino |
| Frontend | Next.js 16, React 19, wagmi 3 / viem 2, `@safe-global/protocol-kit` + `api-kit`, TanStack Query, Tailwind 4 |
| Infra | Railway (Postgres + backend + frontend services), npm workspaces monorepo |

## Repository structure

```
contracts/   Solidity contracts, Hardhat config, deploy scripts, tests
backend/     Fastify REST API, Safe watcher, Attestcoin proof worker, Prisma schema
frontend/    Next.js app (policy lifecycle UI, Safe integration, adversarial demo)
docs/        Hackathon submission writeup, demo scripts and guides
```

## Local development

```bash
npm install                                   # installs all three workspaces

# contracts
npm run compile --workspace=contracts
npm run test --workspace=contracts            # 38 tests: executor, registry, verifier adapter

# backend (needs contracts/.env + backend/.env — see contracts/.env.example)
npm run prisma:generate --workspace=backend
npm run dev --workspace=backend

# frontend (needs frontend/.env.local — see frontend/.env.example)
npm run dev --workspace=frontend
```

Deploying to testnets: `npm run deploy:sepolia --workspace=contracts` then
`npm run deploy:cc3 --workspace=contracts` (writes `contracts/deployments.json`, which the
backend and frontend both read for addresses).

---

## Security model

`SafeRootPolicyExecutor` enforces every one of these on-chain, independent of the caller:

| Guard | Error |
|---|---|
| Only the registered Safe's policy is honored | `SafeMismatch` |
| Only the version the Safe last approved is valid | `StalePolicyVersion` |
| Policy must not have expired | `PolicyExpired` / `PolicyAlreadyExpired` |
| Destination chain must match | `WrongDestinationChain` |
| Executor identity must match | `WrongExecutor` |
| An Attestcoin proof can't be reused | `ProofAlreadyUsed` |
| Only the trusted Sepolia emitter is accepted | `EmitterNotApproved` |
| Target contract must match exactly | `TargetMismatch` |
| Function selector must be pre-allowed | `FunctionNotAllowed` |
| Calldata must match exactly | `CalldataMismatch` |
| Native value can't exceed what was approved | `AmountExceedsApproval` |
| An action can't execute before its window or after expiry | `NotYetEligible` / `ActionExpired` |
| An action can't execute twice | `ActionAlreadyExecuted` |
| A paused policy blocks execution | `ExecutorPaused` |
| Guardian pause is guardian-only | `NotGuardian` |
| Reentrancy is blocked | OpenZeppelin `ReentrancyGuard` |

See `docs/DEMO_GUIDE.md` §4 for each of these verified live against the deployed contract.

## License

MIT — see individual package `package.json` files.
