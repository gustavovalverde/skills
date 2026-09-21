---
name: identifier-naming
description: Choose or review code identifiers and domain vocabulary, or plan and carry out a rename. Use when naming is the decision, not automatically for every variable declaration or routine code edit.
license: MIT
---

# Name identifiers

Read the relevant declaration and usage before choosing a name. Use the project's glossary, nearby analogous operations, and language or framework conventions. Preserve exact protocol terms where they express the domain. A familiar convention guides interpretation, but does not justify a name that contradicts behavior.

Make the name convey the role, domain meaning, and consequential effects at its use site. Use enough context to distinguish plausible alternatives without repeating what the surrounding scope already makes clear. Short local names can be appropriate; search-hit counts and word counts are not naming criteria.

Keep cardinality, units, boolean meaning, and failure expectations accurate. Verb meanings such as get, load, find, validate, and verify vary across APIs; infer them from the actual contract and local usage rather than imposing a universal dictionary. Choose casing and suffixes idiomatically for the target language.

Naming difficulty can reveal an unclear responsibility, but does not by itself justify extraction, inlining, or redesign. A name for a one-line expression can explain an important concept. An operation can legitimately return a result while mutating state, especially when splitting it would lose atomicity.

Before renaming, distinguish internal bindings from supported public names, serialized keys, URLs, configuration, and names consumed by tools. Preserve those contracts unless changing them is part of the task. Legitimate version names, adapter names, and compatibility names may need to remain. Use [rename checks](references/renames.md) when propagating a change beyond a local binding.

Recommend a name with the behavioral distinction it clarifies. If several names are reasonable, prefer the one consistent with nearby usage; avoid broad synonym churn or a mandatory naming report. Check affected consumers and relevant string references after editing.

- Read [decision examples](references/examples.md) for ambiguous effects, boolean polarity, or public-name constraints.
- Read [sources and scope](references/sources.md) for language-specific conventions or attribution. Routine naming does not require fetching sources or invoking another skill.
