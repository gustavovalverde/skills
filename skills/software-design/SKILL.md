---
name: software-design
description: Plan a feature or substantial refactor, or assess software design across interfaces, ownership, and module boundaries. Use when implementation needs design decisions; routine edits and execution of an already-settled plan do not need a new design review.
license: MIT
---

# Design software

Start with the requested outcome, constraints, and decisions still open. Inspect relevant code, callers, and tests before judging an existing design. For new software, separate supplied requirements from assumptions. When executing an approved plan, check changed assumptions and proceed; reopen only decisions that new evidence undermines.

Work from a representative user task toward the implementation. Establish the domain concepts and observable success, failure, and unknown outcomes. Sketch the common usage, then trace state ownership, invariants, and lifecycle or transaction boundaries. Iterate between usage and ownership before settling file placement and names. Keep user-significant policy explicit while hiding coordination callers should not need to manage.

Compare the current or simplest viable design with the smallest useful alternative. Include leaving the structure unchanged. A single implementation, long function, conditional, or unfamiliar convention is not evidence of a defect. Consider what callers must understand, where maintainers must navigate, and which changes require coordination. These are qualitative questions, not a complexity score. Preserve security, resource ownership, transaction, and compatibility boundaries when simplifying.

Use focused help only for decisions that need it. If available, `public-api-design` examines developer-facing usage and compatibility, `codebase-structure` examines placement and moves, and `identifier-naming` examines ambiguous domain vocabulary and renames. A focused request can use one of those skills directly. Do not load all of them as a checklist; this workflow also works on its own.

Make the result proportional to the task: explain the decision, supporting evidence, costs, and unresolved questions. Separate demonstrated failures from tradeoffs and preferences. Identify the smallest useful implementation slice and the checks that would establish its behavior and contract. An assessment does not require code changes or a separate design document. When implementation is requested, preserve behavior outside the agreed change and verify affected consumers and failure paths.

Read supporting references only when needed:

- [Principles and tradeoffs](references/principles.md) when deciding whether an abstraction, dependency, or module boundary helps.
- [Decision examples](references/examples.md) for concrete comparisons and scoping a first implementation slice.
- [Sources and scope](references/sources.md) for attribution or deeper study. Routine design work does not require fetching external sources.
