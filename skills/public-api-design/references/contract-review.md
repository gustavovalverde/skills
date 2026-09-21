# Review the caller's contract

## Understand the task

Choose a representative caller and operation from actual usage, requirements, or supplied examples. Identify what they must know, decide, and coordinate. When evidence is missing, state the assumption that affects the recommendation rather than inventing a persona or a requirement.

| Caller burden | What to investigate |
|---|---|
| Discovery | Can developers find the operation using familiar domain and ecosystem vocabulary? |
| Decisions | Which options express necessary policy, and which ask callers to choose implementation details? |
| Coordination | Must callers repeat registration, preserve identity, or order setup steps? What requirement makes that necessary? |
| State | Who owns resources, transactions, cancellation, and cleanup? Can callers tell when an operation is complete? |
| Failure | Can callers distinguish rejected input, absence, unavailable dependencies, and an unknown outcome? |
| Change | How much caller code changes when a normal requirement changes? Can advanced use build on basic use? |

Use the answers to compare alternatives, not to assign a numerical usability score. A task may inherently require multiple steps or an explicit lifetime. Hiding those obligations can make an API harder to reason about.

## Simplify without hiding policy

Keep internal validation, composition, and dispatch behind a task-level operation when that removes coordination without concealing relevant behavior. Let optional controls build on the common case. Preserve diagnostics and control that actual consumers need; avoiding setup work should not make failures opaque.

Prefer types or setup validation that reject invalid combinations before consequential work begins. Some failures depend on runtime state and cannot be rejected during initialization. Describe when failure occurs and what callers may safely do next.

For network operations, define retry eligibility and bounds against the actual operation and protocol. For deduplication, specify key scope, request matching, and retention when the contract provides them. For transaction helpers, state the atomicity boundary and who owns completion. Do not invent guarantees to make the example shorter.

## Preserve compatibility

Assess changes from an existing consumer's perspective: source compatibility, binary compatibility where applicable, serialized names, status and error behavior, defaults, ordering, and resource ownership. Fewer required arguments can still change behavior if a new default selects a different policy.

When a breaking change is justified, show a direct old-to-new mapping and identify what callers must change. A wrapper or an additive convenience method may improve common usage while preserving advanced behavior. Compare its maintenance cost with a breaking replacement. Documentation-only work preserves exact identifiers unless changing the contract is explicitly part of the task.

## Verify what callers receive

Select checks for the affected surface. Prefer existing tools and tests; a small change does not require every category below.

| Surface | Useful evidence |
|---|---|
| Library or SDK | Compile or typecheck complete common usage against public exports, including inferred return types and supported error handling. |
| HTTP or RPC | Compare requests, responses, errors, and applicable metadata with the implementation and required protocol. |
| Generated client | Generate from the actual schema and inspect or exercise the resulting caller interface. Handwritten types alone do not verify generation. |
| CLI or configuration | Run representative commands or configuration loading; check defaults, invalid input, help, exit status, and output relied on by scripts. |
| Optional integration | Check enabled and disabled configurations when contracts vary. Keep required shared infrastructure distinct from accidental feature leakage. |
| Behavioral change | Exercise the complete operation through the public surface, including relevant failure and cleanup paths. |
| Migration | Exercise supported old usage and the proposed replacement where compatibility is claimed. |

For an assessment without a runnable environment, identify the missing proof. Do not turn a suggested test into a passing result. For usability uncertainty, ask a representative developer to complete a concrete task without implementation coaching when that evaluation is warranted. Agent review can reveal issues but does not replace evidence from intended users.
