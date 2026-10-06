import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { template, validate, structural, main, digest, queueRows, schema, drift, LEGACY_ALIASES } from './workspace.mjs';

const ID = 'ghsa-2345-6789-cfgh';
const REPO = 'example-org/example-lib';
const stamp = '2026-09-20T12:00:00Z';
const raw = (id = ID) => ({ ghsa_id: id.replace('ghsa-', 'GHSA-'), html_url: `https://github.com/${REPO}/security/advisories/${id.replace('ghsa-', 'GHSA-')}`, state: 'triage', summary: 'Synthetic contract report', created_at: stamp, updated_at: stamp });
function confirmed() {
  const c = template(); c.case_id = ID;
  c.repository.github = REPO; c.repository.stable_sha = 'a'.repeat(40); c.repository.prerelease_ref = 'origin/prerelease'; c.repository.prerelease_sha = 'b'.repeat(40);
  c.continuity.owner = 'synthetic-maintainer';
  c.source = { ...c.source, url: raw().html_url, title: raw().summary, created_at: stamp, updated_at: stamp, retrieved_at: stamp, acknowledgement_deadline: stamp };
  c.authorization.basis = 'Synthetic local-only assessment';
  c.duplicate_assessment = { checked_at: stamp, queries: ['Synthetic archive search'], result: 'no_match', candidate_ids: [], rationale: 'No matching synthetic claim.' };
  c.last_triaged_at = stamp;
  const claim = c.claims[0];
  Object.assign(claim, { title: 'Synthetic failed guarantee', technical_verdict: 'confirmed', disposition: 'accept', branch_state: 'fixed_on_prerelease', evidence: ['Synthetic pinned source observation'], counterevidence: ['Newer branch has the guard'], proof_gaps: [], source: 'Synthetic client', control: 'Synthetic input', sink: 'Synthetic policy decision', impact: 'Synthetic protected action' });
  claim.product_contract = { surface: 'Synthetic opt-in plugin', delivery: 'official_plugin', lifecycle: 'stable', default_enabled: false, production_support: 'conditional', supported_environments: ['Synthetic supported configuration'], intended_capability: 'Limit an action', security_guarantee: 'Enforce the configured limit', contract_evidence: ['Synthetic contract reference'], contract_violated: true, advisory_justification: 'A supported guarantee fails with protected impact.' };
  c.overall_disposition = 'accept'; c.case_status = 'awaiting_maintainer_decision';
  c.github_snapshot.before = { captured_at: stamp, state: 'triage', updated_at: stamp, metadata_digest: 'c'.repeat(64) };
  c.github_snapshot.after = { ...c.github_snapshot.before }; c.github_snapshot.unchanged = true;
  return c;
}
const clean = c => assert.deepEqual(validate(c), []);
const rejects = c => assert.ok(validate(c).length, 'Expected validation failure');

test('four historical shapes stay independent of disposition', () => {
  const fixed = confirmed(); clean(fixed);
  const server = confirmed(); Object.assign(server.claims[0], { technical_verdict: 'refuted', disposition: 'close_not_vulnerability', branch_state: 'not_applicable' }); server.claims[0].product_contract.contract_violated = false; server.overall_disposition = 'close_not_vulnerability'; clean(server);
  const duplicate = confirmed(); duplicate.claims[0].disposition = 'close_duplicate'; duplicate.overall_disposition = 'close_duplicate'; duplicate.duplicate_assessment.result = 'exact_duplicate'; duplicate.duplicate_assessment.candidate_ids = ['synthetic-canonical']; clean(duplicate);
  const multi = confirmed(); multi.claims.push({ ...structuredClone(multi.claims[0]), claim_id: 'claim-002', branch_state: 'live_on_both' }); clean(multi);
  for (const old of ['2.0.0', '2.1.0', '2.1.1', '2.1.2']) { const c = confirmed(); c.process_version = old; delete c.continuity; if (old === '2.0.0') delete c.claims[0].product_contract; clean(c); }
});

test('rejects malformed records and unsupported future process versions', () => {
  for (const mutate of [c => { c.claims[0].technical_verdict = 'valid'; }, c => { delete c.claims[0].proof_gaps; }, c => { c.process_version = '3.0.0'; }, c => { c.claims[0].unexpected = true; }, c => { c.post_triage.metadata_request = { severity: 'high', cvss_vector_string: 'CVSS:3.1/test' }; }, c => { c.source.updated_at = 'yesterday'; }, c => { c.claims.push(c.claims[0]); }]) { const c = confirmed(); mutate(c); rejects(c); }
  assert.ok(structural({}, { magicValidation: true }).length);
});

test('product contract, uncertainty, and mixed claims gate acceptance', () => {
  const c = confirmed(); c.claims[0].product_contract.contract_violated = false; rejects(c);
  const unresolved = confirmed(); unresolved.claims[0].technical_verdict = 'unresolved'; unresolved.claims[0].disposition = 'clarify'; unresolved.overall_disposition = 'clarify'; rejects(unresolved);
  unresolved.claims[0].proof_gaps = ['Need a supported-use contract']; clean(unresolved);
  const multi = confirmed(); multi.claims.push({ ...structuredClone(unresolved.claims[0]), claim_id: 'claim-002' }); rejects(multi); multi.overall_disposition = 'clarify'; clean(multi);
  multi.overall_disposition = 'close_duplicate'; rejects(multi);
  const issue = confirmed(); issue.claims[0].disposition = 'issue'; issue.claims[0].product_contract.contract_violated = false; issue.overall_disposition = 'issue'; clean(issue);
  const hardening = structuredClone(issue); hardening.claims[0].disposition = 'hardening'; hardening.overall_disposition = 'hardening'; clean(hardening);
});

test('publication requires verified fix/release or explicit disclosure exception; CVE is separate', () => {
  const c = confirmed(); c.post_triage.advisory_published_at = stamp; rejects(c);
  for (const k of ['fix_merged_at', 'public_branch_verified_at', 'package_released_at', 'metadata_completed_at']) c.post_triage[k] = stamp;
  clean(c);
  const pending = structuredClone(c); pending.post_triage.advisory_published_at = null;
  assert.deepEqual(validate(pending, { publicationCheck: true }), []);
  c.post_triage.package_released_at = '2026-09-21T12:00:00Z'; rejects(c);
  const noFix = confirmed(); noFix.post_triage.advisory_published_at = stamp;
  noFix.post_triage.disclosure_exception = { approved_by: 'synthetic-maintainer', approved_at: stamp, policy_basis: 'Synthetic disclosure deadline', reason: 'Deadline reached without a fix; disclose affected scope truthfully.' }; clean(noFix);
  const cve = confirmed(); cve.post_triage.cve_requested_at = stamp; clean(cve);
});

test('snapshot integrity and review-ready stage do not conflate setup with review', () => {
  const c = confirmed(); assert.deepEqual(validate(c, { ready: true }), []);
  c.github_snapshot.after.metadata_digest = 'd'.repeat(64); rejects(c);
  c.github_snapshot.unchanged = false; clean(c);
  assert.ok(validate(template(), { ready: true }).length);
  const stale = confirmed(); stale.source.updated_at = '2026-09-21T12:00:00Z'; assert.ok(validate(stale, { ready: true }).length);
});

test('two independent maintainers can resume without private local dependencies', () => {
  const temp = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'advisory-triage-test-'));
  try {
    const repos = ['sender', 'receiver'].map(name => join(temp, name));
    const roots = repos.map(repo => join(repo, '.notes/advisories'));
    for (const repo of repos) {
      fs.mkdirSync(repo); execFileSync('git', ['init', '-q', repo]);
      fs.appendFileSync(join(repo, '.git/info/exclude'), '\n/.notes/advisories/\n');
      main(['init', join(repo, '.notes/advisories'), '--repo', repo]);
    }
    const source = join(temp, 'source.json'); fs.writeFileSync(source, JSON.stringify(raw()));
    main(['new', roots[0], ID, '--repository', REPO, '--repo', repos[0], '--owner', 'sender', '--snapshot', source, '--stable-branch', 'main', '--stable', 'a'.repeat(40), '--next', 'absent']);
    assert.equal(JSON.parse(fs.readFileSync(join(roots[0], ID, 'case.json'))).authorization.github_read, 'not_authorized');
    assert.throws(() => main(['capture', roots[0], ID, 'after']), /reads are not authorized/);
    main(['capture', roots[0], ID, 'after', '--snapshot', source]);
    assert.throws(() => main(['new', roots[0], ID]), /exists/);
    const dir = join(roots[0], ID), path = join(dir, 'case.json');
    const c = confirmed(); c.repository.path = repos[0]; c.authorization.github_write = 'authorized'; c.continuity.hold_reason = 'Internal decision needed';
    fs.writeFileSync(path, JSON.stringify(c)); fs.writeFileSync(join(dir, 'triage.md'), '# Synthetic assessment\nEvidence is at a synthetic approved location. Hold for internal decision.');
    fs.writeFileSync(join(dir, 'private-extra.txt'), 'Do not transfer automatically');
    main(['validate', roots[0], ID, '--ready']);
    assert.throws(() => main(['checkpoint', roots[0], ID, '--owner', 'sender', '--reviewer', 'synthetic-agent', '--reason', 'Synthetic handoff']), /Unknown option owner for checkpoint/);
    assert.throws(() => main(['checkpoint', roots[0], ID, '--reason', 'Synthetic handoff']), /--reviewer/);
    main(['checkpoint', roots[0], ID, '--reviewer', 'synthetic-agent', '--reason', 'Synthetic handoff', '--ready']);
    const history = join(dir, 'history'); const file = join(history, fs.readdirSync(history)[0]);
    const saved = JSON.parse(fs.readFileSync(file));
    assert.equal(saved.reviewer, 'synthetic-agent'); assert.equal(JSON.parse(saved.files['case.json']).continuity.owner, 'synthetic-maintainer');
    assert.deepEqual(Object.keys(saved.files).sort(), ['case.json', 'triage.md']);
    assert.throws(() => main(['resume', roots[1], '--from', file, '--expect', '0'.repeat(64), '--owner', 'receiver', '--repo', repos[1]]), /checksum/);
    main(['resume', roots[1], '--from', file, '--expect', saved.revision, '--owner', 'receiver', '--repo', repos[1]]);
    const received = JSON.parse(fs.readFileSync(join(roots[1], ID, 'case.json')));
    assert.equal(received.continuity.owner, 'receiver'); assert.equal(received.continuity.hold_reason, 'Internal decision needed');
    assert.equal(received.authorization.github_write, 'not_authorized'); assert.equal(received.repository.path, repos[1]);
    assert.equal(received.authorization.github_read, 'not_authorized');
    assert.ok(validate(received, { ready: true }).length);
    assert.deepEqual(received.claims, c.claims); assert.equal(received.case_status, 'static_triage');
    assert.equal(received.continuity.last_reviewed_revision, saved.revision);
    assert.equal(fs.existsSync(join(roots[1], ID, 'private-extra.txt')), false);
    assert.throws(() => main(['resume', roots[1], '--from', file, '--expect', saved.revision, '--owner', 'receiver', '--repo', repos[1]]), /Existing case/);
    assert.throws(() => main(['checkpoint', roots[0], '../escape', '--reviewer', 'x', '--reason', 'x']), /Invalid case/);
    const attack = structuredClone(saved); attack.files['../escape'] = 'bad'; delete attack.revision; const revision = digest(attack); const tampered = join(temp, 'invalid.json'); fs.writeFileSync(tampered, JSON.stringify({ revision, ...attack }));
    assert.throws(() => main(['resume', roots[1], '--from', tampered, '--expect', revision, '--owner', 'receiver', '--repo', repos[1]]), /Only case.json/);
    const inventory = join(temp, 'inventory.json');
    fs.writeFileSync(inventory, JSON.stringify([[raw(), { ...raw(), state: 'draft' }]]));
    main(['queue', roots[0], '--inventory', inventory]);
    const queue = JSON.parse(fs.readFileSync(join(roots[0], 'QUEUE.team.json')));
    assert.equal(queue.source_mode, 'supplied_inventory'); assert.equal(queue.retrieved_at, null);
    assert.match(fs.readFileSync(join(roots[0], 'QUEUE.team.md'), 'utf8'), /offline inventory; source collection time is unverified/);
    main(['queue', roots[0], '--inventory', inventory, '--check']);
    c.source.updated_at = '2026-09-19T12:00:00Z'; fs.writeFileSync(path, JSON.stringify(c));
    assert.throws(() => main(['queue', roots[0], '--inventory', inventory, '--check']), /stale/);
    assert.equal(queueRows(roots[0], [raw()])[0].local_status, 'stale_reassess');
    const legacyID = 'ghsa-3456-789c-fghj'; fs.mkdirSync(join(roots[0], legacyID)); fs.writeFileSync(join(roots[0], legacyID, 'triage.md'), 'Historical decision');
    assert.equal(queueRows(roots[0], [{ ...raw(), ghsa_id: legacyID.toUpperCase() }])[0].local_status, 'legacy_assessment_check_history');
    assert.equal(queueRows(roots[1], [{ ...raw(), ghsa_id: 'GHSA-4567-89CF-GHJM' }])[0].local_status, 'history_check_required');
    const linkID = 'ghsa-5678-9cfg-hjmp'; fs.symlinkSync(dir, join(roots[1], linkID)); assert.throws(() => main(['validate', roots[1], linkID]), /symlink/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('schema contract supports only the vocabulary covered by the validator', () => {
  // Exercise every definition independently, so unsupported vocabulary cannot hide in an unselected oneOf.
  for (const definition of Object.values(schema.$defs)) assert.equal(structural(null, definition).some(e => e.includes('unsupported schema')), false);
});

test('published historical records preserve unknown milestones without granting publication readiness', () => {
  const c = confirmed();
  c.source.github_state = 'published';
  c.github_snapshot.before.state = c.github_snapshot.after.state = 'published';
  c.post_triage.advisory_published_at = stamp;
  clean(c);
  assert.deepEqual(validate(c, { ready: true }), []);
  assert.ok(validate(c, { publicationCheck: true }).some(e => e.includes('fix_merged_at')));
  c.post_triage.public_branch_verified_at = '2026-09-22T12:00:00Z';
  c.post_triage.package_released_at = stamp;
  clean(c);
  assert.ok(validate(c, { publicationCheck: true }).length);
  c.github_snapshot.before.state = 'draft';
  rejects(c);
});

test('canonical URLs, isolated source checkout, historical checkpoint and review-only body', () => {
  const temp = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'advisory-retrospective-test-'));
  try {
    const storage = join(temp, 'records'), sourceRepo = join(temp, 'source');
    for (const repo of [storage, sourceRepo]) { fs.mkdirSync(repo); execFileSync('git', ['init', '-q', repo]); }
    fs.appendFileSync(join(storage, '.git/info/exclude'), '\n/.notes/advisories/\n');
    const root = join(storage, '.notes/advisories');
    main(['init', root, '--repo', storage]);
    const input = join(temp, 'source.json');
    const published = { ...raw(), state: 'published', published_at: stamp };
    fs.writeFileSync(input, JSON.stringify(published));
    main(['new', root, ID, '--repository', REPO, '--repo', sourceRepo, '--owner', 'reviewer', '--snapshot', input, '--stable-branch', 'main', '--stable', 'a'.repeat(40), '--prerelease', 'absent']);
    const dir = join(root, ID), path = join(dir, 'case.json');
    const created = JSON.parse(fs.readFileSync(path));
    assert.equal(created.repository.path, sourceRepo);
    assert.equal(created.source.url, published.html_url);
    assert.equal(created.post_triage.advisory_published_at, stamp);
    assert.equal(created.source.publicly_disclosed, true);
    assert.equal(fs.existsSync(join(sourceRepo, '.notes')), false);
    const initial = fs.readdirSync(dir).find(f => f.startsWith('source-'));
    assert.deepEqual(JSON.parse(fs.readFileSync(join(dir, initial))), published);
    main(['capture', root, ID, 'after', '--snapshot', input]);
    for (const url of [published.html_url.replace('github.com', 'example.com'), published.html_url + '?x=1', published.html_url.replace(ID.slice(-4), 'hjmp')]) {
      fs.writeFileSync(input, JSON.stringify({ ...published, html_url: url }));
      assert.throws(() => main(['capture', root, ID, 'after', '--snapshot', input]), /Unexpected advisory URL/);
    }
    const c = confirmed(); c.repository.path = sourceRepo;
    c.source.github_state = 'published'; c.github_snapshot.before.state = c.github_snapshot.after.state = 'published';
    c.post_triage.advisory_published_at = stamp;
    fs.writeFileSync(path, JSON.stringify(c));
    fs.writeFileSync(join(dir, 'triage.md'), 'Retrospective review. Historical approvals unknown; no external changes authorized.');
    fs.writeFileSync(join(dir, 'advisory.review.md'), 'Synthetic local candidate, not approved for disclosure.');
    main(['validate', root, ID, '--ready']);
    assert.throws(() => main(['validate', root, ID, '--publication-check']), /Publication requires prior/);
    main(['checkpoint', root, ID, '--reviewer', 'synthetic-agent', '--reason', 'Historical gaps retained']);
    assert.equal(fs.readdirSync(join(dir, 'history')).length, 1);
    fs.writeFileSync(join(dir, 'advisory.md'), 'Unapproved disclosure');
    assert.throws(() => main(['validate', root, ID]), /explicit acceptance/);
    fs.unlinkSync(join(dir, 'advisory.md'));
    c.source.github_state = 'triage'; fs.writeFileSync(path, JSON.stringify(c));
    assert.throws(() => main(['validate', root, ID]), /review-only body requires/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('drift compares the record with a GitHub observation', () => {
  const c = confirmed(), vector = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N';
  const observation = { snapshot: { ...c.github_snapshot.after }, advisory: { ...raw(), cvss_severities: { cvss_v3: null, cvss_v4: null } } };
  assert.deepEqual(drift(c, observation), []);
  c.post_triage.metadata_request = { cvss_vector_string: vector };
  assert.deepEqual(drift(c, observation), [`post_triage.metadata_request.cvss_vector_string is ${vector}, but GitHub reported no CVSS 3.1 vector`]);
  observation.advisory.cvss_severities.cvss_v3 = { vector_string: vector, score: 5.3 }; assert.deepEqual(drift(c, observation), []);
  assert.deepEqual(drift(c, { ...observation, advisory: { ...raw(), cvss: { vector_string: vector, score: 5.3 } } }), []);
  c.github_snapshot.after = null; observation.snapshot.state = 'draft';
  assert.deepEqual(drift(c, observation), ['source.github_state is triage, but GitHub reported draft']);
});

test('validate warns about drift from the latest observation without failing', t => {
  const temp = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'advisory-drift-test-'));
  try {
    const repo = join(temp, 'repo'), root = join(repo, '.notes/advisories'), dir = join(root, ID), input = join(temp, 'source.json');
    fs.mkdirSync(repo); execFileSync('git', ['init', '-q', repo]);
    fs.appendFileSync(join(repo, '.git/info/exclude'), '\n/.notes/advisories/\n');
    main(['init', root, '--repo', repo]);
    const vector = 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N';
    const observed = (state, v) => ({ ...raw(), state, cvss_severities: { cvss_v3: v && { vector_string: v, score: null }, cvss_v4: null } });
    fs.writeFileSync(input, JSON.stringify(observed('triage', vector)));
    main(['new', root, ID, '--repository', REPO, '--repo', repo, '--owner', 'synthetic-maintainer', '--snapshot', input, '--stable-branch', 'main', '--stable', 'a'.repeat(40), '--prerelease', 'absent']);
    const c = confirmed(); c.repository.path = repo; c.post_triage.metadata_request = { cvss_vector_string: vector };
    fs.writeFileSync(join(dir, 'case.json'), JSON.stringify(c)); fs.writeFileSync(join(dir, 'triage.md'), 'Synthetic assessment.');
    main(['capture', root, ID, 'after', '--snapshot', input]);
    const warn = t.mock.method(console, 'warn', () => {});
    const warnings = () => warn.mock.calls.map(call => call.arguments.join(' '));
    main(['validate', root, ID, '--ready']); assert.deepEqual(warnings(), []);
    fs.writeFileSync(join(dir, 'observation-2000-01-01T00-00-00-000Z.json'), JSON.stringify({ phase: 'before', snapshot: { ...c.github_snapshot.before, state: 'closed' }, advisory: observed('closed', null) }));
    main(['validate', root, ID]); assert.deepEqual(warnings(), []);
    fs.writeFileSync(input, JSON.stringify(observed('closed', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N')));
    main(['capture', root, ID, 'after', '--snapshot', input]);
    main(['validate', root, ID]); main(['validate', root, '--ready']);
    const lines = warnings();
    assert.equal(lines.length, 6);
    for (const field of ['source.github_state is triage', 'github_snapshot.after.state is triage', `cvss_vector_string is ${vector}`]) assert.equal(lines.filter(line => line.includes(ID) && line.includes(field)).length, 2);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

const GENERIC = { caseSchema: 'advisory-case/v2', queueSchema: 'advisory-queue/v1' };
const LEGACY = { caseSchema: 'example-project-advisory-case/v2', queueSchema: 'example-project-team-queue/v1' };
const readCase = (root, id = ID) => JSON.parse(fs.readFileSync(join(root, id, 'case.json'), 'utf8'));
function checkout(temp, name = 'repo') {
  const repo = join(temp, name), root = join(repo, '.notes/advisories');
  fs.mkdirSync(repo); execFileSync('git', ['init', '-q', repo]);
  fs.appendFileSync(join(repo, '.git/info/exclude'), '\n/.notes/advisories/\n');
  main(['init', root, '--repo', repo]);
  return { repo, root };
}
function snapshotFile(temp, id = ID) {
  const file = join(temp, `source-${id}.json`);
  fs.writeFileSync(file, JSON.stringify(raw(id)));
  return file;
}
// A local bare origin whose default branch is not main, so no network or GitHub access is involved.
function originCheckout(temp) {
  const repo = join(temp, 'repo'), root = join(repo, '.notes/advisories'), origin = join(temp, 'origin.git');
  const git = (...args) => execFileSync('git', ['-C', repo, '-c', 'user.name=synthetic', '-c', 'user.email=synthetic@example.invalid', '-c', 'commit.gpgsign=false', ...args], { encoding: 'utf8' }).trim();
  execFileSync('git', ['init', '-q', '--bare', '--initial-branch=trunk', origin]);
  fs.mkdirSync(repo); git('init', '-q', '--initial-branch=trunk');
  fs.appendFileSync(join(repo, '.git/info/exclude'), '\n/.notes/advisories/\n');
  git('remote', 'add', 'origin', origin);
  git('commit', '-q', '--no-verify', '--allow-empty', '-m', 'chore: base'); git('push', '-q', 'origin', 'trunk');
  const trunk = git('rev-parse', 'HEAD');
  const branch = (name, message) => {
    git('switch', '-q', '-C', name, 'trunk'); git('commit', '-q', '--no-verify', '--allow-empty', '-m', message); git('push', '-q', 'origin', name);
    const sha = git('rev-parse', 'HEAD'); git('switch', '-q', 'trunk');
    return sha;
  };
  main(['init', root, '--repo', repo]);
  return { repo, root, trunk, branch };
}
// A gh on PATH that records any call and fails, so a missing repository can never reach GitHub.
function guardGh(temp) {
  const bin = join(temp, 'bin'), called = join(temp, 'gh-called'), path = process.env.PATH;
  fs.mkdirSync(bin); fs.writeFileSync(join(bin, 'gh'), `#!/bin/sh\ntouch '${called}'\nexit 1\n`, { mode: 0o755 });
  process.env.PATH = `${bin}${delimiter}${path}`;
  return { called, restore: () => { process.env.PATH = path; } };
}

test('legacy case records stay valid, and the schema itself names only generic values', () => {
  const c = confirmed();
  assert.equal(c.schema_version, GENERIC.caseSchema); clean(c);
  assert.equal(schema.properties.schema_version.const, GENERIC.caseSchema);
  const legacy = structuredClone(c); legacy.schema_version = LEGACY.caseSchema;
  clean(legacy); assert.deepEqual(validate(legacy, { ready: true }), []);
  legacy.schema_version = 'unrelated-case/v2'; rejects(legacy);
  const states = schema.$defs.claim.properties.branch_state.enum;
  assert.ok(states.includes('fixed_on_prerelease') && states.includes('prerelease_only_regression'));
  for (const [old, current] of Object.entries(LEGACY_ALIASES.branchStates)) {
    assert.ok(!states.includes(old) && states.includes(current), old);
    const record = confirmed(); record.claims[0].branch_state = old; clean(record);
    record.schema_version = LEGACY.caseSchema; clean(record);
  }
  const fixed = confirmed(); fixed.claims[0].branch_state = 'fixed_on_next'; clean(fixed);
  fixed.claims[0].branch_state = 'fixed_on_anything'; rejects(fixed);
});

test('new records name the repository and use generic identifiers; a legacy queue stays checkable', () => {
  const temp = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'advisory-generic-ids-test-'));
  try {
    const { repo, root } = checkout(temp);
    main(['new', root, ID, '--repository', REPO, '--repo', repo, '--owner', 'synthetic-maintainer', '--snapshot', snapshotFile(temp), '--stable-branch', 'main', '--stable', 'a'.repeat(40)]);
    const created = readCase(root);
    assert.equal(created.schema_version, GENERIC.caseSchema); assert.equal(created.repository.github, REPO);
    assert.deepEqual(validate(created), []);
    const inventory = join(temp, 'inventory.json'), queuePath = join(root, 'QUEUE.team.json');
    fs.writeFileSync(inventory, JSON.stringify([[raw()]]));
    const queueArgs = ['queue', root, '--inventory', inventory];
    main(queueArgs);
    const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    assert.equal(queue.schema_version, GENERIC.queueSchema); assert.equal(queue.repository, REPO);
    main([...queueArgs, '--check']);
    fs.writeFileSync(queuePath, JSON.stringify({ ...queue, schema_version: LEGACY.queueSchema }));
    main([...queueArgs, '--check']);
    fs.writeFileSync(queuePath, JSON.stringify({ ...queue, schema_version: 'unrelated-list/v1' }));
    assert.throws(() => main([...queueArgs, '--check']), /Unsupported queue schema_version/);
    fs.writeFileSync(queuePath, JSON.stringify({ ...queue, schema_version: LEGACY.queueSchema }));
    main(queueArgs);
    assert.equal(JSON.parse(fs.readFileSync(queuePath, 'utf8')).schema_version, GENERIC.queueSchema);
    assert.throws(() => main([...queueArgs, '--repository', 'other-org/other-lib']), /differs from the recorded repository example-org\/example-lib/);
    assert.throws(() => main([...queueArgs, '--repository', 'not a repository']), /Expected --repository OWNER\/NAME/);
    main([...queueArgs, '--repository', REPO.toUpperCase(), '--check']);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('commands that call GitHub fail with an actionable message when the repository is unknown', () => {
  const temp = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'advisory-unknown-repository-test-'));
  const gh = guardGh(temp);
  try {
    const { repo, root } = checkout(temp);
    const unknown = /Unknown GitHub repository\. Pass --repository OWNER\/NAME; later commands reuse the repository recorded/;
    const snapshot = snapshotFile(temp), inventory = join(temp, 'inventory.json');
    fs.writeFileSync(inventory, JSON.stringify([[raw()]]));
    const intake = ['new', root, ID, '--repo', repo, '--owner', 'synthetic-maintainer', '--stable-branch', 'main', '--stable', 'a'.repeat(40)];
    assert.throws(() => main(intake), unknown);
    assert.throws(() => main([...intake, '--snapshot', snapshot]), unknown);
    assert.throws(() => main(['queue', root]), unknown);
    assert.throws(() => main(['queue', root, '--inventory', inventory]), unknown);
    assert.equal(fs.existsSync(join(root, ID)), false);

    const dir = join(root, ID), write = c => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(join(dir, 'case.json'), JSON.stringify(c)); fs.writeFileSync(join(dir, 'triage.md'), 'Synthetic assessment.'); };
    const c = confirmed(); c.repository.github = null; c.source.url = null; c.authorization.github_read = 'authorized';
    write(c);
    assert.throws(() => main(['capture', root, ID, 'after']), unknown);
    assert.throws(() => main(['capture', root, ID, 'after', '--snapshot', snapshot]), unknown);
    assert.throws(() => main(['capture', root, ID, 'after', '--repository', 'not a repository']), /Expected --repository OWNER\/NAME/);

    delete c.repository.github; c.source.url = raw().html_url;
    write(c);
    assert.throws(() => main(['capture', root, ID, 'after', '--snapshot', snapshot, '--repository', 'other-org/other-lib']), /differs from the recorded repository example-org\/example-lib/);
    main(['capture', root, ID, 'after', '--snapshot', snapshot]);
    assert.equal(fs.existsSync(gh.called), false, 'gh must never be invoked');
  } finally { gh.restore(); fs.rmSync(temp, { recursive: true, force: true }); }
});

test('a repository with only a default branch creates a case from that branch', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  const temp = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'advisory-single-branch-test-'));
  try {
    const { repo, root, trunk } = originCheckout(temp);
    main(['new', root, ID, '--repository', REPO, '--repo', repo, '--owner', 'synthetic-maintainer', '--snapshot', snapshotFile(temp)]);
    const { repository } = readCase(root);
    assert.deepEqual([repository.github, repository.stable_ref, repository.stable_sha, repository.prerelease_ref, repository.prerelease_sha], [REPO, 'origin/trunk', trunk, null, null]);
    main(['validate', root, ID]);
    assert.deepEqual(warn.mock.calls, []);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('branch options are honored, explicit SHAs win, and errors name the branch used', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  const temp = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'advisory-branch-options-test-'));
  try {
    const { repo, root, trunk, branch } = originCheckout(temp);
    const release = branch('release', 'fix: release line'), preview = branch('preview', 'feat: preview line');
    assert.notEqual(release, trunk);
    const ids = ['ghsa-3456-789c-fghj', 'ghsa-4567-89cf-ghjm', 'ghsa-5678-9cfg-hjmp', 'ghsa-6789-cfgh-jmpq'];
    const make = (id, ...extra) => main(['new', root, id, '--repository', REPO, '--repo', repo, '--owner', 'synthetic-maintainer', '--snapshot', snapshotFile(temp, id), ...extra]);
    const refs = id => { const { repository: r } = readCase(root, id); return [r.stable_ref, r.stable_sha, r.prerelease_ref, r.prerelease_sha]; };

    make(ids[0], '--stable-branch', 'release', '--prerelease-branch', 'preview');
    assert.deepEqual(refs(ids[0]), ['origin/release', release, 'origin/preview', preview]);
    make(ids[1], '--stable-branch', 'release', '--stable', trunk);
    assert.deepEqual(refs(ids[1]), ['origin/release', trunk, null, null]);
    make(ids[2], '--stable', trunk, '--next', preview);
    assert.deepEqual(refs(ids[2]), ['origin/trunk', trunk, 'origin/next', preview]);
    make(ids[3], '--stable', trunk, '--prerelease', preview, '--prerelease-branch', 'preview');
    assert.deepEqual(refs(ids[3]), ['origin/trunk', trunk, 'origin/preview', preview]);

    const failing = (extra, pattern) => assert.throws(() => make('ghsa-7894-cfgh-jmpq', ...extra), pattern);
    failing(['--stable-branch', 'missing-line'], /Need exact missing-line SHA/);
    failing(['--prerelease-branch', 'absent-line'], /Pre-release branch absent-line not found on origin/);
    failing(['--prerelease', preview], /Name the pre-release branch with --prerelease-branch/);
    failing(['--prerelease', 'absent', '--prerelease-branch', 'preview'], /--prerelease absent contradicts --prerelease-branch/);
    failing(['--prerelease', preview, '--next', preview], /legacy alias of --prerelease/);
    failing(['--stable-branch', '../escape'], /Invalid --stable-branch/);
    assert.deepEqual(warn.mock.calls, []);

    const bare = checkout(temp, 'no-origin');
    const offline = (...extra) => main(['new', bare.root, ID, '--repository', REPO, '--repo', bare.repo, '--owner', 'synthetic-maintainer', '--snapshot', snapshotFile(temp), ...extra]);
    assert.throws(() => offline('--stable-branch', 'main'), /Could not read branches from origin/);
    offline('--stable', trunk);
    assert.equal(readCase(bare.root).repository.stable_ref, 'origin/main');
    assert.match(warn.mock.calls.map(call => call.arguments.join(' ')).join('\n'), /Could not resolve the default branch of origin; using main\./);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('only project-prefixed earlier identifiers count as legacy', () => {
  assert.ok(LEGACY_ALIASES.caseSchema.test('example-project-advisory-case/v2'));
  for (const id of ['advisory-case/v2', 'example-project-advisory-case/v3', 'advisory-case/v2-extra', 'Example-advisory-case/v2']) assert.ok(!LEGACY_ALIASES.caseSchema.test(id), id);
  assert.ok(LEGACY_ALIASES.queueSchema.test('example-project-team-queue/v1'));
  assert.ok(!LEGACY_ALIASES.queueSchema.test('example-project-team-queue/v2'));
});
