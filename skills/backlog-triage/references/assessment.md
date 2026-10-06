# Assess a problem group

## Establish scope and contract

Read the initial report, material comments, and linked work. Break a large request into independent acceptance criteria. Retain exact symbols, versions, API surfaces, configurations, and meaningful changes to the request. Distinguish reporter claims, author explanations, maintainer decisions, and observed behavior. A comment is not approval merely because it appears late in a thread.

For the relevant code path, inspect current source, docs, public and inferred types, endpoint metadata, tests, reported-version history, and delivery state. Source inspection, a test present in a PR, an author-reported passing check, a locally executed check, hosted checks, and published-package behavior are different evidence. Checks that never ran, such as fork workflows awaiting approval, are unknown rather than passing. Bot-authored analysis, such as issue assistants and automated reviews, is a lead to verify in source, not evidence. Do not run a full test suite or execute reporter code merely to perform light triage. Deep reproduction or implementation is a separate scope when needed.

Classify a Bug only when supported behavior violates its contract. A requested capability is a Feature; an intentional policy may need documentation or a design decision. Preserve unknowns rather than inventing certainty. Age and inactivity alone prove neither invalidity nor resolution.

Record outcome and interface separately. For example, a supported registered-client integration might already produce audience-bound tokens while a requested standalone endpoint does not. Report both facts and the material integration differences. A maintainer may accept the alternate integration, or may retain the exact interface request. Neither decision should be inferred from similar output alone.

## Scope-decision handoff

When a supported integration satisfies the outcome through a different API, or valid implementations take opposing design directions, return the concrete choice with the recommendation. Identify the existing integration, link its actual implementing PRs, verify branch or release availability, and explain the exact API or configuration difference. State what each choice means for every related issue and PR, plus missing evidence that still blocks a closure.

Present both options with named item consequences:

- **Accept the supported integration:** the issue can be recommended resolved within the explicitly accepted scope; candidate PRs can be retired only after checking for distinct useful work.
- **Retain the requested interface:** the unmet issue stays open, and compatible candidate PRs remain eligible for technical review.

For example: “The registered-client flow via `POST /oauth2/token` already supplies this outcome in VERSION through #PR_A and #PR_B. Standalone `POST /device/token` does not. Accept that integration for #ISSUE, allowing its resolution and retirement of redundant #CANDIDATE work after patch review, or retain the standalone requirement, keeping #ISSUE open and #CANDIDATE eligible?” Replace placeholders with verified facts.

Record the actual decision and its scope before changing coverage or actions. A compatible technical recommendation is not maintainer acceptance. A generic `decision_needed` verdict alone does not give the maintainer enough information to choose.

## Search related work efficiently

Start with native relationships and explicit report, comment, and PR-body references. Expand with behavior, affected symbols, package ownership, and targeted closed/merged searches. Include fixes and prior attempts, not only the open inventory. Matching titles or files cannot prove equivalent behavior. A PR targeting a non-default branch may mention an issue without having a native closing reference.

Keep an unlinked-PR lane. Infer the intended behavior from the PR body, patch, tests, docs, and discussion, marking the inference. An issue is useful when durable requirements or competing designs need an owner; it is not required for every valid focused PR.

Start with the strongest few candidates for one concrete problem. A shared tracker does not make every connected issue one duplicate group. Record unexamined candidates as gaps and expand when they could change the decision. A repository-wide scope claim needs accounted-for inventory and an explicit area boundary, including related package contracts outside keyword matches.

For a full area, use the [completion criteria](workspace.md#complete-an-area-assessment) to distinguish exhaustive scope screening from requirement assessment and exact-head PR review.

## Compare scope and implementation

Create a coverage table with material criteria as rows and current source, relevant release, and inspected PR heads as columns. Each entry is covered, partial, missing, or unknown, with an evidence locator and revision. Preserve unchecked release surfaces as unknown; investigate only those that can change the recommendation.

Keep these relationships distinct:

| Relationship | Treatment |
| --- | --- |
| Exact or functional duplicate with complete material coverage | Select a canonical owner and consolidate |
| Alternative implementations of the same accepted behavior | Select one vehicle after technical comparison |
| Partial overlap | Keep ownership of each uncovered requirement |
| Complementary changes | Retain distinct implementation responsibilities |
| Ordered stack | Establish prerequisites and implementation order |
| Backport or different supported target | Check delivery need before consolidation |
| Shared topic or tracker | Relate without implying duplicate scope or dependency |

Choose the canonical issue by complete scope, useful evidence, active ownership, and explicit maintainer decisions. Earlier submission is a reasonable tie-break for comparable owners. A closed canonical that is fixed can still explain a duplicate. A closed, unresolved canonical without an owner needs a reopening or replacement decision before discarding unresolved work.

Evaluate PR correctness and contract first, then architecture and compatibility, then relevant evidence and remaining work. Check exact heads and base branches. Contributor association is a hint, not proof of accepted prior work or implementation quality. Use contribution history and age only when the repository adopts those preferences and the technical candidates remain comparable. Do not infer bad faith because an author opened another PR instead of editing a fork they might not be able to access.

An issue closure assessment includes its known related PRs. For each, decide whether it remains useful, is superseded, is complementary, or still needs investigation. Selecting an unmerged PR does not resolve the issue. A test-only contribution can be declined when it adds no material value; do not invent a transfer requirement for every artifact. Useful missing behavior must remain owned, and claimed transfers need actual evidence.

## Coordination

Use the host's supported subagent tools when independent slices add value. Follow the user's and repository's model choices; no specific model or plugin is required by this skill.

- **Coordinator:** owns group identity, scope, shared evidence, canonical selection, reconciliation, records, and final delivery. It centralizes GitHub writes.
- **Assessors:** receive bounded groups or a concrete contract/implementation slice, source refs, full-context pointers, owned output paths, and permitted side effects. They return per-criterion findings with API surface, evidence, uncertainty, and the exact inspected revision. Avoid repeated inventory fetches and competing edits to the same record.
- **Verifier:** challenges consequential decisions against raw evidence, checks material scope and alternate integrations, and confirms the decision at its recorded revision. Also sample keep-open groups and reported missing capabilities to catch overlooked fixes. Record the actual reviewer and tested revision.

Workers must not independently close their assigned issues or select a final canonical across competing assessments. Before rendering a recommendation, the coordinator reconciles incompatible findings and actions. Two claims about different API surfaces may both be correct. A disagreement over the same criterion/surface requires adjudication; an alternative supported outcome requires an explicit scope decision when it changes the action.

Reusing verified evidence requires matching identity, scope, discussion, source refs, and relevant PR heads. Changed evidence invalidates affected decisions, not every completed group. If an independent verifier is unavailable, preserve verification as pending where required; do not attribute verification to another person or stop unrelated analysis.

## Recommend an action

Duplicate closure requires complete material coverage and a canonical destination. Fixed closure requires the actual fixing work and criterion evidence; confirm version or branch availability before claiming it. Intentional behavior or invalid usage can be explained from authoritative contract evidence without inventing a fixing PR. Partial fixes leave the unmet requirement open or explicitly owned.

A PR can be declined because it contradicts the supported contract or implements an explicitly declined design, even when no replacement PR exists. Record that as `close_not_planned`, with the inspected head and authoritative contract or maintainer decision. Explain the actual incompatibility; do not invent a superseding PR or treat a new, unreviewed proposal as already declined. The related issue may remain open for a compatible implementation.

Keep closure comments short and truthful:

> Closed as a duplicate of #CANONICAL. This issue is linked to the canonical one for tracking. Thank you for the report.

When the reports differ slightly but share the material scope, write "duplicate of, or very similar to" instead.

> Fixed by #PR [verified availability, if useful]. Thank you for the report.

> Closing as superseded by #PR because [brief technical reason]. Thank you for the contribution.

> Closing because [brief contract conflict or explicit design decision]. [Link to the relevant contract or decision, if useful.]

Linking an existing canonical is enough when it already contains the context. Add a brief comment there only for useful missing information or a concrete remaining requirement. Do not announce routine analysis or send unsolicited progress replies to PR authors. Keep recommended actions separate from authorized and applied actions.
