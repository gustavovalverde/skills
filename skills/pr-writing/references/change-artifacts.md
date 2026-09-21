# Commits and release notes

## Commit messages

Follow the repository convention. Explain the change at commit scope, with the reason in a body when the subject cannot carry it. Preserve issue references that help future maintainers. Avoid copying the full PR description into a commit.

## Changesets and changelogs

Describe what users observe or can now do. Include required action, compatibility constraints, and affected versions when supported by the evidence. Use exact API or configuration names when users need them; explain the symptom before an internal cause.

For example:

> Retrying a failed CSV export now starts a new attempt. Previously, the export remained marked as failed and could not be retried.

Internal-only refactors may need no entry; follow the repository's release policy. A developer-facing release note can include implementation details when they change an integration contract. Preserve uncertainty rather than promising an unverified outcome.

## Make the symptom concrete

Removing internal names is not enough if the sentence still describes an execution path.

Implementation-focused: “The retry branch now resets the worker flag.”

Reader-focused: “You can retry a failed export without reloading the page.”

Use the second version only when the implementation supports that behavior. A PR may also explain the mechanism when reviewers need it; a release note usually does not.
