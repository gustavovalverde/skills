# Writing

Draft or revise an advisory body and metadata from a reviewed assessment. Read [authorized updates](github-updates.md) before any write.

## Check prerequisites

Read the case, assessment checkpoint, available human acceptance record, live advisory and discussion, and requested changes. For an unpublished disclosure, acceptance must cover these claims; metadata approval alone is insufficient. Without acceptance, prepare a recommendation in `triage.md` and pause before creating the disclosure body. For an explicitly requested read-only review of an already-published advisory, apply the [policy](policy.md)'s retrospective exception and produce review-only artifacts from the current assessment and published scope.

Reuse a current reviewed assessment. Route only material unsupported or changed claims, ranges, contracts, or impact to [assessment](assessment.md). Wording cleanup does not require repeated technical analysis. An exact duplicate with no material contribution needs closure text, not a canonical rewrite.

For explicitly offline drafting, use supplied assessment and source snapshots, record their dates and access limitations in `triage.md`, and label the result provisional pending live reconciliation. This permits a local draft, not a freshness claim, authorized update, or ready-to-publish conclusion. The same acceptance or retrospective-review prerequisite applies.

## Draft for affected developers

Use the [advisory template](../assets/advisory.template.md) and the [editorial review](editorial-review.md). Store only the disclosure body in `advisory.md`; keep scoring reasoning, private evidence, and approvals in `triage.md`. Follow the editorial review's rule for credits and the advisory's own CVE ID. If an existing Credit section names anyone missing from the metadata credits, record a blocker and propose the credits change under its own authority before removing the section.

For a retrospective review, use `advisory.review.md` and `metadata.review.json` instead. Keep review status outside the copyable body, in `triage.md` and the handoff response. Run the same draft check below with those filenames. Return the requested standardized candidate even if its metadata delta is empty; an accurate existing advisory need not be changed remotely.

Prepare a separate metadata proposal from the same evidence: a title that starts with an affected package, the package and ecosystem, complete affected and fixed ranges written with [release lines and ranges](releases.md), a CWE, and a `cvss_vector_string` chosen with the [scoring rubric](scoring.md). Show the current-to-proposed delta and explain material changes. No change is valid when the existing content is accurate.

Run the local checks:

```sh
node "$SKILL/scripts/check-draft.mjs" CASE_DIRECTORY/advisory.md CASE_DIRECTORY/metadata-proposal.json
```

The proposal is for review, not an instruction to send a request. Omit the second argument for prose-only work. When the repository keeps its own advisory template, follow that template instead of the editorial structure and add `--metadata-only`, which keeps the rules that apply to any advisory (CWE, CVSS 3.1 vector, complete package ranges, and no unfinished text) and skips this skill's section and title conventions. The check detects missing or extra sections, scaffold text, restated severity, a proposal without a CWE or a CVSS 3.1 vector, a title that does not start with an affected package, closed ranges without a patched version, and forbidden fields. Warnings, which do not fail the check, flag opening sections that run past about 250 words or 10 code spans, a kept Credit section, and CVE IDs in the body. Neither establishes factual truth or readability.

To find existing draft or published advisories that no longer meet these rules, such as one that restates its own CVE ID or has only a CVSS 4.0 vector, run the same checks over live advisories. The audit only reads GitHub; revise each finding through the normal drafting and approval steps. Add `--metadata-only` for a repository that uses its own template, so house-style differences do not hide metadata problems.

```sh
node "$SKILL/scripts/audit-advisories.mjs" OWNER/REPO [--state draft,published] [GHSA-ID ...] [--metadata-only] [--json]
```

## Review, then optionally apply

Return the advisory link, copyable body, metadata delta, and uncertainty. Drafting permission does not authorize a write. When the case and fields are explicitly authorized, follow [authorized updates](github-updates.md) and its update helper: the dry run records the baseline and payload the approval covers, and `--apply` sends exactly that payload only while the live advisory still matches the baseline, then re-fetches to catch ignored or unexpected changes. Reconcile a changed baseline and review a new dry run before retrying. Record the result and exact draft revision, and preserve state, credits, collaborators, CVE, and fork fields.

Record the assessment revision, draft and metadata artifact revisions, proposed or observed changes, authority, and next action in `triage.md` and `case.json`. Checkpoint with the [workspace procedure](workspace.md) before changing an existing draft and after completing the requested work, preserving prior approved revisions.

Stop after the requested draft or update. Publication is a separate human gate evaluated in [readiness](readiness.md).
