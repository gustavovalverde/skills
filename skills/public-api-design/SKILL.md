---
name: public-api-design
description: Design or review developer-facing contracts and their common usage, including library APIs, SDKs, endpoints, CLIs, and configuration. Use when adding or changing a public surface or assessing API usability and compatibility.
license: MIT
---

# Design a public API

Start with the developer's task and the contract they consume. Inspect representative callers, documentation, exported types, and relevant protocol or ecosystem conventions. An internal export or database schema is not automatically a public surface; establish who depends on it.

Write realistic common usage before choosing internal contracts. Include the setup and operation needed to complete the task, with inputs, results, and failure behavior. For an existing API, compare current and proposed usage. Label sketches as proposals rather than presenting invented calls as supported functionality.

Separate necessary domain concepts and policy choices from implementation coordination. Hide wiring that callers should not need to manage, while keeping consequential choices, side effects, and resource ownership explicit. Multiple entrypoints or a shared handle can be appropriate when they represent independent tasks, transactions, or lifetimes. Judge the burden on callers rather than the number of methods or lines.

Make the common path direct and idiomatic. Disclose advanced controls where demonstrated needs justify them, without requiring every caller to learn them. Preserve required protocol concepts and meaningful failure distinctions. Defaults must suit the task; neither retries nor idempotency nor atomicity follows merely from a convenient interface.

Treat compatibility as part of the design. Account for existing consumers, wire formats, generated clients, and behavior before changing names, defaults, or types. A usability concern warrants a proportionate improvement, not an automatic breaking redesign.

Check the canonical usage and public types as well as behavior. Exercise relevant errors, invalid setup, and integration boundaries; use the [contract review](references/contract-review.md) for the applicable checks. Distinguish inspected examples, executed checks, and actual usability evidence. A compiling snippet alone does not prove the API is easy to use.

Present the proposed usage or concrete finding first, then explain the caller benefit and material tradeoffs. Include migration implications when relevant. Scale the response to the decision rather than requiring a fixed report.

- Read [decision examples](references/examples.md) when weighing simpler setup against caller control or compatibility.
- Read [sources and scope](references/sources.md) for research lenses or attribution. Routine design does not require fetching sources or invoking another skill.
