# Release planning

Use this when accepted findings have fixes ready or nearly ready and the maintainers are deciding what ships together. This phase recommends; the maintainers decide and perform merges, releases, and publication.

## Group fixes by what users must do

For each accepted finding with a candidate fix, record what an existing user must change after upgrading:

- Storage: schema changes, migrations, or stored records that stop working.
- Public contract: exported types, function signatures, endpoint shapes, configuration options, or error behavior.
- Operation: new configuration, coordinated upgrades across services or installed clients, restarted in-flight flows, or repeated verification.

A fix that only rejects unauthorized behavior is not automatically a breaking change, and the repository's release policy decides which track each change needs. A change that makes existing users adjust their setup can need a minor release even without a signature or schema change. Classify each fix as fitting the patch track, needing the next minor or major, or needing a maintainer decision, and give the reason.

Ship what is ready. Prefer the reviewed fixes that fit the target track over holding the release for every open finding; a finding whose fix is not ready keeps its own timeline. Once a fix has passed review, change it only for a demonstrated defect. Present the grouping as a table the maintainers can share: the advisory, what goes wrong, whether it fits the patch track and why, and its severity.

## Land the fixes

Temporary private forks are for validating a fix with its reporter. When the maintainers choose to land fixes through the repository's normal review path, for example a stack of public pull requests that keeps each fix reviewable, describe the hardened behavior without naming the vulnerability, the advisory, or how to exploit the old behavior until the advisory is published. Respond to review comments that would keep the release on its track, and record the rest for a later release.

## Write the upgrade notice

When a fix changes what users must do, the release notes need an upgrade notice near the top: who is affected, what to upgrade together, what to restart or reconfigure, and what does not change, such as the absence of a schema migration. Changesets and release notes follow `pr-writing` when available. The notice carries no exploit detail.

## Publish after the release

Publication follows the release the maintainers name. Before each advisory is published, set its fixed versions to that release on every affected line with [release lines and ranges](releases.md), draft its body for the moment of publication as [writing](writing.md) describes, and complete the [readiness](readiness.md) check. The maintainer publishes, or explicitly authorizes publishing the named advisories once the release ships. Related reports that were not selected stay pending.
