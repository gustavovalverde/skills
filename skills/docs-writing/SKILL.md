---
name: docs-writing
description: Write or restructure documentation such as tutorials, how-to guides, READMEs, reference pages, conceptual explanations, proposals, RFCs, and ADRs, plus explanatory text for slides and diagrams. Use when creating or substantially revising documentation that readers learn from, follow, look up, or decide with, even when the piece is small, such as one reference entry or one caption. Not for interface text (ui-copy), pull request descriptions or release notes (pr-writing), or line editing that keeps a draft's structure (text-editing).
license: MIT
---

# Write documentation

Choose the form by the reader's task, not the publishing platform, and ground every instruction and example in the implementation or supplied specification.

## Approach

Read the reference for the form:

- [Documentation forms](references/documentation.md) for tutorials, how-to guides, reference pages, and explanations.
- [Decision records](references/decisions.md) for proposals, RFCs, and ADRs.
- [Visual content](references/visual-content.md) for slide copy and text that accompanies charts or diagrams. Presentation and design tools handle layout and rendering.

Check existing documentation before adding a page, and update or link useful material instead of duplicating it. Match the reader's knowledge and the project's terminology. Before a section relies on a concept, establish whether the reader already knows it or needs an explanation.

Keep prerequisites before dependent actions and qualifications beside the claims they constrain. Choose the smallest representation that answers the reader's question: prose for reasoning, a table for comparable options, a sequence for ordering, or a shallow tree for responsibility. Show a focused diff when the surrounding shape is familiar, and the complete example when omitted context would hide ownership, order, or a usable result. Place a visual beside the explanation it supports.

## Gotchas

- Familiar words can hide a missing conceptual step. Add that context before shortening the prose.
- An inspected example is not an executed one. Say which you have.
- Supported behavior, proposals, and unknowns read alike unless they are labeled.
- Shortening can drop exact identifiers, version limits, and supporting evidence. Keep them, and explain unfamiliar concepts without weakening their technical meaning.
- Drafting history and unrelated internal process details do not help the reader.

## Finish

Check whether readers can complete the task, locate the fact, or assess the decision. Verify examples and links within the available environment, and report material limits. Leave the rest of the documentation set alone during a narrow edit.
