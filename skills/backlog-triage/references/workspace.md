# Persistent triage records

Use an ignored or explicitly chosen external workspace for batches, large discussions, and resumable work. Find the existing canonical records before creating a new directory. Gitignored notes do not appear in ordinary `git status`, and worktrees do not inherit their contents. Verify the selected location directly and check that it is ignored or outside the source checkout. Never store case data inside the installed skill or commit it to the skills repository.

GitHub owns current public state, type, labels, relations, and implementation links. Local JSON records own evidence, criterion coverage, recommendations, uncertainty, verification, and action history. Tables are generated reading views. A local record or successful validation does not prove that GitHub was changed.

## Capture and reuse evidence

Collect issues and PRs in a central inventory. Freeze a bounded batch ordered by creation time and item number descending. Prioritize consequential work and genuine prerequisites separately, and record a revisit trigger for stalled work. Record repository identity, acquisition start/end, refs, target order, counts, pagination, errors, completeness, and the next cursor. This is a set of observations, not an atomic snapshot of GitHub. Add newly created items to a later intake wave.

Use installed connectors or authenticated `gh`. Prefer REST pagination for large inventories and focused GraphQL for nested relationships or review threads. Search and similarity helpers identify candidates; they do not establish exhaustive coverage or duplication. A list command's default limit is not the repository's total.

For GitHub.com, these read-only acquisition commands retain complete REST pages when the calls succeed. Replace `OWNER/REPO` with the resolved repository, and use fresh output paths in the evidence store:

```sh
gh api --method GET --paginate --slurp 'repos/OWNER/REPO/issues?state=open&per_page=100' > open-items.pages.json
gh api --method GET --paginate --slurp 'repos/OWNER/REPO/pulls?state=open&per_page=100' > open-prs.pages.json
```

The issues endpoint includes PRs; distinguish objects with `pull_request` and reconcile their identities with the PR inventory. Check command exit status before marking either capture complete. Preserve a failed or partial capture as incomplete; never promote it to a complete inventory. GitHub mutations during pagination can cause drift, so validate identity uniqueness and acquisition limits. [GitHub CLI pagination](https://cli.github.com/manual/gh_api).

Hydrate selected groups on demand: full bodies, comments and timelines, native relations, PR metadata/head/base, relevant files, reviews/threads, and checks. Paginate each nested connection separately, retain totals and errors, and chunk large context with a manifest linking every material section. Search relevant closed/merged work, symbols, history, and published artifacts. Store complete observations once; summaries and worker prompts point back to them.

Keep immutable source evidence by revision and mutable observations by timestamp/content hash. Refresh affected GitHub metadata at session boundaries and before actions. A changed comment, scope, ref, or PR head invalidates dependent conclusions and verification. Unchanged evidence can be reused without another broad sweep. Unknown evidence blocks only the affected action; unrelated complete groups can progress.

## Complete an area assessment

Define the area by behavior, package ownership, and supported contracts before filtering. Reconcile unique issue and PR identities against the captured totals, including PRs returned by the issues endpoint. For every captured item, retain a scope disposition of direct, adjacent, outside, or unknown, with a brief reason and evidence pointer. Labels, search matches, tracker membership, and Project membership cannot establish semantic coverage.

Record review depth separately: screened for scope, assessed against material requirements and related work, or reviewed at an exact PR head. A complete area assessment does not imply every PR received a merge-readiness review. Map each direct or relevant adjacent item to its problem group and record its recommendation, remaining evidence or scope decision, and next action. Reconcile standalone PRs and closed or merged fixes discovered outside the open inventory too.

The completion report states the captured issue/PR totals, counts for each scope disposition and review depth, group coverage, unresolved decisions, and the next cursor or revisit trigger. Claim complete inventory only after successful pagination and identity reconciliation; complete area screening only when every item has a resolved scope disposition; and complete area assessment only when all relevant items have an accounted-for assessment. Otherwise name the completed stage and its denominator, identify undisposed or unassessed items, and retain the remaining work. A generated matrix's valid rows cannot prove that omitted items were assessed.

## Local ledger commands

The dependency-free Node.js helper needs Node.js 20 or later. Set `SKILL` to the installed `backlog-triage` folder and `RUN` to the chosen record directory. The helper has no GitHub access or product-code execution.

```sh
node "$SKILL/scripts/ledger.mjs" new "$RUN/groups/resource-tokens/group.json" --repo OWNER/REPO --id resource-tokens
node "$SKILL/scripts/ledger.mjs" validate "$RUN/groups/resource-tokens/group.json"
node "$SKILL/scripts/ledger.mjs" digest "$RUN/groups/resource-tokens/group.json"
node "$SKILL/scripts/ledger.mjs" validate "$RUN/groups/resource-tokens/group.json" --ready
node "$SKILL/scripts/ledger.mjs" render "$RUN/groups"
```

`new` creates a draft from the bundled [template](../assets/group.template.json) without replacing an existing record. A group lives in `<group-id>/group.json`. Fill its fields from evidence; do not copy a verdict from another group. `validate` checks the record contract. `--ready` additionally requires a nonempty assessment, reconciliation, and a decision for every known-open member. Closure requirements include the relevant criterion coverage and independent verification. Keep-open and decision-needed outcomes can explicitly account for unresolved work. Passing validation is a recommendation gate, not execution authority or proof that evidence is true or current.

`digest` identifies the normalized group record, excluding its verification field so a reviewer can bind verification to the reviewed result. The reviewer records their own identity and the actual result revision. Changes to evidence, scope, members, or decisions change the digest. The helper validates the recorded attestation and revision binding; it cannot establish who performed a review or whether it occurred. Do not fabricate an independent reviewer to pass validation.

`render` finds group records recursively and atomically generates `matrix.md` in the supplied directory. It refuses malformed or invalid input instead of silently omitting a row. Re-render after record changes; preserve original evidence and previous decision revisions separately. The generated matrix must not be edited as a second verdict store.

## Fill a group record

The helper currently accepts GitHub.com URLs and one repository per record. Other hosts and cross-repository groups can use the existing evidence store without this helper. Issue and PR numbers share their repository's number namespace. The record's `id` matches its parent directory, and `coordinator` names the actual owner. The template starts with empty arrays so no example verdict is mistaken for evidence.

| Field | Item shape and meaning |
| --- | --- |
| `members` | `kind` is `issue` or `pull_request`; include numeric `number`, matching GitHub `url`, ISO `observed_at`, `context_complete`, observed `state`, and `head_sha` for PRs. Issue states are open, closed, or unknown; PRs also support merged. |
| `criteria` | Each has unique `id`, the material `request`, exact `requested_surface`, and numeric `member_ids` to which it applies. A surface is an endpoint or public API, not a broad OAuth category. |
| `evidence` | Unique `id`, `kind`, `locator`, ISO `observed_at`, `complete`, and a `revision` when relevant. Kinds are issue_thread, pull_request, source, docs, release, runtime, contract, maintainer_decision, or other. A maintainer decision points to the actual decision and its scope. Optional numeric `member_id` associates evidence with a member. PR observations bind to that member's actual head. |
| `coverage` | Numeric `item_id`, `criterion_id`, exact `surface`, `status`, `basis`, numeric `target_id` where applicable, and `evidence_ids`. Status is covered, partial, missing, or unknown. |
| `canonical_issue` / `selected_prs` | Nullable canonical issue number and an array of selected PR numbers, all resolving to members. A selected PR is not proof of implementation or release. |
| `decisions` | Numeric `item_id`, `action`, `rationale`, `evidence_ids`, and `target_id` for a duplicate or supersession. Actions are keep_open, decision_needed, close_duplicate, close_resolved, close_answered, close_superseded, or close_not_planned. Only issues use resolved/answered/duplicate; only PRs use superseded/not_planned. A not-planned PR closure needs current-head and contract or explicit decision evidence, and has no replacement target. |
| `reconciliation` | Pending or complete `status`, coordinator `rationale`, `unresolved_conflicts`, and any explicit `scope_decisions` binding criterion, requested and accepted surfaces, decision authority, and rationale. |
| `verification` | Actual `reviewer`, reviewed `result_revision`, confirmed or changes_needed `verdict`, and `pending` flag. Pending is not an independent pass. |

Leave `scope_decisions` empty when no actual scope decision exists. Preserving an intake request belongs in `criteria`; it does not require an accepted-surface entry or a placeholder authority. Closed or merged historical members need no keep-open decision.

Mark `context_complete` and evidence `complete` for the material actually inspected. A head SHA identifies a patch; it does not establish that the patch, relevant discussion, or tests were reviewed. A PR-body summary cannot be marked as a complete implementation observation when relevant patch evidence is missing. Keep its proposed coverage unknown and record the inspection gap.

Coverage basis explains what is established: `canonical_scope` means the target issue owns the criterion; `candidate_pr` means an inspected PR proposes it; `current_code` means it is implemented on inspected source; `released` means a published artifact contains it; `contract` establishes the supported behavior. These assertions are not interchangeable.

For example, a canonical-scope row for a duplicate issue points to the canonical issue and references both reports:

```json
{
  "item_id": 52,
  "criterion_id": "logout-tabs",
  "surface": "client.signOut",
  "basis": "canonical_scope",
  "target_id": 51,
  "status": "covered",
  "evidence_ids": ["report-52", "canonical-51"]
}
```

A fixed closure instead needs covered current_code or released rows for every applicable criterion, with source/release evidence rather than only issue discussion or an open candidate. A scope decision accepting another API must be real and explicit. The coordinator must still judge whether declared criteria and evidence represent the complete material request; the helper cannot discover omitted requirements.

## Record ownership and limits

Keep one coordinator-owned record per bounded group, with worker assessments stored separately. The template covers members, material criteria, API surfaces, evidence locators/revisions, coverage, canonical issue, implementation selection, per-item recommendations, reconciliation, and independent verification. Member references and canonical IDs must resolve consistently within the group's repository. External work can be evidence; unsupported cross-repository consolidation remains an explicit gap.

Preserve work kind and availability in the accompanying assessment or evidence, separately from closure actions. Capture native metadata, plans, authorization, receipts, and continuity in adjacent run files when they are needed. This helper does not replace an existing inventory/cache, collect GitHub, validate runtime truth, track all native metadata, or execute an apply plan. Use the existing evidence store and the [native update procedure](github-native.md) rather than inventing helper commands.

Before a consequential change, checkpoint the current record and evidence references in a fresh history file. Preserve old records when migrating or reassessing, and record the reason for a reversal. Refresh live facts before resuming in another session. A local path alone is not a team handoff: public GitHub should contain the brief decision and actionable remaining scope, and any shared evidence store needs an appropriate destination and audience.
