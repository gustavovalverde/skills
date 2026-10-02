---
name: delegated-delivery-coordinator
description: Coordinate delegated implementation or investigation across agents, including assignment boundaries, shared ownership, and integration. Use for agent coordination, not ordinary direct work or a software design question alone.
license: MIT
---

# Coordinate delegated delivery

Use delegation where an independent assignment improves progress or confidence within the user's authorized workflow. Keep requirements, consequential design decisions, integration, and delivery accountability with the coordinator. Coordinate through the available runtime; selecting this skill does not change the user's chosen agent, model, or execution permissions. Use internal workers unless the user requests separate visible chats.

## Bound the assignment

Keep the complete user outcome in view while assigning one coherent result to each worker. Include the exact workspace and source revision, owned paths, acceptance criteria, relevant constraints, focused checks, and mutation authority. State whether further delegation is permitted. A focused brief is usually enough; the [implementation brief](assets/implementation-brief.md) is an optional template.

When the approach is uncertain, choose an early return that resolves the uncertainty: a proposal before edits or one representative implementation path. Let established patterns run through their bounded acceptance criteria. Define the return boundary before dispatch and have the worker end its turn there; commentary alone is not a completed handoff.

Assign one writer to shared files, generated artifacts, and contract decisions. Separate branches in the same directory do not isolate writers. Use disjoint paths or separate worktrees, and reconcile shared outputs after combining the changes.

## Steer from evidence

Review the decision, affected caller, diff, or failure evidence relevant to the next step. A handoff should identify the result, changed paths, source and environment, focused evidence, unresolved issues, and the next decision. Keep full logs in artifacts rather than repeating the worker's investigation.

Reuse a worker for a focused correction while its context remains useful. Before transferring ownership, establish that the previous writer has stopped and inspect partial changes. Transfer accepted decisions, current source, valid evidence, and remaining work. Reconsider scope or missing context when failures recur before increasing model capability.

Continue independent work while workers run. Keep one concise checkpoint when the assignment spans turns or several workspaces. Read [runtime and ownership](references/runtime.md) when lifecycle controls, custom agents, or visible chats affect coordination, and [roles and review](references/roles-and-review.md) when choosing workers or an independent reviewer.

## Integrate and finish

Inspect the combined change against its callers and acceptance criteria, then run checks affected by integration. Reuse worker evidence only while its source and environment still apply. A completed worker turn establishes its assigned result, not delivery of the whole task.

Keep architecture and interface decisions with their appropriate domain. If a design decision remains open, use the available design guidance; coordinating agents does not require loading every design or writing skill. Verify any publication or external state change included in the task, and distinguish local evidence from hosted or production behavior.
