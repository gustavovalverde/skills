# Remediation

Use this phase for a requested fix implementation or fix review once the claim and remediation boundary are established. A task completion, passing suite, or reviewer agreement is not proof of a complete fix.

Read the [policy](policy.md) and [contract questions](product-contract.md), and the [workspace procedure](workspace.md) when creating or handing off records.

## Scope and authority

Resolve the case's accepted claims, canonical owner, current evidence, holds, and requested action. Reuse current assessment instead of repeating intake. Material doubt about validity or scope goes back to [assessment](assessment.md); do not silently enlarge the advisory while fixing it. Established ordinary hardening can be handled as ordinary engineering without manufacturing advisory acceptance.

Distinguish implementation from review-only requests. Explicit authorization to fix permits local source edits and appropriate defensive tests within that scope; it does not authorize commits, pushes, merges, remote PR/advisory writes, publication, or contact. Reuse existing action-specific authority without asking again. A new public contract or migration not covered by that authority needs a concrete decision before dependent implementation. Continue independent authorized work while that decision is pending.

Do not execute reporter code, reproduce exploits, probe live targets, or conduct autonomous vulnerability discovery. Review supplied observations as supplied evidence. Use synthetic defensive invariant tests and legitimate-flow controls for the changed code. An unavailable proof stays a named gap, not a reason to claim success or weaken the contract.

## Define acceptance before implementation

Pin the source checkout, exact base revision, target release line, and private case location. Read the repository's AGENTS.md, SECURITY.md, CONTRIBUTING.md, applicable docs, public types, endpoint metadata, and relevant history. A previously inspected base is not necessarily the current target; record any deliberate older-base work and its integration requirement.

Write a claim-level acceptance matrix using the [remediation review template](../assets/remediation-review.template.md). For each established claim, record:

- The failed guarantee, relevant actor authority, and exact supported surfaces/configurations.
- The intended invariant after the fix and the legitimate behavior that must remain possible, including server API and inferred client usage where applicable.
- The affected producer, consumer, persistence, and final authority decisions; related accepted claims and shared-code owners.
- Required evidence and meaningful positive controls, with exclusions justified against the contract rather than chosen for convenience.

Keep private records under the case's ignored `remediation/` directory. Ignored notes do not transfer with a worktree: use the explicit case path or an approved checkpoint, verify audience/access, and preserve source provenance. Do not copy unrelated confidential case records into a new checkout or a skill repository.

## Review the design against the framework

Design from existing developer tasks and supported guarantees. Prefer ownership inside the affected feature or plugin when possible; use a shared core operation when multiple supported flows must enforce the same invariant. Applications should not coordinate internal locks, plugin cleanup order, or storage generations. Existing patterns are evidence, not proof that an abstraction is adequate.

Review the dimensions affected by this patch, marking others not applicable with a reason:

- **Authority and lifecycle:** check both issuance and use of durable credentials; distinguish cached observations from authoritative state and a point-in-time check from a reusable capability.
- **Persistence and failure:** establish atomicity from actual adapter primitives, affected-row results, and persisted postconditions. Awaiting a hook or write does not prove it happened; hooks may veto or transform it. Enumeration through an index does not prove complete revocation.
- **Concurrency and recovery:** consider an in-flight write, an expired lease, competing workers, crash or lost response, proof consumption, retry, and partial cleanup where these affect the invariant. A lease alone does not fence writers; external hook effects are not exactly-once without their own mechanism.
- **Public contracts:** inspect canonical usage, exported/inferred types, endpoint metadata, custom hooks/authorizers/adapters, configuration defaults, and error semantics. Do not assume custom callbacks obey a stronger contract than the public API requires.
- **Compatibility:** account for stored records, pending ceremonies, wire formats, key rotation, mixed-version nodes, schema rollout, and supported runtimes/storage modes. Removing a vulnerable flow or failing closed may be containment while still breaking promised functionality.
- **Composition:** identify other fixes that touch the same helper, storage namespace, lifecycle, or public contract. One canonical implementation owns each shared change; duplicate advisories inherit its actual coverage and blockers.

For a material tradeoff, record the smallest viable options, guarantees, compatibility costs, recommendation, and exact decision needed. Do not treat a design proposal as implemented, silently narrow supported configurations, or infer stable-release approval from a patch changeset. Read current release policy rather than hard-coding a release track.

## Implement and validate the bounded change

Follow repository tooling and testing instructions. Use a failing defensive test first where required, then the smallest coherent correction. Keep tests about the invariant and supported behavior, not a copy of the implementation. Preserve successful authentication, redirects, recovery, custom storage/configuration, and other affected legitimate outcomes; negative tests alone cannot qualify the fix.

Select checks from the acceptance matrix: focused tests, affected neighbors, public type/canonical usage checks, and relevant build/adapter checks. Verify tests load the intended source or rebuilt package artifacts. Classify each failure as introduced, baseline-proven on the exact comparison revision, environment-blocked, or unresolved. Do not rewrite legitimate failing tests to bless a broken contract. Unavailable dependencies, uncollected tests, skipped cases, and canceled commands are not passes.

Record command, revision or patch digest, environment/configuration, result, and evidence location. Distinguish tests actually observed from owner-reported or historical results. Preserve valid unchanged checks; rerun only what changed inputs or unresolved concerns invalidate. Avoid launching unrestricted repository-wide suites or many heavy checks concurrently when focused evidence suffices.

## Independently assess and integrate

Review the actual final production diff and surrounding contract independently of the implementation summary. A separate reviewer/session is useful when available and authorized; it is not a substitute for source inspection. If the same agent performs review, disclose that limit and perform a distinct review pass. If coordinating existing tasks, send concrete findings to each owner using the available task communication tools, then inspect the returned correction. Dispatch or owner self-certification never counts as acceptance.

Bind the review to the exact commit or complete working-tree patch digest. Include staged and untracked source files, and check that the retained patch represents the checkout. Relevant changes invalidate affected review/test evidence. Base HEAD alone does not identify an uncommitted candidate.

For an uncommitted snapshot, capture tracked changes against the recorded base, not just unstaged `git diff`, and include intended untracked production, test, and changeset files. Preserve binary changes, modes, renames, and deletions. Compare the patch file inventory and resulting contents with the checkout before hashing the retained patch bytes with SHA-256. Reverse-application success alone does not prove equality: unrelated edits may still remain. Keep private notes out of the source patch; store their evidence references separately.

When fixes interact, assemble them in an isolated private integration checkout, never in another advisory's temporary fork, preserve individual provenance, and deduplicate shared changes. Review the combined diff and run the combined acceptance matrix, including affected positive flows, against that exact integrated revision. Individual green worktrees do not prove joint correctness. If integration is outside the request or blocked, complete the individual review but leave integration explicitly unqualified. Backports and alternate release lines require their own relevant review and validation.

A review may assemble existing patches in a disposable checkout for verification without editing the owners' source. Conflict resolutions that introduce new behavior are corrective implementation, not merely assembly; require implementation authority and review the resulting change. Record an unresolved conflict as an integration blocker rather than silently choosing semantics.

## Verdict and handoff

Use the [review template](../assets/remediation-review.template.md) for each case. Report separate conclusions:

- **Remediation:** complete for the stated scope, partial, or unresolved. A material correctness or legitimate-flow gap prevents complete. State whether evidence is source-only, locally tested, or broader.
- **Integration:** verified at an exact combined revision, not required with rationale, or pending/blocked. Do not use not-required to hide known overlaps.
- **Merge recommendation:** ready only when applicable acceptance checks and independent review pass, required contract/migration decisions are recorded, and integration is qualified. Otherwise list blockers, owners, and the next action. This is a recommendation, not merge authority.
- **Release/disclosure:** unverified here unless separately established. A local patch, merge, installable package, deployment qualification, and disclosure are distinct milestones. Route release grouping to [release planning](release.md) and a disclosure review to [readiness](readiness.md).

Update the existing case's triage.md and continuity pointers without changing its assessment verdict or advisory state to mean “fix done.” Link the remediation artifacts; preserve the established case schema. Record reviewer identity/time, exact patch, strongest counterevidence, observed checks, unresolved coverage, decisions, and correction outcomes. Do not claim certainty or architectural approval beyond that evidence.
