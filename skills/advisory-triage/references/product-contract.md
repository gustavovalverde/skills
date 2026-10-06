# Contract questions

Use these distinctions when a claim's classification depends on configuration, feature scope, or delegated authority. Establish the applicable contract from the affected version, not a generic checklist or today's documentation alone.

## Authority and supported use

An application operator, trusted server hook, authenticated user, tenant administrator, and configured identity provider are different actors. Identify which one supplies the decisive input. Owning one organization does not imply authority over the host application or another tenant.

Record whether the surface is core, an official plugin, a third-party integration, an example, or an internal helper. Then establish lifecycle, defaults, supported environments, and production intent. These describe the contract; they are not shortcuts to accepting or rejecting a report.

- **Opt-in feature:** an optional supported feature must enforce the guarantee it promises once enabled.
- **Trusted configuration:** an operator deliberately choosing a permitted endpoint or callback is different from an untrusted tenant selecting it. Determine whether the project exposes a lower-trust route that breaks the configuration's assumptions.
- **Server-only helper:** direct invocation with a forged object does not prove an HTTP attack path. If evidence defeats the reported public path and no identified plausible supported path remains, refute that claim rather than holding it open for hypothetical alternatives. Conversely, server APIs can legitimately process lower-trust application input.
- **Deprecated or experimental feature:** verify release-era statements. A new deprecation label cannot retroactively erase a supported promise. Latest-only maintenance does not by itself decide whether historical users warrant an advisory, and an advisory does not promise a backport. Escalate ambiguous policy rather than inventing an exclusion.

## What protection actually fails?

These examples come from authentication and multi-tenant libraries; the same distinctions apply to other kinds of protection, and a repository profile can add its own.

- **Sessions:** documented bounded cache staleness may be expected. Creating a new durable credential or privilege that escapes that bound is a different claim. Establish the promised revocation behavior.
- **Identity providers:** a trusted operator-selected provider may intentionally assert identity. A tenant-controlled provider asserting identities outside its authorized domain crosses a different boundary.
- **Enrollment:** proving an external identity does not necessarily authorize creating an account when registration is disabled.
- **Roles:** permission to manage roles does not necessarily permit granting stronger permissions. Check operation authority and any separate privilege ceiling.
- **Verification:** registration and authentication can have distinct requirements. Proof accepted for one purpose does not automatically authorize another.
- **Availability:** counting rejected requests can be intentional. Establish attributable, disproportionate, persistent, or otherwise unbounded work before claiming a security effect. Do not turn possible quota pressure into a proven total outage.
- **Composition:** two supported plugins may share records or infrastructure. Their combined guarantee matters; requiring two options is not itself a reason to dismiss a claim.

Documentation need not state every elementary authentication guarantee word for word. If the guarantee is inferred from a supported ceremony, state the inference and evidence. Equally, do not invent a stronger promise merely because it would be safer.

## Advisory or ordinary work?

A security advisory communicates an established failure of a supported security boundary to affected users. An ordinary functional defect, confusing documentation, or stronger optional containment can deserve a fix without an advisory. Evaluate impact beyond the actor's intended authority, not just the fact that a safety-related change is possible.

An existing mitigation does not prove the vulnerable behavior was intended. An existing patch does not prove the report was valid. Evaluate the contract independently, then establish when the source fix and package release occurred relative to the report and disclosure.

For a contested conclusion, preserve both the strongest supporting evidence and the strongest counterevidence. Ask for clarification only when the missing fact could change the verdict or disposition.
