# SafeRoot Policy — UX Flow Specification

**Version:** 1.0  
**Status:** MVP UX direction  
**Related document:** `SafeRoot_Policy_PRD.md`  
**Primary platform:** Desktop Web3 application  
**Design character:** Institutional, calm, transparent, security-first  

---

## 1. UX Thesis

SafeRoot should feel like the organization’s existing Safe transaction experience extended to Creditcoin.

It should not feel like:

- A bridge interface.
- A cryptographic proof generator.
- A generic Web2 admin dashboard.
- A developer console.
- A second multisig application.

The user’s mental model should be:

> **My Ethereum Safe approved these exact Creditcoin actions.**

The user should not need to understand:

- Merkle roots.
- Merkle leaves.
- Calldata hashes.
- Proof encoding.
- Attestation queries.
- Receipt decoding.

The normal journey is:

> **Select Safe → Create policy → Review and approve → Verify → Execute → Protected**

---

## 2. UX References

SafeRoot should borrow familiar interaction patterns without cloning another product’s visual identity.

| Product reference | Pattern to adopt | SafeRoot application |
|---|---|---|
| Safe | Account context, owner threshold, signature progress, transaction history | Source Safe selection and approval tracking |
| Rabby | Human-readable transaction simulation and risk warnings | Policy impact review before Safe submission |
| Across | Clear origin-to-destination progress | Ethereum → Attestcoin → Creditcoin verification status |
| Uniswap | Minimal top navigation, one primary task, clear confirmation | Policy creation and execution confirmation |
| Aave | Obvious status and available actions | Policy and action readiness |
| Etherscan | Detailed evidence available on demand | Advanced transaction and proof inspection |

### Primary design reference

Safe is the primary mental-model reference because SafeRoot extends an existing Safe’s authority.

### Supporting references

- Rabby supplies the safety-review pattern.
- Across supplies the cross-chain waiting and verification pattern.
- Uniswap supplies minimal navigation and focused task completion.
- Etherscan supplies optional evidence depth.

---

## 3. UX Principles

### 3.1 One primary task per screen

Each screen should have one obvious primary action:

- Select Safe.
- Review policy.
- Submit to Safe.
- Wait for verification.
- Execute action.
- Respond to a security event.

### 3.2 Keep authority context visible

Users must always know:

- Which Safe is the authority.
- Which chain they are viewing.
- Which connected wallet is active.
- Which policy version is in context.

### 3.3 Translate cryptography into product state

Default copy should say:

- Safe approved.
- Evidence available.
- Verified on Creditcoin.
- Action matches approval.
- Action differs from approval.

Technical terms appear only in expanded details.

### 3.4 Explain failure precisely

Never show only:

> Transaction reverted.

Show:

> Amount differs from Safe-approved policy. Approved: 25,000 USDC. Submitted: 100,000 USDC. No funds moved.

### 3.5 Make relaying invisible during normal use

Proof delivery should happen automatically. The user sees progress, not proof-upload work.

### 3.6 Treat waiting as a normal state

Attestation availability is not immediate. The interface should communicate:

- What is complete.
- What is waiting.
- Whether user action is required.
- When the status last changed.

### 3.7 Progressive disclosure

Normal operators receive human-readable outcomes. Risk reviewers and auditors can expand technical details.

---

## 4. Information Architecture

SafeRoot uses a persistent top navigation bar. It must not use a generic left-hand dashboard sidebar.

### Top navigation

#### Left

- SafeRoot identity.

#### Center

- **Policies**
- **Activity**

#### Right

- Authority Safe selector.
- Network context.
- Connected wallet.

### Context journey indicator

Below the top bar, policy-related screens show:

> **Build → Approve → Verify → Execute**

The indicator communicates the current stage without becoming a navigation menu.

### Policies

Contains:

- Policies requiring attention.
- Policies waiting for Safe approval.
- Policies being verified.
- Active policies.
- Completed, expired, paused, or superseded policies.

### Activity

Contains:

- Safe approval activity.
- Verification progress.
- Successful executions.
- Blocked execution attempts.
- Guardian actions.
- Policy expiry and supersession.

### Avoided navigation

The MVP should not contain top-level sections for:

- Dashboard.
- Analytics.
- TVL.
- Markets.
- Governance forum.
- Relayer marketplace.
- Proof console.
- Portfolio.
- Guardians.

Guardian controls belong inside the affected policy and settings.

---

## 5. Persistent Top-Bar Behavior

### Safe context

Before selection:

> **Select Safe**

After selection:

> **Acme Treasury**

Selecting the Safe context opens:

- Safe name.
- Safe address.
- Network.
- Owner count.
- Threshold.
- Change Safe action.

### Network context

During source steps:

> **Ethereum Sepolia**

During destination verification and execution:

> **Creditcoin CC3**

The change should be explicit because it explains where the user is operating.

### Wallet context

Display the connected account in abbreviated form.

The interface must distinguish:

- Connected wallet.
- Authority Safe.
- Relayer.
- Guardian.

These identities must never be visually conflated.

---

## 6. Complete UX Flow

## Screen 1 — Select Safe

### User goal

Choose the existing Ethereum Safe that will authorize Creditcoin policies.

### Main content

- Page title: **Select Safe**
- Source network: Ethereum Sepolia.
- Safe name: Acme Treasury Safe.
- Owner count: 3.
- Threshold: 2-of-3.
- Supporting copy: **Use your existing Safe authority.**

### Primary action

> **Continue with this Safe**

### Secondary actions

- Select a different Safe.
- View Safe address.
- View owners.

### Requirements

- Never ask the user to recreate owners.
- Make the threshold visible before proceeding.
- Make the source network unmistakable.
- Explain that the Safe remains the authority.

### Success state

The selected Safe appears in the persistent top bar.

### Error states

- Unsupported source network.
- Address is not a Safe.
- Unable to read Safe configuration.
- Connected wallet is not associated with the Safe.

The last case should be a warning rather than a universal blocker because a policy author may not be an owner.

---

## Screen 2 — Create Policy

### User goal

Package several Creditcoin actions into one bounded Safe approval.

### Main content

- Policy name: Protocol Operations.
- Destination: Creditcoin CC3.
- Executor: verified SafeRoot executor.
- Action list.
- Policy expiry.

### MVP actions

1. **Pay grant — 25,000 USDC**
2. **Set maximum LTV — 68%**
3. **Pause new deposits**

### Primary action

> **Review policy**

### Secondary actions

- Add action.
- Remove action.
- Edit action.
- Save draft.

### Interaction pattern

Use human-readable action templates. Each action opens a focused configuration panel.

For the grant action, show:

- Recipient identity and address.
- Asset.
- Exact amount.
- Destination contract.
- Earliest execution.
- Expiry.

### Requirements

- Show a live action count.
- Show maximum financial exposure.
- Require expiry.
- Use exact values in the MVP.
- Put raw calldata under advanced details.

### Validation

The user cannot proceed when:

- No action exists.
- An action has an invalid target.
- Expiry is missing or already passed.
- The action exceeds integration limits.
- Two actions use the same identity.

---

## Screen 3 — Review and Approve

### User goal

Understand the policy’s effect and approve through the existing Safe.

### Main content

#### Impact summary

- **3 Creditcoin actions**
- **Maximum transfer: 25,000 USDC**
- Destination: Creditcoin CC3.
- Executor identity.
- Expiry: September 7, 2026.

#### Safety statement

> **Relayers cannot change targets, amounts, or calldata.**

#### Risk warnings

- Policy authorizes value transfer.
- Policy changes a lending risk parameter.
- Policy contains an emergency pause.
- Cross-chain revocation is not instantaneous.

### Primary action before submission

> **Submit to Safe**

### Safe approval state

- Owner 1 — Signed.
- Owner 2 — Signed.
- Owner 3 — Not required.
- Threshold reached: 2-of-3.

### Primary approved status

> **Approved on Ethereum**

### Secondary action

> **View Safe transaction**

### Requirements

- Never replace the normal Safe approval process.
- Make financial exposure visually prominent.
- Show the exact destination and expiry.
- Signers should understand the policy without opening technical details.

---

## Screen 4 — Verify

### User goal

Understand whether the Safe-approved policy has become active on Creditcoin.

### Network context

The top bar changes from Ethereum Sepolia to Creditcoin CC3.

### Progress tracker

1. Safe approved.
2. Ethereum confirmed.
3. Attestcoin evidence available.
4. Verified on Creditcoin.

### Final success state

> **Policy active**

### Secondary action

> **View technical proof**

### Waiting-state copy

#### Waiting for Ethereum confirmation

> The Safe transaction was submitted. No action is required while Ethereum confirms it.

#### Waiting for Attestcoin evidence

> The Safe approval is confirmed. SafeRoot is waiting for verifiable source evidence.

#### Waiting for Creditcoin verification

> Evidence is available and is being verified on Creditcoin.

### Requirements

- Never show a manual proof-upload form by default.
- Distinguish waiting from failure.
- Show when the status last changed.
- Permit an advanced manual relay option only when needed.

### Failure states

- Source transaction failed.
- Wrong policy emitter.
- Source Safe mismatch.
- Wrong destination executor.
- Policy version is stale.
- Policy expired before activation.
- Proof already processed.

Every failure should explain whether the user can retry, create a new policy, or take no action.

---

## Screen 5 — Execute

### User goal

Execute an available action exactly as the Safe approved it.

### Main action card

- Action: Pay contributor grant.
- Amount: 25,000 USDC.
- Recipient: Alice DAO.
- Source authority: Acme Treasury Safe.
- Destination: Creditcoin CC3.
- Expiry: 18 hours remaining.
- Status: Ready to execute.

### Primary action

> **Execute approved action**

### Remaining actions

- Set maximum LTV — Ready.
- Pause new deposits — Ready.

### Confirmation experience

Before the destination transaction is submitted, show:

> You are executing an action already approved by Acme Treasury Safe.

Then summarize:

- Exact recipient.
- Exact amount.
- Exact destination.
- Policy identity.
- Expiry.

### Success state

> **Executed exactly as approved**

### Requirements

- The relayer identity is visible but secondary.
- The authority Safe is visually primary.
- Never imply that the relayer approved the action.
- Link the successful Creditcoin transaction.
- Remove the action from the Ready state immediately after success.

---

## Screen 6 — Protected

### User goal

Understand the difference between a permitted action and a maliciously altered attempt.

### Approved panel

- **Approved action**
- 25,000 USDC.
- **Executed**

### Altered panel

- **Altered action**
- 100,000 USDC.
- **Blocked — no funds moved**

### Explanation

> **Amount differs from Safe-approved policy.**

### Comparison detail

| Field | Approved | Submitted |
|---|---|---|
| Recipient | Alice DAO | Alice DAO |
| Amount | 25,000 USDC | 100,000 USDC |
| Target | Grant Vault | Grant Vault |
| Result | Executed | Blocked |

### Guardian section

- Guardian pause.
- Remaining actions paused.
- Incident reason.
- Affected policy.

### Requirements

- Use green only for verified success.
- Use red only for a blocked or invalid attempt.
- State clearly that no funds moved.
- Keep the reason human-readable.
- Allow advanced users to view the rejected action evidence.

---

## 7. Policies Experience

The Policies page should act like Safe’s transaction queue, not a metrics dashboard.

### Section 1 — Needs attention

- Waiting for Safe signatures.
- Policy expiring soon.
- Guardian pause active.
- Failed verification requiring a new policy.

### Section 2 — Being verified

- Ethereum confirming.
- Attestcoin evidence pending.
- Creditcoin verification pending.

### Section 3 — Ready

- Active policies with unused actions.

### Section 4 — History

- Completed.
- Expired.
- Paused.
- Superseded.

### Policy-list row

Each row shows:

- Policy name.
- Authority Safe.
- Current phase.
- Available actions.
- Expiry.
- Highest-priority warning.

Avoid showing TVL, asset prices, or unrelated treasury balances.

---

## 8. Activity Experience

The Activity page combines cross-chain events into one understandable history.

### Default activity language

- Policy submitted to Acme Treasury Safe.
- Owner 1 signed.
- Safe threshold reached.
- Ethereum transaction confirmed.
- Attestcoin evidence became available.
- Policy activated on Creditcoin.
- Grant action executed.
- Altered grant action blocked.
- Guardian paused remaining actions.

### Activity item structure

- Human-readable event.
- Time.
- Actor or authority.
- Network.
- Policy and action.
- Status.
- Expandable transaction details.

### Advanced detail

- Ethereum transaction hash.
- Policy version.
- Source emitter.
- Creditcoin executor.
- Attestcoin proof reference.
- Action commitment.
- Creditcoin transaction hash.

---

## 9. Progressive Disclosure

### Level 1 — Operator

- Safe approved.
- Policy active.
- Action ready.
- Action executed.
- Action blocked.

### Level 2 — Risk reviewer

- Safe address.
- Action count.
- Maximum exposure.
- Recipients and targets.
- Policy version.
- Activation and expiry.
- Guardian status.

### Level 3 — Technical auditor

- Ethereum transaction.
- Source contract.
- Policy commitment.
- Attestcoin verification details.
- Action membership evidence.
- Calldata hash.
- Destination transaction.

The interface should never force Level 3 details on Level 1 users.

---

## 10. Status Language

| Internal state | User-facing status |
|---|---|
| Draft | Building policy |
| Awaiting Safe signatures | Waiting for Safe approval |
| Source transaction submitted | Confirming on Ethereum |
| Source confirmed | Safe approved |
| Attestation pending | Waiting for evidence |
| Proof submitted | Verifying on Creditcoin |
| Policy active | Ready to execute |
| Action used | Executed |
| Policy paused | Remaining actions paused |
| Action mismatch | Blocked — action differs from approval |
| Policy expired | Execution window ended |
| Policy superseded | Replaced by a newer policy |

Avoid vague statuses such as Processing, Error, Failed, or Invalid without a reason.

---

## 11. Rejection Copy Library

### Amount changed

> **Execution blocked — no funds moved**  
> Approved amount: 25,000 USDC  
> Submitted amount: 100,000 USDC  
> This action differs from the Safe-approved policy.

### Recipient changed

> **Execution blocked — recipient changed**  
> The submitted recipient does not match the recipient approved by the Safe.

### Target changed

> **Execution blocked — unauthorized target**  
> This policy does not permit calls to the submitted contract.

### Action replay

> **Already executed**  
> This one-time action was successfully executed earlier and cannot be used again.

### Expired policy

> **Execution window ended**  
> This policy expired before the action was submitted. Create a new Safe-approved policy to continue.

### Stale policy version

> **Policy replaced**  
> A newer Safe-approved policy is active. This older version cannot execute.

### Guardian pause

> **Remaining actions paused**  
> The Creditcoin guardian paused this policy. No unused action can execute while the pause remains active.

### Proof replay

> **Approval already verified**  
> This Safe approval has already been processed. The active policy was not changed.

---

## 12. Guardian UX

### Entry point

Guardian pause appears inside an active policy’s overflow or emergency controls. It is not a primary global navigation section.

### Pause confirmation

> **Pause all remaining actions?**  
> Completed actions will not be reversed. Unused actions will become unavailable on Creditcoin. The guardian cannot change or execute them.

### Required inputs

- Incident reason.
- Confirmation of affected policy.

### Paused-state banner

> **Guardian pause active — remaining actions are unavailable.**

### Recovery

The MVP should not give the guardian a simple unilateral Resume button. Recovery should require a new Safe policy or a stricter approved process.

---

## 13. Network and Wallet UX

### Source phase

- Safe selection.
- Policy creation.
- Review.
- Safe approval.

Network context: **Ethereum Sepolia**.

### Destination phase

- Attestcoin verification result.
- Policy activation.
- Action execution.
- Security response.

Network context: **Creditcoin CC3**.

### Network switching principle

Cross-chain complexity should appear as progress rather than repeated manual wallet switching.

The normal operator should not need to:

- Download a proof.
- Paste a proof.
- Copy a policy root.
- Manually switch networks for each status update.

When a destination transaction requires wallet interaction, explain why Creditcoin CC3 is required before prompting the switch.

---

## 14. Notifications

### In-app notifications

- Safe threshold reached.
- Ethereum transaction confirmed.
- Attestcoin evidence available.
- Policy active on Creditcoin.
- Action executed.
- Action blocked.
- Policy expires in 24 hours.
- Guardian pause activated.
- New policy version activated.

### MVP delivery

In-app notifications are sufficient.

### Roadmap delivery

- Email.
- Slack.
- Telegram.
- Webhook.

Notifications should link directly to the affected policy or action.

---

## 15. Accessibility and Usability

- Never communicate state through color alone.
- Pair green, red, yellow, and purple states with text and icons.
- Maintain keyboard navigation for every primary flow.
- Provide clear focus states.
- Use readable transaction addresses with copy controls.
- Expand full addresses on demand.
- Use plain language before technical language.
- Avoid animated progress that hides actual waiting time.
- Ensure error messages remain visible until dismissed.
- Preserve user-entered policy data if wallet confirmation is cancelled.

---

## 16. Responsive Strategy

### MVP

Desktop-first experience optimized for:

- Policy authors.
- Safe signers.
- Protocol operators.
- Hackathon judges.

### Mobile behavior

Mobile support may provide:

- Policy status.
- Signature progress.
- Activity.
- Guardian alerts.

Complex policy creation is not an MVP mobile requirement.

### Top navigation on small screens

- SafeRoot identity remains visible.
- Safe and network context collapse into one context menu.
- Policies and Activity move into a compact navigation menu.
- The primary task remains visible without horizontal scrolling.

---

## 17. Empty, Waiting, and Loading States

### No Safe connected

> Connect an Ethereum Safe to create Creditcoin policies.

### No policies

> No policies yet. Create your first bounded Creditcoin policy using an existing Safe.

### No active actions

> This policy has no remaining executable actions.

### Attestation waiting

> Safe approval confirmed. Waiting for Attestcoin evidence. No action is required.

### Relayer waiting

> Evidence is available. SafeRoot is delivering it to Creditcoin.

### Wallet request cancelled

> Transaction cancelled. Your policy draft was preserved.

---

## 18. Demo UX Script

### Screen 1 — Establish trust

> Acme already uses this 2-of-3 Ethereum Safe. SafeRoot does not create another signer system.

### Screen 2 — Show bounded intent

> Acme approves three exact Creditcoin actions under one short-lived policy.

### Screen 3 — Show readable approval

> Signers see the maximum transfer, destination, expiry, and risk before approving through Safe.

### Screen 4 — Show cross-chain verification

> Attestcoin proves the Ethereum approval. Creditcoin independently activates the policy.

### Screen 5 — Show permissionless execution

> Anyone can relay this 25,000 USDC grant, but nobody can change it.

### Screen 6 — Show protection

> The approved payment executes. The altered 100,000 USDC payment is blocked, and no funds move.

---

## 19. UX Acceptance Criteria

The MVP UX is complete when:

1. A first-time judge understands SafeRoot’s purpose from the Select Safe screen.
2. A policy author creates three actions without reading raw calldata.
3. A signer sees maximum exposure, destination, and expiry before approval.
4. SafeRoot reuses Safe’s approval process rather than creating another one.
5. Verification progress clearly separates Ethereum, Attestcoin, and Creditcoin.
6. Users do not manually upload proofs during the normal flow.
7. The Action Center makes the next executable action obvious.
8. A successful action states that it executed exactly as approved.
9. A rejected action explains the specific changed field.
10. Guardian pause clearly states its limited power.
11. Top navigation remains consistent across every screen.
12. No primary screen resembles a generic metrics dashboard.

---

## 20. Final UX Definition

SafeRoot’s UX combines:

> **Safe’s authority context + Rabby’s readable risk review + Across’s cross-chain progress + Uniswap’s focused navigation + Etherscan’s optional evidence depth**

The interface succeeds when users understand three truths:

1. **The Ethereum Safe created the authority.**
2. **Attestcoin made that authority verifiable on Creditcoin.**
3. **The relayer can execute only the exact approved action.**

The winning experience is not a complex dashboard. It is a short, explainable sequence:

> **Select Safe → Create policy → Approve → Verify → Execute → Protected**

