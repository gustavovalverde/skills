---
name: ui-composition
description: Compose product screens, components, forms, tables, navigation, and landing or pricing sections from the existing design system with the fewest elements that let the user act. Use when building or changing a screen or flow, including small tweaks, and before adding a button, badge, card, filter, banner, or block of explanatory text, even when the request only names a feature. Not for the wording of labels, errors, and messages (ui-copy), module and API boundaries (software-design), or documentation (docs-writing).
license: MIT
---

# Compose screens with less

Build each screen from what the project already has, give it one obvious next step, and remove every element that does not help the user act. Judge the composed screen at desktop and mobile widths, not components in isolation.

## Start from what exists

Read the project's design source of truth first: `DESIGN.md`, the design-system docs, or the interface guide. If none exists, say so before inventing conventions, because an undocumented system is the main reason agents improvise.

Use the design system's components and tokens. Before building a button group, table, filter, form, sign-in, pricing, or dashboard pattern, check the component library's upstream components and published examples or blocks, and adapt the closest one. Build new only when none fits, and put a shared component in the design-system package rather than the app.

When a shared component or token changes, apply it to every surface that consumes it and check each one. Match neighboring screens: the same shell, the same placement for the same control, and the same term for the same concept.

## Give each view one next step

Each view has one primary action. Before adding a button, decide whether it needs to exist, then take its variant and position from the library's pattern for that context. Group secondary actions in an overflow menu. Prefer a compact select, dropdown, or filter to a group of large buttons, and collapse options that do the same job into one control.

## Ask less in forms

Ask only for what the next step needs and show what remains later. Infer, default, and reuse what is already known; generate identifiers instead of asking users to type them. Constrain input types, validate with the project's form library, let users skip optional steps, and end long flows with an editable summary.

## Gotchas

- An icon carries an action or status whose meaning is clear without words; a logo replaces a partner's written name. Secondary explanation and technical detail go in a tooltip or disclosure, not on the resting screen.
- Each fact appears once: one total, one status, one disclaimer. Completed states drop deadlines, optional markers, and fields that no longer apply.
- Use a color only for the role the design system assigns it. Destructive styling is for destructive actions, and confirmations use the primary style.
- Badges and pills stay small, wallet and social buttons sit side by side, and status tabs filter with All as the default. When space runs out, remove content instead of shrinking text.
- Nothing is half-clipped, hidden behind an expander, or placed outside its card, and related items in a section share one alignment.
- Controls enable as soon as their input is valid, without a reload.

## Finish

Run the app and use the changed flow as a user would, at desktop and mobile widths, including empty, error, busy, and completed states. Capture the actual changed UI, fix what the captures show, and only then report the result; do not ask the user to inspect it for you. For each element added, confirm it has a role in the user's next step, and delete it otherwise.

Use `ui-copy` when available for the words on the screen. When the user corrects a composition choice that the project guide does not cover, propose recording it there so the next change starts from it.
