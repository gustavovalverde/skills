---
name: ui-copy
description: Write or review concise UI copy when building or changing product interfaces. Remove unnecessary text while preserving information needed to act.
license: MIT
---

# Write less interface copy

Use the least text that lets the user recognize the current state, make a decision, and complete the task. Follow the product's language and design conventions. Assess the composed screen, not strings in isolation.

## Require a reason to add text

Start with clear labels, values, states, and actions. Product facts are context, not a checklist of text to display. Add explanation only when needed for the current decision: a non-obvious constraint, consequence, distinction, or recovery step. A heading does not need a subtitle; a card does not need a description. Explain a future outcome only if it changes the decision now.

Selected filters, dates, badges, field labels, and action labels already communicate information. Avoid restating them or narrating the next click. For example, a selected period usually needs no separate date caption, and a metric needs no sentence paraphrasing its label. Keep exact dates when they support a distinct decision.

Tooltips and disclosures are options for useful secondary context, not places to put deleted repetition. Add them only for a concrete need. Keep essential instructions, consequences, errors, and recovery visible.

## Preserve meaning

Match copy to the actual state and supported actions. Never invent success, guarantees, or safe retry; a timeout does not prove an operation failed. Keep necessary context at direct entry points and before consequential actions.

Omit terminal periods from titles, headings, navigation, controls, labels, and short UI fragments. Retain question marks and normal punctuation in explanatory prose. Preserve domain terms, translation variables, plural forms, and technical identifiers. Keep accessible names aligned with visible labels; necessary accessible descriptions may repeat visual information.

## Finish with a deletion pass

Before finishing, review the composed UI across all requested changes, including adjacent states. For each supporting sentence, ask: if removed, would the user lose information needed for this task? If not, delete it. Check repetition of meaning, not just identical wording.

Delete before shortening, and avoid replacing redundant text with another slogan. Verify affected languages and layouts when relevant. A focused edit needs its surrounding context, not an unrelated repository-wide audit.
