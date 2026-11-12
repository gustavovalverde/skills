# Default structure

Use this structure when the repository has no pull request template:

```markdown
Fixes #123

## Summary

## Reviewer notes

## Evidence

## Merge danger

**Door:**

**Blast radius:**
```

Delete Reviewer notes when there is nothing to add. Delete Evidence when there is no behavior to show, such as a prose-only docs change. Delete Merge danger for a docs-only or CI-only change that a revert fully undoes.

## With a repository template

Write only the template's sections, in its order. Apply each rule from `SKILL.md` to the section with the same purpose: Motivation takes the Summary rule, Solution takes the reviewer-notes rule, and Testing takes the evidence rule. Put link lines where the template asks for them, or at the top when it does not say. Add a Merge danger section only when the door is one-way and the template has no place for risk.

## Link lines

Put each relation to another issue or PR on its own line above the first heading, so a reviewer sees what the PR fixes or replaces first:

```markdown
Fixes #123
Part of #124: adds the RPC field; the index comes in a later PR
Closes #456: same fix, without the new option
Depends on #789: review only the last two commits until it merges
```

- `Fixes` resolves an issue. Use the closing keyword the platform recognizes.
- `Part of` partly resolves an issue. Say which part.
- `Closes #N: <reason>` supersedes another PR, with the reason in one line. Credit the original author when this PR reuses their work. GitHub does not close a pull request through a keyword, so the replaced PR must be closed by hand. Tell whoever asked for the description, and close it only when they ask you to.
- `Depends on` marks a stacked PR. Say which commits to review. Remove the line when the base merges.

A change with no issue has no link lines. Its Summary says why the change is needed.

## Evidence by change type

- **A fix:** the test that fails without the change and passes with it, named and described by what it checks.
- **A performance change:** the workload, the environment, and before and after numbers for this PR alone.
- **A workflow or script:** how it was run. For a job that runs only on release or a schedule, when its first real run will be.
- **A visual change:** a screenshot, with a sentence on what it shows.

List as not tested only what a reviewer might assume was tested, with the reason.

## Door and blast radius

**Door:** "two-way" when reverting the PR fully undoes it. "One-way" when the change acts outside the repository in a way a revert does not undo, such as a data migration, a publish, a deployment, or deleted data. "Two-way until the next release" for public API, configuration, schema, or protocol changes, which become a contract once released; name who is affected after that.

**Blast radius:** what a defect would affect, in a few words, such as "session lookup", "RPC clients", or "release path". Add a sentence only for a consequence a reviewer would not infer, such as an extra query on every request.

## Example

A large change keeps the short Summary. Its length goes into one visual, a few design choices, and the evidence:

````markdown
Part of #9797: Chrome only; other browsers are unchanged

## Summary

A copied session cookie works on any machine until the session expires. With the new `@better-auth/dbsc` plugin, a Chrome session works only on the device that created it. Other browsers keep ordinary sessions.

## Reviewer notes

A copied cookie belongs to the same session as the real one, so the check must run on every lookup, not at sign-in. Core gets one plugin option, `validateSession`, at each place a session is looked up:

```diff
 getSession
+  plugin.validateSession(session, ctx)
 multi-session, admin, one-time-token, sign-out
+  isSessionAccepted before reusing a stored session
```

- **The device key is stored on the session**, so the plugin needs no table and works with secondary storage.
- **A copied cookie never deletes a session.** Signing out with it clears that browser's cookies only.

## Evidence

The Playwright spec `e2e/integration/dbsc` drives Chrome against an HTTPS server. With enforcement removed, a second profile holding only the token gets the owner's session. With it, `/get-session` returns `null`.

## Merge danger

**Door:** two-way until the next release, after which `validateSession`, `isSessionAccepted`, and the `dbscPublicKey` column are public contract.

**Blast radius:** session lookup.
````
