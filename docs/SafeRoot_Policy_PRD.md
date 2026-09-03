# SafeRoot Policy — Product Requirements Document

**Version:** 1.0  
**Status:** Hackathon MVP definition  
**Product type:** Cross-chain governance and bounded execution infrastructure  
**Source authority:** Ethereum Safe  
**Destination:** Creditcoin CC3  
**Verification layer:** Attestcoin  
**Document scope:** Product, features, business thesis, demo, and delivery requirements  

---

## 1. Executive Summary

SafeRoot Policy lets an organization use its existing Ethereum Safe as the source of authority for tightly bounded actions on Creditcoin.

A DAO, protocol, fund, or institution can define a bundle of Creditcoin actions, approve that bundle through its existing Safe threshold, and make those actions executable on Creditcoin after the Safe approval is verified through Attestcoin. Any relayer may deliver the evidence and execute an approved action, but the relayer cannot change the target, recipient, amount, function, timing, destination, or policy version.

SafeRoot does not deploy a second independent multisig and does not ask Creditcoin to trust a project-operated webhook or centralized Safe indexer. The Ethereum Safe remains the authority. Attestcoin carries verifiable evidence of that authority to Creditcoin. SafeRoot then enforces the exact boundaries that the Safe approved.

The product promise is:

> **One Ethereum Safe approval. Bounded execution on Creditcoin.**

The core product loop is:

> **Build → Approve → Verify → Execute → Protect**

---

## 2. Product Pitch

### One-line pitch

> **Use your existing Ethereum Safe to authorize bounded actions on Creditcoin.**

### Memorable pitch

> **One Safe. One policy. Exact execution across chains.**

### 30-second pitch

Acme DAO already secures its treasury and governance through a 2-of-3 Ethereum Safe. When Acme begins operating on Creditcoin, it should not need to create and maintain another independent signer configuration.

With SafeRoot, Acme packages several Creditcoin actions into one policy: pay a contributor grant, change a lending risk cap, and authorize an emergency pause. Its existing Ethereum Safe approves the policy. Attestcoin proves that approval to Creditcoin. Any relayer can then execute the permitted actions, but cannot alter their recipients, amounts, targets, parameters, or execution window.

If an attacker changes a 25,000 USDC grant into 100,000 USDC, SafeRoot blocks it and no funds move.

### Category definition

SafeRoot is a **cross-chain policy authorization and bounded execution layer**.

It is not:

- A new multisig wallet.
- A generic bridge.
- A governance voting application.
- A treasury portfolio dashboard.
- A centralized transaction relay.
- A Safe replacement.

### Core question

> **How can an organization safely extend the authority of its existing Ethereum Safe to Creditcoin without duplicating signer management or trusting a bridge operator?**

---

## 3. Problem

Organizations increasingly operate across multiple chains, but their governance authority is fragmented.

Even if an organization deploys smart accounts with the same owners and threshold on several chains, each instance remains independent. Over time, owners, thresholds, modules, and operational procedures can diverge.

This creates several problems:

### Duplicate administration

The organization must create, configure, monitor, and update a new signer environment on every chain.

### Governance drift

Changes to the original Safe do not automatically make another chain’s authority identical. The organization can mistakenly operate with different owners or thresholds.

### Additional signer risk

Every duplicated authority system creates another place where keys, permissions, and operating procedures can fail.

### Trusted relay dependency

A destination-chain contract often depends on a bridge, validator set, webhook, or project-operated server to claim that a source-chain approval happened.

### Poor action boundaries

A broad cross-chain administrator role may be able to perform more actions than the Safe intended. A compromised relayer or executor could redirect value or call an unauthorized function.

SafeRoot addresses these problems by separating authority from transport:

- The Ethereum Safe creates the authority.
- Attestcoin proves the source transaction.
- A relayer transports evidence.
- The Creditcoin executor enforces the approved boundaries.

---

## 4. Product Thesis

The strongest cross-chain governance model is not to reproduce the same multisig everywhere. It is to preserve one trusted source of authority and let destination-chain systems independently verify its bounded decisions.

SafeRoot combines four capabilities:

| Capability | Product responsibility |
|---|---|
| Existing Safe authority | Uses the organization’s current owners and threshold |
| Policy bundling | Commits several exact Creditcoin actions under one approval |
| Attestcoin verification | Proves that the configured Safe authorized the policy on Ethereum |
| Bounded execution | Permits only the exact actions, limits, timing, and destination approved by the Safe |

The relayer is intentionally untrusted.

The relayer can:

- Deliver an Attestcoin proof.
- Submit an approved action for execution.
- Pay destination-chain transaction fees.

The relayer cannot:

- Create authority.
- Change policy contents.
- Change an approved recipient.
- Increase an approved amount.
- Replace the destination contract.
- Extend the expiry.
- Reuse an action.
- Select a different executor.

---

## 5. Product Goals

### Primary goals

1. Let an organization reuse an existing Ethereum Safe as Creditcoin authority.
2. Allow one Safe approval to authorize several independently executable Creditcoin actions.
3. Ensure any relayer can transport evidence without gaining governance power.
4. Make every permitted and rejected execution understandable to non-technical operators.
5. Demonstrate that changed calldata, targets, amounts, or timing cannot execute.
6. Provide an auditable connection between the Safe transaction and each Creditcoin action.
7. Establish SafeRoot as reusable infrastructure for Creditcoin protocols.

### Hackathon goals

1. Verify one genuine 2-of-3 Safe approval from Ethereum Sepolia through Attestcoin.
2. Activate one real policy on Creditcoin CC3.
3. Execute three different approved actions.
4. Reject altered, replayed, expired, and incorrectly bound actions.
5. Show one real Creditcoin ecosystem integration or credible integration-ready target.
6. Explain the full product in under three minutes.

### Non-goals

- Replacing Safe’s signer or transaction experience.
- Creating a new DAO voting protocol.
- Supporting arbitrary actions without constraints.
- Guaranteeing instantaneous cross-chain revocation.
- Automatically mirroring every Safe configuration change.
- Providing cross-chain asset bridging.
- Supporting every chain in the MVP.
- Building a relayer marketplace or token incentive system.
- Providing portfolio analytics, token pricing, or treasury reporting.
- Implementing governance forums, proposal discussions, or delegation.

---

## 6. Target Users

### Primary customer: Protocol or DAO operations team

An organization that already uses an Ethereum Safe and is beginning to operate contracts, funds, or governance functions on Creditcoin.

**Goals:**

- Avoid creating a separate Creditcoin signer configuration.
- Keep Ethereum Safe owners and threshold as the recognized authority.
- Authorize several operational actions in one review cycle.
- Delegate transaction delivery without delegating governance power.
- Maintain a traceable cross-chain audit record.

### Primary end user: Policy author

An operations contributor who prepares actions for Safe review.

**Goals:**

- Select understandable action templates.
- Define amounts, targets, timing, and expiry.
- Preview exactly what the Safe will authorize.
- Submit the policy into the organization’s existing Safe process.

### Primary end user: Safe signer

An owner responsible for reviewing and approving the policy.

**Goals:**

- Understand the effects without decoding raw calldata.
- Verify the destination, maximum exposure, timing, and action count.
- Approve through the normal Safe threshold.

### Supporting user: Relayer or keeper

An untrusted participant or automated worker that delivers proofs and actions.

**Goals:**

- Detect when a source policy is ready.
- Deliver the proof permissionlessly.
- Execute available actions without special authorization.
- Receive a clear explanation when an action is unavailable or invalid.

### Supporting user: Guardian

A limited emergency role on Creditcoin.

**Goals:**

- Pause remaining actions during an incident.
- Stop damage without being able to create or redirect authority.
- Leave an auditable incident record.

### Supporting user: Auditor or judge

A reviewer who needs to trace the entire lifecycle.

**Goals:**

- Verify the Ethereum Safe transaction.
- Inspect the Attestcoin verification result.
- Confirm policy bindings.
- Match every Creditcoin execution to an approved action.
- Understand why a malicious attempt was rejected.

---

## 7. Jobs to Be Done

### Operations team

- When our organization begins using Creditcoin, we want our existing Ethereum Safe to remain the source of authority so we do not operate another independent signer system.
- When we need several Creditcoin actions, we want to approve them as one bounded policy so signers do not repeat the complete review process for every action.
- When an external relayer delivers an action, we want the system to execute only what the Safe approved.

### Safe signer

- When reviewing a policy, I want a human-readable impact summary so I can understand maximum financial exposure and operational effects.
- When approving, I want to use the Safe process I already trust.

### Relayer

- When a policy becomes active, I want to see which actions remain eligible and submit them without obtaining a privileged key.

### Guardian

- When suspicious or unexpected activity occurs, I want to pause unused actions immediately without gaining the ability to transfer funds or create new policy.

### Auditor

- When examining an execution, I want to trace it back to a specific Safe approval and verify that its action parameters were unchanged.

---

## 8. Core Product Model

### 8.1 Safe

The source Ethereum Safe is the policy authority. SafeRoot does not copy its owners or recreate its signature threshold on Creditcoin.

### 8.2 Policy

A policy is one Safe-approved bundle containing:

- Policy identity.
- Policy version.
- Destination chain.
- Authorized Creditcoin executor.
- One or more approved actions.
- Activation time.
- Expiry time.
- Optional financial exposure limits.
- Emergency pause configuration.

### 8.3 Approved action

An action is one exact permission inside the policy. It defines:

- Destination target.
- Permitted function.
- Exact or bounded parameters.
- Native value, if any.
- Asset and amount, when relevant.
- Earliest execution time.
- Expiry.
- Unique action identifier.
- One-time execution rule.

### 8.4 Attestcoin evidence

Attestcoin evidence proves that the configured Ethereum source transaction succeeded and produced the expected policy authorization event.

### 8.5 Executor

The Creditcoin executor verifies policy activation and applies every action boundary before calling the destination target.

### 8.6 Guardian pause

The guardian may pause unused actions. It cannot create policies, alter approved actions, transfer value, replace the Safe, or grant itself execution authority.

---

## 9. End-to-End Product Flow

### Step 1 — Select Safe

The policy author connects an existing Ethereum Safe.

SafeRoot displays:

- Safe name.
- Safe address.
- Ethereum network.
- Owner count.
- Signature threshold.

The author confirms that this Safe will become the policy authority.

### Step 2 — Create policy

The author selects a Creditcoin integration and adds actions using human-readable templates.

Hackathon policy:

1. Pay a 25,000 USDC contributor grant.
2. Set maximum LTV to 68%.
3. Pause new deposits.

The author sets activation, expiry, and relevant limits.

### Step 3 — Review and approve

SafeRoot displays a human-readable impact summary:

- Three Creditcoin actions.
- Maximum transfer of 25,000 USDC.
- Exact destination and executor.
- Policy expiry.
- Warning that revocation is not instantaneous.
- Statement that relayers cannot change action details.

The author submits the policy to the existing Safe. Safe owners approve through the normal threshold.

### Step 4 — Verify

After the Safe transaction succeeds:

1. Ethereum confirms the source transaction.
2. Attestcoin evidence becomes available.
3. A permissionless worker transports the evidence.
4. Creditcoin verifies the Safe, source, policy version, destination, executor, timing, and proof uniqueness.
5. The policy becomes active.

### Step 5 — Execute

Any relayer submits an approved action and its inclusion evidence.

SafeRoot verifies:

- The policy is active.
- The policy has not expired.
- The executor is not paused.
- The action belongs to the approved policy.
- The target and function are permitted.
- The submitted parameters match the approved action.
- The action has not already executed.
- The value remains within its boundary.

The action executes on Creditcoin.

### Step 6 — Protect

If a relayer changes the amount, target, calldata, timing, destination, executor, or action identifier, SafeRoot rejects the attempt.

Example:

- Approved: 25,000 USDC to Alice DAO.
- Submitted: 100,000 USDC to Alice DAO.
- Result: Blocked; no funds moved.

During an incident, the local guardian can pause remaining actions.

---

## 10. Functional Requirements

## Feature 1 — Safe Selection

### Purpose

Connect the organization’s existing Ethereum Safe without reproducing its signer configuration.

### Requirements

- Connect an Ethereum wallet.
- Discover or enter an existing Safe address.
- Display Safe owners and threshold.
- Display source network and Safe address.
- Require explicit confirmation of the authority Safe.
- Preserve the selected Safe throughout policy creation.

### Acceptance criteria

- The user can select one genuine Ethereum Sepolia Safe.
- SafeRoot shows the correct owner count and threshold.
- SafeRoot never asks the user to recreate the Safe’s owners.
- The policy cannot be submitted without a confirmed source Safe.

---

## Feature 2 — Creditcoin Integration Selection

### Purpose

Define which Creditcoin application and executor will receive policy authority.

### Requirements

- Show named, verified integrations.
- Display the integration’s Creditcoin network and executor.
- Explain which targets and functions the integration supports.
- Place custom contract entry under an advanced option.
- Warn when an integration has not been verified by SafeRoot.

### Acceptance criteria

- The user can select the hackathon target integration.
- The chosen executor is visible in the policy review.
- A policy cannot silently change its executor after Safe approval.

---

## Feature 3 — Policy Builder

### Purpose

Allow a policy author to create understandable, bounded destination actions.

### Requirements

- Create a policy name.
- Add one or more actions.
- Use human-readable action templates.
- Show the target application and outcome of every action.
- Define exact values or safe upper bounds.
- Define earliest execution and expiry.
- Show a running summary of action count and maximum financial exposure.
- Allow actions to execute independently after activation.
- Prevent duplicate action identifiers.

### MVP action templates

| Action | User-defined values | Required boundary |
|---|---|---|
| Contributor grant | Recipient, asset, amount | Exact recipient and amount |
| Risk-cap change | Risk parameter and value | Exact target and new value |
| Emergency pause | Target protocol | Exact pause function |

### Acceptance criteria

- The author can create all three hackathon actions in one policy.
- Every action has an obvious outcome and expiry.
- The builder never requires the author to read raw calldata by default.
- Technical action details remain available for expert review.

---

## Feature 4 — Human-Readable Policy Review

### Purpose

Help Safe signers understand what authority they are granting.

### Requirements

- Show the number of actions.
- Show destination chain and executor.
- Show maximum financial exposure.
- Show recipients, assets, amounts, functions, and parameter changes.
- Show activation and expiry.
- Explain permissionless relaying.
- Explain that relayers cannot alter approved contents.
- Warn that cross-chain revocation is not instantaneous.
- Provide expandable technical details.

### Acceptance criteria

- A signer can understand the policy without decoding calldata.
- Financially sensitive actions receive prominent warnings.
- The submitted Safe transaction matches the reviewed policy.

---

## Feature 5 — Safe Approval Tracking

### Purpose

Reuse Safe’s existing signing and threshold process.

### Requirements

- Submit or link the policy transaction to Safe.
- Display current signer progress.
- Link to the source Safe transaction.
- Mark the policy approved only after the Safe transaction succeeds.
- Do not create a separate SafeRoot signature threshold.

### Acceptance criteria

- The real 2-of-3 Safe approves the source transaction.
- SafeRoot distinguishes proposed, signed, executed, and failed states.
- A failed source transaction cannot activate a policy.

---

## Feature 6 — Cross-Chain Verification Progress

### Purpose

Turn a complex proof lifecycle into an understandable status experience.

### Required stages

1. Safe approved.
2. Ethereum confirmed.
3. Attestcoin evidence available.
4. Verified on Creditcoin.
5. Policy active.

### Requirements

- Update progress without requiring manual user intervention.
- Distinguish waiting from failure.
- Show the latest known status and time.
- Offer an advanced technical-proof view.
- Allow permissionless proof delivery.
- Reject duplicate proofs without changing the policy again.

### Acceptance criteria

- Users do not manually upload proof data during the normal flow.
- The product explains which stage is waiting.
- A valid proof activates the exact policy once.
- An invalid or replayed proof cannot activate or replace policy state.

---

## Feature 7 — Policy Activation

### Purpose

Make an approved policy available only after all bindings are verified on Creditcoin.

### Verification requirements

- Supported Ethereum source network.
- Successful source receipt.
- Approved policy emitter.
- Call authorized by the configured Safe.
- Correct destination chain.
- Correct Creditcoin executor.
- Current policy version.
- Valid activation and expiry.
- Unique proof.

### Acceptance criteria

- A valid policy becomes active.
- A spoofed emitter is rejected.
- An approval from the wrong Safe is rejected.
- A policy for another chain or executor is rejected.
- An older policy version cannot replace a newer version.

---

## Feature 8 — Action Center

### Purpose

Show which approved actions are ready, executed, expired, paused, or blocked.

### Action states

| State | Meaning |
|---|---|
| Draft | Action has not been approved by the Safe |
| Waiting | Policy approval exists but Creditcoin verification is incomplete |
| Ready | Policy is active and the action is eligible |
| Executed | Action completed successfully |
| Expired | Execution window ended |
| Paused | Guardian pause prevents execution |
| Blocked | Submitted action did not match its approved boundaries |

### Requirements

- Display each action in human-readable form.
- Show the source Safe and policy.
- Show expiry.
- Show readiness and execution state.
- Link executed actions to destination transactions.
- Separate legitimate action state from malicious attempt history.

### Acceptance criteria

- All three hackathon actions appear under one policy.
- The user can identify the next available action within five seconds.
- Completed actions cannot execute again.

---

## Feature 9 — Action Execution

### Purpose

Allow any relayer to execute an eligible action exactly as approved.

### Requirements

- Present an execution preview.
- Show target, value, parameters, source policy, expiry, and executor.
- Require the submitted action to match its approved commitment.
- Mark the action used before external interaction is completed.
- Record the result in the policy activity history.
- Provide a clear success or rejection explanation.

### Acceptance criteria

- A valid grant action executes once.
- A valid risk-cap change executes once.
- A valid pause action executes once.
- A duplicate action is rejected.
- An altered amount, target, or parameter is rejected.

---

## Feature 10 — Security Response and Rejection Explanations

### Purpose

Make blocked attacks as understandable as successful actions.

### Required rejection reasons

- Policy not active.
- Policy expired.
- Executor paused.
- Wrong destination chain.
- Wrong executor.
- Wrong target.
- Function not allowed.
- Calldata differs from approval.
- Amount exceeds approval.
- Action already executed.
- Policy version is stale.
- Proof already used.
- Source transaction failed.
- Source emitter not approved.
- Source Safe does not match.

### Example

> **Execution blocked — no funds moved**  
> Approved amount: 25,000 USDC  
> Submitted amount: 100,000 USDC  
> Reason: Amount differs from Safe-approved policy.

### Acceptance criteria

- The user sees a specific reason instead of a generic transaction failure.
- A blocked attempt never changes destination protocol state.
- The attempt appears in the audit history.

---

## Feature 11 — Guardian Pause

### Purpose

Provide a destination-side emergency stop without creating another source of governance authority.

### Guardian permissions

The guardian may:

- Pause unused actions.
- Add an incident reason.
- View affected policies.

The guardian may not:

- Create or approve policies.
- Change action contents.
- Transfer funds.
- Change recipients or parameters.
- Replace the authority Safe.
- Extend expiry.
- Execute an action solely because it is guardian.

### Requirements

- Require explicit pause confirmation.
- Explain which actions will be affected.
- Preserve completed actions.
- Record the guardian and incident reason.
- Use a stricter recovery process than the initial pause action.

### Acceptance criteria

- Guardian pause prevents all remaining actions.
- Guardian cannot move funds or create authority.
- Pause status is visible throughout the product.

---

## Feature 12 — Activity and Audit Trail

### Purpose

Trace every policy and action across Ethereum, Attestcoin, and Creditcoin.

### Activity types

- Policy drafted.
- Submitted to Safe.
- Safe signature added.
- Safe threshold reached.
- Source transaction executed.
- Attestcoin evidence available.
- Policy verified on Creditcoin.
- Action submitted.
- Action executed.
- Action blocked.
- Guardian pause activated.
- Policy expired.
- New policy version activated.

### Requirements

- Show human-readable activity first.
- Link source and destination transactions.
- Provide expandable technical evidence.
- Preserve rejected attempts.
- Identify policy version and action identity.

### Acceptance criteria

- An auditor can trace every executed action to its Safe approval.
- An auditor can confirm that altered attempts did not change state.
- Source and destination evidence is available from one policy record.

---

## 11. Policy Lifecycle

| Policy state | Meaning | Actions executable? |
|---|---|---:|
| Draft | Policy is being created | No |
| Awaiting approval | Submitted to Safe but threshold is incomplete | No |
| Approved on Ethereum | Safe transaction succeeded | No |
| Awaiting evidence | Source approval exists; Attestcoin evidence is not yet available | No |
| Verifying | Evidence has been submitted to Creditcoin | No |
| Active | Policy is verified and within its execution window | Yes |
| Paused | Guardian pause is active | No |
| Expired | Policy execution window ended | No |
| Completed | All actions are executed or otherwise terminal | No |
| Superseded | A newer policy version replaced this policy | No |

### State priority

When multiple conditions apply, the user-facing state follows this priority:

> **Paused → Superseded → Expired → Completed → Active → Verifying → Awaiting evidence → Approved → Awaiting approval → Draft**

---

## 12. Trust and Security Model

### Trusted authority

The configured Ethereum Safe is trusted to authorize the policy according to its own rules.

### Untrusted actors

- Proof workers.
- Action relayers.
- Public transaction submitters.
- User-interface hosting environment.

These actors may transport data but cannot create or modify authority.

### Trusted configuration

- Approved policy-emitter address.
- Supported source-chain identity.
- Creditcoin executor address.
- Integration allowlist.
- Guardian address and limited role.

### Security invariants

1. Only a policy approved by the configured Safe can activate.
2. A policy is valid only for its bound destination chain and executor.
3. Older policy versions cannot replace newer versions.
4. Every action is usable at most once.
5. A changed action cannot remain a member of the approved policy.
6. A relayer never gains authority from transporting evidence.
7. Guardian pause cannot move funds or create policy.
8. Failed source transactions cannot create destination authority.
9. Duplicate proofs cannot repeat activation.
10. External execution cannot reenter and consume an action twice.

---

## 13. Important Product Limitations

### Revocation is not instantaneous

Attestcoin verification includes source-attestation and relay latency. A newer revocation policy can also be delayed or withheld.

MVP mitigation:

- Short policy expiry.
- Increasing policy versions.
- Small, bounded actions.
- Multiple permissionless proof workers.
- Destination guardian pause.

SafeRoot must not claim immediate cross-chain revocation.

### Destination integrations must recognize the executor

The destination protocol must authorize the SafeRoot executor to call the permitted function. SafeRoot cannot control an unrelated contract that has not granted the necessary role.

### Safe ownership is not continuously mirrored

SafeRoot proves a specific Safe-authorized policy transaction. It does not continuously reproduce every Safe configuration detail on Creditcoin.

### SafeRoot proves blockchain authorization, not business wisdom

The product proves that the Safe approved the action. It does not determine whether the decision was financially or operationally correct.

---

## 14. Hackathon MVP Scope

### Must ship

- Real 2-of-3 Safe on Ethereum Sepolia.
- Policy-authoring experience.
- Three action templates.
- Human-readable policy review.
- Genuine Safe policy approval transaction.
- Policy authorization event from the approved source.
- Permissionless Attestcoin proof worker.
- Native verification on Creditcoin CC3.
- Policy version and expiry enforcement.
- Action membership verification.
- Three successful destination actions.
- Duplicate-action prevention.
- Duplicate-proof prevention.
- Wrong-source rejection.
- Wrong-destination rejection.
- Altered-calldata rejection.
- Expired-policy rejection.
- Stale-policy-version rejection.
- Target and function allowlist.
- Reentrancy protection.
- Guardian pause.
- Activity trail linking source and destination.
- Public judge verification instructions.

### Should ship after the core path works

- One real Creditcoin protocol integration.
- Automated relayer redundancy.
- Shareable policy receipt.
- Advanced proof inspection.
- External protocol or DAO pilot statement.
- Gas and execution-cost visibility.

### Do not build for the hackathon

- Multichain destination support.
- Governance voting.
- Relayer token incentives.
- General arbitrary-call interface for normal users.
- Cross-chain treasury dashboard.
- AI policy generation.
- Mobile application.
- Portfolio analytics.
- Instant remote revocation claims.
- Complex role-management system.

---

## 15. Demo Requirements

The demo must begin with the existing Ethereum Safe and end with a Creditcoin state change.

### Demo policy

| Action | Approved effect |
|---|---|
| Contributor grant | Pay exactly 25,000 USDC to Alice DAO |
| Risk-cap update | Set maximum LTV to exactly 68% |
| Emergency pause | Pause new deposits once |

### Three-minute demo sequence

1. Select Acme Treasury Safe and show its 2-of-3 threshold.
2. Open the prepared policy containing three actions.
3. Show the human-readable impact review.
4. Show the genuine Safe approval transaction.
5. Show verification progress from Ethereum through Attestcoin to Creditcoin.
6. Execute the approved 25,000 USDC grant.
7. Attempt an altered 100,000 USDC grant.
8. Show the specific rejection and confirm no funds moved.
9. Activate guardian pause and show remaining actions become unavailable.

### Mandatory judge moments

#### Success

> **Executed exactly as approved.**

#### Tampering protection

> **Blocked — amount differs from Safe-approved policy. No funds moved.**

#### Permissionless transport

> **The relayer delivered authority but never possessed authority.**

### Demo preparation

- Prepare source transactions whose attestations are already available.
- Do not depend on new source attestation arriving during the presentation.
- Use the same deployed contracts and execution paths as the public repository and tests.
- Provide transaction links for every stage.

---

## 16. Adversarial Test Requirements

The project should demonstrate at least the following cases:

1. Valid Safe policy activates.
2. Valid action executes.
3. Second valid action executes independently.
4. Third valid action executes independently.
5. Spoofed policy emitter is rejected.
6. Failed source transaction is rejected.
7. Wrong authority Safe is rejected.
8. Wrong destination chain is rejected.
9. Wrong executor is rejected.
10. Altered target is rejected.
11. Altered function is rejected.
12. Altered calldata is rejected.
13. Increased grant amount is rejected.
14. Invalid action membership evidence is rejected.
15. Duplicate action is rejected.
16. Duplicate Attestcoin proof is rejected.
17. Expired policy is rejected.
18. Not-yet-active policy is rejected.
19. Stale policy version is rejected.
20. Disallowed target is rejected.
21. Disallowed function is rejected.
22. Native-value overflow is rejected.
23. Reentrancy cannot execute an action twice.
24. Guardian pause blocks unused actions.
25. Guardian cannot create or alter policy.

Test quality matters more than an arbitrary test count. Every test should protect a meaningful invariant or demo path.

---

## 17. Success Metrics

### Hackathon success

- One real Safe approval activates one Creditcoin policy.
- Three approved actions execute successfully.
- An altered action is rejected with no destination-state change.
- A duplicate action cannot execute.
- Guardian pause stops remaining actions.
- Judges understand the product within three minutes.
- At least one Creditcoin protocol can explain how it would integrate SafeRoot.

### Product validation metrics

- Number of connected authority Safes.
- Number of activated policies.
- Number and value of executed actions.
- Percentage of actions executed without manual proof handling.
- Median time from Safe approval to active Creditcoin policy.
- Number of destination integrations.
- Number of invalid actions correctly rejected.
- Number of false rejections of valid actions.
- Percentage of policy reviews completed without opening raw calldata.

### North-star metric

> **Value and number of Creditcoin actions safely governed by existing external-chain authorities.**

---

## 18. Business Model

SafeRoot should become infrastructure for protocols and institutional operators rather than a consumer wallet.

### Potential revenue streams

- Policy-activation fee.
- Per-action execution fee.
- Protocol integration fee.
- Enterprise subscription for monitoring, reporting, and support.
- Hosted relayer and reliability service.
- Premium policy templates and compliance exports.

### Potential customers

- Creditcoin protocols.
- DAOs expanding to Creditcoin.
- RWA issuers.
- Stablecoin and payment operators.
- Institutional funds.
- Treasury-management providers.
- Cross-chain governance platforms.

### Long-term position

> **The policy authority layer for Creditcoin’s cross-chain ecosystem.**

---

## 19. Go-to-Market Thesis

### Initial wedge

Target teams that already govern capital or protocol parameters through an Ethereum Safe and need to operate on Creditcoin.

### Initial offer

Provide one integration package with three high-value templates:

- Treasury payment.
- Protocol parameter update.
- Emergency pause.

### Adoption strategy

1. Integrate one Creditcoin protocol.
2. Demonstrate governance through a real Ethereum Safe.
3. Publish an integration and threat-model guide.
4. Add templates for common Creditcoin protocol roles.
5. Expand into a registry of verified integrations.
6. Add multiple source and destination chains only after the Creditcoin flow is proven.

### Credibility milestone

The most valuable post-hackathon evidence is not a large number of mock integrations. It is one real protocol allowing a SafeRoot executor to control a narrowly defined production or testnet function.

---

## 20. Competitive Positioning

| Alternative | What it provides | SafeRoot difference |
|---|---|---|
| Separate destination Safe | Independent destination authority | Reuses the existing Ethereum Safe as continuing authority |
| Centralized webhook | Fast event delivery | Creditcoin verifies evidence instead of trusting the operator’s conclusion |
| Generic bridge messaging | Cross-chain message delivery | Uses Attestcoin-verified source history and bounded pull execution |
| Safe transaction indexing | Source transaction visibility | Turns source approval into enforceable Creditcoin authority |
| Broad destination admin role | Flexible control | Restricts execution to exact policy contents |

The defensible originality claim is:

> **SafeRoot uses an existing Ethereum Safe approval, verified through Attestcoin, to authorize tightly bounded and permissionlessly relayed actions on Creditcoin.**

Do not claim that cross-chain governance or Merkle-based action commitments are unprecedented.

---

## 21. Key Product Risks

### Risk 1 — Generic cross-chain governance perception

Judges may ask why SafeRoot must exist specifically on Creditcoin.

**Mitigation:** Integrate one real Creditcoin protocol and demonstrate a meaningful destination state change.

### Risk 2 — Revocation latency

A harmful policy may remain executable until expiry or guardian pause.

**Mitigation:** Short expiry, small action boundaries, increasing policy versions, multiple relayers, and local pause.

### Risk 3 — Product becomes a developer console

Raw roots, leaves, proofs, and calldata can overwhelm operators.

**Mitigation:** Human-readable templates, progressive disclosure, and one primary task per screen.

### Risk 4 — Broad executor permissions

An integration may grant the executor more authority than the policy interface communicates.

**Mitigation:** Narrow integration roles, target and function allowlists, explicit templates, and public permission review.

### Risk 5 — Demo depends on attestation timing

Waiting for new source evidence can break the judging flow.

**Mitigation:** Use already-attested source transactions while separately proving the live pipeline exists.

### Risk 6 — Security complexity reduces delivery quality

Too many policy modes create an unauditable MVP.

**Mitigation:** One Safe, one source chain, one destination executor, three fixed action types, and one pause role.

---

## 22. Open Product Decisions

1. **Exact values or bounded values?**  
   Recommendation: use exact values in the hackathon MVP. Add bounded templates later.

2. **Who pays destination execution fees?**  
   Recommendation: permissionless relayer for MVP; sponsored execution is a later service.

3. **Can the guardian resume actions?**  
   Recommendation: no unilateral resume. Require a new Safe-approved policy or a narrowly defined recovery process.

4. **Should actions execute automatically?**  
   Recommendation: make proof delivery automatic but action execution explicit in the MVP.

5. **Can one policy target several protocols?**  
   Recommendation: yes conceptually, but limit the MVP to a small allowlist under one verified executor.

6. **Should custom calldata be available?**  
   Recommendation: advanced-only and clearly labeled as higher risk.

7. **What constitutes a verified integration?**  
   Recommendation: published target, permitted functions, granted role, and reviewed template definitions.

---

## 23. Roadmap

### Phase 1 — Hackathon proof

- Ethereum Sepolia Safe.
- Creditcoin CC3 executor.
- Three fixed actions.
- Attestcoin proof worker.
- Guardian pause.
- Full adversarial demonstration.

### Phase 2 — Integration product

- Verified integration registry.
- Reusable action templates.
- Hosted proof and execution reliability.
- Policy reporting and notifications.
- Protocol onboarding documentation.

### Phase 3 — Institutional controls

- Multiple authority Safes.
- Controlled bounded-value templates.
- Policy scheduling.
- Compliance exports.
- Approval analytics.
- Multiple independent guardians.

### Phase 4 — Cross-chain policy network

- Additional supported source chains.
- Additional supported destination chains.
- Standard policy interface for protocols.
- Relayer service-level agreements.
- Organization-wide policy management.

---

## 24. Final MVP Definition

SafeRoot Policy v1 is:

> A Creditcoin execution layer where one existing Ethereum Safe approves a short-lived policy containing three exact actions, Attestcoin proves that approval, any relayer can submit eligible actions, and altered or replayed actions are rejected.

The MVP is complete only when all seven outcomes are demonstrated:

1. A real 2-of-3 Safe approves the policy.
2. Creditcoin verifies the Safe approval through Attestcoin.
3. The policy becomes active only on its bound executor.
4. Three approved actions execute successfully.
5. An altered action is rejected and moves no funds.
6. An already-used action cannot execute again.
7. Guardian pause blocks all remaining actions without granting new authority.

Everything else is secondary.

---

## 25. Final Pitch Narrative

Acme already protects its treasury and governance through a 2-of-3 Ethereum Safe.

Now Acme wants to operate on Creditcoin. It could deploy another independent multisig, repeat its signer configuration, and accept the risk that the two systems eventually diverge.

Or it can use SafeRoot.

Acme creates one policy containing three Creditcoin actions: pay a contributor grant, update a lending risk cap, and authorize an emergency pause. Its existing Ethereum Safe approves the policy.

Attestcoin proves that exact approval to Creditcoin. Any relayer can deliver the proof and execute an approved action, but no relayer can increase the grant, change the recipient, call another contract, or reuse the action.

The approved 25,000 USDC payment executes.

The altered 100,000 USDC payment is blocked. No funds move.

The organization keeps the Safe it already trusts. Creditcoin receives verifiable authority. Relayers deliver actions without controlling them.

> **SafeRoot Policy: one Ethereum Safe approval, bounded execution on Creditcoin.**

