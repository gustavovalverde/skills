---
name: identifier-naming
description: Choose or review names for variables, functions, types, files, folders, and domain vocabulary, and carry out renames. Use when the user asks what to call something, whether a name is clear or misleading, or to rename a symbol, key, file, or folder without moving it. Not for deciding where code belongs or whether to split it (codebase-structure), or for every new declaration in routine edits.
license: MIT
---

# Name identifiers

Make each name convey the role, domain meaning, and consequential effects at its use site, in the project's vocabulary.

## Approach

Read the declaration and its usage before choosing a name. For a file or folder, inspect its contents and consumers to establish the responsibility the name should express. Use the project's glossary, nearby analogous operations, and language or framework conventions. Preserve exact protocol terms where they express the domain.

Use enough context to distinguish plausible alternatives without repeating what the surrounding scope already makes clear; short local names can be right. Keep cardinality, units, boolean meaning, and failure expectations accurate, and choose casing and suffixes idiomatically for the language. A name for a one-line expression can explain an important concept.

Infer what verbs such as get, load, find, validate, and verify mean from the actual contract and local usage rather than from a universal dictionary. A familiar convention guides interpretation but does not justify a name that contradicts behavior.

A name cannot settle unclear ownership, grouping, or placement. When those are unresolved, use `codebase-structure` when available, and return to naming once responsibilities are fixed.

Before renaming, distinguish internal bindings from supported public names, serialized keys, URLs, configuration, and names consumed by tools, and preserve those contracts unless changing them is part of the task. Use [rename checks](references/renames.md) whenever a rename reaches beyond a local binding, including any file or folder rename.

## Gotchas

- A private module can expose a public name through re-exports, such as Rust `pub use`. Trace entrypoints before calling a symbol internal.
- `ensure` does not make a check-and-create atomic, and `verify` does not imply cryptographic verification. Fix the name or report the behavior.
- An operation may legitimately return a result while mutating state when splitting it would lose atomicity.
- Replacing `canEdit` with `isDisabled` without inverting every use changes what true means.
- Version, adapter, and compatibility names such as `ClientV2` can be load-bearing.
- Case-only renames need verification in Git and on case-sensitive file systems.
- Search-hit counts and name length are not naming criteria. Naming difficulty can reveal an unclear responsibility, but does not by itself justify extraction, inlining, or redesign.

## Finish

Recommend a name with the behavioral distinction it clarifies. Among reasonable options, prefer the one consistent with nearby usage and avoid synonym churn. After editing, check affected consumers and relevant string references.

## References

- [Decision examples](references/examples.md) for ambiguous effects, boolean polarity, or public-name constraints.
