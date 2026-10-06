# Readiness

Review an accepted advisory for disclosure readiness using the final body, metadata, remediation and release evidence, and human approvals. Read [authorized updates](github-updates.md) for lifecycle guidance and the [editorial review](editorial-review.md) before reviewing.

Review the evidence independently of the author's conclusion, in the same session or a fresh session with approved record access. Passing validators and previous approvals prove only their stated scope.

## Review the candidate

For a requested retrospective review, assess the published content and any review-only candidate separately from readiness for a new action. Missing historical approvals are unknown provenance, not proof that the past publication was improper. Report content accuracy and remaining evidence gaps; do not require a new acceptance or publication event just to finish the local review. Any recommendation for a new disclosure action still requires the checks below.

Use the [readiness template](../assets/readiness.template.md). For every applicable check, record pass, blocker, or not applicable, with evidence revision and timestamp:

1. The human accepted these claims. Contract conclusions and duplicate coverage are current, and no material contradiction is hidden in the rollup.
2. The final body and metadata agree with the assessment. Require concrete affected conditions, bounded impact, a CWE, a CVSS 3.1 vector, verified upgrade or workaround guidance, and ranges that follow [release lines and ranges](releases.md), with any corrected range matched by a body change.
3. Normal remediation has a reviewed fix, appropriate regression evidence, a verified public-branch result, and installable fixed packages for every affected package. Distinguish supplied from observed tests, source fixes from shipped artifacts, and pull request review from merge.
4. Every release line is checked as [release lines and ranges](releases.md) describes. An affected line that the ranges and Patches do not account for is a blocker.
5. For policy-driven disclosure without a fix, review the named maintainer's documented exception and truthful unfixed status instead of inventing milestones. A deadline does not authorize publication.
6. Scoped variant coverage supports the disclosed scope, and unexamined configurations are identified. Material uncertainty about scope or impact blocks an unqualified disclosure.
7. Credits and applicable reporter consent, the CVE decision, partner coordination, and timing have recorded dispositions and owners. The body follows the editorial review's rule for credits and its own CVE ID. This does not authorize contact or credit changes.
8. The disclosure excludes private investigation, executable reproductions, secrets, and inaccessible evidence links. Reviewer evidence remains retrievable after the temporary fork is deleted.

## Decision

Write the case's `readiness.md` with reviewed revisions, check results, blockers and owners, and a ready or not-ready recommendation. If an owner is unknown, say "owner unknown; assign owner" rather than inventing one. Every blocker needs resolution or an explicit applicable exception before recommending ready. Missing live evidence remains a blocker; offline drafts are not verified disclosure candidates.

Record the review in `triage.md` and `continuity.next_action`. Changes to scope, body, metadata, patch, ranges, or releases invalidate the affected checks. Return the advisory link and the exact human decision needed. Stop before publication, release, merge, or CVE request.

After human publication, a requested verification may read live state, body, ranges, and links; the read-only audit described in [writing](writing.md) runs the draft checks over live advisories. Report discrepancies without silently repairing them.

For a new publication decision, also run the workspace validator with `--ready --publication-check`. It checks record completeness and lifecycle chronology, not human approval, factual accuracy, or every readiness criterion above.
