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

Every step below is one of three explicit actions:
- **POINT AT** — hold the cursor / mouse-highlight over this element while you talk, don't click it
- **CLICK** — actually click this exact element, it navigates or changes state
- **SAY** — the line to speak while that element is on screen

Every label named is the **exact on-screen text**, verified against the live component code
(not guessed), so you know precisely where the cursor goes at each timestamp.

### 0:00–0:20 — Cold open

- Have `https://frontend-production-78b3.up.railway.app/policies` already loaded, no click yet.
- **SAY:** "Safe multisig is the standard for DAO treasuries — but its authority stops at the
  chain it lives on. Moving an approved action to another chain usually means a bridge, or a
  separate trusted signer. SafeRoot removes both: one Safe approval on Ethereum, verified
  trustlessly via Creditcoin's Attestcoin oracle, then executed with hard constraints on
  Creditcoin."

### 0:20–1:10 ⭐ — Prove a real policy already executed

1. **POINT AT** the **"History"** section heading on `/policies` (scroll down — completed
   policies live here, not at the top of the page).
2. **CLICK** the row **"Q4 Contributor Grant — Production Demo"** (its badge reads `Completed`).
3. **POINT AT** the summary card at the top of the detail page — specifically the
   **"Maximum transfer"** field (reads `2,500 MockUSDC`) and the **"Authority Safe"** field
   (an address). This card is visible immediately, no scroll needed.
   **SAY:** "This isn't simulated — this policy already executed for real, across two chains."
4. Scroll down to the **"Policy activity"** section heading.
5. **POINT AT** each event row top-to-bottom, reading its bold title text out loud (don't
   click yet): `Policy drafted` → `Submitted to Safe` → `Safe signature added` (×2) →
   `Safe threshold reached` → `Source transaction executed` → `Attestcoin evidence available`
   → `Policy verified on Creditcoin` → `Action executed`.
   **SAY:** "Approved by the Safe on Ethereum Sepolia... attested by Attestcoin... verified
   on-chain on Creditcoin... action executed — 2,500 MockUSDC actually sent."

### 1:10–1:30 — Prove it with a block explorer

1. **CLICK** the **"Technical detail"** toggle (small `Level 3` tag next to it) on the
   **`Action executed`** row — it expands to reveal a **"Transaction hash"** field as raw text.
2. **POINT AT** that transaction hash text for one second (it won't be clickable — that's
   expected, it's plain text, not a link).
3. **CLICK** over to your pre-opened Blockscout tab (see §2) showing the same hash already
   confirmed on Creditcoin CC3.
   **SAY:** "Every step is a real transaction you can verify yourself — no trusted relayer in
   between, just a cryptographic proof."

### 1:30–2:00 — Show the policy-creation UX

1. **CLICK** browser address bar / a link to go to `/select-safe`.
2. **CLICK** into the field labeled **"Safe address on Ethereum Sepolia"**, paste
   `0xf4b6a941B0bB4699cba45970cBf7c476ccE49dDd`.
3. **CLICK** the button **"Look up Safe"**.
4. **POINT AT** the **"Owners"** and **"Threshold"** numbers that appear on the Safe card
   (reads `3` owners, `2-of-3` threshold).
5. **CLICK** **"View owners"** to expand the owner address list, let it sit on screen briefly.
6. **CLICK** **"Continue with this Safe"** — this is the button with the arrow icon; it
   navigates straight to the Create Policy form.
7. On the Create Policy form, **POINT AT** the card titled **"Contributor grant"** — its
   fields (**"Recipient identity"**, **"Recipient address"**, **"Asset"**, **"Exact amount"**)
   are already visible and pre-filled, since this template is included by default.
8. **CLICK** the **"Advanced details"** disclosure inside that same card to reveal
   **"Target contract"**, **"Function selector"**, and **"Encoded params"** — the exact
   bytes that get locked into the Safe approval.
9. Do **not** click **"Review policy"** or **"Save draft"** — stop here.
   **SAY:** "Creating a policy means locking in exact constraints — which contract, which
   function, which parameters, when it expires — all bound to a single Safe approval. I won't
   finish this one on camera since Attestcoin attestation takes 20–30 minutes — that's why I
   already have a completed one to show."

### 2:00–2:45 ⭐⭐ — The security differentiator (most important segment)

1. **CLICK** back to `/policies`, scroll to the **"Ready"** section.
2. **CLICK** the row **"Q4 Treasury Policy — Live Demo"**.
3. On its detail page, **CLICK** the text link **"See how tampered actions are blocked"** —
   this is the natural in-app path to the Protected page; don't type a URL on camera.
4. **POINT AT** the card titled **"Level 3 — Adversarial control"**, specifically the
   **left green panel "Approved action"** showing `1,200 MockUSDC` — this is what the Safe
   actually signed off on.
5. **POINT AT** the **"Submitted amount"** input field next to it — it's pre-filled with
   `100000`, already different from the approved amount. No typing needed.
6. **CLICK** the red **"Attempt execution"** button.
7. **A wallet signature prompt appears — approve it on camera** (this is what proves the
   call is real, not mocked).
8. **POINT AT** the **right-hand "Altered action" panel** flipping to
   **"Blocked — no funds moved"**.
9. **POINT AT** the comparison table that appears below — specifically the **"Amount"** row,
   shown in red because it differs from the approved value, with a red **"Blocked"** badge in
   the **"Result"** column.
10. **POINT AT** the error callout underneath naming the specific revert reason (e.g.
    `AmountExceedsApproval` or `CalldataMismatch` — whichever the live call returns).
    **SAY:** "Here's the part that matters: this isn't a UI check. This is the smart contract
    itself refusing the call. Even with a valid Attestcoin proof, even calling the contract
    directly, an attacker can't change a single byte of what the Safe approved." Read the
    on-screen error name out loud.

### 2:45–3:00 — Close

- **CLICK** back to `/policies`. Static frame, no further clicks.
- **SAY:** "One Safe approval. Trustless cross-chain verification via Attestcoin — no bridge.
  And execution that rejects anything that deviates. Live right now on Creditcoin CC3 and
  Ethereum Sepolia — code's on GitHub."

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
2. **Shot B** — Policy A detail page, "Maximum transfer" + "Authority Safe" fields in the
   summary card, then the "Policy activity" section (15–20s)
3. **Shot C** — "Technical detail" expanded on the "Action executed" row, then cut to the
   pre-opened explorer tab showing the same confirmed tx (8–10s)
4. **Shot D** — `/select-safe`, Safe card after "Look up Safe" — owners/threshold populated (8–10s)
5. **Shot E** — `/policies/new`, the "Contributor grant" card with "Advanced details"
   expanded, showing target contract / function selector / encoded params (10–12s)
6. **Shot F** — Policy B's Protected page, "Attempt execution" click → wallet signature →
   "Blocked — no funds moved" panel with the red comparison-table row and error callout
   visible (15–20s)
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
