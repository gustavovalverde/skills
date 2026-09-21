---
name: identifier-naming
description: Choose or review code identifiers, file and folder names, and domain vocabulary, or carry out a rename. Use when naming is the decision, not automatically for every declaration, new path, or routine edit.
license: MIT
---

# Name identifiers

Read the relevant declaration and usage before choosing a name. For a file or folder, inspect its contents and consumers to establish the responsibility the name should express. Use the project's glossary, nearby analogous operations, and language or framework conventions. Preserve exact protocol terms where they express the domain. A familiar convention guides interpretation, but does not justify a name that contradicts behavior.

Make the name convey the role, domain meaning, and consequential effects at its use site. Use enough context to distinguish plausible alternatives without repeating what the surrounding scope already makes clear. Short local names can be appropriate; search-hit counts and word counts are not naming criteria.

Keep cardinality, units, boolean meaning, and failure expectations accurate. Verb meanings such as get, load, find, validate, and verify vary across APIs; infer them from the actual contract and local usage rather than imposing a universal dictionary. Choose casing and suffixes idiomatically for the target language.

Naming difficulty can reveal an unclear responsibility, but does not by itself justify extraction, inlining, or redesign. When location and responsibility stay fixed, handle the file or folder rename and its path-compatibility checks here. If ownership, grouping, or placement is unresolved, use `codebase-structure` when available to assess that decision; an ordinary rename does not require both skills. A name for a one-line expression can explain an important concept. An operation can legitimately return a result while mutating state, especially when splitting it would lose atomicity.

Before renaming, distinguish internal bindings from supported public names, serialized keys, URLs, configuration, and names consumed by tools. Trace re-exports and package entrypoints before calling a symbol internal: a private module can expose a public name, even when no wire format uses it. Preserve those contracts unless changing them is part of the task. Legitimate version names, adapter names, and compatibility names may need to remain. Use [rename checks](references/renames.md) when propagating a change beyond a local binding.

For path renames, check supported import paths, routes, framework discovery, and generated inputs. A clearer label must not silently change those contracts. Inspect dynamic or string-based references as well as typed imports; verify case-only renames in Git and case-sensitive environments.

Recommend a name with the behavioral distinction it clarifies. If several names are reasonable, prefer the one consistent with nearby usage; avoid broad synonym churn or a mandatory naming report. Check affected consumers and relevant string references after editing.

- Read [decision examples](references/examples.md) for ambiguous effects, boolean polarity, or public-name constraints.
- Read [sources and scope](references/sources.md) for language-specific conventions or attribution. Routine naming does not require fetching sources or invoking another skill.
