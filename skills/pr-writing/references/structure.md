# Default structure

Use these shapes when the repository has no pull request template.

## A change the diff shows in full

Most fixes and small changes need link lines and one paragraph, with no headings:

```markdown
Fixes #812

Retrying a failed CSV export left the job marked as failed, so the retry never ran. Retry now clears the failure state before it schedules a new attempt.

`retry.test.ts › clears the failure state before scheduling` fails without the change and passes with it.
```

## A change that needs reviewer notes

```markdown
Fixes #123

## Summary

## Reviewer notes

## Evidence

## Merge danger

**Door:**

**Blast radius:**
```

Delete Evidence when there is no behavior to show, such as a prose-only docs change. Delete Merge danger when a revert fully undoes the change and a defect would affect only what the diff shows.

## With a repository template

Write only the template's sections, in its order, and remove its comments. Apply each rule from `SKILL.md` to the section with the same purpose: Motivation takes the Summary rule, Solution takes the reviewer-notes rule, and Testing takes the evidence rule. Put link lines where the template asks for them, or at the top when it does not say. Add a Merge danger section only when a revert does not undo the change and the template has no place for risk.

## Link lines

Put each relation to another issue or PR on its own line above the body, so a reviewer sees what the PR fixes or replaces first:

```markdown
Fixes #123
Part of #124: adds the RPC field; the index comes in a later PR
Closes #456: same fix, without the new option
Depends on #789: review only the last two commits until it merges
Related to #790: changes the same function and needs a rebase onto this PR
```

- `Fixes` resolves an issue. Use the closing keyword the platform recognizes.
- `Part of` partly resolves an issue. Say which part.
- `Closes #N: <reason>` supersedes another PR, with the reason in one line. Credit the original author when this PR reuses their work. GitHub does not close a pull request through a keyword, so the replaced PR must be closed by hand. Tell whoever asked for the description, and close it only when they ask you to.
- `Depends on` marks a stacked PR. Say which commits to review. Remove the line when the base merges.
- `Related to #N: <how>` is for any other issue or PR that affects review or landing order, such as one that must rebase onto this change.

A change with no issue has no link lines. Its first sentence says why the change is needed.

## Evidence by change type

- **A fix:** the test that fails without the change and passes with it, named by what it checks.
- **A performance change:** the workload, the environment, and before and after numbers for this PR alone.
- **A workflow or script:** how it was run. For a job that runs only on release or a schedule, when its first real run will be.
- **A visual change:** a screenshot, with a sentence on what it shows.

When you did not see the test fail, name the behavior the test checks and do not claim a before. List as not tested only what a reviewer might assume was tested, with the reason.

## Door and blast radius

**Door:** "one-way" when the change acts outside the repository in a way a revert does not undo, such as a data migration, a publish, a deployment, or deleted data. "Two-way until the next release" for public API, configuration, schema, or protocol changes, which become a contract once released; name who is affected after that.

**Blast radius:** what a defect would affect, in a few words, such as "session lookup", "RPC clients", or "release path". Add a sentence only for a consequence a reviewer would not infer, such as an extra query on every request.

## A large change

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
