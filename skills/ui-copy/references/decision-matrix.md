# Surface decisions

Apply the product's established conventions first. These defaults guide choices where no convention exists.

| Surface | Reader's question | Useful default |
|---|---|---|
| Button | What will this do? | Action with enough specificity to predict the result; no terminal period |
| Form label | What value belongs here? | Stable, visible name for the input |
| Helper text | What do I need to know before entering it? | Required format, constraints, or consequences beside the field |
| Placeholder | What might a valid value look like? | Optional example; never the only label or essential instruction |
| Error | What happened, and how can I continue? | Known problem and supported recovery; keep full-sentence punctuation |
| Empty state | Why is there nothing here? | Distinguish an empty collection, filtered results, and failed loading |
| Success | What has completed? | Confirm the completed operation without promising later outcomes |
| Loading | What is still happening? | Describe the ongoing operation; follow the product's ellipsis convention |
| Tooltip | What does this control or term mean? | Brief supplementary explanation; move essential instructions into visible text |
| Heading or navigation | Where am I, or what is here? | Recognizable name; omit terminal periods, retain question marks for questions |
| Status | What is the current state? | Consistent domain vocabulary; preserve distinctions such as pending and unknown |

Prefer specificity over arbitrary word limits. "Delete workspace" can be better than "Delete" when the object is otherwise ambiguous. A long label may indicate missing context, but shortening it must not obscure the consequence.

Microsoft's [UI writing guidance](https://learn.microsoft.com/en-us/windows/apps/design/style/writing-style) uses periods for complete sentences in tooltips, errors, and dialogs. This is an example of a coherent convention, not a requirement to override another product's design system.
