---
name: codebase-structure
description: Decide where code belongs, including file and module placement, splitting or merging modules, flattening or nesting directories, and moving files across boundaries. Use when the user asks where something should go, whether to split or merge files, how to organize a folder or package, or to move code between modules or packages. Not for renaming something that stays in place (identifier-naming) or for routine edits.
license: MIT
---

# Organize a codebase

Make the tree predict where behavior lives, and change it only when a concrete task gets easier. Existing conventions guide predictable placement; a demonstrated boundary or navigation problem can justify departing from them.

## Approach

Identify the placement or navigation problem before changing the tree. Read the repository's directory guidance and inspect the relevant files, consumers, and framework entrypoints.

Keep related behavior near its owner when that makes a task easier to follow. Separate responsibilities when a boundary protects runtime constraints, resource ownership, independent consumers, or independently changing policy. History can support a change-coupling claim, but new code and squashed history still permit decisions based on requirements and dependencies.

Compare extending, splitting, moving, and leaving the structure unchanged. Before recommending a move, name the concrete change or lookup it helps, what readers or consumers gain, and what coordination it adds. Label navigation preferences as optional rather than as maintenance defects.

Choose paths that predict responsibility in the project's vocabulary, and follow the installed framework's routing and naming conventions rather than imposing one language's layout everywhere. Keep feature-local code near its feature, and use a shared location for an established shared responsibility. Settle ownership and grouping before naming new boundaries. If terminology is still disputed once ownership is settled, use `identifier-naming` when available and pass along the settled responsibilities.

Before a move or rename, use [moves and verification](references/moves.md) to establish what each path means and which references types do not cover. Preserve external contracts unless their migration is part of the task.

## Gotchas

- File length, shared prefixes, and directory counts are signals to inspect, not reasons to split or merge. Shared fields and invariants can make apparent concerns one cohesive unit.
- A directory with one file can be a real boundary, such as a route group that installs a layout.
- A barrel can be a supported public entrypoint. Removing it can trade a build concern for a compatibility break.
- Client/server, worker, security, initialization, and package boundaries hold even when files look related.
- A layout change improves performance only when the dependency graph or bundler output shows it.

## Finish

Answer a placement question at the scope it was asked. Present a focused tree or path mapping when it clarifies the layout, with the reason for each material boundary, and scale verification to the affected consumers and runtime boundaries.

## References

- [Decision examples](references/examples.md) for disputed splits, shared locations, or framework boundaries.
