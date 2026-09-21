---
name: architecture-principles
description: Evaluate architecture tradeoffs, module boundaries, and unnecessary complexity when designing or reviewing a structural change. Use for architecture assessments, not routine edits or general code review without an architectural concern.
license: MIT
---

# Assess architecture

Start with the requested decision and the constraints the design must satisfy. Inspect the relevant implementation, callers, and tests before judging its structure. For a proposal without code, distinguish supplied requirements from assumptions.

Trace a representative operation through the affected boundaries: who owns state, who enforces invariants, and how failures reach callers. Compare the current design with the smallest useful alternative. Include leaving the structure unchanged when it already meets the need.

Use principles to explain a concrete consequence. A single implementation, a long function, a conditional, or a framework convention is not sufficient evidence of a defect. Evaluate the work required to understand and change the behavior, rather than counting files, methods, or layers. Preserve security, transaction, lifecycle, and compatibility boundaries when simplifying.

For each material finding, identify the affected code or proposed contract, the requirement or maintenance problem, and a proportionate correction. Separate demonstrated failures from tradeoffs and preferences. Explain what a recommendation costs as well as what it improves; avoid turning a local concern into an unrelated redesign. A review can conclude that no structural change is warranted.

When implementation is requested, preserve behavior unless changing it is part of the task. Check the affected consumers and failure paths using the repository's existing checks. Report what those checks establish and any relevant gaps. An assessment alone does not require editing code.

Read supporting references only when needed:

- [Principles and tradeoffs](references/principles.md) when deciding whether an abstraction, dependency, or module boundary helps.
- [Decision examples](references/examples.md) when a proposed simplification needs a concrete comparison.
- [Sources and scope](references/sources.md) for attribution or deeper study. Routine assessment does not require fetching external sources.
