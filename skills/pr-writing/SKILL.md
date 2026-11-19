---
name: pr-writing
description: Write or revise pull request titles and descriptions, commit messages, changesets, changelog entries, and release notes. Use when opening or updating a pull request, describing a diff or a stacked change for reviewers, or summarizing a change for users, even in a single sentence. Not for design documents or ADRs (docs-writing) or for reviewing the code itself.
license: MIT
---

# Write a pull request

Write for the reviewer deciding whether to approve: what changes and why, what to check, and what could go wrong. Leave out the rest; a reviewer who needs more will ask.

## Approach

1. **Find the structure.** Read repository instructions and its PR template for sections, titles, and required metadata. When the user asks for their usual style, inspect a few recent PRs. Choose one structure that meets those requirements rather than combining templates.
2. **Size the body to the change.** A small fix usually needs one paragraph: problem, new behavior, and evidence. Add sections when reviewers need more context. Use [the default structure](references/structure.md) when repository guidance leaves the choice open. Stay under 400 words outside code blocks.
3. **Title one behavior**, in 72 characters or fewer including the prefix. A stacked PR's title and body cover its own layer.
4. **Describe the completed change.** State the caller's problem, then the new behavior in at most three sentences. Give actions a clear subject: "The endpoint rejects reused assertions." Reserve instructions for actions the reviewer or operator must take.
5. **Explain decisions reviewers would question:** the constraint behind the design, required user action, a compatibility boundary, or the governing specification. Separate each decision from its reason and failure behavior when a sentence becomes crowded. Use a visual when it explains more clearly than prose; [representations](references/representations.md) lists the shapes.
6. **Show observed evidence:** a test failing before and passing after, real output, or a screenshot. Preserve uncertainty about untested behavior. Build file links with [the permalink script](scripts/permalink.py); follow [citing sources](references/citations.md) for external facts.
7. **State the merge danger only when it is not obvious:** a revert does not fully undo the change, the change becomes a public contract on release, or a defect would reach further than the diff suggests.
8. **Edit, then check limits.** Use concrete subjects and verbs, readable validation sentences, and only the terminology reviewers need. For an editorial review, use `text-editing` when available; pass the draft, verified facts, required structure, and length budget. Run `node scripts/check-body.mjs BODY.md --title "..."`; its length checks do not assess writing quality.

## Gotchas

- Keep the working session out of the body. Retain a rationale when it explains a choice reviewers would otherwise question.
- Evidence is a result, not a test plan. Lists of test files, test counts, or commands restate the diff and CI.
- Distinguish our policy, a framework default, and a protocol requirement; preserve each qualification when shortening.
- Say each point once. A visual replaces the prose it illustrates, and reviewer notes do not repeat the Summary, the diff, or a bot-generated summary.
- Name the evidence: "The tests pass for clock differences up to 60 seconds," rather than "Clock differences pass."
- Breaking behavior, required migrations, and unresolved risks stay visible, never collapsed.
- Fill a required template truthfully and leave unmet items unchecked.
- When the PR changes, rewrite the affected section to match the final diff instead of appending. A fix for a review comment belongs in a reply on that thread, and changes the body only when it changes what the PR does.

## Finish

Delete each sentence the reviewer would not miss. For prose edits, preserve accepted structure, facts, sources, and required metadata; keep the revision no longer unless the user requests expansion. Check that the title and body match the final diff and stand alone.

For commit messages, changesets, or release notes, use [change artifacts](references/change-artifacts.md).
