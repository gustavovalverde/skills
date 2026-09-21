---
name: ui-copy
description: Write or review interface labels, actions, states, and recovery messages against actual product behavior and screen context.
license: MIT
---

# Write interface copy

Establish the surface, actual product behavior, audience, and language. Use the product's glossary and design conventions. A copy request does not authorize changing product behavior or technical identifiers.

## Establish state and supported actions

Before proposing an action, establish the known outcome and which actions the product supports in that state. Distinguish pending, completed, failed, and unknown outcomes. If completion is unknown, do not infer retry safety from a timeout or from the availability of a history page. Do not invent an action to make a message feel complete. Without an established safe retry, omit retry instructions, including conditional wording such as “check history before trying again.” Include only actions established by the supplied behavior.

Offer retry, undo, or recovery only when supported by the supplied behavior. A known-safe retry can be offered; an uncertain outcome needs a supported status check or other established next step. Success copy confirms only completed work. Put irreversible or costly consequences before the action that commits them.

## Review copy in context

Give controls meaningful labels and keep essential instructions visible. Align visible wording and accessible names. Preserve distinctions between no data, no matching results, and failed loading. Status and error text must remain understandable without color or position alone.

Compare hints and captions with the controls, headings, numbers, and earlier steps users can see. Remove repetition, but keep non-obvious constraints and consequences. An unchecked checkbox does not prove a choice is optional. Repeat orientation or warnings when users can enter a step directly; accessible descriptions may deliberately repeat visual information.

For example, “Select an option” beneath a clearly labeled selector may add little; “This changes access for every member” can be essential. Avoid unsupported reassurance or timing promises.

Consult [surface decisions](references/decision-matrix.md) for wording and punctuation examples, or [copy audit](references/review-checklist.md) for a broader review. A single-string edit needs only its relevant checks.

Preserve localization variables, plural forms, and exact identifiers. Check wrapping, truncation, accessibility, and affected translations when the change warrants it. Use length as a layout signal, not an arbitrary correctness threshold. Report a concrete replacement or the missing behavior that prevents an accurate one.
