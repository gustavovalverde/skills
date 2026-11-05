# Documentation forms

Use the reader's need to select a form. These are organizing principles, not mandatory page templates or a requirement to build four directories.

## Tutorial: learn through practice

Give a newcomer a supported path to a useful result. State the starting conditions, guide the exercise in a reliable order, and show what the reader should observe at meaningful checkpoints. Keep choices limited so the learner can make progress. Explain enough to orient the learner; link deeper theory or alternative approaches separately.

The completion check is whether a newcomer with the stated prerequisites can reach and recognize the result.

## How-to: complete a task

Name the user's goal and required starting conditions. Present actions in usable order, including necessary branches and recovery steps. Put a condition before the instruction it changes. Use numbered steps for a sequence; each step should be easy to act on and check. Related steps do not need to become one long sentence.

Phrase a task as "if you want x, do y": the reader's goal, then the setting that achieves it, then the consequence. For example, these two sentences lead into a list of what the server then exposes:

> To open the development server from your phone, set `host: "0.0.0.0"`. Anyone who can reach your machine can then open the app:

The reason for a rule that is not obvious fits in one sentence after the rule: "Sessions end after 30 minutes without activity. This limits how long someone else can use a computer you left signed in."

Describe actual outcomes rather than vague directions such as "configure appropriately." Include the result that confirms success. Keep reference catalogs and extended explanations elsewhere, with links when useful. Preserve necessary judgment calls instead of inventing a universally safe sequence.

For example, a token-rotation guide must establish whether concurrent old and new tokens are supported before recommending an overlap. If that behavior is unknown, identify the missing fact rather than fabricating a procedure.

The completion check is whether a competent reader can achieve the stated goal using the documented behavior.

## Reference: find a fact

Use stable names, consistent fields, and predictable ordering. For a configuration option, document its meaning, accepted values, default, constraints, and interactions when known. Distinguish an omitted value from an explicit value when behavior differs. When a how-to leaves an exception to the reference entry, the entry must state it. Use tables for short comparable fields and examples where they clarify the contract. A table with three or more columns can split identifiers across lines on a phone. For options that need a description, give each one its name and type on one line, then a paragraph.

Reference can be terse without becoming cryptic. It does not need a narrative introduction or transitions between independent entries. Link to instructions and explanations instead of embedding a lesson in every field.

The completion check is whether readers can locate an exact answer without inferring it from an example.

## Explanation: understand relationships

Develop the reasons, mechanisms, and tradeoffs that help readers understand the subject. Use connected paragraphs, concrete examples, and diagrams where they clarify relationships. Choose concrete-first or principle-first order according to the audience. Keep headings recognizable rather than inventing abstractions to label ordinary topics.

The completion check is whether readers can explain the mechanism and its limits, not just repeat terminology. Include uncertainty and supporting sources when they affect that understanding.

## Give readers an entry point

For an unfamiliar concept, explain its practical meaning before introducing the term. For example, “The server remembers a request key so retrying the same request does not create another order” gives a reader an entry point to idempotency. Then state the actual retention window and matching conditions from the specification. Do not imply an unlimited guarantee.

For related concepts, explain the relationship that helps the reader distinguish them. A request timeout limits one attempt; a retry limit caps additional attempts. A useful explanation connects those controls without inventing an abstract heading or forcing every section into a shared template.

## Shape a section

These patterns let readers check their own case: who acts next, which option fits, and what a rule means in practice. Apply each one where a section needs it, not as a template for every section.

**Say what happens next, and whether the reader must act.** Add this where the reader's part is unclear, such as after a call that returns a redirect URL:

> The server responds with a `url`. The browser SDK sends the user there for you. If you call the endpoint without the SDK, redirect the browser to `url` yourself.

**Introduce a variant by the condition that selects it.** Start from what the reader already has:

> If you have the user's email, pass `email`. If you have only their team, pass `teamId`.

**Show the basic case first, then each add-on as a change to it.** Name the setting the add-on builds on. Otherwise a reader may set the add-on alone and see no effect:

> To also cache responses at the edge, set `edge: true` next to `cache`.

**Follow an abstract rule with one concrete instance.**

> When several timeouts apply, the shortest one ends the request. For example, with a 30-second server timeout and a 5-second route timeout, a request to that route fails after 5 seconds.

**Open a section about a safeguard with what it prevents.** A reader who knows the threat can judge what weakening the safeguard costs:

> Signature verification rejects forged events from anyone who lacks the signing secret.

**Give each error its cause and its fix.** When a fix relaxes a safeguard, state the condition that makes it safe first:

> `host_not_allowed`: the webhook URL's host is not in `allowedHosts`. After you confirm that you control the host, add it to `allowedHosts`.

**State a callback's inputs and return value in words**, instead of leaving them to an example's destructuring:

> `onEvent` receives the event and the attempt number. It returns `true` to acknowledge the event.

**Put the unit in the code comment.** Readers copy the line, not the paragraph above it:

```ts
timeout: 30_000, // 30 seconds, in milliseconds
```

## Check a revision

Compare each reworded sentence with the original, and each added sentence, fix, or example with the source, for these shifts:

- "unless X" that became "only X"
- a dropped "by default"
- a lead-in sentence that no longer matches the list or code after it
- "you" that now means an end user or API caller instead of the reader
- an instruction that tells the reader to do what the system already does
- a goal the setting only partly achieves, with its limit moved away from the instruction
- an absolute word, such as "always," "never," or "only," where the source has an exception
- a claim scoped wider or narrower than the implementation, such as a check described as always running when it runs only if its option is set
- an example value or fix that works in one case and fails in another
