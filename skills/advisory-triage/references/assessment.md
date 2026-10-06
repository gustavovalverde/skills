# Assessment

Assess an existing report against its supported contract, scoped evidence, impact, versions, and duplicate coverage. Current intake evidence satisfies the prerequisite; if history or scope is missing, use [intake](intake.md) only for that gap. Read the [contract questions](product-contract.md) before deciding.

## Establish each claim

1. Pin reported versions, discovered current refs, and the exact source revisions inspected. Read the security policy, release-era documentation, public and inferred types, endpoint metadata where the project has it, tests, source history, and published artifacts.
2. Establish who supplies the decisive input and what authority they already hold. Distinguish operators, tenant administrators, users, external providers, and unauthenticated callers. State the supported capability and the alleged failed guarantee.
3. Trace the reported source, control, and sink path, or the defeating guard, through supported surfaces. Record evidence and counterevidence for reachability, prerequisites, guarantee failure, and additional protected impact. Long-standing behavior is not proof of intent.
4. Separate source findings, supplied observations, historical executions, and current observations. Review supplied reproduction evidence without executing its code. If the verdict depends on unavailable runtime proof, record the exact specialist-validation question and remain unresolved. An internally forged call or a proposed fix cannot fill that gap.
5. For confirmed claims, document relevant configurations and supplied adjacent claims in `variants.md` when useful. Use a bounded matrix: path or configuration, intended invariant, evidence revision, observed control, coverage result, and gap. This is defensive coverage of the reported issue, not autonomous vulnerability discovery.
6. Compare duplicate coverage per claim, then establish branch states and the introduction, fix, release, and report chronology. Find the first release containing the fix on every release line with [release lines and ranges](releases.md). Apply the support policy without rewriting historical promises.
7. Decide verdict and disposition independently. Explain advisory versus expected capability, misuse, hardening, ordinary bug, documentation work, or exclusion. For an established vulnerability, choose CVSS metrics with the [scoring rubric](scoring.md), compare the case with its worked examples, and record metric evidence separately from operational priority.

## Completion

Update `case.json` and `triage.md` with counterevidence, gaps, exact SHAs, timestamps, and a reporter-ready response. Validate with the [workspace helper](workspace.md), checkpoint the conclusion, and explain any reversal.

Return an evidence-backed recommendation, not an acceptance claim. Stop at material gaps or the human disposition gate. Once acceptance is verified and drafting is requested, [writing](writing.md) consumes the assessment. A remediation plan or a passing fix is not required to recommend acceptance.
