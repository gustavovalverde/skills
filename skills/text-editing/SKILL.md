---
name: text-editing
description: Review or revise an existing draft for clarity, organization, readability, and audience fit, such as emails, announcements, essays, reports, or documentation passages. Use whenever the user shares prose and asks to edit, tighten, simplify, or get feedback on it, even a single paragraph or section. Not for writing new documentation (docs-writing), interface text (ui-copy), translations, ordinary replies, or spelling fixes.
license: MIT
---

# Edit text

Improve how a draft serves its reader while keeping its meaning, evidence, and scope.

## Approach

Preserve the requested scope: a review needs actionable findings, and a rewrite needs usable revised text. Infer the audience and purpose from the draft and request. Ask only when an unresolved distinction would materially affect the result.

Address audience mismatch, unsupported claims, missing conditions, and organization before sentence polish. Distinguish improving wording from changing the underlying argument, and flag factual uncertainty instead of silently resolving it.

Keep related reasoning together, split overloaded sentences, and remove repetition without losing relationships between ideas. Check what each paragraph contributes beyond the preceding material, and remove it when cutting loses no needed meaning, evidence, orientation, or emphasis. End when the reader's purpose is fulfilled, even if source material remains unused. Leave unaffected sections alone.

## Gotchas

- Exact technical terms, citations, version boundaries, and qualifications can look like clutter. Keep the ones the reader needs to understand or act.
- Filling a gap with plausible product behavior, or with facts from an unrelated example, invents content.
- Punctuation habits and sentence-length targets are project conventions, not universal quality rules. Follow the project's.
- Short labels or steps need not become narrative paragraphs.
- Commentary about drafting adds nothing ("As requested, phase two documents the retry setting"), while operational provenance can be essential, such as a commit hash identifying a reproduced result.

## Finish

For a review, lead with the largest obstacles and give concrete replacements. For a rewrite, provide the revision and name the material ambiguities that remain.

Read [readability evidence](references/readability.md) when the user asks for measurements or a comprehension check, or when a measurement would resolve a specific uncertainty. Report scores only from a tool you actually ran.
