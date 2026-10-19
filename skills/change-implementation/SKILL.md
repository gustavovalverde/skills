---
name: change-implementation
description: Implement an issue, feature, or non-trivial bug fix as one complete change, from the request and its discussion through code, tests, and documentation, including breaking changes when the repository allows them. Use when asked to implement, fix, or build something whose change reaches callers, contracts, stored data, or several modules, when working from a GitHub issue or bug report, or when the user wants a lasting fix rather than a patch. Not for design questions without implementation (software-design), applying an approved plan or a routine edit, reviewing a diff, or triaging issues (backlog-triage).
license: MIT
---

# Implement a change

Understand the change and its consumers before choosing a solution, then land it completely. Each step ends with a check, so a skipped step shows before review.

## Approach

1. **Map related work.** Read the request, its comments, and everything it links. Search open and closed issues and pull requests for the same behavior. Read the repository's instructions, and any installed skill that profiles it, for the compatibility stance and required checks. Done when each related item has a relation (duplicate, sibling, blocker, or superseded) and the consumers are named: developers, users, and agents.
2. **Reproduce.** Write a test that sends the real request through the public surface, using the real client's payload or logs, in the runtime the behavior depends on. For a feature, write the acceptance test. Done when the test fails on the base branch, or the contract shows the behavior is intended.
3. **Find the root cause and blast radius.** Fix the shared code where the failure starts, so sibling callers are covered, and place the change where its reason lives. Prefer existing mechanism: a repository helper, the framework's primitive, the standard library or platform, then an installed dependency. When the fix belongs upstream, propose it there. Done when every caller, configuration variant, and touched contract, such as stored data, wire formats, and agent-facing schemas, is marked covered or out of scope with a reason.
4. **Check prior art** when the change sets protocol behavior, a security property, a default, or a public API's shape. Verify the one fact the decision turns on against the specification or the real client's request. Use `prior-art-research` when available for a wider benchmark. Done when each design choice is recorded as copied, adapted, or rejected, with its source.
5. **Classify release impact.** Ask whether existing outputs change, whether requests or configurations that worked now fail, and whether stored data needs a migration. Any yes needs a breaking or minor release under the repository's rules. Split a narrow fix from a breaking cleanup. Done when each answer is recorded and the version bump matches.
6. **Design the public surface.** Use `software-design` when available for open boundaries, and `public-api-design` and `identifier-naming` when available for each new or changed public option, endpoint, error, default, or name. Done when each public name is checked and the options left out are listed.
7. **Build test-first.** Make the reproduction pass, then revert the fix and confirm the test fails. Cover the variants from step 3. When compatibility is not required, remove obsolete paths and update every caller; when it is, provide the required migration. Done when the tests fail without the fix and pass with it, and the required checks pass.
8. **Update documentation.** Find every page and example covering the changed behavior. Upgrade notes name the released versions affected. Done when each user-visible change has an updated page or a reason it needs none.

## Gotchas

- An issue's proposed fix is a hypothesis. Maintainer comments may have redirected it.
- A nearby precedent can be wrong. Check it against the contract before copying it.
- Ask the user only about their decisions, such as compatibility stance, scope, and product behavior. Research facts.

## Finish

Read the full diff and revert every hunk that does not serve the change, including reworded comments and formatting. Record why each remaining workaround is needed, and file unrelated improvements as follow-ups. Report the change, where each side effect was handled, the release impact, upstream proposals, and anything unverified.

## References

- [Decision examples](references/examples.md) for tempting patches and the right change.
