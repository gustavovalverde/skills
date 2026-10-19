# Decision examples

## Fix the shared function, not the reported path

An issue reports that exporting an empty report crashes, and suggests a guard in the export handler. Three other handlers call the same `summarize()` function, which fails on an empty list.

Fix `summarize()` and add a test for the empty case there. A guard in the export handler closes the ticket and leaves the three sibling callers broken. When the issue discussion shows a maintainer already rejected the shared fix for a reason, follow that reason instead.

## Use the framework's primitive instead of rebuilding it

A one-time code must be consumed exactly once. The tempting implementation reads the record, checks its status, and writes it back as used. The database adapter in use already offers an atomic consume or a conditional update that reports how many rows changed.

Use the primitive. Read-then-write passes a single-request test and fails under two concurrent redemptions. Add a concurrency test that runs two redemptions together and expects one success.

## Remove the old path when compatibility is not required

A pre-release library renames `createClient(options)` to `connect(config)`. The tempting change keeps `createClient` as a deprecated alias that forwards to `connect`.

The repository's instructions state that it has no compatibility obligations yet, so remove `createClient`, update every caller, test, and example in the same change, and state the rename in the change description. In a repository with published consumers, the same rename needs the migration path its compatibility stance requires.

## Propose the upstream fix alongside a local one

A date library parses a valid ISO 8601 week date incorrectly. The tempting fix is a local regular expression that pre-processes week dates before calling the library.

Check the library's issue tracker and latest release first. When the bug is unfixed, propose the fix upstream with a failing case. If the project cannot wait, add the smallest local workaround, isolated in one place, with a comment linking the upstream issue so the workaround can be removed when the fix ships.

## Treat output that agents parse as a contract

A CLI change rewords an error from `config not found` to a friendlier sentence and moves it from stderr to stdout. Agents and scripts call this CLI and branch on that error.

List the error text, stream, and exit status as side effects. Keep the exit status and stream stable, add a machine-readable error code if the tool lacks one, and treat the wording change as a contract change when consumers match on it.
