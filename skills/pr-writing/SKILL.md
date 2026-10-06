---
name: pr-writing
description: Write or revise pull request titles and descriptions, commit messages, changesets, changelog entries, and release notes. Use when opening or updating a pull request, describing a diff or a stacked change for reviewers, or summarizing a change for users, even in a single sentence. Not for design documents or ADRs (docs-writing) or for reviewing the code itself.
license: MIT
---

# Write a pull request

Write for the reviewer approving the change: the behavior it adds, removes, or corrects, and what they cannot reconstruct from the diff.

## Approach

Use the current diff and available evidence. Follow repository title conventions, templates, and reporting requirements, and preserve the status of proposed work and unrun checks.

Title the change a reviewer is approving. When one title cannot honestly cover the change, split the pull request. In a stack, each title and body covers only its own layer; mention another layer only when this one depends on it, and leave stack position to the platform.

Lead with the concrete problem and resulting behavior, in terms a reader who never opened the code can follow. Then explain the design choice, changed contract, or tradeoff that reviewers cannot reconstruct from the diff.

Scale the body to the change. When the file diff shows the whole change, a short paragraph is enough. A cross-cutting change may need a review map grouped by concern. Keep file references and identifiers that help locate important behavior rather than narrating every file.

Add a visual only for what the file diff does not show at a glance: commands or output before and after, a restructure as a file tree, comparable sources as a table, or a failure as its real output. Condense a behavior change that the diff spreads across files or buries in prose, and skip restating a diff a reviewer can read in seconds. [Representations](references/representations.md) lists the shapes and when each fits.

Give reviewers evidence they can check: a test that failed and now passes, real output, or a screenshot for a visual change. Claim only what the evidence states, and mark inferences as such. Build file and line links with [the permalink script](scripts/permalink.py), which pins the commit and checks that the lines exist. When the change aligns with an external fact, follow [citing sources](references/citations.md).

## Gotchas

- Breaking behavior, required migration, dependencies, consequential assumptions, and unresolved risks stay visible. Optional detail may be collapsed; required actions may not.
- Say when a change is hard to reverse, such as a data migration, a deletion, or a published contract, and what it can affect beyond the diff.
- Drafting history, follow-up plans, and checks CI already reports are noise for reviewers. Issue links and backport context that affect review or landing are not.
- A required template is filled truthfully, with unmet items left unchecked. Manufactured command logs and ceremonial sections are not evidence.

## Finish

Check that the title and description match the final scope and stand alone.

For commit messages, changesets, or release notes, use [change artifacts](references/change-artifacts.md). Those readers need a different emphasis from reviewers, though an impact statement may appear in both when each audience needs it.
