---
name: pr-writing
description: Draft or revise pull request titles and descriptions from the change and its evidence. Also supports commit messages and release notes.
license: MIT
---

# Write a pull request

Use the current diff and available evidence. Follow repository title conventions, templates, and applicable reporting requirements. Preserve the status of proposed work and unrun checks.

Title the change a reviewer is approving: the behavior added, removed, or corrected. When one title cannot honestly cover the change, split the pull request. In a stack, each title and body covers only its own layer; mention another layer only when this one depends on it, and leave stack position to the platform.

Lead with the concrete problem and resulting behavior, in terms a reader who never opened the code can follow. Explain the design choice, changed contract, or tradeoff that reviewers cannot reconstruct from the diff.

Scale the body to the change. When the file diff shows the whole change, a short paragraph is enough. A cross-cutting change may need a review map grouped by concern. Keep file references and identifiers that help locate important behavior rather than narrating every file.

Keep breaking behavior, required migration, dependencies, consequential assumptions, and unresolved risks visible. Say when a change is hard to reverse, such as a data migration, a deletion, or a published contract, and what it can affect beyond the diff. Optional detail may be collapsed; required actions must not be.

Write for the reviewer. Retain issue links and backport context that affect review or landing. Leave out drafting history, follow-up plans, and checks that CI already reports. Do not manufacture command logs or ceremonial sections. Fill a required template truthfully and leave unmet items unchecked.

Add a visual only for what the file diff does not show at a glance: commands or output before and after, a restructure as a file tree, comparable sources as a table, a failure as its real output. Do not restate a diff a reviewer can read in seconds, such as a sentence of added prose; do condense a behavior change the diff spreads across files or buries in prose. [Representations](references/representations.md) lists the shapes and when each fits.

Give reviewers evidence they can check: a test that failed and now passes, real output, or a screenshot for a visual change. Claim only what the evidence states and mark inferences as such. Build file and line links with [the permalink script](scripts/permalink.py), which pins the commit and checks that the lines exist. When the change aligns with an external fact, follow [citing sources](references/citations.md).

Finish by checking that the title and description match the final scope and stand alone.

For commit messages or release notes, use [change artifacts](references/change-artifacts.md). These readers need a different emphasis from reviewers; an impact statement may appear in both when each audience needs it. No additional style skill is required.

Consult [sources and scope](references/sources.md) when attribution or a comparison of explanation techniques is requested.
