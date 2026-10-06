import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDraft, digestRecord, main, renderMatrix, validateFile, validateRecord } from './ledger.mjs';

const root = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'backlog-ledger-test-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
const groupPath = id => join(root, id, 'group.json');
const stamp = '2026-10-06T12:00:00Z';
const issueUrl = n => `https://github.com/synthetic/repo/issues/${n}`;
const prUrl = n => `https://github.com/synthetic/repo/pull/${n}`;
const record = () => ({
  schema_version: 1, repo: 'synthetic/repo', id: 'auth-flow', coordinator: 'triage-owner',
  members: [
    { kind: 'issue', number: 10, url: issueUrl(10), observed_at: stamp, state: 'open', context_complete: true },
    { kind: 'issue', number: 11, url: issueUrl(11), observed_at: stamp, state: 'open', context_complete: true },
    { kind: 'pull_request', number: 20, url: prUrl(20), observed_at: stamp, state: 'merged', head_sha: 'head-20', context_complete: true },
  ],
  criteria: [{ id: 'token-contract', request: 'Accept a resource-scoped token', requested_surface: '/oauth2/token', member_ids: [10, 11] }],
  evidence: [
    { id: 'issue10', kind: 'issue_thread', locator: `${issueUrl(10)}#issuecomment-1`, observed_at: stamp, complete: true },
    { id: 'issue11', kind: 'issue_thread', locator: issueUrl(11), observed_at: stamp, complete: true },
    { id: 'pr20', kind: 'pull_request', member_id: 20, locator: prUrl(20), revision: 'head-20', observed_at: stamp, complete: true },
  ],
  coverage: [
    { item_id: 10, criterion_id: 'token-contract', surface: '/oauth2/token', basis: 'canonical_scope', target_id: 10, status: 'covered', evidence_ids: ['issue10'] },
    { item_id: 11, criterion_id: 'token-contract', surface: '/oauth2/token', basis: 'canonical_scope', target_id: 10, status: 'covered', evidence_ids: ['issue10', 'issue11'] },
  ],
  canonical_issue: 10, selected_prs: [20],
  decisions: [
    { item_id: 10, action: 'keep_open', rationale: 'The accepted change is not merged.', evidence_ids: ['issue10', 'pr20'] },
    { item_id: 11, action: 'close_duplicate', target_id: 10, rationale: 'Every requested outcome is covered by the canonical issue.', evidence_ids: ['issue11', 'pr20'] },
  ],
  reconciliation: { status: 'complete', rationale: 'Compared member requests and current implementation evidence.', scope_decisions: [], unresolved_conflicts: [] },
  verification: { reviewer: '', result_revision: '', verdict: 'changes_needed', pending: true },
});
function put(group = record(), id = group.id) {
  group.id = id;
  if (group.verification?.pending === false) group.verification.result_revision = digestRecord(group);
  const path = groupPath(id);
  fs.mkdirSync(join(root, id), { recursive: true });
  fs.writeFileSync(path, `${JSON.stringify(group, null, 2)}\n`);
  return path;
}
function withVerifiedClosure(group = record()) {
  group.verification = { reviewer: 'independent-reviewer', result_revision: digestRecord(group), verdict: 'confirmed', pending: false };
  return group;
}
function readyErrors(path) { return validateFile(path, { ready: true }).errors.join('\n'); }

test('new makes a structurally valid draft which is not ready and never overwrites', () => {
  assert.match(createDraft(groupPath('new-flow'), 'synthetic/repo', 'new-flow'), /Created draft/);
  const path = groupPath('new-flow');
  const draft = JSON.parse(fs.readFileSync(path, 'utf8'));
  assert.equal(draft.reconciliation.status, 'pending');
  assert.equal(validateFile(path).valid, true);
  assert.match(readyErrors(path), /complete group reconciliation/);
  const contents = fs.readFileSync(path, 'utf8');
  assert.throws(() => createDraft(path, 'synthetic/repo', 'new-flow'), /already exists/);
  assert.equal(fs.readFileSync(path, 'utf8'), contents);
  assert.throws(() => createDraft(join(root, 'wrong-id', 'group.json'), 'synthetic/repo', 'right-id'), /must be/);
});

test('CLI exposes new, validate, digest, and render with stable digest output', () => {
  const dir = join(root, 'cli-run');
  const path = join(dir, 'cli-flow', 'group.json');
  assert.match(main(['new', path, '--repo', 'synthetic/repo', '--id', 'cli-flow']), /Created draft/);
  assert.equal(main(['validate', path]), `Valid draft: ${path}`);
  assert.match(main(['digest', path]), /^[a-f0-9]{64}$/);
  assert.match(main(['render', dir]), /Rendered 1 groups/);
  assert.match(fs.readFileSync(join(dir, 'matrix.md'), 'utf8'), /cli-flow/);
});

test('unknown references, duplicate member identities, and self-duplicate decisions fail structural validation', () => {
  const unknown = record();
  unknown.coverage[0].evidence_ids = ['missing'];
  assert.match(validateRecord(unknown).join('\n'), /unknown evidence missing/);
  const duplicated = record();
  duplicated.members.push({ ...duplicated.members[0] });
  assert.match(validateRecord(duplicated).join('\n'), /duplicate item number/);
  const self = record();
  self.decisions[1].target_id = 11;
  self.canonical_issue = 11;
  assert.match(validateRecord(self).join('\n'), /different target_id/);
});

test('duplicate closure is blocked when a material criterion is uncovered', () => {
  const group = record();
  group.criteria.push({ id: 'refresh-lifecycle', request: 'Preserve refresh behavior', requested_surface: '/oauth2/refresh', member_ids: [11] });
  const path = put(withVerifiedClosure(group));
  assert.match(readyErrors(path), /requires covered canonical_scope evidence for criterion refresh-lifecycle/);
});

test('an alternate API surface needs an explicit scoped maintainer decision', () => {
  const group = record();
  group.criteria[0].requested_surface = '/device/token';
  group.coverage = group.coverage.map(row => ({ ...row, surface: '/oauth2/token' }));
  const path = put(withVerifiedClosure(group));
  assert.match(readyErrors(path), /requires covered canonical_scope evidence for criterion token-contract/);
  group.reconciliation.scope_decisions.push({ criterion_id: 'token-contract', requested_surface: '/device/token', accepted_surface: '/oauth2/token', decision_authority: 'maintainer', rationale: 'The OAuth token endpoint is the accepted supported integration surface.' });
  const allowed = put(withVerifiedClosure(group));
  assert.deepEqual(validateFile(allowed, { ready: true }).errors, []);
});

test('a merged historical patch revision does not satisfy evidence bound to the current PR head', () => {
  const group = record();
  group.evidence.find(e => e.id === 'pr20').revision = 'merged-old-head';
  const path = put(withVerifiedClosure(group));
  assert.match(readyErrors(path), /not a current member observation/);
});

test('verification digest excludes verification fields but changes when the reviewed content changes', () => {
  const group = record();
  const before = digestRecord(group);
  group.verification.reviewer = 'reviewer';
  assert.equal(digestRecord(group), before);
  group.coverage[0].status = 'partial';
  assert.notEqual(digestRecord(group), before);
  const path = put(withVerifiedClosure(record()));
  const changed = JSON.parse(fs.readFileSync(path, 'utf8'));
  changed.coverage[0].status = 'partial';
  fs.writeFileSync(path, JSON.stringify(changed));
  assert.match(readyErrors(path), /verification result_revision must match/);
});

test('changing a PR head invalidates closure evidence pinned to the earlier head', () => {
  const group = record();
  group.members.find(m => m.kind === 'pull_request').head_sha = 'new-head-20';
  const path = put(withVerifiedClosure(group));
  assert.match(readyErrors(path), /not a current member observation/);
});

function resolvedWithEvidence(kind, surface = '/oauth2/token') {
  const group = record();
  group.decisions[1] = { item_id: 11, action: 'close_resolved', target_id: 20, rationale: 'Current implementation satisfies the requested contract.', evidence_ids: ['issue11', 'implementation'] };
  const implementation = {
    id: 'implementation', kind,
    locator: kind === 'source' ? 'https://github.com/synthetic/repo/blob/main/packages/oauth/src/token.ts' : kind === 'docs' ? 'https://docs.example.test/oauth/token' : 'https://registry.example.test/releases/v2.0.0',
    revision: kind === 'source' ? 'main-sha' : 'v2.0.0', observed_at: stamp, complete: true,
  };
  group.evidence.push(implementation);
  group.coverage.push({ item_id: 11, criterion_id: 'token-contract', surface, basis: kind === 'release' ? 'released' : 'current_code', target_id: null, status: 'covered', evidence_ids: ['issue11', 'implementation'] });
  return withVerifiedClosure(group);
}

test('current source and released evidence satisfy fixed closure while docs satisfy an answered contract', () => {
  for (const kind of ['source', 'release']) {
    const group = resolvedWithEvidence(kind);
    const path = put(group, `resolved-${kind}`);
    assert.deepEqual(validateFile(path, { ready: true }).errors, []);
  }
  const group = record();
  group.decisions[1] = { item_id: 11, action: 'close_answered', rationale: 'The documented API contract matches current behavior.', evidence_ids: ['issue11', 'api-doc'] };
  group.evidence.push({ id: 'api-doc', kind: 'docs', locator: 'https://docs.example.test/oauth/token', revision: 'docs-sha', observed_at: stamp, complete: true });
  group.coverage.push({ item_id: 11, criterion_id: 'token-contract', surface: '/oauth2/token', basis: 'contract', target_id: null, status: 'covered', evidence_ids: ['issue11', 'api-doc'] });
  const path = put(withVerifiedClosure(group), 'answered-docs');
  assert.deepEqual(validateFile(path, { ready: true }).errors, []);
});

test('an unmerged candidate PR cannot satisfy fixed closure even when its patch is current', () => {
  const group = record();
  group.members.find(member => member.number === 20).state = 'open';
  group.decisions[1] = { item_id: 11, action: 'close_resolved', target_id: 20, rationale: 'Candidate work appears to address the request.', evidence_ids: ['issue11', 'pr20'] };
  group.evidence.push({ id: 'main-source', kind: 'source', locator: 'https://github.com/synthetic/repo/blob/main/packages/oauth/src/token.ts', revision: 'main-sha', observed_at: stamp, complete: true });
  group.coverage.push({ item_id: 11, criterion_id: 'token-contract', surface: '/oauth2/token', basis: 'candidate_pr', target_id: 20, status: 'covered', evidence_ids: ['pr20'] });
  const path = put(withVerifiedClosure(group), 'candidate-not-fixed');
  const errors = readyErrors(path);
  assert.match(errors, /must be a merged member PR/);
  assert.match(errors, /requires covered current_code or released evidence/);
});

test('duplicate closure requires current canonical scope and canonical context', () => {
  const group = record();
  group.coverage = group.coverage.filter(row => row.item_id !== 10);
  const path = put(withVerifiedClosure(group), 'duplicate-no-canonical-scope');
  assert.match(readyErrors(path), /canonical issue #10 needs covered canonical_scope/);
  const unknown = record();
  unknown.id = 'duplicate-unknown-canonical';
  unknown.members.find(member => member.number === 10).state = 'unknown';
  const unknownPath = put(withVerifiedClosure(unknown), 'duplicate-unknown-canonical');
  assert.match(readyErrors(unknownPath), /needs a known open or closed state/);
});

test('ready requires a nonempty assessment and a decision for each open member', () => {
  const empty = record();
  empty.members = [];
  empty.criteria = [];
  empty.evidence = [];
  empty.coverage = [];
  empty.selected_prs = [];
  empty.decisions = [];
  empty.canonical_issue = null;
  const emptyPath = put(empty, 'empty-assessment');
  assert.match(readyErrors(emptyPath), /at least one member and one material criterion/);

  const unaccounted = record();
  unaccounted.decisions = unaccounted.decisions.filter(decision => decision.item_id !== 10);
  const unaccountedPath = put(withVerifiedClosure(unaccounted), 'unaccounted-open-member');
  assert.match(readyErrors(unaccountedPath), /open member #10 needs an explicit decision/);
});

test('closed issues and merged PR source members do not need closure decisions', () => {
  const group = record();
  group.members.find(member => member.number === 10).state = 'closed';
  group.decisions = group.decisions.filter(decision => decision.item_id !== 10);
  const path = put(withVerifiedClosure(group), 'closed-source-member');
  assert.deepEqual(validateFile(path, { ready: true }).errors, []);
});

test('duplicate scoped surface decisions are rejected instead of selecting one silently', () => {
  const group = record();
  group.criteria[0].requested_surface = '/device/token';
  group.reconciliation.scope_decisions = [
    { criterion_id: 'token-contract', requested_surface: '/device/token', accepted_surface: '/oauth2/token', decision_authority: 'maintainer', rationale: 'Accepted alternate.' },
    { criterion_id: 'token-contract', requested_surface: '/device/token', accepted_surface: '/device/token', decision_authority: 'maintainer', rationale: 'Conflicting decision.' },
  ];
  assert.match(validateRecord(group).join('\n'), /scope_decisions contain more than one decision for a criterion/);
});

test('a contract-declined PR can be recommended closed without a replacement when evidence and verification are complete', () => {
  const group = record();
  group.members.find(member => member.number === 20).state = 'open';
  group.criteria[0].member_ids.push(20);
  group.evidence.push({ id: 'decision', kind: 'maintainer_decision', locator: 'local://triage/decision-1', revision: 'review-1', observed_at: stamp, complete: true });
  group.decisions.push({ item_id: 20, action: 'close_not_planned', rationale: 'The requested endpoint is intentionally outside the supported API contract.', evidence_ids: ['pr20', 'decision'] });
  const path = put(withVerifiedClosure(group), 'declined-pr');
  assert.deepEqual(validateFile(path, { ready: true }).errors, []);
});

test('close_not_planned requires current PR head, authoritative decision evidence, PR subject, no target, and verification', () => {
  const make = () => {
    const group = record();
    group.members.find(member => member.number === 20).state = 'open';
    group.criteria[0].member_ids.push(20);
    group.evidence.push({ id: 'decision', kind: 'contract', locator: 'https://docs.example.test/contract', revision: 'contract-sha', observed_at: stamp, complete: true });
    group.decisions.push({ item_id: 20, action: 'close_not_planned', rationale: 'Outside supported contract.', evidence_ids: ['pr20', 'decision'] });
    return withVerifiedClosure(group);
  };
  const stale = make();
  stale.evidence.find(evidence => evidence.id === 'pr20').revision = 'old-head';
  assert.match(readyErrors(put(stale, 'declined-stale-pr')), /not a current member observation/);
  const noAuthority = make();
  noAuthority.decisions.find(decision => decision.item_id === 20).evidence_ids = ['pr20'];
  assert.match(readyErrors(put(noAuthority, 'declined-no-contract')), /requires contract, docs, source, or maintainer-decision evidence/);
  const noPrObservation = make();
  noPrObservation.decisions.find(decision => decision.item_id === 20).evidence_ids = ['decision'];
  assert.match(readyErrors(put(noPrObservation, 'declined-no-pr-observation')), /requires a complete observation of its current head/);
  const noVerification = make();
  noVerification.verification = { reviewer: '', result_revision: '', verdict: 'changes_needed', pending: true };
  assert.match(readyErrors(put(noVerification, 'declined-no-verification')), /require completed independent verification/);
  const issueAction = make();
  issueAction.decisions.find(decision => decision.item_id === 20).item_id = 11;
  assert.match(validateRecord(issueAction).join('\n'), /close_not_planned requires a PR/);
  const target = make();
  target.decisions.find(decision => decision.item_id === 20).target_id = 10;
  assert.match(validateRecord(target).join('\n'), /must not specify target_id/);
});

test('ready PR closures require the locator to match the explicitly bound PR member', () => {
  const make = () => {
    const group = record();
    group.members.find(member => member.number === 20).state = 'open';
    group.criteria[0].member_ids.push(20);
    group.evidence.find(evidence => evidence.id === 'pr20').locator = `${prUrl(20)}#discussion_r7`;
    group.evidence.push({ id: 'decision', kind: 'contract', locator: 'https://docs.example.test/contract', revision: 'contract-sha', observed_at: stamp, complete: true });
    group.decisions.push({ item_id: 20, action: 'close_not_planned', rationale: 'Outside supported contract.', evidence_ids: ['pr20', 'decision'] });
    return withVerifiedClosure(group);
  };
  assert.deepEqual(validateFile(put(make(), 'locator-fragment'), { ready: true }).errors, []);

  const wrongRepository = make();
  wrongRepository.evidence.find(evidence => evidence.id === 'pr20').locator = 'https://github.com/other/repo/pull/20';
  assert.match(validateRecord(wrongRepository, { ready: true }).join('\n'), /must identify a PR member by its URL/);

  const wrongNumber = make();
  wrongNumber.evidence.find(evidence => evidence.id === 'pr20').locator = prUrl(21);
  assert.match(validateRecord(wrongNumber, { ready: true }).join('\n'), /must identify a PR member by its URL/);

  const emptyFragment = make();
  emptyFragment.evidence.find(evidence => evidence.id === 'pr20').locator = `${prUrl(20)}#`;
  assert.match(validateRecord(emptyFragment, { ready: true }).join('\n'), /must identify a PR member by its URL/);

  const conflictingIdentity = make();
  conflictingIdentity.members.push({ kind: 'pull_request', number: 21, url: prUrl(21), observed_at: stamp, state: 'closed', head_sha: 'head-21', context_complete: true });
  Object.assign(conflictingIdentity.evidence.find(evidence => evidence.id === 'pr20'), { member_id: 21, revision: 'head-21' });
  assert.match(validateRecord(conflictingIdentity, { ready: true }).join('\n'), /must identify a PR member by its URL/);
});

function supersededWithReplacement() {
  const group = record();
  const superseded = group.members.find(member => member.number === 20);
  superseded.state = 'open';
  group.members.push({ kind: 'pull_request', number: 21, url: prUrl(21), observed_at: stamp, state: 'open', head_sha: 'head-21', context_complete: true });
  group.selected_prs.push(21);
  group.criteria[0].member_ids.push(20);
  group.evidence.push({ id: 'pr21', kind: 'pull_request', member_id: 21, locator: `${prUrl(21)}#discussion_r8`, revision: 'head-21', observed_at: stamp, complete: true });
  group.coverage.push({ item_id: 20, criterion_id: 'token-contract', surface: '/oauth2/token', basis: 'candidate_pr', target_id: 21, status: 'covered', evidence_ids: ['pr21'] });
  group.decisions.push({ item_id: 20, action: 'close_superseded', target_id: 21, rationale: 'The selected replacement PR carries this request forward.', evidence_ids: ['pr20', 'pr21'] });
  group.decisions.push({ item_id: 21, action: 'keep_open', rationale: 'The selected replacement remains active.', evidence_ids: ['pr21'] });
  return withVerifiedClosure(group);
}

test('close_superseded accepts a complete replacement and rejects stale or incomplete replacement context', () => {
  assert.deepEqual(validateFile(put(supersededWithReplacement(), 'superseded-ready'), { ready: true }).errors, []);

  const stale = supersededWithReplacement();
  stale.evidence.find(evidence => evidence.id === 'pr21').revision = 'old-head-21';
  assert.match(readyErrors(put(stale, 'superseded-stale-head')), /not a current member observation/);

  const incomplete = supersededWithReplacement();
  incomplete.members.find(member => member.number === 21).context_complete = false;
  assert.match(readyErrors(put(incomplete, 'superseded-incomplete-context')), /needs known context and state/);
});

test('surfaces are explicit and arbitrary; unsupported IDs, bases, and actions fail safely', () => {
  const distinct = record();
  distinct.criteria[0].requested_surface = '/device/token';
  assert.deepEqual(validateRecord(distinct), []);
  const badBasis = record();
  badBasis.coverage[0].basis = 'oauth';
  assert.match(validateRecord(badBasis).join('\n'), /supported basis/);
  const badAction = record();
  badAction.decisions[0].action = 'close_whatever';
  assert.match(validateRecord(badAction).join('\n'), /each decision needs/);
  const badId = { ...record(), id: 'Bad ID' };
  assert.match(validateRecord(badId).join('\n'), /lowercase hyphenated group ID/);
  const duplicateNumber = record();
  duplicateNumber.members.push({ kind: 'pull_request', number: 10, url: prUrl(10), observed_at: stamp, state: 'open', head_sha: 'x', context_complete: true });
  assert.match(validateRecord(duplicateNumber).join('\n'), /duplicate item number/);
  const duplicateCoverage = record();
  duplicateCoverage.coverage.push({ ...duplicateCoverage.coverage[0], status: 'missing' });
  assert.match(validateRecord(duplicateCoverage).join('\n'), /duplicate item\/criterion\/surface\/basis\/target tuples/);
  const badTime = record();
  badTime.evidence[0].observed_at = 'not a timestamp';
  assert.match(validateRecord(badTime).join('\n'), /parseable observed_at/);
  const unselectedCandidate = record();
  unselectedCandidate.members.push({ kind: 'pull_request', number: 21, url: prUrl(21), observed_at: stamp, state: 'open', head_sha: 'head-21', context_complete: true });
  unselectedCandidate.evidence.push({ id: 'pr21', kind: 'pull_request', member_id: 21, locator: `${prUrl(21)}#discussion_r7`, revision: 'head-21', observed_at: stamp, complete: true });
  unselectedCandidate.coverage.push({ item_id: 11, criterion_id: 'token-contract', surface: '/oauth2/token', basis: 'candidate_pr', target_id: 21, status: 'covered', evidence_ids: ['pr21'] });
  assert.deepEqual(validateRecord(unselectedCandidate), []);
});

test('malformed nested JSON shapes and timestamps return structural errors without ready dereferences', () => {
  const group = record();
  group.id = 'auth-flow';
  group.coverage[0].status = 'missing';
  group.criteria = [null];
  group.members[0].observed_at = 'yesterday-ish';
  group.decisions[0] = null;
  assert.doesNotThrow(() => validateRecord(group, { ready: true }));
  const errors = validateRecord(group, { ready: true }).join('\n');
  assert.match(errors, /parseable observed_at/);
  assert.match(errors, /each criterion needs/);
  assert.match(errors, /each decision needs/);
  const nullMember = record();
  nullMember.members = [null];
  assert.doesNotThrow(() => validateRecord(nullMember, { ready: true }));
  assert.match(validateRecord(nullMember, { ready: true }).join('\n'), /each member needs/);
  const missingMemberIds = record();
  missingMemberIds.criteria = [{ id: 'no-members', request: 'Request', requested_surface: '/api/example' }];
  assert.doesNotThrow(() => validateRecord(missingMemberIds, { ready: true }));
  assert.match(validateRecord(missingMemberIds, { ready: true }).join('\n'), /each criterion needs/);
});

test('partial evidence and keep-open decisions can be ready with explicit unknown coverage', () => {
  const group = record();
  group.coverage[0].status = 'unknown';
  group.coverage[0].evidence_ids = [];
  group.decisions = [
    { item_id: 10, action: 'keep_open', rationale: 'Evidence does not establish closure.', evidence_ids: [] },
    { item_id: 11, action: 'decision_needed', rationale: 'A maintainer must resolve the scope question.', evidence_ids: [] },
  ];
  const path = put(group);
  assert.deepEqual(validateFile(path, { ready: true }).errors, []);
});

test('render refuses malformed and path-mismatched groups without damaging an existing matrix', () => {
  const dir = join(root, 'render-set');
  fs.mkdirSync(join(dir, 'auth-flow'), { recursive: true });
  fs.writeFileSync(join(dir, 'auth-flow', 'group.json'), '{broken');
  const matrix = join(dir, 'matrix.md');
  fs.writeFileSync(matrix, 'previous matrix\n');
  assert.throws(() => renderMatrix(dir), /Cannot read valid JSON/);
  assert.equal(fs.readFileSync(matrix, 'utf8'), 'previous matrix\n');
  fs.writeFileSync(join(dir, 'auth-flow', 'group.json'), JSON.stringify({ ...record(), id: 'other-group' }));
  assert.throws(() => renderMatrix(dir), /Path\/id mismatch/);
  assert.equal(fs.readFileSync(matrix, 'utf8'), 'previous matrix\n');
});

test('render atomically replaces its generated matrix on rerun', () => {
  const dir = join(root, 'render-ok');
  put(record(), 'auth-flow');
  const sourceDir = join(root, 'auth-flow');
  fs.mkdirSync(dir, { recursive: true });
  fs.cpSync(sourceDir, join(dir, 'auth-flow'), { recursive: true });
  renderMatrix(dir);
  const matrix = join(dir, 'matrix.md');
  assert.match(fs.readFileSync(matrix, 'utf8'), /auth-flow/);
  fs.writeFileSync(matrix, 'stale derived matrix\n');
  renderMatrix(dir);
  assert.match(fs.readFileSync(matrix, 'utf8'), /# Backlog group matrix/);
});

test('matrix labels recommendations, readiness, verification, and gaps without claiming changes were applied', () => {
  const dir = join(root, 'matrix-review');
  fs.mkdirSync(join(dir, 'auth-flow'), { recursive: true });
  const pending = record();
  pending.coordinator = 'reviewer | coordinator';
  pending.coverage[0].status = 'missing';
  fs.writeFileSync(join(dir, 'auth-flow', 'group.json'), JSON.stringify(pending));
  renderMatrix(dir);
  const output = fs.readFileSync(join(dir, 'matrix.md'), 'utf8');
  assert.match(output, /local recommendations, not applied GitHub changes/);
  assert.match(output, /pending \| pending/);
  assert.match(output, /recommend duplicate/);
  assert.match(output, /\| coordinator/);
  assert.match(output, /uncovered:/);
  const ready = withVerifiedClosure(record());
  fs.writeFileSync(join(dir, 'auth-flow', 'group.json'), JSON.stringify(ready));
  renderMatrix(dir);
  assert.match(fs.readFileSync(join(dir, 'matrix.md'), 'utf8'), /ready \| confirmed \(current\)/);
});
