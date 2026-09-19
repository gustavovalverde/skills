---
name: write-pr
description: Draft or revise pull request titles and descriptions from the change and its evidence. Also supports commit messages and release notes.
license: MIT
---

# Write a pull request

Use the current diff and available evidence. Follow repository title conventions, templates, and applicable reporting requirements. Preserve the status of proposed work and unrun checks.

Lead with the concrete problem and resulting behavior. Add a before-and-after example when it clarifies the change. Explain the design choice, changed contract, or tradeoff that reviewers cannot readily reconstruct from the diff.

Scale the body to the change. A small fix may need one paragraph; a cross-cutting change may need a review map grouped by concern. Keep file references and internal identifiers when they help locate or assess important behavior, rather than narrating every changed file.

Keep breaking behavior, required migration, dependencies, consequential assumptions, and unresolved risks visible. Optional exhaustive detail may be collapsed; required actions must not be. Generated summaries belong after the authored explanation and can be removed when redundant.

Retain issue links and backport context that affect review or landing. Remove drafting history and irrelevant planning labels. Verification evidence must be accurate and follow the user's and repository's reporting rules; do not manufacture command logs or ceremonial sections.

Choose a representation for the review question: a focused before-and-after or diff for changed behavior, a sequence for ordering, a shallow tree for ownership, or a table for comparable contracts. Keep prose for rationale. Include only the detail needed to explain the point, but show the complete example when a fragment would hide a critical condition or boundary. A visual is optional; place it beside the explanation it supports. Finish by checking that the description matches the final scope and stands alone.

For commit messages or release notes, use [change artifacts](references/change-artifacts.md). These readers need a different emphasis from reviewers; an impact statement may appear in both when each audience needs it. No additional style skill is required.

Consult [sources and scope](references/sources.md) when attribution or a comparison of explanation techniques is requested.
