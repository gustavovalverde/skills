# Disclosure editorial review

Use this checklist on every draft and final readiness review. The final body helps an application developer decide whether they are affected and what to do. The private assessment explains how maintainers reached the conclusion.

## Title

Start every title with the affected package that contains the flaw, then a colon and what goes wrong in plain words: `<package>: <what goes wrong>`. Use the package a reader installs: the core package for features shipped inside it, and an extension's own package name when it ships separately. When several packages are affected, name the one that contains the root cause and mention the others in "Am I affected?". The prefix is always one of the packages in the metadata's affected list. Readers scan advisory lists by package, so the prefix lets them rule an advisory in or out at a glance.

Describe the effect a user would notice rather than the internal mechanism. Keep the title under about 90 characters, with no code formatting, no severity words, and no em dashes. Neither sensationalize nor minimize the established impact.

| Instead of | Write |
| --- | --- |
| Shared verification namespace lets a sibling verifier consume foreign records | `example-lib: One sign-in method can accept codes issued for another` |
| Guard silently disabled on edge runtimes because the resolver throws | `@example/sso: Private-network protection is skipped on some edge runtimes` |
| Invitation acceptance path lacks inviter-authority revalidation | `example-lib: Invitations still work after the inviter loses access` |

## Structure: the easiest answers first

Readers arrive with one question: "does this affect me, and what do I do?" Put the answers to that in the first sections, and the mechanism last, for the readers who need it. Use these headings in this order, and add no others:

1. **Am I affected?** Open with one sentence the reader can check in seconds: the package and versions, and the feature or setting that must be in use. Then list only the conditions that decide exposure, in at most about five short bullets, and say "all of these" or "any of these". Add "You are not affected if…" when a common setup is safe. What the attacker must know or hold belongs in Impact; timing windows and internal preconditions belong in Technical details.
2. **Summary.** Two or three sentences in plain words: which feature misbehaves and what protection fails. Name the feature, not the functions.
3. **Impact.** Who can do what, to whom, and the limits, in a few sentences.
4. **Patches.** The fixed version on each affected release line and the upgrade action, or a plain statement that no patched release exists.
5. **Workarounds** (when useful). Short steps. Say what each step does not cover.
6. **Technical details** (optional). How the flaw happens, for maintainers and security teams, with the function, field, and option names they need. This is the only section where internal names belong. No exploit steps.
7. **References** (when relevant).

The body does not restate what GitHub displays beside the advisory. Severity, credit, and the advisory's own CVE ID live only in the metadata (the CVSS vector, the credits field, and the CVE assignment). A restated copy either duplicates the sidebar or contradicts it after the metadata changes. The body therefore has no Credit section, except as the last section for attribution the credits field does not carry, such as a team without a GitHub account or credit a maintainer chose to keep in the text. Before removing a Credit section from an existing body, confirm that every credited person is already in the metadata credits, so attribution is not lost. Cite another project's CVE only as a reference.

A reader should know whether they are affected, what can happen, and what to do after about 250 words: the first three sections together, plus Patches. If those sections run longer, move precision down into Technical details rather than cutting facts. The draft check warns when they pass about 250 words or 10 code spans. Advisories with several problems can use one bolded lead-in per problem inside a section, but keep the same headings.

Reporter testing notes, internal status, relationships to other advisories, and one-off sections belong in the private case record, not the body.

## Plain language

Many readers use English as a second language, and some read a translation. Write so the text survives both.

- One idea per sentence. Prefer active voice and the present tense.
- Use common words. When a technical term is necessary, explain it once in plain words the first time it appears.
- Use code formatting only for names the reader configures, calls, or searches for: package names, option names, and public API calls. In the first three sections, even those should be the few the reader needs to decide; move the rest to Technical details or describe them in words. Internal function names, file paths, and database fields rarely help an application developer.
- Keep each condition next to the claim it limits. Do not make readers carry a condition across paragraphs.
- Write nothing that goes stale when a new version ships. Do not name the "latest" or "current" release, and do not give an unfixed issue an upper bound such as "through 1.7.5"; write "1.3.7 and later" and let the affected range in the metadata carry the rest. The metadata range follows the same rule (see Cross-check facts). Historical facts are stable and stay: the first affected version, fixed versions, and the versions a test covered.
- Distinguish tenant administration from application-operator control.
- Preserve uncertainty and limits. Prefer an explicit unknown over a confident but unsupported claim.
- Keep mitigation limitations visible. A workaround that disables a feature is not an equivalent fix; unpublished configuration or APIs are not actionable guidance.
- Retain no template instructions, internal status narrative, source line numbers, or exploit walkthroughs in the public body.
- State no CVSS score, vector, severity label, or metric reasoning in the body. The advisory metadata carries severity, and a restated value contradicts it as soon as the vector changes. Describe the conditions and consequences in words instead.

## Cross-check facts

Compare the body with each accepted claim, not just the advisory title. For a retrospective review-only candidate, compare against the published scope and current assessment instead; historical publication does not supply missing approval records. Every material condition and consequence must have evidence in the assessment. Describe unexamined cases as unexamined, not unaffected.

Check that body and metadata agree on package names, affected ranges, fixed releases, CWE, and impact. The metadata needs at least one CWE and a CVSS 3.1 vector chosen with the scoring rubric; a CVSS 4.0 vector alone does not meet the rubric. Explain CVSS metrics privately from the established vulnerable configuration. Keep severity/vector exclusivity in the API proposal.

Metadata ranges follow [release lines and ranges](releases.md): open-ended while unfixed, a patched version beside every closed range, every release line accounted for, and a body change with any corrected range. For an unreleased fix, keep the distinction between a source fix and an available package. A disclosure without a fix must retain accurate unfixed status and pass the policy exception gate.

Check that approved credit is in the metadata credits. Link only what the body's readers can open; a private canonical advisory or internal record stays inaccessible to the public.

## Read it as an application developer

Answer from the draft alone:

1. Does my version and configuration meet the affected conditions?
2. Who can trigger the behavior, and what authority do they already need?
3. What additional harm is established, and what is not claimed?
4. Which released version should I install, or what verified alternative exists?

If any answer requires private context, revise the draft or record the missing fact as a blocker. The length and code-span warnings are prompts to revise; readability remains a human judgment, not a word-count or grade-score target.
