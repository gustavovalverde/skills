# Decision examples

## Reproduce with the client's real request

A bug report says sign-in through a partner's identity provider fails with "invalid request". The tempting reproduction builds a request from the report's description, which passes, so the bug looks unreproducible.

Ask for or find the provider's actual request, such as its documented sample payload or the reporter's logs. The real request sends a parameter in a form the description never mentioned, and the test built from it fails on the base branch. A test built from prose tests your reading of the report, not the client.

## Split a narrow fix from a breaking cleanup

A fix for duplicate webhook deliveries also renames the delivery status values and changes their stored form. The tempting change ships both together because they touch the same code.

Answer the release-impact questions for each part. The duplicate fix changes no outputs and needs no migration, so it ships as a patch. The rename changes stored values and response shapes, so it goes in its own change under the repository's rules for breaking changes. Users then get the fix without waiting for the migration.

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
