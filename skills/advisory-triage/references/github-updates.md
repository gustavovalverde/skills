# Authorized advisory updates

Use this only when the user requests body or metadata changes to a report with an established assessment. Resolve any material uncertainty before changing the corresponding claim. A correct body does not need rewriting merely because it was reviewed again.

## Before writing

Re-fetch the advisory and inspect changes since the assessment. Apply the smallest patch supported by the evidence and current authority.

Unless explicitly expanded, “body and metadata” means summary, description, affected packages and ranges, CWE, and CVSS. It does not include state changes, credits, collaborators, messages, temporary forks, CVE requests, releases, or publication. Reuse explicit permission already given for the same action and case.

For an exact duplicate with no material new contribution, provide closure text and the canonical link, noting that the canonical advisory stays private until publication. Do not edit canonical metadata or credit merely because another report arrived. If the duplicate contributes new evidence, explain the proposed canonical delta separately.

## Body and metadata

Write for affected application developers: what condition is affected, what protection fails, bounded impact, released fixes or their absence, and supported workarounds. Keep implementation detail only when needed to understand the issue. Exclude exploit recipes, raw private evidence, and unsupported claims. Titles start with the affected package that contains the flaw and describe the effect in plain words, as the [editorial review](editorial-review.md) describes.

Send `cvss_vector_string` without `severity`; GitHub derives severity. Choose each Base metric with the [scoring rubric](scoring.md) and keep the metric reasoning in triage.md. The body does not restate the score, vector, or severity, so after a vector change, check that no earlier body still does. It follows the editorial review's rule for credits and the advisory's own CVE ID; credit changes need separate authority.

Write package-specific affected and fixed ranges with [release lines and ranges](releases.md), and preserve complete vulnerability objects when the endpoint replaces the collection. When a range is corrected, send the matching body change in the same update. Do not invent a fixed release.

## Send the update

Send approved changes with [advisory-update.mjs](../scripts/advisory-update.mjs), not a hand-built request. Resolve `SKILL` to the installed advisory-triage folder:

```sh
node "$SKILL/scripts/advisory-update.mjs" OWNER/REPO GHSA-xxxx-yyyy-zzzz --fields CASE_DIRECTORY/metadata-proposal.json --evidence CASE_DIRECTORY/update-1
```

`--fields` takes the reviewed metadata proposal that passed the draft check in [writing](writing.md). Without `--apply`, the command is a dry run: it prints each field's current and proposed value and writes `baseline.json` (the advisory as fetched) and `payload.json` (the request it would send) into the evidence directory. The approval covers that payload against that baseline, so review `payload.json` itself. Repeating the dry run replaces both files, and the latest one is the one to review. Once exactly that payload is approved, repeat the same command with `--apply`.

`--apply` sends exactly the reviewed payload. It refuses to send when:

- the evidence directory holds no dry run of the same advisory;
- the live advisory differs from `baseline.json` in any field other than `updated_at` (the error names each field);
- the fields file no longer produces `payload.json`.

GitHub does not advance `updated_at` for every edit, so an unchanged timestamp does not prove that nothing changed. The payload holds only fields that differ from the live advisory. The helper rejects fields outside this scope, `severity`, and closed ranges without a patched version. When `vulnerabilities` changes, list every affected package, because the endpoint replaces that collection and an omitted package would drop out silently. It also accepts `credits`, but only use that field under separate credit authority. After sending, it re-fetches the advisory and fails when a requested field was ignored or when any other field changed, including state, credits, CVE, and fork information.

An advisory keeps one CVSS vector. Sending a 3.1 vector to an advisory that has a CVSS 4.0 vector removes the 4.0 vector without storing the 3.1 one, so verification fails. Run a new dry run into a new evidence directory and apply it; the second request stores the 3.1 vector.

With `--apply`, it adds `after.json` beside the dry-run files and never overwrites it. A directory that has `after.json` refuses both a dry run and an apply, so use a new private directory inside the case for each update and cite it in triage.md. If the request itself fails, the result is uncertain: fetch before retrying. Stop on a baseline mismatch or conflicting concurrent edit rather than overwriting it; reconcile, then review a new dry run before applying. Return the advisory link and actual changes; do not claim acceptance when only metadata changed.

## Remediation and disclosure remain separate

The normal accepted-finding sequence is draft acceptance, temporary fork, reviewed fix, merge through the advisory, public-branch verification, package release, final ranges, and advisory publication. Publication is disclosure, not a merge or release, and deletes the temporary fork. None of these steps follows automatically from a triage recommendation.

Check the current SECURITY.md for response and disclosure deadlines. A deadline requiring disclosure without a fix needs an explicit maintainer decision, not an invented patch version or silent delay. GitHub supports CVE requests for drafts; separate API capability from team-preferred timing and actual authorization.

## Official references

- [GitHub repository advisory API](https://docs.github.com/en/rest/security-advisories/repository-advisories)
- [GitHub temporary private forks](https://docs.github.com/en/code-security/tutorials/fix-reported-vulnerabilities/collaborate-in-a-fork)
- [FIRST CVSS 3.1 specification](https://www.first.org/cvss/v3-1/specification-document)

Re-check the applicable official contract if a lifecycle rule or API behavior is uncertain.
