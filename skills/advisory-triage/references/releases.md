# Release lines and ranges

Use this whenever an assessment, metadata proposal, Patches section, or readiness check states affected or fixed versions.

## Find the fix on every release line

A fix on one line says nothing about the others, and readers on a backport or pre-release line need their own upgrade target. From release tags and the package registry, find the first release containing the fix on the current stable line, each maintained backport line, and each pre-release line. The repository's support policy, or an installed profile for the repository, names which lines are maintained.

For npm packages, the [release-lines helper](../scripts/release-lines.mjs) reports this from the fix and backport commits or pull requests. Repeat `--commit` or `--pr` for each one:

```sh
node "$SKILL/scripts/release-lines.mjs" --repo CHECKOUT --pr PR_NUMBER --package PACKAGE
```

It lists the first tag containing the fix on each line, whether npm publishes it, and the published pre-releases before it on the same pre-release line. A line it does not list has no release containing those commits, so confirm whether that line is unaffected or still needs a fix. For other registries, compare release tags with the registry directly.

A branch fix is not a fixed package, and a merge is not a release. Distinguish "fixed in source" from "a fixed package is available"; an assigned release number does not prove availability. The exception is a body drafted for publication after a release the maintainers have named, which [writing](writing.md) covers.

## Write ranges that do not go stale

- An unfixed issue gets an open-ended range such as `>= 1.3.7` with no patched version, because an upper bound goes stale as soon as another affected release ships.
- A closed range (with `<` or `<=`) needs its patched version beside it; otherwise it implies a fix nobody can install. Unknown fixed versions stay unknown.
- A pre-release line that sorts above the stable fix gets its own closed range beside its patched pre-release, for example `>= 2.0.0-beta.1, < 2.0.0-beta.4` patched in `2.0.0-beta.4` when the stable fix is `1.9.3`. Pre-releases of the fixed version itself, such as `2.0.0-beta.3` before `2.0.0`, sort below it and fall inside the stable range. Flagging one that already has the fix is acceptable; leaving out an affected one is not.
- Verify ranges against history and shipped artifacts on every line. The first verified affected version is not necessarily the first affected version, and the first tested version is not the first affected one.
- Use package-specific affected and fixed ranges. When an update replaces the collection of affected packages, list every one, because an omitted package drops out silently.
- When a range is corrected, change the body with it so the two never disagree.
