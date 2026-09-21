# Rename checks

## Establish meaning and scope

Inspect the implementation and callers, including return values, absence handling, side effects, and errors. A name such as `findAccount` may permit a missing result while still throwing on a database outage. Changing the name does not establish a new error contract.

| Concern | Question |
|---|---|
| Role | Does the name identify an action, value, predicate, type, or capability in the project's conventions? |
| Specificity | Does the reader need more context here, or is it already supplied by the module, receiver, or local scope? |
| Effects | Would callers mistake a write, destructive read, network operation, or deferred job for something else? |
| Units and shape | Are duration units, counts, singular/plural meaning, and map relationships clear where the type does not express them? |
| Polarity | Is the predicate understandable at its important use sites, without changing what true means? |
| Vocabulary | Does the term distinguish domain concepts consistently across code and documentation? |

Avoid names that suggest guarantees the implementation lacks. `ensure` does not make a non-atomic check-and-create safe; `verify` does not establish cryptographic verification. Fix a misleading name or identify the behavioral defect according to the requested scope.

## Respect compatibility and conventions

Determine whether the name is consumed outside the edited code: public exports, reflection, dependency injection, serialization, schemas, URLs, CLI flags, environment variables, metrics, event names, selectors, and generated clients can all be contracts.

An internal binding can change while a wire key stays fixed through an explicit mapping. Public names may require an alias, deprecation path, migration, or versioned change. Keep names that genuinely distinguish supported versions or concrete adapters. Do not delete an older API simply to remove a temporal adjective.

Use the target language's conventions for interfaces, async methods, constants, and acronyms. Framework-enforced forms take precedence over stylistic preferences; for example, React hook naming conveys restrictions on how the function may be called. A conventional `Service`, `Handler`, or `Manager` suffix can be accurate when its role is clear.

## Propagate and verify

Use symbol-aware rename tools when available, then inspect textual references that they cannot resolve. Search affected source, tests, mocks, documentation, configuration, scripts, and generated inputs. Update generated outputs through the normal generator where appropriate.

Classify remaining uses of the old name instead of requiring zero matches. Compatibility fixtures, external keys, migration documentation, and unrelated symbols may correctly retain it. Avoid global replacement of a common word across distinct domains.

Run the repository's relevant type, lint, and behavioral checks. Exercise runtime discovery or serialization when they depend on strings; a build may be needed for import or route changes. Keep validation proportional to the affected contract. A local variable rename does not require a full deployment test suite.
