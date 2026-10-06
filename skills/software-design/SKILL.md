---
name: software-design
description: Plan a feature or substantial refactor, or assess a design's interfaces, state ownership, module boundaries, abstractions, and error handling. Use when implementation needs decisions that are still open, when the user asks how to approach or structure a change, or whether an abstraction or dependency earns its place. Not for routine edits, executing an approved plan, or a question only about API usage, file placement, or naming.
license: MIT
---

# Design software

Work from a representative user task toward the implementation, and compare the simplest viable design with the smallest useful alternative before changing structure.

## Approach

Start with the requested outcome, constraints, and decisions still open. Inspect relevant code, callers, and tests before judging an existing design. For new software, separate supplied requirements from assumptions. When executing an approved plan, check changed assumptions and proceed; reopen only decisions that new evidence undermines.

Establish the domain concepts and the observable success, failure, and unknown outcomes. Sketch the common usage, then trace state ownership, invariants, and lifecycle or transaction boundaries. Iterate between usage and ownership before settling file placement and names. Keep user-significant policy explicit while hiding coordination callers should not need to manage.

Compare the current or simplest design with the smallest useful alternative, including leaving the structure unchanged. Ask what callers must understand, where maintainers must navigate, and which changes require coordination. These are qualitative questions, not a complexity score. Preserve security, resource ownership, transaction, and compatibility boundaries when simplifying.

This workflow is complete on its own. When one decision needs more depth, use the focused skill for it when available, and pass along what is already established:

- `public-api-design` for developer-facing usage and compatibility, with the representative task and usage sketch.
- `codebase-structure` for placement and moves, with the settled ownership.
- `identifier-naming` for disputed vocabulary or renames, with the domain concepts.
- `docs-writing` when the user asks to record the decision as an ADR or proposal, with the decision, alternatives, and evidence.

## Gotchas

- A single implementation, long function, conditional, or unfamiliar convention is not evidence of a defect.
- One implementation can justify an interface when it isolates a dependency or makes behavior testable.
- Similar code can encode independent policies. Sharing it can couple changes that should stay separate.
- Catching every storage error and returning `null` turns an outage into "not found".
- Combining modules cannot make a database write and an email send commit atomically.

## Finish

Make the result proportional to the task: the decision, supporting evidence, costs, and unresolved questions, with demonstrated failures separated from tradeoffs and preferences. Identify the smallest useful implementation slice and the checks that would establish its behavior and contract. An assessment can end there. When implementation is requested, preserve behavior outside the agreed change and verify affected consumers and failure paths.

## References

- [Principles and tradeoffs](references/principles.md) when deciding whether an abstraction, dependency, or module boundary helps.
- [Decision examples](references/examples.md) for concrete comparisons and scoping a first implementation slice.
