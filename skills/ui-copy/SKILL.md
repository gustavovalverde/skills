---
name: ui-copy
description: Write or review interface text such as labels, buttons, headings, field hints, empty states, errors, confirmations, tooltips, and onboarding messages. Use when building or changing a screen, component, or flow that shows text to users, even for a single label or message, and even when the request is about the interface rather than its words. Not for documentation, marketing pages, or prose outside the product (docs-writing, text-editing).
license: MIT
---

# Write less interface copy

Use the least text that lets the user recognize the current state, make a decision, and complete the task. Follow the product's language and design conventions, and assess the composed screen, not strings in isolation.

## Require a reason to add text

Start with clear labels, values, states, and actions. Product facts are context, not a checklist of text to display. Add explanation only when the current decision needs it: a non-obvious constraint, consequence, distinction, or recovery step. Explain a future outcome only if it changes the decision now.

Match copy to the actual state and supported actions. Keep essential instructions, consequences, errors, and recovery visible, and keep necessary context at direct entry points and before consequential actions. Preserve domain terms, translation variables, plural forms, and technical identifiers.

## Gotchas

- Selected filters, dates, badges, field labels, and action labels already communicate, so avoid restating them or narrating the next click. A selected period rarely needs a date caption, and a metric rarely needs a sentence paraphrasing its label. Keep exact dates when they support a distinct decision.
- A heading does not need a subtitle, and a card does not need a description.
- Add a tooltip or disclosure only for a concrete need for secondary context, never as a place for deleted repetition.
- A timeout does not prove an operation failed. Never invent success, guarantees, or safe retry.
- Accessible names stay aligned with visible labels, and accessible descriptions may repeat visual information on purpose.
- Titles, headings, navigation, controls, labels, and short fragments take no terminal period. Explanatory prose keeps normal punctuation, including question marks.

## Finish with a deletion pass

Review the composed UI across all requested changes, including adjacent states. For each supporting sentence, ask: if removed, would the user lose information needed for this task? If not, delete it. Check repetition of meaning, not just identical wording.

Delete before shortening, and avoid replacing redundant text with another slogan. Verify affected languages and layouts when relevant. A focused edit needs its surrounding context, not a repository-wide audit.
