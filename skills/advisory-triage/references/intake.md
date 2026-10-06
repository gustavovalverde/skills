# Intake

Screen a report for prior work, duplicates, scope, missing information, or evidence-backed early closure. Using this phase directly does not run the others.

## Screen the report

1. Resolve one case and read its live report and discussion, existing records, holds, and earlier decisions. For "next", refresh the triage-only queue, newest first. Drafts are remediation work. Skip handled cases without new material evidence; a missing manifest requires a history check.
2. Record scope, timestamps, disclosure status, acknowledgement and disclosure deadlines from the repository's current security policy, and authority. Use the [workspace procedure](workspace.md) for records. Intake fields are not proof of completed deep analysis.
3. Split independent allegations. Search all advisory states, issues, pull requests, releases, and prior replies for the same guarantee and cause. Record queries, claim-level coverage, canonical URL, current state, owner, and material new value.
4. Check the initial contract with the [contract questions](product-contract.md): actor authority, input, supported configuration, intended capability, and the alleged failed guarantee. Inspect enough evidence to support an early decision; reporter wording alone cannot establish invalidity or duplication.
5. Decisive evidence can support duplicate, not-vulnerability, hardening, ordinary-issue, or out-of-scope recommendations here. A specific missing fact leads to clarification. Plausible security impact or a disputed contract routes to [assessment](assessment.md).

## Completion

Update `case.json` and `triage.md` with claim-level screening results, evidence, questions, owner or hold, and next action. Keep insufficiently supported verdicts unresolved and state which parts were only screened.

Return the report link and recommendation. Include closure text when recommending closure, the canonical link for duplicates, and the relevant pull request when verified. For clarification, supply the exact question. Stop for the human decision; enter deep assessment only when it is within the requested work.
