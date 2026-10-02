---
name: code-consistency
description: Find and reuse repository conventions, utilities, and analogous implementations when adding features or reviewing consistency. Use for implementation patterns, not for architecture, placement, or naming decisions on their own.
license: MIT
---

# Match repository patterns

For a feature implementation or consistency review, inspect the changed area and its consumers, then find the closest analogous behavior. Read repository guidance and a few representative files to establish relevant conventions such as naming, imports, exports, types, errors, and tests. Search by behavior as well as filenames, and check whether an existing helper's contract fits before adding another.

Keep discovery proportional to the change. Reuse what the session has already established unless the source changed. Follow local conventions when they fit; explain a concrete conflict with correctness, a required boundary, or the user's instructions when departing from them. In reviews, compare the actual diff with relevant examples and report only actionable deviations, with location, impact, and a concrete fix. In implementation, make the requested change and run checks relevant to its behavior and consumers.

Do not treat a pattern as a mandate when its contract does not fit, or report stylistic alternatives as defects. If available, use `software-design` for unresolved design across responsibilities or boundaries, `codebase-structure` for placement, `public-api-design` for an API contract, and `identifier-naming` for a naming decision. When that guidance is unavailable, address the requested decision directly. Routine edits to settled code do not need a consistency review.
