# Working records and maintainer handoff

Process version: 2.2.0.

Every phase follows [policy.md](policy.md). Each checkout keeps private working records in ignored `.notes/advisories/`. GitHub remains authoritative for state and discussion. A local decision, checkpoint, or completed queue row does not change GitHub.

## Start a workspace

Use Node.js 20 or newer. Live reads additionally require `gh`, Git, and access to the repository's private advisories. Resolve `SKILL` to this installed skill folder, `REPO` to the project checkout, and `GITHUB_REPO` to its `OWNER/NAME`. Do not assume another maintainer's paths. No helper installs dependencies or executes report code.

```sh
node "$SKILL/scripts/workspace.mjs" init "$REPO/.notes/advisories" --repo "$REPO"
```

Setup refuses tracked or non-ignored case storage. If needed, add `/.notes/advisories/` to the checkout's local Git exclude file, whose location is returned by `git rev-parse --git-path info/exclude`. Do not unignore or commit case evidence. Setup preserves existing files and refuses conflicting schemas instead of replacing them.

Before creating a case, read its live discussion and search approved shared records, all advisory states, issues, PRs, and releases. Queue generation only lists triage reports; it is not the duplicate search.

```sh
node "$SKILL/scripts/workspace.mjs" queue "$REPO/.notes/advisories" --repository "$GITHUB_REPO"
node "$SKILL/scripts/workspace.mjs" new "$REPO/.notes/advisories" ghsa-xxxx-yyyy-zzzz --repository "$GITHUB_REPO" --repo "$REPO" --owner MAINTAINER
```

Replace the example ID with a real GHSA. `new` reads the advisory and the current revision of the remote's default branch, or of the branch named with `--stable-branch`. Add `--prerelease-branch NAME` when the project keeps a separate pre-release branch; without one, the pre-release fields are recorded as not applicable. It saves a private source snapshot and creates `case.json` and `triage.md`, recording the repository so later commands reuse it. Fetch and inspect the recorded source revisions separately: discovering a SHA is not inspecting its code. Intake's `last_triaged_at` is a setup timestamp, not proof of completed review. Take acknowledgement and disclosure deadlines from the repository's security policy or an installed profile for the repository, and verify the current SECURITY.md before relying on them.

For offline checks, `new` accepts `--snapshot PATH --stable SHA`, plus `--prerelease-branch NAME --prerelease SHA` for a pre-release branch; these are supplied observations, not live verification. Offline intake records live reads as unauthorized. `queue --inventory PATH` accepts a GitHub array or paginated arrays. Record collection time and access limits in the assessment. Never present an offline check as fresh remote state. On systems where a temporary path is a symlink, use its resolved real path; the helper refuses symlinked workspaces.

For isolated reviews, initialize a separate Git checkout for records, with `.notes/advisories/` ignored. `init --repo` names this storage checkout; `new --repo` and `resume --repo` name the inspected source checkout. The helper writes only under ROOT and uses the source checkout for ref discovery and the manifest path:

```sh
node "$SKILL/scripts/workspace.mjs" init "$RECORDS_REPO/.notes/advisories" --repo "$RECORDS_REPO"
node "$SKILL/scripts/workspace.mjs" new "$RECORDS_REPO/.notes/advisories" ghsa-xxxx-yyyy-zzzz --repository "$GITHUB_REPO" --repo "$SOURCE_REPO" --owner MAINTAINER
```

Use the same storage ROOT for capture, validation, and checkpoints. Offline snapshot options work unchanged. Preserve source URLs and snapshots exactly; canonical `GHSA-xxxx-yyyy-zzzz` identifiers are accepted without uppercasing their suffix.

## Complete the assessment

Keep `case.json` and `triage.md` for every case. The JSON follows the `advisory-case/v2` contract, and records written by earlier, project-prefixed versions of this workflow (`PROJECT-advisory-case/v2`) still validate without rewriting; Markdown explains the evidence and reasoning. Separate each claim's verdict from its disposition, product-contract conclusion, and branch state. Ordinary engineering work uses `issue`; it is not automatically a security advisory.

Record actor authority and input, the supported guarantee, source/control/sink or defeating guard, evidence and counterevidence, uncertainty, exact inspected SHAs, historical support, duplicate coverage, and version evidence. Explain advisory eligibility separately from technical validity. A material unresolved claim keeps the report-level recommendation provisional even when another claim is confirmed.

`continuity` records the accountable owner, next action, hold, approved shared-record URL and audience, and the revision reviewed at handoff. Unknown values remain null, not invented. Document the canonical URL and ownership check per duplicate claim in `triage.md`, with candidate IDs in the manifest. Record each action's authority and observed result in the decision section. The historical `maintainer_decision` field is not a blanket authorization for external actions.

Use `variants.md` only for confirmed findings and only when it adds relevant scope analysis. Create `advisory.md` only after explicit advisory acceptance; metadata-edit approval is not acceptance. No reproduction artifacts are required by this skill. If runtime evidence is material but unavailable, record a precise proof gap and request bounded specialist validation. A remediation plan and green test are not prerequisites for a technical verdict.

The shared policy's published-advisory retrospective exception uses `advisory.review.md` and `metadata.review.json`, not `advisory.md`. The manifest retains observed state, an advisory-eligible recommendation, and unknown approvals without treating the review-only candidate as accepted disclosure.

Capture the closing observation without silently replacing the baseline:

```sh
node "$SKILL/scripts/workspace.mjs" capture "$REPO/.notes/advisories" ghsa-xxxx-yyyy-zzzz after
```

The immutable observation includes a digest of the complete GitHub API response. Compare it with the original snapshot, update `github_snapshot.after` and `unchanged` truthfully, and reconcile any changed fields or newly available discussion. Digests do not cover discussion absent from the API response: read comments separately. Do not update source timestamps or `last_triaged_at` to imply work that was not performed.

```sh
node "$SKILL/scripts/workspace.mjs" validate "$REPO/.notes/advisories" ghsa-xxxx-yyyy-zzzz
node "$SKILL/scripts/workspace.mjs" validate "$REPO/.notes/advisories" ghsa-xxxx-yyyy-zzzz --ready
```

The first checks record structure and consistency. `--ready` also rejects legacy process versions, missing owners, placeholder evidence/revisions, absent final observations, and source updates newer than the assessment. Neither can establish that evidence is true, that a product guarantee exists, that a reviewer approved an action, or that a linked document is accessible. Review those explicitly.

Both modes also compare each record with the latest `observation-*.json` that `capture` saved in its case directory. They print a drift warning when `source.github_state` or `github_snapshot.after.state` differs from the observed state, or when `post_triage.metadata_request.cvss_vector_string` differs from the observed CVSS 3.1 vector. Warnings never fail validation. A requested vector can legitimately differ until its authorized write happens; otherwise reconcile `case.json` with the observation, or explain the difference in triage.md.

When both source state and the initial GitHub snapshot are already `published`, ordinary validation and checkpoints preserve missing historical milestones. `new` records the observed `published_at`, not an inferred approval. Record event times separately from when evidence was checked: leave unknown merge or metadata-completion times null, and record today's verification as today's observation in triage.md. Do not substitute commit or advisory-update timestamps. `--ready` means ready for assessment review, not publication.

For a new disclosure decision, add `--publication-check` to validate the required lifecycle milestones and chronology even for an imported published case. Missing milestones still block that check; an import is not a disclosure exception. Explicit human approval and the readiness skill remain necessary. A passing historical checkpoint never certifies the original publication process.

For ordinary fixed-advisory publication, record merge, public-branch verification, release, and complete metadata before publication. A policy-mandated disclosure without a fix requires a named maintainer's dated, reasoned `post_triage.disclosure_exception`; do not fabricate release milestones. CVE reservation is a separately authorized action and need not follow publication. See [GitHub updates](github-updates.md) for external-write boundaries.

## Preserve and share a decision

Checkpoint before changing an earlier conclusion, and again after the review:

```sh
node "$SKILL/scripts/workspace.mjs" checkpoint "$REPO/.notes/advisories" ghsa-xxxx-yyyy-zzzz --reviewer REVIEWER --reason "Reviewed supported configuration; remaining gap is documented" --ready
```

`--reviewer` is required and names whoever performed the review being checkpointed, which can differ from the case owner in `continuity.owner`. An agent records its own identity, never a maintainer's name unless that maintainer reviewed the record.

This creates a new content-addressed JSON file under the case's `history/`, preserving `case.json` and `triage.md`, reviewer, time, and reason. It never overwrites a checkpoint or uploads anything. For an incomplete assessment, omit `--ready` and state the gap. For a reversal, identify the earlier checkpoint revision, changed evidence, former conclusion, new conclusion, and reviewer in the assessment. The files are ordinary local records, not a tamper-proof audit service; their digest detects changes only when compared with a trusted revision.

For team continuity, choose a location explicitly approved for that advisory's audience. The private GitHub advisory discussion can hold an approved summary and a link to an access-controlled evidence record. An approved private case store can hold the checkpoint itself. Access to a skills repository, wiki, or tracker does not imply access to an embargoed case. Do not upload private evidence to a skills repository or a public attachment service.

Before sharing, inspect both files for sensitive data and unnecessary personal paths. The checkpoint deliberately excludes raw snapshots, reporter attachments, tests, and executable artifacts. Put necessary evidence links, source revisions, and access prerequisites in `triage.md`; a checkpoint without accessible supporting evidence is an incomplete handoff. The helper cannot verify link permissions. Confirm the recipient can read the actual evidence. Sharing or posting needs explicit authority for the destination and content.

Record `shared_record_url` and `shared_audience`, then create the final checkpoint. Send its revision through the approved channel along with the owner, recommendation, holds, gaps, and next action. Do not claim the handoff is shared until the upload and recipient access are verified. A local filesystem path is not a shared-record URL.

The receiving maintainer saves that checkpoint locally and runs:

```sh
node "$SKILL/scripts/workspace.mjs" resume "$REPO/.notes/advisories" --from CHECKPOINT.json --expect TRUSTED_SHA256 --repo "$REPO" --owner RECEIVING_MAINTAINER
```

Resume verifies content and identity, refuses an existing case directory, preserves the original checkpoint, changes the local checkout path and owner, and disables live reads, external writes, and runtime authority. It does not refresh evidence or remove a hold. Establish read authority, read the previous decision, verify shared evidence access, refresh live metadata and discussion, and inspect current refs before deciding whether reassessment is needed. If a case already exists, compare checkpoints and reconcile explicitly. Never resolve two maintainers' differing conclusions by last-write-wins.

## Queue and earlier records

`queue` writes `QUEUE.team.json` and `QUEUE.team.md` and leaves other files untouched. The team queue is a generated view of current triage-state reports and local manifests, not another place to edit verdicts. It distinguishes missing records, legacy Markdown assessments, stale records, explicit holds, and current local status. An intake row is not a deep analysis. Drafts do not appear in new intake.

Run `queue --check` against live GitHub to reject stale or edited queue entries. With `--inventory`, it checks consistency against that supplied snapshot only. Refresh at the start and end of a work session. New remote comments may require reassessment even if metadata timestamps do not change. To select the next case, read history for `history_check_required` or `legacy_assessment_check_history` first, then consider stale or nonterminal records. Do not automatically pick holds or previously handled cases.

Records created under an earlier process version stay readable without rewriting their decisions. Checkpoint any record you intend to change, and upgrade a case when reassessing it: keep `schema_version`, set `process_version` to `2.2.0`, add `continuity`, and review every recommendation and old authorization. Do not mass-mark cases reviewed, accepted, or terminal, and verify with `validate --ready` after the new review. Records with a newer process version fail closed until the installed skill is updated. Re-running `init` in a workspace created with an earlier schema stops at the differing `case.schema.json`; archive the old schema, templates, and queues before replacing them, and never copy the archive into a skills repository.

Historical values that never matched the schema are translated explicitly during reassessment, not normalized automatically. Store full request and response evidence privately alongside the case, as the [update helper](github-updates.md#send-the-update) does; the manifest's `metadata_request` keeps only the scoring fragment. A failed legacy validation is a migration task, not a reversal of the vulnerability assessment.
