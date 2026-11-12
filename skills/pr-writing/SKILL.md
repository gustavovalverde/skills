---
name: pr-writing
description: Write or revise pull request titles and descriptions, commit messages, changesets, changelog entries, and release notes. Use when opening or updating a pull request, describing a diff or a stacked change for reviewers, or summarizing a change for users, even in a single sentence. Not for design documents or ADRs (docs-writing) or for reviewing the code itself.
license: MIT
---

# Write a pull request

Write for the reviewer deciding whether to approve: what changes and why, what to check, and what could go wrong. Leave out everything else; a reviewer who needs more will ask.

## Approach

1. **Find the structure.** When the repository has a template or contribution guide, such as `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`, `CONTRIBUTING.md`, or `AGENTS.md`, write only its sections and follow its title convention. When it has none, use [the default structure](references/structure.md), which also covers link lines, superseded and stacked PRs, and how these rules map onto a template's sections.
2. **Title the behavior a reviewer approves**, in about 60 characters or fewer. If one title cannot cover the change, split the PR. In a stack, each title and body covers only its own layer.
3. **Summarize in at most three sentences or four short bullets.** Start with the problem a user or caller sees, then the behavior after the change, for a reader who never opened the code. Leave function names and mechanism to reviewer notes.
4. **Add reviewer notes only for what the diff cannot show:** a design choice a reviewer would otherwise question, with the constraint that forced it; what users must do after the change; what the PR deliberately leaves unchanged; or the specification it follows. Use a visual only when it shows something faster than prose; [representations](references/representations.md) lists the shapes.
5. **Show evidence a reviewer can check:** a test that failed without the change and passes with it, real output, or a screenshot for a visual change. Claim only what the evidence shows. Build file and line links with [the permalink script](scripts/permalink.py). When the change follows an external fact, see [citing sources](references/citations.md).
6. **State the merge danger:** whether a revert fully undoes the change, and what a defect would affect.

The body grows with the change only in reviewer notes and evidence. The title and Summary stay short for every PR.

## Gotchas

- The working session does not belong in the body: the user's instructions, options discussed and rejected, how a decision was reached, commands tried or checks repeated, and earlier review rounds. Evidence keeps only the checkable result. Keep a rationale only when a reviewer would otherwise question the choice, and state it as the constraint.
- Give one reason per decision. Name a rejected alternative only when a reviewer is likely to propose it.
- Say each point once. A visual replaces the prose it illustrates, reviewer notes do not repeat the Summary, and the body does not repeat a bot-generated summary.
- Keep the tone proportionate to the impact. State a security exposure plainly, without alarm.
- Breaking behavior, required migrations, and unresolved risks stay visible, never collapsed.
- Fill a required template truthfully and leave unmet items unchecked. Delete an empty section instead of writing "None" or "N/A". Leave out checks that CI already reports.
- When the PR changes, rewrite the affected section to match the final diff instead of appending to it. A fix for a review comment belongs in a reply on that thread; it changes the body only when it changes what the PR does or what its evidence shows.

## Finish

Read each sentence and ask whether the reviewer would miss it when deciding to approve. Delete it if not. Then check that the title and body match the final diff and stand alone.

For commit messages, changesets, or release notes, use [change artifacts](references/change-artifacts.md). Their readers are users and maintainers.
