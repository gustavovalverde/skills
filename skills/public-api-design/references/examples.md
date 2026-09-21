# Decision examples

These sketches illustrate design choices, not an existing library.

## Hide repeated internal registration

A search feature requires the same bridge object in two host registrations. Callers never use the bridge independently, and both registrations have the same lifetime:

```ts
const bridge = createSearchBridge();
const client = createClient({ extensions: [bridge] });
const index = createIndex({ adapters: [bridge] });
```

A task-level factory could own that coordination:

```ts
const search = createSearch({ endpoint, credentials });
const results = await search.query({ text });
```

Before recommending it, establish where `endpoint` and `credentials` currently come from and who owns shutdown. A factory must not introduce hidden global state or silently take ownership of caller-managed resources. If consumers genuinely need independently managed hosts, preserve a supported advanced path.

## Keep a transaction handle when it expresses the task

A caller updates inventory and records a reservation in the same database transaction. Passing the same transaction handle to both operations expresses a required consistency boundary.

Keep that coordination explicit, or offer a scoped transaction callback with equivalent semantics. Removing the handle and giving each operation its own transaction would shorten calls while losing the caller's guarantee. Object identity is not inherently an API defect.

## A convenient default can change the contract

An API creates jobs, and callers currently decide whether a timed-out request may be retried. A proposed client retries automatically to reduce setup.

Establish whether the server may already have created the job and whether the operation supports deduplication before recommending automatic retries. If those guarantees are unknown, preserve the unknown outcome rather than claiming the job failed or that retry is safe. Convenience does not establish repeatability.

## Improve usage without renaming the wire format

An SDK exposes `page_token` because the service uses that request field. A new convenience method could manage pagination for ordinary callers while leaving manual paging available.

Preserve the wire field and supported low-level calls. Review memory use, laziness, cancellation, and mid-stream errors before choosing an iterator or an eagerly collected list. A friendlier name or shorter snippet is insufficient evidence that the replacement preserves behavior.
