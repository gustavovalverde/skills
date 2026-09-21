---
name: codebase-structure
description: Choose or review file placement, module splits and merges, and directory organization when repository structure is the decision. Use for placement questions and structural refactors, not automatically for every new file or routine code edit.
license: MIT
---

# Organize a codebase

Identify the placement or navigation problem before changing the tree. Read the repository's directory guidance and inspect the relevant files, consumers, and framework entrypoints. Existing conventions guide predictable placement; a concrete boundary or usability problem can justify departing from them.

Keep related behavior near its owner when that makes a task easier to follow. Separate responsibilities when a boundary protects runtime constraints, resource ownership, independent consumers, or independently changing policy. History can support a change-coupling claim, but new code and squashed history still permit decisions based on requirements and dependencies.

Compare extending, splitting, moving, and leaving the structure unchanged. File length, matching prefixes, and directory counts are signals to inspect, not rules that mandate a split or merge. Explain what readers or consumers gain and what coordination the change adds. Before recommending a move, name the concrete change or lookup it helps and compare it with keeping the current layout. Shared fields and invariants may make apparent concerns one cohesive unit; label navigation preferences as optional, not demonstrated maintenance defects.

Preserve client/server, worker, security, initialization, and package boundaries. A directory with one file can represent a useful boundary. A barrel can provide a supported public entrypoint. Establish actual dependency or bundling effects before claiming that a layout improves performance.

Choose paths that predict responsibility in the project's vocabulary. Keep feature-local code near its feature when appropriate; use a shared location for an established shared responsibility. Follow the installed framework's routing and naming conventions rather than imposing one language's layout everywhere.

For moves and renames, identify supported import paths, URLs, discovery patterns, and generated files before editing. Preserve external contracts unless their migration is part of the task. Use [moves and verification](references/moves.md) to check references that types may not cover. Scale verification to affected consumers and runtime boundaries.

Present a focused tree or path mapping when it clarifies the proposed layout, with the reason for each material boundary. A placement question does not require a repository-wide reorganization or another skill.

- Read [decision examples](references/examples.md) for disputed splits, shared locations, or framework boundaries.
- Read [sources and scope](references/sources.md) for attribution or framework-specific details; routine placement does not require browsing.
