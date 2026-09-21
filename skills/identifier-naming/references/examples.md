# Decision examples

## Name an atomic mutation honestly

An operation increments a durable sequence and returns the allocated number in one atomic action. `getSequence` hides the write; `allocateSequenceNumber` may better express the caller's task.

Keep the atomic operation. Splitting it into an increment followed by a read can return another caller's number. Command–query separation is a useful lens, not a reason to introduce a race.

## Keep units explicit without changing the wire contract

A local variable called `timeout` represents milliseconds. `timeoutMs` can clarify an ambiguous numeric value. If the server expects a field named `timeout`, preserve that field explicitly:

```ts
const request = { timeout: timeoutMs };
```

This is a naming sketch, not a proposed protocol change. Renaming the serialized field requires separate compatibility analysis. A duration type may already express the unit sufficiently in another language.

## Boolean polarity depends on the concept

A permission predicate is `canEdit`, and a button consumes it as `disabled={!canEdit}`. The negation is ordinary adaptation between permission and presentation; it is not automatically a naming defect.

Keep the permission name when it describes the domain clearly. Use `isDisabled` for actual control state when appropriate. Renaming one to the other without inverting all relevant logic changes what true means.

## Preserve language and API conventions

A repository uses Python's `snake_case`, or a public API follows a language convention that includes interface prefixes or async suffixes.

Apply that convention rather than importing a TypeScript naming table. Preserve `ClientV2` when it distinguishes a supported contract version. A private `newClient` left behind after a completed migration may instead need a stable role name.

## Scope can supply the domain

Inside a short loop over customers, `customer` is usually sufficient. At a boundary accepting both the payer and recipient, `payer` and `recipient` communicate different roles better than two numbered customer variables.

Add context to resolve a real ambiguity. Repeating the entire domain in every local binding makes reading harder without making meaning more precise.

## Clarify a file or folder's existing role

`utils.ts` contains only invoice-total calculations. Renaming it to `invoice-totals.ts` can clarify its role without moving or splitting the implementation. Likewise, a folder called `common` that contains only invoice code may warrant a domain name if the surrounding scope does not already supply it. Check imports and path-based discovery before applying either rename.

If the file mixes invoice calculations, payment execution, and notification delivery, a more specific filename cannot establish a coherent responsibility. Assess ownership and grouping before choosing names for any resulting modules. Do not turn the naming request into an unrequested restructuring.
