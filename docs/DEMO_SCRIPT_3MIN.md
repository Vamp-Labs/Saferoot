# SafeRoot Policy — 3-Minute Demo Video Script (English)

Everything referenced here is **live on real testnets** (Ethereum Sepolia + Creditcoin CC3).
No mocks, no fixtures. This is a tight, timed cut of the full walkthrough in
`docs/DEMO_GUIDE.md` — use this file when you're recording, use that one for reference/Q&A prep.

**Total runtime target: 3:00.** Practice it once with a stopwatch before the real take — this
script has almost no slack.

---

## 0. One-line pitch (memorize this, say it early)

> "SafeRoot lets a Safe multisig on Ethereum approve an action once, and have it execute
> trustlessly on Creditcoin — verified by Attestcoin's oracle, not a bridge."

---

## 1. What to show, second by second

| Time | Screen / Component | What you do | What you say |
|---|---|---|---|
| **0:00–0:20** | Landing page or blank browser (talking head / voiceover over UI) | Open the app home: `https://frontend-production-78b3.up.railway.app` | "Safe multisig is the standard for DAO treasuries — but its authority stops at the chain it lives on. Moving an approved action to another chain usually means a bridge, or a separate trusted signer. SafeRoot removes both: one Safe approval on Ethereum, verified trustlessly via Creditcoin's Attestcoin oracle, then executed with hard constraints on Creditcoin." |
| **0:20–1:10** ⭐ | `/policies` list → click into **Policy A** (Completed) | 1. Show the `/policies` page, point at the card **"Q4 Contributor Grant — Production Demo"** with status `Completed`. 2. Click in. 3. Scroll to the **activity timeline**. | "This isn't simulated — this policy already executed for real, across two chains." Read the timeline out loud, fast: "Approved by the Safe on Ethereum Sepolia... attested by Attestcoin... verified on-chain on Creditcoin... action executed — 2,500 MockUSDC actually sent." |
| **1:10–1:30** | Click a tx hash in the timeline → opens block explorer | Click the **`SourceTransactionExecuted`** or **`ActionExecuted`** tx hash link, let the explorer tab open (Sepolia Etherscan / Creditcoin Blockscout) | "Every step is a real transaction you can verify yourself — no trusted relayer in between, just a cryptographic proof." |
| **1:30–2:00** | `Select Safe` flow → `Create Policy` form | 1. Click **"Select Safe"**, paste `0xf4b6a941B0bB4699cba45970cBf7c476ccE49dDd`. 2. Point out owners + threshold auto-loaded from the real Safe Transaction Service. 3. Open **"Create Policy"**, pick an action template, show the parameter fields (target contract, function, exact amount, expiry). | "Creating a policy means locking in exact constraints — which contract, which function, which parameters, when it expires — all bound to a single Safe approval. I won't finish this one on camera since Attestcoin attestation takes 20–30 minutes — that's why I already have a completed one to show." |
| **2:00–2:45** ⭐⭐ (most important differentiator) | **Policy B** (Active, unexecuted actions) → `/protected` execute page | Open Policy B's protected execute page, submit `executeAction` with a **tampered parameter** (e.g. amount changed from 1,200 → 120,000 USDC, or swap the recipient). Show the contract **reject** it. | "Here's the part that matters: this isn't a UI check. This is the smart contract itself refusing the call. Even with a valid Attestcoin proof, even calling the contract directly, an attacker can't change a single byte of what the Safe approved." Read the error on screen out loud: `CalldataMismatch`. Optionally show a second one (swap target contract → `TargetMismatch`, or swap function selector → `FunctionNotAllowed`). |
| **2:45–3:00** | Cut back to app home or policy list | Static frame, no new clicks | "One Safe approval. Trustless cross-chain verification via Attestcoin — no bridge. And execution that rejects anything that deviates. Live right now on Creditcoin CC3 and Ethereum Sepolia — code's on GitHub." |

---

## 2. Exact data to have ready in tabs before you hit record

Open these **before** recording so you never wait on-screen:

1. **Tab 1 — Policy A (Completed)**
   `https://frontend-production-78b3.up.railway.app/policies/0x46ed58b5e14e07ad6300248a68e9064db0cd67efe971351b7cb2c6194f1e6a0b`
2. **Tab 2 — Policy B (Active, for live tamper demo)**
   `https://frontend-production-78b3.up.railway.app/policies/0x1421453ee798bf10d2cd06d8dab1caec484ad1734c8bbc5d5f807778ec0c7f41/protected`
3. **Tab 3 — Sepolia Etherscan**, pre-searched for tx `0xbb32e12051c24204d7d87d4d8b174ab6eab36955e222132b42207d69fc09695b`
4. **Tab 4 — Creditcoin CC3 Blockscout**, pre-searched for tx `0xa81e808705a4ea324bdf2b31580f470fcec3bdcfb4e28e2a3de28d0a3218d8db`
5. **Tab 5 — `/policies` list** (for the Select-Safe / Create-Policy segment)

Have the tamper value ready to paste (don't type it live, it burns seconds):
- Change **amount**: `1200` → `120000`
- Or change **recipient** to any other address you control

---

## 3. Component-by-component cut list

If you'd rather record in short clips and edit together, here's the minimal shot list:

1. **Shot A** — `/policies` list, Policy A card visible with `Completed` badge (3–4s)
2. **Shot B** — Policy A detail page, timeline fully visible, scroll from top to `ActionExecuted` (15–20s)
3. **Shot C** — Click a tx hash, explorer page loads showing confirmed tx (8–10s)
4. **Shot D** — Select Safe modal, owners/threshold populated (8–10s)
5. **Shot E** — Create Policy form, parameter fields visible (10–12s)
6. **Shot F** — Policy B `/protected` page, tampered submission, error banner showing `CalldataMismatch`/`TargetMismatch` (15–20s)
7. **Shot G** — Closing frame on `/policies` or landing page while you deliver the summary line (10s)

Total raw footage needed: ~70–85s of actual screen action; the rest is voiceover pacing —
record it slightly loose and trim in the edit, since 3:00 is a hard ceiling for most
hackathon submission forms.

---

## 4. What to explicitly NOT do in a 3-minute cut

- Don't wait for a real Attestcoin attestation on camera (20–30 min) — always use the
  pre-completed Policy A for that story beat.
- Don't demo the full multisig signing flow (multiple wallet popups) — mention it exists,
  don't perform it live; it eats 30–60s for no new information.
- Don't read every row of the adversarial-test table — pick **one** tamper case, show its
  specific error, and say "ten more scenarios like this are covered, all in the test suite."
- Don't explain Attestcoin's internal mechanics (attestors, continuity proofs, etc.) beyond
  one sentence — save that for Q&A, not the pitch.

---

## 5. 30-second fallback (if a judge asks "give me the 10-second version")

> "One approval on your Ethereum Safe. A trustless proof via Creditcoin's Attestcoin oracle —
> no bridge, no new trusted signer. An execution contract on Creditcoin that only accepts
> exactly what was approved, and rejects everything else with a specific on-chain error.
> It's live on testnet right now, not a mockup."

---

## 6. If something breaks mid-recording

- **Page won't load / blank screen** → reload once; if it persists, cut to Policy A tab
  (known-good, already tested) and continue from there — don't debug on camera.
- **Explorer tx page slow to load** → have the explorer tab already open and pre-searched
  (see section 2) so you never wait on a network fetch during the take.
- **Tamper demo doesn't show the expected error** → fall back to the pre-verified table in
  `docs/DEMO_GUIDE.md` section 4 and just narrate over a still frame of one confirmed error.
