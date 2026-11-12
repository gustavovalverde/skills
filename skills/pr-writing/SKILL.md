---
name: pr-writing
description: Write or revise pull request titles and descriptions, commit messages, changesets, changelog entries, and release notes. Use when opening or updating a pull request, describing a diff or a stacked change for reviewers, or summarizing a change for users, even in a single sentence. Not for design documents or ADRs (docs-writing) or for reviewing the code itself.
license: MIT
---

# Write a pull request

Write for the reviewer deciding whether to approve: what changes and why, what to check, and what could go wrong. Leave out the rest; a reviewer who needs more will ask.

## Approach

1. **Find the structure.** When the repository has a pull request template, write only its sections. A contribution guide without a template gives requirements, not sections: meet them inside the shape below. Follow the repository's title convention.
2. **Size the body to the change.** When the diff shows the whole change, write the link lines and one paragraph without headings, about 100 words: the problem, the new behavior, and the test or output that shows it. Use the headed sections of [the default structure](references/structure.md) only when the change needs reviewer notes, and stay under 400 words outside code blocks. It also covers link lines, superseded and stacked PRs, and templates.
3. **Title one behavior a reviewer approves**, in 72 characters or fewer, prefix included. If it needs "and", consider splitting the PR. In a stack, each title and body covers only its own layer.
4. **Summarize in at most three sentences.** State the problem a user or caller sees, then the behavior after the change, for a reader who never opened the code. Mechanism belongs in reviewer notes.
5. **Add a reviewer note only for a question the reviewer would otherwise ask in a review comment:** why this design, with the constraint that forced it; what users must do after the change; what the PR deliberately leaves unchanged; or which specification it follows. Three usually suffice. Use a visual only when it shows something faster than prose; [representations](references/representations.md) lists the shapes.
6. **Give one before and after a reviewer can check:** a failing test that now passes, real output, or a screenshot. Say a test failed without the change only when you saw it fail. Build file links with [the permalink script](scripts/permalink.py), and cite external facts as in [citing sources](references/citations.md).
7. **State the merge danger only when it is not obvious:** a revert does not fully undo the change, the change becomes a public contract on release, or a defect would reach further than the diff suggests.
8. **Check the limits** with `node scripts/check-body.mjs BODY.md --title "..."`.

## Gotchas

- The working session stays out of the body: the user's instructions, options discussed and rejected, how a decision was reached, commands tried, and earlier review rounds. Keep a rationale only when a reviewer would otherwise question the choice, and state it as the constraint.
- Evidence is a result, not a test plan. Lists of test files, test counts, or commands restate the diff and CI.
- Give one reason per decision. Name a rejected alternative only when a reviewer is likely to propose it.
- Say each point once. A visual replaces the prose it illustrates, and reviewer notes do not repeat the Summary, the diff, or a bot-generated summary.
- State a security exposure plainly, without alarm.
- Breaking behavior, required migrations, and unresolved risks stay visible, never collapsed.
- Fill a required template truthfully and leave unmet items unchecked.
- When the PR changes, rewrite the affected section to match the final diff instead of appending. A fix for a review comment belongs in a reply on that thread, and changes the body only when it changes what the PR does.

## Finish

Delete each sentence the reviewer would not miss when deciding to approve. Then check that the title and body match the final diff and stand alone.

For commit messages, changesets, or release notes, use [change artifacts](references/change-artifacts.md).
