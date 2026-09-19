---
name: write-docs
description: Write or restructure documentation around what readers need to learn, do, look up, or decide. Includes explanatory slide and diagram text.
license: MIT
---

# Write documentation

Choose the form by the reader's task, not the publishing platform. Read the relevant reference:

- [Documentation forms](references/documentation.md) for tutorials, how-to guides, reference pages, and explanations.
- [Decision records](references/decisions.md) for proposals, RFCs, and ADRs.
- [Visual content](references/visual-content.md) for explanatory slide copy and text accompanying charts or diagrams. Presentation and design tools handle layout and rendering.

Check existing documentation before adding a page. Update or link useful material instead of duplicating it. Match the reader's knowledge and the project's terminology. Before a section relies on a concept, establish whether the reader already knows it or needs an explanation. Familiar words can still conceal a missing conceptual step; add that context before shortening the prose.

Ground instructions and examples in the implementation or supplied specification. Distinguish supported behavior from proposals and unknowns. Keep prerequisites before dependent actions and qualifications beside the claims they constrain. Do not present an inspected example as an executed one.

Choose the smallest representation that answers the reader’s question: prose for reasoning, a table for comparable options, a sequence for ordering, or a shallow tree for responsibility. Show a focused diff when the surrounding shape is familiar; show the complete example when omitted context would hide ownership, order, or a usable result. A visual is optional and belongs beside the explanation it supports.

Preserve exact identifiers, version limits, and supporting evidence. Explain unfamiliar concepts without weakening their technical meaning. Remove drafting history and unrelated internal process details.

Finish by checking whether readers can complete the task, locate the fact, or assess the decision. Verify examples and links within the available environment, and report material limits. A narrow edit does not require reorganizing the documentation set or loading an editorial skill.

Consult [sources and scope](references/sources.md) when attribution or standards comparison is requested; routine writing does not require fetching sources.
