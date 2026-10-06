# CVSS scoring rubric

Reviewed: 2026-09-25. Use this rubric whenever you choose CVSS 3.1 Base metrics for an established vulnerability. Its purpose is consistency: equivalent situations get the same metrics across advisories, and the score reflects what an attacker must overcome in the configuration the advisory describes.

Record the evidence for each metric in `triage.md`. The advisory body does not restate the score, vector, severity, or metric reasoning. The metadata carries them, and a restated value drifts out of date as soon as the vector changes.

## What to score

Score the configuration the advisory describes as affected. The metric rules below decide which of its preconditions add attack complexity. Whatever remains, such as how many deployments use that configuration or project urgency, belongs in operational priority, not in the vector. Expected behavior, hardening, and unresolved claims are not scored.

## Metrics

### Attack Vector (AV)

- **N** when the attacker reaches the affected behavior through the application's network endpoints.
- **L** when the attacker needs their own code on the victim's device, for example an app registered for a URL scheme that receives a redirect.
- Adjacent (A) and Physical (P) rarely apply here. Justify them explicitly if you use them.

### Attack Complexity (AC)

Use **H** when success depends on something the attacker cannot control and that is not the default behavior of the affected feature once it is enabled:

- a non-default deployment setting, especially one the documentation advises against;
- a third party's configuration or behavior, such as an identity provider, an OAuth provider, or a device platform;
- a race or timing window the attacker must win;
- a secret taken from the victim, such as a captured assertion, a stolen session token, or the victim's password.

Keep **L** when the only preconditions are enabling the affected opt-in plugin or feature with its default settings, or knowing public information such as an email address or a public provider account ID. A period during which the victim must act, such as an approval window or a code's lifetime, is covered by User Interaction, not AC.

These conditions narrow who is exposed as much as they reduce exploitability. Scoring them in AC keeps an issue in a plugin's default setup above an issue that needs a discouraged setting, which matches how maintainers and users prioritize.

### Privileges Required (PR)

Score the lowest privilege the attack needs in the target application:

- **N**: no account.
- **L**: an ordinary user account, the attacker's own API key or session, or a low organization role, including an app-defined role below administrator.
- **H**: an application administrator, an organization administrator or owner, or an operator.

Count a victim's secret once. When the attacker must hold the victim's password, session, or assertion, score AC:H with PR:N. Adding PR:L would count the same precondition twice.

### User Interaction (UI)

Use **R** when someone other than the attacker must act for the harm to occur: following a link, signing up, completing a verification or approval flow, or opening an app.

Also use **R** when the defect is that a protective action fails to protect: a session revocation, a password change, or an administrator deleting a user. The scenario needs that action to happen, so score it the same way every time. Otherwise use **N**.

### Scope (S)

Use **C** only when the impact reaches a component governed by a different security authority, for example requests the vulnerable component forges against other internal services. Account, session, and organization impact inside the same application stays **U**.

### Confidentiality and Integrity (C, I)

- A full session as the victim, or equivalent control of their account: **C:H/I:H**.
- Access limited to a narrower surface, such as one scoped API key or tokens for a single resource that do not amount to a session: **L**.
- An escalated role inside an organization: score what that role can read (C) and change (I).

Score each effect once. When one action causes the harm, do not score it under both Integrity and Availability.

### Availability (A)

Use **N** unless the attack itself denies the legitimate user or the service:

- **H**: the attacker can delete the victim's organization or account, or lock the owner out in a way normal recovery cannot undo.
- **L**: targeted, repeatable denial the owner cannot work around, for example an attack that keeps deleting the codes the user needs to sign in or recover.

Durable attacker access is Confidentiality and Integrity, not Availability. So is forcing a logout that the user undoes by signing in again.

## Worked examples

These synthetic situations show the rules applied together. Compare a new case with the closest example before scoring it. They come from a web authentication library; a repository profile can add examples calibrated to its own project, each with its computed score beside the vector.

| Situation | Vector | Score |
| --- | --- | --- |
| An opt-in plugin at its defaults lets an unauthenticated caller redeem a record created by another flow and get a session for any user whose email they know | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` | 9.1 Critical |
| The same class of forgery, but only with a non-default state storage mode and without a dedicated plugin secret | `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N` | 7.4 High |
| An SSO replay that needs a captured signed assertion and an identity provider that omits an optional expiry | `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N` | 7.4 High |
| A second factor is skipped, but the attacker needs the victim's password | `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N` | 7.4 High |
| Pre-account hijacking: the attacker registers the victim's email first, the victim later proves ownership, and the attacker's sign-in method survives | `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N` | 8.1 High |
| The same hijacking, but only when the OAuth provider passes an unverified email | `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N` | 6.8 Medium |
| An attacker's app on the victim's device receives a session because a non-default wildcard origin also matches the app's URL scheme | `CVSS:3.1/AV:L/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N` | 6.3 Medium |
| An organization administrator, with the default roles, creates an owner and can then delete the organization | `CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:H` | 6.5 Medium |
| A member holding an app-defined lower role grants itself stronger permissions; this needs a custom role setup | `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:H/A:H` | 7.1 High |
| A victim follows a flow the attacker started and grants tokens for one resource server only | `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N` | 5.4 Medium |
| An unauthenticated caller repeatedly deletes other users' pending sign-in and recovery codes | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L` | 5.3 Medium |
| Unsigned logout requests end another user's session, which the user re-creates by signing in | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N` | 5.3 Medium |
| A deleted user's own API key keeps working after an administrator removes the user | `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:L/I:L/A:N` | 4.6 Medium |
| Concurrent requests exceed a rate limit only with non-default database storage, and the excess is bounded | `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N` | 3.7 Low |

## Compute the score

Compute the score from the vector with the bundled helper instead of by hand:

```sh
node "$SKILL/scripts/cvss.mjs" "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N"
```

It applies the CVSS 3.1 Base formula and prints the score and severity. Send only `cvss_vector_string` to GitHub; GitHub derives the severity.

## When the rubric does not fit

Record the metric, the rule that did not fit, and the choice you made, then raise it with the maintainer so the rubric can be updated. A score that departs from the rubric without a recorded reason breaks the consistency this rubric exists to provide.
