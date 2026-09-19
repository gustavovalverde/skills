# Copy audit

Review only the requested scope. Prioritize copy that affects consequential decisions or blocks task completion, then state clarity, navigation, and cosmetic consistency.

- Check each action against its actual consequence, including permission requirements and irreversible effects.
- Check errors for a known cause, actionable guidance, and an appropriate distinction between failure and an unknown outcome. Avoid inventing retry safety.
- Check empty, loading, partial, success, and failure states independently.
- Check that labels, accessible names, and visible instructions identify the same action or input. Placeholders and tooltips can supplement essential guidance but cannot be its only location.
- Check hints and captions against visible controls and prior steps. Remove duplication while retaining accessible descriptions, necessary constraints, and consequences at the point of action.
- Check terminology, capitalization, and punctuation against the project's glossary and design system.
- Check natural phrasing in the target language. Preserve translation keys, variables, plural forms, and domain terms.
- Check layout or assistive-technology behavior when the copy change affects them. Use the project's relevant checks when implementation or exact-string expectations change.

Report issues by user impact, with concrete replacements and any behavior that must be confirmed. Stop when the requested surfaces communicate their states and actions accurately and the material findings are addressed; unrelated routes do not require a sweep.

Sources for accessibility questions:

- [W3C form instructions](https://www.w3.org/WAI/tutorials/forms/instructions/): visible labels and usable instructions.
- [W3C user notifications](https://www.w3.org/WAI/tutorials/forms/notifications/): clear feedback and guidance to correct errors.
