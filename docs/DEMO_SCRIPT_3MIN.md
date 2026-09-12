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

Every "you click" instruction below names the **exact button/link text as it appears in the
live app** (verified against the actual component code, not guessed) — so you know precisely
where your cursor goes at each timestamp.

| Time | Screen / Component | Exact click(s) | What you say |
|---|---|---|---|
| **0:00–0:20** | App home / `/policies` | Just have the page open, no click yet. Go straight to `https://frontend-production-78b3.up.railway.app/policies`. | "Safe multisig is the standard for DAO treasuries — but its authority stops at the chain it lives on. Moving an approved action to another chain usually means a bridge, or a separate trusted signer. SafeRoot removes both: one Safe approval on Ethereum, verified trustlessly via Creditcoin's Attestcoin oracle, then executed with hard constraints on Creditcoin." |
| **0:20–1:10** ⭐ | `/policies` → **History** section → Policy A detail page | 1. On `/policies`, scroll down to the **"History"** section (completed policies live here, not at the top). 2. Click the row **"Q4 Contributor Grant — Production Demo"** (badge reads `Completed`). 3. On the detail page, look at the **"Policy activity"** section near the bottom — it already shows the last 6 events inline, no extra click needed. | "This isn't simulated — this policy already executed for real, across two chains." Read the timeline entries out loud, fast: "Approved by the Safe on Ethereum Sepolia... Attestcoin evidence available... verified on-chain on Creditcoin... action executed — 2,500 MockUSDC actually sent." |
| **1:10–1:30** | Same page → block explorer tab | Click the **`View full activity`** link (top-right of the "Policy activity" section) if you want the full list with tx-hash links, or switch straight to your pre-opened Etherscan/Blockscout tab (see §2). | "Every step is a real transaction you can verify yourself — no trusted relayer in between, just a cryptographic proof." |
| **1:30–2:00** | `/select-safe` → `/policies/new` | 1. Go to `/select-safe`. 2. Paste `0xf4b6a941B0bB4699cba45970cBf7c476ccE49dDd` into the **"Safe address on Ethereum Sepolia"** field. 3. Click **"Look up Safe"**. 4. Point at the **Owners** / **Threshold** numbers that appear, click **"View owners"** to expand the list. 5. Click **"Continue with this Safe"** — this navigates to the Create Policy form. 6. On that form, click **"Add action"** next to one template to show its parameter fields (target contract, function, exact amount, expiry). Do **not** click "Review policy". | "Creating a policy means locking in exact constraints — which contract, which function, which parameters, when it expires — all bound to a single Safe approval. I won't finish this one on camera since Attestcoin attestation takes 20–30 minutes — that's why I already have a completed one to show." |
| **2:00–2:45** ⭐⭐ (most important differentiator) | Policy B detail page → **Protected** page | 1. Go back to `/policies`, open the **"Ready"** section, click **"Q4 Treasury Policy — Live Demo"**. 2. On its detail page, click the link **"See how tampered actions are blocked"** — this is the natural in-app path to `/protected`, don't type the URL. 3. On the Protected page, find the card **"Level 3 — Adversarial control"**. The **"Submitted amount"** field is pre-filled with `100000`, already different from the approved `1,200` — you don't need to type anything. 4. Click the red **"Attempt execution"** button. 5. Point at the right-hand **"Altered action"** panel flipping to **"Blocked — no funds moved"**, and the error callout naming the specific revert reason underneath. | "Here's the part that matters: this isn't a UI check. This is the smart contract itself refusing the call. Even with a valid Attestcoin proof, even calling the contract directly, an attacker can't change a single byte of what the Safe approved." Read the on-screen error name out loud (e.g. `AmountExceedsApproval` / `CalldataMismatch`, whichever the live call returns). |
| **2:45–3:00** | Cut back to `/policies` | Static frame, no new clicks | "One Safe approval. Trustless cross-chain verification via Attestcoin — no bridge. And execution that rejects anything that deviates. Live right now on Creditcoin CC3 and Ethereum Sepolia — code's on GitHub." |

> **Wallet note for the tamper demo:** clicking "Attempt execution" fires a real
> `executeAction` call through a connected wallet (MetaMask/Rabby) on Creditcoin CC3 — it is
> **not** a mocked button. Have your wallet already connected and switched to CC3
> (chainId `102031`) before recording this segment, so the network-switch/connect popup
> doesn't eat screen time. Approve the wallet's signature prompt on camera — that's part of
> what proves it's a real transaction, not a simulation.

---

## 2. Exact data to have ready in tabs before you hit record

Open these **before** recording so you never wait on-screen:

1. **Tab 1 — `/policies` list**
   `https://frontend-production-78b3.up.railway.app/policies`
   (scroll once before recording so you know exactly where Policy A sits in **History** and
   Policy B sits in **Ready** — don't hunt for them on camera)
2. **Tab 2 — Sepolia Etherscan**, pre-searched for tx `0xbb32e12051c24204d7d87d4d8b174ab6eab36955e222132b42207d69fc09695b`
3. **Tab 3 — Creditcoin CC3 Blockscout**, pre-searched for tx `0xa81e808705a4ea324bdf2b31580f470fcec3bdcfb4e28e2a3de28d0a3218d8db`
4. **Wallet extension** already open, connected, and switched to **Creditcoin CC3**
   (chainId `102031`, RPC `https://rpc.cc3-testnet.creditcoin.network`) — needed for the
   "Attempt execution" click in the tamper demo to fire a real transaction without a delay.

The tamper demo needs **no typing**: the Protected page's "Submitted amount" field already
defaults to `100000`, which is well above Policy B's approved `1,200` — just click
**"Attempt execution"**.

---

## 3. Component-by-component cut list

If you'd rather record in short clips and edit together, here's the minimal shot list:

1. **Shot A** — `/policies`, "History" section, Policy A row with `Completed` badge (3–4s)
2. **Shot B** — Policy A detail page, "Policy activity" section fully visible (15–20s)
3. **Shot C** — Pre-opened explorer tab showing a confirmed tx (8–10s)
4. **Shot D** — `/select-safe`, Safe card after "Look up Safe" — owners/threshold populated (8–10s)
5. **Shot E** — `/policies/new`, one action template expanded via "Add action" (10–12s)
6. **Shot F** — Policy B's Protected page, "Attempt execution" click → wallet signature →
   "Blocked — no funds moved" panel with the error callout visible (15–20s)
7. **Shot G** — Closing frame on `/policies` while you deliver the summary line (10s)

Total raw footage needed: ~70–85s of actual screen action; the rest is voiceover pacing —
record it slightly loose and trim in the edit, since 3:00 is a hard ceiling for most
hackathon submission forms.

---

## 4. What to explicitly NOT do in a 3-minute cut

- Don't wait for a real Attestcoin attestation on camera (20–30 min) — always use the
  pre-completed Policy A for that story beat.
- Don't demo the full multisig signing flow (multiple wallet popups) — mention it exists,
  don't perform it live; it eats 30–60s for no new information.
- Don't read every row of the adversarial-test table — the Protected page's "Attempt
  execution" button only demos the amount-tamper case; mention the other nine scenarios
  (wrong target, wrong function selector, replay, expiry, etc.) verbally instead of trying
  to click through them — the live UI doesn't expose controls for those, they're proven in
  the contract test suite (see `docs/DEMO_GUIDE.md` §4 for the full verified table).
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
- **Wallet popup doesn't appear after "Attempt execution"** → check the wallet is on
  Creditcoin CC3 (chainId `102031`); the app will trigger a network-switch prompt first if
  it isn't, which costs a few extra seconds but is fine to leave in the cut.
