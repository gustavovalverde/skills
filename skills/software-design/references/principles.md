# Principles and tradeoffs

## Present requirements and simplicity

YAGNI questions capabilities built for an unconfirmed future need. It does not prohibit abstractions that isolate an existing dependency, enforce an invariant, or make current behavior testable. Compare the cost of carrying an extension point now with the likely cost of adding it later. Required reliability, security, accessibility, and operational controls are current constraints even when they add code.

Judge simplicity across the operation and its consumers. Fewer lines can hide more coordination; additional internal code can make the caller's task easier. Prefer the design that makes relevant behavior and ownership easier to follow within the actual performance and operational constraints.

## Cohesion and information hiding

Group behavior that shares a policy, invariant, or reason to change. Hide implementation decisions behind a boundary that lets callers work without coordinating its internals. Keep independently changing concerns separable when combining them spreads change or couples unrelated lifecycles.

A deep module provides useful behavior through a modest interface. Depth does not require merging everything into one service: transaction, deployment, authorization, and resource ownership boundaries may require distinct components. Follow one operation to determine whether a split isolates a decision or merely forwards calls.

## SOLID as diagnostic questions

| Principle | Question to investigate | Limit |
|---|---|---|
| Single responsibility | Do unrelated policies force changes to the same component or expose each other's internals? | Responsibility concerns reasons to change, not method or line count. |
| Open–closed | Is a demonstrated variation forcing repeated changes across otherwise stable code? | A local conditional may be clearer than a strategy hierarchy. Extension points need a concrete benefit. |
| Liskov substitution | Does each implementation preserve the behavior callers are promised? | Compatible signatures alone do not establish substitutability. Inspect accepted inputs, outcomes, errors, and state changes. |
| Interface segregation | Must a consumer depend on operations it cannot use, or must an implementation promise behavior it cannot supply? | Prefer a useful capability boundary over an interface for every method. |
| Dependency inversion | Does domain policy depend on volatile details that make it difficult to change or exercise? | Injecting a function or passing a value may suffice. Direct construction is appropriate where dependencies are assembled. |

## Duplication and abstraction

Share a rule when copies represent the same knowledge and must change together. Similar syntax can represent independent policies. Extracting it may couple those policies or require flags that make the common function harder to use. Compare the actual callers before deciding; neither a fixed number of copies nor a single implementation determines the answer.

## Control flow and errors

Guard clauses and named conditions help when they expose the main path. Preserve evaluation order, short-circuiting, cleanup, and side effects when introducing them. A name should explain a domain condition rather than conceal an equally opaque expression.

Preserve distinctions between absence, invalid input, unavailable dependencies, and unknown outcomes. Catch an error where the code can recover, translate it accurately, or add needed context. Logging and rethrowing at every layer can duplicate reports. Intentional suppression needs a defined outcome, such as ignoring a failure in optional telemetry; it must not turn a required operation's failure into success.

## Resolving competing concerns

State the constraint that drives the decision: correctness, compatibility, isolation, latency, operating cost, or ease of change. Compare benefits against migration and maintenance costs. Familiar framework conventions are relevant to comprehension, but do not excuse a demonstrated defect. Unfamiliar code may need a short explanation rather than a rewrite.

Complexity measurements can identify places to inspect. They do not establish defects or prove that a refactor improved the system. Test the behavior or boundary that motivated the change.
