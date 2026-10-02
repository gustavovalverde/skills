# Runtime and ownership

Use the tools and model identifiers exposed by the executing agent. Codex and Claude can share these skill files while offering different lifecycle controls. Check the actual tool schema and any custom-agent definition when those details affect the assignment; do not assume a tool name or copied model setting works on another runtime.

## Worker lifecycle

Establish which operations start or resume work, send a message, wait for completion, and stop a worker. A queued message need not wake an idle worker. An interrupt request need not immediately establish a stop barrier. Wait for the runtime's confirmation before handing the same paths to another writer, then inspect any partial changes. Stopping a worker does not undo file edits or external effects.

Prefer waits that return new results or changed state. Do not repeatedly retrieve unchanged progress or narrate it. If direct parent messaging is unavailable, use the completed response as the handoff and make the communication limit explicit.

Treat a brief's path restrictions as instructions, not filesystem isolation. Check whether workers share a directory, whether their branches use separate worktrees, and which permissions the runtime actually enforces. Describe the isolation only to that strength. Changing agent configuration is a separate action from dispatching a worker.

## Visible chats

A user-requested separate chat is a different artifact from an internal worker. Use the product's supported chat tools and retain its identity, host, workspace, and source revision. Creation can be asynchronous; verify readiness and follow progress through the relevant tools. If that surface is unavailable, report the limitation and obtain agreement before substituting an internal worker.

## Integration

Record source revisions when collecting evidence. Inspect the exact changes before combining them, then reconcile generated artifacts, schemas, and other shared contracts from the combined source. Separately passing assignments can still fail together. Resume a reviewer only when a change or unresolved concern invalidates its earlier evidence.
