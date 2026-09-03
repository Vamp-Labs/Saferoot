# 03 — Frontend

## Responsibilities

Build the entire SafeRoot Policy web application in Next.js: every screen in
`docs/SafeRoot_UX_Flow.md`, following the visual language established in `docs/code.html` and
extended consistently (see §6 below, embedded verbatim from the PM's design-system inventory).
You are the only role that renders anything a human sees.

## Scope

### In scope

- Persistent top navigation and journey indicator (UX §4–5).
- Screen 1 Select Safe, Screen 2 Create Policy, Screen 3 Review and Approve, Screen 4 Verify,
  Screen 5 Execute, Screen 6 Protected (UX §6).
- Policies page (UX §7) and Activity page (UX §8), including all four/section groupings described
  there.
- Guardian pause entry point and confirmation flow (UX §12), reached from inside an active policy,
  not as a global nav item.
- Wallet connection for both Ethereum Sepolia (Safe steps) and Creditcoin CC3 (execution steps),
  with explicit, visually distinct display of connected wallet vs. authority Safe vs. relayer vs.
  guardian identity (UX §5.3) — these must never be visually conflated.
- Proposing the policy transaction to the real Safe via `@safe-global/protocol-kit`/`api-kit`
  (the only Ethereum write this app performs) and calling the Backend's `link-safe-tx` endpoint
  with the resulting `safeTxHash`.
- Direct wallet transactions for `executeAction` and `guardianPause` on Creditcoin CC3.
- A Level-3/advanced "attempt a tampered execution" control for the demo (see
  `00-overview.md` §5.6) that lets an operator submit `executeAction` with a deliberately altered
  parameter, to produce a live Screen 6 rejection.
- Progressive disclosure across all three levels (UX §9): operator-level plain status by default,
  risk-reviewer detail one click away, technical/auditor detail (tx hashes, policy version, proof
  reference, calldata) behind an explicit expand.
- All empty/waiting/loading/error copy from UX §11 and §17, verbatim where given.
- Responsive collapse behavior for the top nav on small screens (UX §16) — full policy creation
  does not need to work on mobile; status/activity viewing does.
- Accessibility requirements from UX §15: never color-alone state, visible keyboard focus, all
  primary flows keyboard-navigable, addresses copyable with full value on demand, error messages
  stay visible until dismissed, preserved draft data if a wallet confirmation is cancelled.

### Out of scope

- Building a custom Safe multisig signing UI — owners sign in Safe{Wallet}; you only show
  progress and deep-link out (UX §1 non-goal: SafeRoot must not feel like "a second multisig
  application").
- Submitting `activatePolicy` — that is Backend's automated worker; you only display its progress.
- Any contract or backend logic. You consume the ABI (`/contracts/abi`, once published) for the
  two direct writes you make, and the REST API (`00-overview.md` §5.5) for everything else.
- Portfolio analytics, TVL, token pricing, or any dashboard-style content explicitly excluded by
  UX §4 "Avoided navigation."
- Email/Slack/webhook notifications — in-app only for MVP (UX §14).

## Objectives

1. A first-time judge understands SafeRoot's purpose from the Select Safe screen alone (UX
   Acceptance Criterion 1).
2. A policy author can create all three demo actions without ever reading raw calldata (UX
   Acceptance Criterion 2 / PRD Feature 3).
3. A signer sees maximum exposure, destination, and expiry before approving (UX Acceptance
   Criterion 3).
4. Verification progress clearly separates Ethereum, Attestcoin, and Creditcoin, and never asks
   for a manual proof upload in the normal flow (UX Acceptance Criteria 5–6).
5. A rejected/tampered action explains the specific changed field, with a visible "no funds moved"
   statement (UX Acceptance Criterion 9, PRD Feature 10).
6. No primary screen resembles a generic metrics dashboard (UX Acceptance Criterion 12).

## Requirements

### Information architecture (UX §4)

Persistent top bar, no left sidebar. Left: SafeRoot identity. Center: **Policies**, **Activity**.
Right: authority Safe selector, network context, connected wallet. Below the top bar on
policy-related screens, a non-clickable journey indicator: **Build → Approve → Verify → Execute**.
Do not add top-level Dashboard, Analytics, TVL, Markets, Governance forum, Relayer marketplace,
Proof console, Portfolio, or Guardians sections (UX §4 "Avoided navigation," explicit).

### Top-bar behavior (UX §5)

- Safe context: `Select Safe` before selection; the Safe's name after. Clicking it opens name,
  address, network, owner count, threshold, and a "Change Safe" action.
- Network context switches explicitly between `Ethereum Sepolia` (source steps) and
  `Creditcoin CC3` (verification/execution steps) — never hide this switch.
- Wallet context: abbreviated connected address, visually distinct from Safe/relayer/guardian
  identity at all times.

### Screen requirements

Build all six screens exactly as specified in `docs/SafeRoot_UX_Flow.md` §6 (Screens 1–6). Key
points repeated here so this file is self-contained:

- **Screen 1 — Select Safe**: show source network, Safe name, owner count, threshold; primary
  action "Continue with this Safe"; never ask the user to recreate owners; unsupported-network,
  not-a-Safe, unreadable-config, and wallet-not-an-owner (warning, not blocker) error states.
- **Screen 2 — Create Policy**: policy name, destination, executor, action list (the three fixed
  MVP templates — grant, risk-cap, pause), expiry; live action count and max financial exposure;
  exact values only (no bounded ranges in MVP); raw calldata under advanced details only;
  validation blocks proceeding on no actions, invalid target, missing/past expiry,
  integration-limit violations, or duplicate action identity.
- **Screen 3 — Review and Approve**: impact summary (action count, max transfer, destination,
  executor, expiry), safety statement ("Relayers cannot change targets, amounts, or calldata."),
  risk warnings (value transfer, risk-parameter change, emergency pause present, revocation not
  instantaneous), "Submit to Safe" primary action, live Safe signature progress (Owner N —
  Signed/Not required, threshold reached), link to the Safe transaction.
- **Screen 4 — Verify**: network context switches to Creditcoin CC3; four-stage progress tracker
  (Safe approved → Ethereum confirmed → Attestcoin evidence available → Verified on Creditcoin);
  final state "Policy active"; waiting-state copy exactly as given in UX §6 Screen 4; failure
  states with an explicit statement of whether the user can retry, must create a new policy, or
  should take no action; no manual proof-upload form by default.
- **Screen 5 — Execute**: action card with amount/recipient/source authority/destination/expiry
  countdown/status; "Execute approved action" primary; remaining-actions list; pre-submission
  confirmation restating exact recipient/amount/destination/policy identity/expiry; success state
  "Executed exactly as approved"; relayer identity visible but secondary, authority Safe visually
  primary; remove from Ready state immediately on success.
- **Screen 6 — Protected**: side-by-side approved vs. altered panels; explanation line (e.g.
  "Amount differs from Safe-approved policy."); comparison table (Recipient/Amount/Target/Result);
  guardian section (pause status, incident reason, affected policy); green reserved for verified
  success only, red reserved for blocked/invalid only.

### Policies page (UX §7)

Four sections: needs attention, being verified, ready, history. Each row: policy name, authority
Safe, current phase, available actions, expiry, highest-priority warning. No TVL, asset prices, or
treasury balances.

### Activity page (UX §8)

Human-readable event first, with time, actor/authority, network, policy+action reference, status,
and expandable technical detail (Ethereum tx hash, policy version, source emitter, Creditcoin
executor, Attestcoin proof reference, action commitment, Creditcoin tx hash).

### Guardian UX (UX §12)

Entry point inside an active policy's overflow/emergency controls, not global nav. Confirmation
copy: "Pause all remaining actions? Completed actions will not be reversed. Unused actions will
become unavailable on Creditcoin. The guardian cannot change or execute them." Requires incident
reason + affected-policy confirmation. Paused-state banner: "Guardian pause active — remaining
actions are unavailable." No resume button.

### Status language and rejection copy

Use the exact mappings in UX §10 (internal state → user-facing status) and the exact copy blocks
in UX §11 (amount changed, recipient changed, target changed, action replay, expired policy, stale
policy version, guardian pause, proof replay). Do not paraphrase these — they were written for
precision and consistency with the demo script.

## Dependencies

- Backend Services' REST API (`00-overview.md` §5.5) for all read data. Build against the
  documented shapes; confirm no drift once Backend is underway.
- Smart Contracts' `deployments.json` and `abi/*.json` (`00-overview.md` §5.4) for the two direct
  writes (`executeAction`, `guardianPause`) and for proposing the Safe transaction targeting
  `PolicyRegistry.registerPolicy`.
- Safe Transaction Service (via `@safe-global/protocol-kit`/`api-kit`) for proposing the Safe
  transaction; Backend separately polls the same service for status display, so this app never
  needs to poll it directly for status — only to propose.
- Until real deployments exist, build and demo against mock/fixture data matching the exact JSON
  shapes in `00-overview.md` §5.1/§5.5, and swap in real endpoints/addresses once published.

## Constraints

- Next.js App Router, TypeScript strict, Server Components by default; `use client` only on
  interactive leaves (wallet buttons, forms, live-updating status widgets) — never on a whole
  layout or page for one interactive element.
- Tailwind CSS, extending the exact token configuration implied by `docs/code.html` (see §6).
- Pre-approved dependencies: `wagmi`, `viem`, `@safe-global/protocol-kit`, `@safe-global/api-kit`,
  Tailwind. No wallet-connect UI kit (RainbowKit/ConnectKit/etc.) — build a minimal custom connect
  surface consistent with the design system instead. Any other dependency needs a check-in first.
- No code comments beyond the single-line `// TEMPORARY` exception.
- Every animation/transition respects `prefers-reduced-motion`.
- Never conflate connected wallet, authority Safe, relayer, and guardian identities visually.
- Never claim instantaneous cross-chain revocation anywhere in copy (PRD §13, hard constraint).

## Deliverables

- `/frontend` Next.js application implementing every screen and page listed above.
- A working wallet-connection flow for both Ethereum Sepolia and Creditcoin CC3, with clear
  network-switch prompts that explain why a switch is needed before prompting it (UX §13).
- The Safe-proposal flow (author submits policy → Safe transaction proposed → `link-safe-tx`
  called) fully wired to a real Safe on Sepolia.
- The direct-write `executeAction` and `guardianPause` flows fully wired to
  `SafeRootPolicyExecutor` on Creditcoin CC3.
- The advanced "attempt a tampered execution" demo control.
- All copy from UX §10/§11 implemented verbatim.

## Acceptance criteria

- A user with no prior context can go from `Select Safe` through a submitted policy without
  reading any raw calldata by default (advanced details must be explicitly expanded to see it).
- The Verify screen updates through its four stages without any manual user action once a Safe
  transaction is executed (polling the Backend API is sufficient — no page-refresh requirement).
- Clicking "Execute approved action" on a Ready action results in a real Creditcoin CC3
  transaction from the connected wallet, and the UI reflects `Executed` status without a manual
  refresh once Backend has indexed it.
- Using the tampered-execution control with an altered grant amount produces a real on-chain
  rejection and the Screen 6 comparison table renders with real approved-vs-submitted values, not
  hardcoded fixture data, once Backend integration is live.
- Guardian pause, triggered from the connected guardian wallet, results in the paused-state banner
  appearing across every affected screen (policy detail, action center, policies list) without a
  manual refresh.
- No screen shows color as the only signal of state; every status has accompanying text and an
  icon.
- Keyboard navigation reaches every primary action on every screen; focus states are visible.
- Cancelling a wallet confirmation preserves any in-progress policy-draft form data.

---

## Design-system inventory (embedded verbatim — source: `docs/code.html`, `docs/screen.png`)

This is the complete design-system inventory produced during planning. It is the authoritative
visual reference. Follow it closely; where it does not cover an application component you need
(cards, tables, badges, forms, modals — none exist in the reference), §6.6 below gives explicit
direction on how to extend it consistently rather than inventing an unrelated style.

**Caveat, stated plainly:** `docs/code.html` is a single marketing hero section for a fictitious
VC firm ("Tribe Capital"), not an application design system. It establishes brand tone, a
color/type pairing, spacing rhythm, and two component patterns (nav bar, two button styles) — it
does not contain cards, tables, forms, modals, badges, or any state styling beyond hover.

### Color tokens (code.html lines 21–26)
| Token | Value | Observed usage |
|---|---|---|
| `tribe-blue` | `#2E35FF` | Primary accent: active nav link, primary button background, hover color for secondary link/icon |
| `tribe-gray` | `#F5F5F5` | Section background |
| `text-primary` | `#1A1A1A` | Headlines, primary body text |
| `text-secondary` | `#666666` | Meta/supporting text |
| white | `#FFFFFF` | Page background |
| `gray-200` | Tailwind default | Header bottom border only, no shadow |

No red/green/yellow tokens exist in the reference — choose a success green and danger red that sit
comfortably next to `#2E35FF` on white, and pair every color state with text and an icon (UX §15).
Green is reserved for verified success only; red is reserved for blocked/invalid attempts only
(UX Screen 6 explicit requirement).

### Typography (code.html lines 6–15, 37, 64–77)
- Two-typeface pairing: **Playfair Display** (700, serif) for the wordmark only, uppercase, tight
  tracking; **Inter** (400/500/600) for everything else.
- Defect to fix, not preserve: the reference declares `font-family: 'Playfair+Display'` (literal
  plus sign), which does not match the real Google Fonts family name and silently falls back.
  Load and apply the font correctly.
- Hero-scale headline pattern: `text-3xl` → `md:text-4xl` → `lg:text-[44px]`, `leading-tight`,
  `font-medium`, line length constrained via `max-w-3xl`. Use this scale for page-level headings
  where a screen needs one; most SafeRoot screens are task/status screens, not hero screens — use
  judgment, this is a top-of-scale reference, not a mandate to headline every screen this large.
- Nav links / button labels: `text-xs`, `font-semibold`, `tracking-wider`, `uppercase`.
- Secondary/meta text: `text-sm`, `leading-relaxed`, `text-secondary` color.
- Inline text link: `text-sm`, `font-medium`.

### Spacing, grid, layout (code.html lines 35, 60–69, 85)
- Content container: `max-w-[1400px] mx-auto`, horizontal padding `px-6` (`lg:px-12`).
- Header height: `h-24` (96px), bottom border only, no shadow, no background change.
- Section vertical rhythm example: `py-24` (`lg:py-32`).
- 12-column grid (`grid-cols-12`, `gap-12`), asymmetric splits used for hero-style content.
- No visible radius or shadow anywhere in the reference — flat, bordered, editorial surface
  treatment, not card-elevation based. Carry this flatness into every new component: prefer
  `border` over `shadow` to separate surfaces.

### Component vocabulary present in the reference
- **Top nav bar**: brand mark left, links centered-left, primary CTA right, bottom border only,
  fixed height, no sidebar — this matches UX §4's explicit "must not use a generic left-hand
  dashboard sidebar."
- **Primary button (solid)**: `bg-tribe-blue`, white text, `px-6 py-3`, uppercase
  `text-xs font-semibold tracking-wider`, trailing arrow icon, `hover:bg-tribe-blue/90`. Use this
  exact style for every primary action across the app: Continue with this Safe, Review policy,
  Submit to Safe, Execute approved action, Pause all remaining actions.
- **Secondary/text link with icon**: bottom border only (no background), icon translates right on
  hover (`group-hover:translate-x-1`), text and icon shift to `tribe-blue` on hover. Use for
  secondary actions: Select a different Safe, View Safe address, View technical proof.
- **Nav link states**: default `text-primary`, current/active `tribe-blue`, hover `tribe-blue`.

### Interaction/state patterns present
Only `hover` and color/transform transitions are demonstrated. Focus, active, disabled, loading,
empty, and error states are not represented in the reference and must be designed here,
consistent with the flat/bordered surface language, `tribe-blue` as the one accent (use it for
focus rings), and UX §15's accessibility requirements.

### Extending the system to application components (your job — direction given here)
The reference is a landing page; SafeRoot is a status-heavy application. Build the missing pieces
using only the primitives above, not an unrelated visual language:
- **Cards/rows** (policy cards, action cards, activity rows): flat surfaces, `border` (not
  shadow), generous padding, minimal or no corner radius — stay flat and bordered.
- **Status badges** (Draft/Waiting/Ready/Executed/Expired/Paused/Blocked): text + icon + a
  low-opacity background tint of the relevant state color, never color alone.
- **Progress tracker** (Safe approved → Ethereum confirmed → Attestcoin evidence → Verified →
  Active): horizontal step indicator, `tribe-blue` for completed/current steps, gray/secondary for
  pending — matching Across's cross-chain progress pattern (UX §2).
- **Buttons**: reuse the primary/secondary styles verbatim everywhere; do not invent new button
  variants.
- **Tables** (e.g. Screen 6's Approved vs Submitted comparison): plain bordered table, `text-sm`,
  header row `font-semibold` + `text-secondary`, no unnecessary striping.
- **Forms** (policy builder action panels): label above input, `text-sm` labels in `text-primary`,
  helper/error text in `text-sm` below the field, focus ring in `tribe-blue`, error state paired
  with icon + red text, never red border alone.
- **Modals/confirmations** (guardian pause confirmation, execute confirmation): centered overlay,
  flat bordered surface (no heavy shadow/blur beyond what's needed for legibility over content),
  primary/secondary buttons in the exact reference styles.

### UX pattern references to blend in (UX §2, for components the color/type inventory alone won't resolve)
- Safe: account context, owner threshold, signature progress, transaction history — source for
  Safe selection and approval-tracking components.
- Rabby: human-readable transaction simulation and risk warnings — source for the policy impact
  review pattern (Screen 3).
- Across: clear origin-to-destination progress — source for the Verify screen's progress tracker.
- Uniswap: minimal top navigation, one primary task, clear confirmation — source for overall nav
  and confirmation-dialog restraint.
- Aave: obvious status and available actions — source for the Action Center / Execute screen.
- Etherscan: detailed evidence available on demand — source for Level 3 technical detail panels.
