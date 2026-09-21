# Documentation forms

Use the reader's need to select a form. These are organizing principles, not mandatory page templates or a requirement to build four directories.

## Tutorial: learn through practice

Give a newcomer a supported path to a useful result. State the starting conditions, guide the exercise in a reliable order, and show what the reader should observe at meaningful checkpoints. Keep choices limited so the learner can make progress. Explain enough to orient the learner; link deeper theory or alternative approaches separately.

The completion check is whether a newcomer with the stated prerequisites can reach and recognize the result.

## How-to: complete a task

Name the user's goal and required starting conditions. Present actions in usable order, including necessary branches and recovery steps. Put a condition before the instruction it changes. Use numbered steps for a sequence; each step should be easy to act on and check. Related steps do not need to become one long sentence.

Describe actual outcomes rather than vague directions such as "configure appropriately." Include the result that confirms success. Keep reference catalogs and extended explanations elsewhere, with links when useful. Preserve necessary judgment calls instead of inventing a universally safe sequence.

For example, a token-rotation guide must establish whether concurrent old and new tokens are supported before recommending an overlap. If that behavior is unknown, identify the missing fact rather than fabricating a procedure.

The completion check is whether a competent reader can achieve the stated goal using the documented behavior.

## Reference: find a fact

Use stable names, consistent fields, and predictable ordering. For a configuration option, document its meaning, accepted values, default, constraints, and interactions when known. Distinguish an omitted value from an explicit value when behavior differs. Use tables for comparable fields and examples where they clarify the contract.

Reference can be terse without becoming cryptic. It does not need a narrative introduction or transitions between independent entries. Link to instructions and explanations instead of embedding a lesson in every field.

The completion check is whether readers can locate an exact answer without inferring it from an example.

## Explanation: understand relationships

Develop the reasons, mechanisms, and tradeoffs that help readers understand the subject. Use connected paragraphs, concrete examples, and diagrams where they clarify relationships. Choose concrete-first or principle-first order according to the audience. Keep headings recognizable rather than inventing abstractions to label ordinary topics.

The completion check is whether readers can explain the mechanism and its limits, not just repeat terminology. Include uncertainty and supporting sources when they affect that understanding.

## Give readers an entry point

For an unfamiliar concept, explain its practical meaning before introducing the term. For example, “The server remembers a request key so retrying the same request does not create another order” gives a reader an entry point to idempotency. Then state the actual retention window and matching conditions from the specification. Do not imply an unlimited guarantee.

For related concepts, explain the relationship that helps the reader distinguish them. A request timeout limits one attempt; a retry limit caps additional attempts. A useful explanation connects those controls without inventing an abstract heading or forcing every section into a shared template.
