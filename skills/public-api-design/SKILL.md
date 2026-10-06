---
name: public-api-design
description: Design or review developer-facing contracts such as library APIs, SDKs, plugin and extension interfaces, HTTP endpoints, CLIs, configuration, and generated clients. Use when adding or changing a public surface, judging whether an API is easy to use correctly, or weighing a breaking change. Not for internal module boundaries with no outside consumers (software-design) or for writing endpoint documentation (docs-writing).
license: MIT
---

# Design a public API

Start from the developer's task and the contract they consume, and make the common path direct without hiding the choices that matter.

## Approach

Inspect representative callers, documentation, exported types, and relevant protocol or ecosystem conventions. Establish who depends on a surface before treating it as public; an internal export or database schema is not automatically one.

Write realistic common usage before choosing internal contracts. Include the setup and operation needed to complete the task, with inputs, results, and failure behavior. For an existing API, compare current and proposed usage. Label sketches as proposals rather than presenting invented calls as supported functionality.

Separate necessary domain concepts and policy choices from implementation coordination. Hide wiring that callers should not need to manage, while keeping consequential choices, side effects, and resource ownership explicit. Judge the burden on callers rather than the number of methods or lines.

Make the common path direct and idiomatic. Disclose advanced controls where demonstrated needs justify them, preserve required protocol concepts, and keep meaningful failure distinctions.

Treat compatibility as part of the design. Account for existing consumers, wire formats, generated clients, and behavior before changing names, defaults, or types. A usability concern warrants a proportionate improvement, not an automatic breaking redesign.

## Gotchas

- Multiple entrypoints or a shared handle can be right when they represent independent tasks, transactions, or lifetimes.
- A convenient default can change the contract. Retries, idempotency, and atomicity do not follow from a simpler interface.
- Fewer required arguments can still change behavior when a new default selects a different policy.
- A compiling snippet does not prove the API is easy to use. Keep inspected examples, executed checks, and usability evidence distinct.

## Finish

Check the canonical usage and public types as well as behavior, and exercise relevant errors, invalid setup, and integration boundaries. The [contract review](references/contract-review.md) lists the checks for each kind of surface. Present the proposed usage or concrete finding first, then the caller benefit, material tradeoffs, and migration implications. Scale the response to the decision.

## References

- [Decision examples](references/examples.md) when weighing simpler setup against caller control or compatibility.
