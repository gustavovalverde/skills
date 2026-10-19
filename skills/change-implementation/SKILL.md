---
name: change-implementation
description: Implement an issue, feature, or non-trivial bug fix as one complete change, from the request and its discussion through code, tests, and documentation, including breaking changes when the repository allows them. Use when asked to implement, fix, or build something whose change reaches callers, contracts, stored data, or several modules, when working from a GitHub issue or bug report, or when the user wants a lasting fix rather than a patch. Not for design questions without implementation (software-design), applying an approved plan or a routine edit, reviewing a diff, or triaging issues (backlog-triage).
license: MIT
---

# Implement a change

Understand the change and its consumers before choosing a solution, then land it completely. The patterns a change sets get copied, so the touched area should end simpler than it started.

## Approach

1. **Establish the change.** Read the request or issue in full, with its comments, linked and competing pull requests, review threads, and earlier attempts or reverts. A report names a symptom, and its discussion often holds rejected approaches and constraints. Restate the problem, the outcome, and the acceptance criteria.
2. **Establish the obligations.** Read the repository's instructions for its compatibility stance, release status, and required checks. Identify the consumers: developers who integrate the code, people who use the product, and agents that call its APIs, tools, or CLIs. When an installed skill profiles this repository's contracts, load it; it refines these defaults.
3. **Understand the code.** Read the code the change touches, its callers, its tests, and the contracts of the frameworks and libraries it relies on. Look for existing mechanism in this order: a helper or pattern in the repository, the framework's intended primitive or extension point, the standard library or platform, and an installed dependency. When the right fix belongs upstream, propose it there alongside any interim local change.
4. **Settle open decisions.** When the design is still open, use `software-design` when available, passing the problem, the consumers, and the compatibility stance. It hands contract, placement, and naming questions to its focused siblings. A change that fits the existing design goes straight to implementation.
5. **List side effects before editing.** Check callers, stored data and migrations, wire formats and generated clients, configuration, documentation and examples, tests, observability, and the contracts agents rely on, such as tool schemas, error codes, and command output. A change that is correct locally usually breaks in one of these places.
6. **Implement end to end.** Fix the root cause where every caller routes through it. When compatibility is not required, remove the obsolete paths, shims, and configuration, and update every caller in the same change. When it is required, provide the migration path the stance calls for. Update affected tests, documentation, and examples together with the code.

## Gotchas

- An issue's proposed fix is a hypothesis. Maintainer comments may have narrowed or redirected it.
- A nearby precedent can itself be wrong. Check it against the contract before copying it.
- Permission to break compatibility removes the obligation to support old callers. It does not remove the obligation to update the callers in this repository and to state the break.
- Ask the user only about decisions that are theirs, such as compatibility stance, scope, and product behavior. Look up facts in the code, history, and documentation.
- Improve the area the change touches. Record unrelated improvements as follow-ups rather than widening the diff.
- Passing tests in the default configuration do not cover the other adapters, platforms, or concurrent callers the change affects.

## Finish

Review the diff for simplification before calling it done: duplicated mechanism, abstractions with one use, leftover compatibility code, and unclear names. Run the repository's required checks and the tests for the changed behavior, including failure paths. Report what changed and why, each side effect and where it was handled, breaking changes with their migration, any upstream proposal, and anything left unverified.

## References

- [Decision examples](references/examples.md) when choosing between a local patch and a root-cause, framework, or breaking change.
