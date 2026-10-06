---
name: backlog-triage
description: Triage GitHub issues and pull requests, including validity, duplicates, competing implementations, canonical issues, and native organization such as issue types, sub-issues, and blocking links. Use when assessing a backlog batch or area, continuing earlier triage, checking whether a single issue or pull request duplicates or supersedes other work, or preparing comments, closures, and metadata updates. Not for security vulnerability reports (advisory-triage) or for reviewing a pull request's code.
license: MIT
---

# Triage a GitHub backlog

Assess a bounded problem group: the requested behavior, related issues, implementation candidates, and relevant historical fixes. When a canonical issue exists or is warranted, it owns the problem and selected pull requests own implementations; a focused standalone pull request can remain a group without an issue.

## Start or resume

Resolve the repository, source checkout, requested outcome, existing records, and action-specific authority. Read the repository's instructions, contribution guide, and security policy. When an installed skill profiles this repository's contracts, packages, and branches, load it; it refines these defaults. Local notes are prior evidence, not current GitHub state.

Choose the needed work without rerunning completed phases:

| Request | Read | Deliver |
| --- | --- | --- |
| Latest files, next batch, area inventory, or continuation | [Workspace](references/workspace.md) | Records, bounded coverage, freshness, and next groups |
| Validity, duplicates, canonical selection, or quick wins | [Assessment](references/assessment.md) | Reconciled recommendation with precise evidence gaps |
| Types, labels, trackers, dependencies, milestones, or Projects | [GitHub primitives](references/github-native.md) | Native changes the assessment justifies |
| Comments, closures, or approved metadata updates | [GitHub primitives](references/github-native.md) | Scoped operations, fresh preflight, receipts, and readback |
| Maintain or evaluate this skill | [Evaluation](references/evaluation.md) | Synthetic replay, scored outcomes, and limits |

Use workspace records for batches, large discussions, or work that must resume; a one-off assessment can stay a concise answer. Organizing and applying reuse current assessed evidence. Return to the assessment when classification, scope, relationships, or canonical selection are unresolved or have changed; a narrow metadata request still needs the evidence that justifies its field.

## Decide

Read the full report and material discussion. Compare the requested outcome, exact public API, and every material criterion against the supported contract, the exact source revision, relevant published artifacts, and inspected pull request heads. Keep work kind, criterion satisfaction, availability, relationship, viability, and action separate.

Select implementations on correctness, contract, architecture, and evidence. Use contributor history or submission order only under an adopted tie-break policy for comparable candidates. When an alternate supported integration could retire the requested work, deliver the [scope-decision handoff](references/assessment.md#scope-decision-handoff) with implementation links and verified availability, without inferring acceptance or claiming the requested interface exists. For parallel work, follow the [coordination contract](references/assessment.md#coordination): workers report evidence, and the coordinator resolves disagreements and owns group edits and GitHub writes.

## Gotchas

- A reproduction, label, linked pull request, or old assessment does not establish validity on its own.
- Similarity only identifies candidates. A duplicate or replacement recommendation accounts for the complete material scope, unique useful work, and every known overlapping pull request, including standalone ones.
- Fixed historical Bugs remain Bugs, and merged does not mean released or complete.
- Extra tests do not keep an obsolete pull request open by themselves; unmet material behavior needs an owner or a scope decision.
- Native issue types, duplicate state, sub-issues, blocking links, and Development links already carry their facts. Mirroring them in labels or custom statuses creates drift; labels the repository's own process requires still apply.
- A public issue can describe a possible vulnerability. Keep exploit detail out of public replies, follow the repository's security policy for private handling, and hand it to `advisory-triage` when available.
- Analysis does not authorize external changes. Comments, metadata, closures, pushes, and merges are distinct actions.

## Finish

Before applying authorized operations, follow the preflight and readback steps in [GitHub primitives](references/github-native.md). Return verified recommendations with evidence, remaining decisions, and the next action, keeping assessed, verified, authorized, and applied results distinct. Structural record validation does not prove semantic correctness or live freshness.
