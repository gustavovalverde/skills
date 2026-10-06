import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPayload, planDiff, verifyAfter, main } from './advisory-update.mjs';

const ID = 'GHSA-2345-6789-cfgh';
const stamp = '2026-09-20T12:00:00Z';
const later = '2026-09-20T12:05:00Z';
const low = 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N';
const high = 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N';
const cvss = (vector, score) => ({ cvss: { vector_string: vector, score }, cvss_severities: { cvss_v3: { vector_string: vector, score }, cvss_v4: { vector_string: null, score: null } } });
const range = (name, vulnerable, patched = null) => ({ package: { ecosystem: 'npm', name }, vulnerable_version_range: vulnerable, patched_versions: patched, vulnerable_functions: [] });
const advisory = () => ({
  ghsa_id: ID, html_url: `https://github.com/example-org/example-lib/security/advisories/${ID}`, state: 'draft', cve_id: null, private_fork: null, collaborating_users: null,
  summary: 'example-lib: Synthetic limit bypass', description: '## Summary\r\n\r\nSynthetic text.  \r\n', severity: 'low', ...cvss(low, 3.7),
  cwe_ids: ['CWE-284'], cwes: [{ cwe_id: 'CWE-284', name: 'Improper Access Control' }],
  vulnerabilities: [range('example-lib', '>= 1.0.0'), range('@example/sso', '>= 1.0.0')],
  credits: [{ login: 'synthetic-finder', type: 'finder' }], credits_detailed: [{ user: { login: 'synthetic-finder' }, type: 'finder', state: 'accepted' }],
  updated_at: stamp,
});

test('payload keeps only approved fields and normalizes complete vulnerability entries', () => {
  const payload = buildPayload({ summary: ' example-lib: Synthetic limit bypass ', vulnerabilities: [{ package: { ecosystem: 'npm', name: 'example-lib' }, vulnerable_version_range: '>= 1.0.0 ', patched_versions: ' ' }], credits: [{ login: 'synthetic-finder', type: 'finder' }] });
  assert.deepEqual(payload, { summary: 'example-lib: Synthetic limit bypass', vulnerabilities: [range('example-lib', '>= 1.0.0')], credits: [{ login: 'synthetic-finder', type: 'finder' }] });
  assert.deepEqual(buildPayload({ vulnerabilities: [range('example-lib', '< 1.2.0', '1.2.0')] }).vulnerabilities[0].patched_versions, '1.2.0');
  const rejected = {
    severity: { severity: 'high' }, state: { state: 'published' }, cve: { cve_id: 'CVE-0000-0000' }, empty: {}, list: [],
    partialCollection: { vulnerabilities: [] }, missingRange: { vulnerabilities: [{ package: { ecosystem: 'npm', name: 'example-lib' } }] }, missingPackage: { vulnerabilities: [{ vulnerable_version_range: '>= 1.0.0' }] },
    functions: { vulnerabilities: [{ ...range('example-lib', '>= 1.0.0'), vulnerable_functions: ['synthetic'] }] }, duplicateRange: { vulnerabilities: [range('example-lib', '>= 1.0.0'), range('example-lib', '>= 1.0.0')] },
    vector: { cvss_vector_string: 'CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N' }, cwe: { cwe_ids: ['284'] }, noCwe: { cwe_ids: [] },
    creditType: { credits: [{ login: 'synthetic-finder', type: 'author' }] }, duplicateCredit: { credits: [{ login: 'Synthetic-Finder', type: 'finder' }, { login: 'synthetic-finder', type: 'finder' }] }, blankSummary: { summary: ' ' },
  };
  for (const [label, fields] of Object.entries(rejected)) assert.throws(() => buildPayload(fields), label);
  for (const patched of [null, ' ']) assert.throws(() => buildPayload({ vulnerabilities: [range('example-lib', '>= 1.0.0, < 1.2.0', patched)] }), /needs patched_versions/);
  assert.deepEqual(buildPayload({ vulnerabilities: [range('example-lib', '>= 2.0.0-beta.1, < 2.0.0-beta.4', '2.0.0-beta.4')] }).vulnerabilities[0].patched_versions, '2.0.0-beta.4');
});

test('planned diff compares each field the way GitHub stores it', () => {
  const diff = planDiff(advisory(), buildPayload({
    description: '## Summary\n\nSynthetic text.\n',
    vulnerabilities: [range('@example/sso', '>= 1.0.0'), range('example-lib', '>= 1.0.0')],
    cvss_vector_string: high,
    credits: [{ login: 'Synthetic-Finder', type: 'finder' }, { login: 'synthetic-analyst', type: 'analyst' }],
  }));
  assert.deepEqual(diff.map(d => [d.field, d.changed]), [['description', false], ['vulnerabilities', false], ['cvss_vector_string', true], ['credits', true]]);
  assert.deepEqual(diff.find(d => d.field === 'cvss_vector_string'), { field: 'cvss_vector_string', current: low, proposed: high, changed: true });
});

test('verification accepts derived fields and GitHub text normalization only for requested fields', () => {
  const patch = buildPayload({ description: '## Summary\n\nRevised synthetic text.', cvss_vector_string: high, cwe_ids: ['CWE-863'], vulnerabilities: [range('example-lib', '< 1.2.1', '1.2.1')] });
  const after = { ...advisory(), ...cvss(high, 7.4), severity: 'high', description: '## Summary\r\n\r\nRevised synthetic text.\r\n', cwe_ids: ['CWE-863'], cwes: [{ cwe_id: 'CWE-863', name: 'Incorrect Authorization' }], vulnerabilities: [range('example-lib', '< 1.2.1', '1.2.1')], updated_at: later };
  assert.deepEqual(verifyAfter(advisory(), after, patch), []);
  assert.match(verifyAfter(advisory(), { ...after, vulnerabilities: advisory().vulnerabilities }, patch).join('\n'), /vulnerabilities does not match/);
  assert.match(verifyAfter(advisory(), { ...after, cvss: { vector_string: low, score: 3.7 }, cvss_severities: advisory().cvss_severities }, patch).join('\n'), /cvss_vector_string does not match/);
  const unrequested = { ...after, state: 'published', credits: [], cve_id: 'CVE-0000-0000' };
  assert.deepEqual(verifyAfter(advisory(), unrequested, patch), ['state changed without being requested', 'cve_id changed without being requested', 'credits changed without being requested']);
  assert.deepEqual(verifyAfter(advisory(), { ...advisory(), severity: 'high', updated_at: later }, { summary: advisory().summary }), ['severity changed without being requested']);
  const credited = { ...advisory(), credits: [{ login: 'synthetic-finder', type: 'finder' }, { login: 'synthetic-analyst', type: 'analyst' }], credits_detailed: [], updated_at: later };
  assert.deepEqual(verifyAfter(advisory(), credited, buildPayload({ credits: [{ login: 'synthetic-analyst', type: 'analyst' }, { login: 'Synthetic-Finder', type: 'finder' }] })), []);
});

const temps = [];
after(() => temps.forEach(dir => fs.rmSync(dir, { recursive: true, force: true })));
function fixture(fields) {
  const dir = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), 'advisory-update-test-'));
  temps.push(dir);
  const edit = value => fs.writeFileSync(join(dir, 'fields.json'), JSON.stringify(value));
  edit(fields);
  const evidence = name => JSON.parse(fs.readFileSync(join(dir, 'evidence', name), 'utf8'));
  return { dir, edit, evidence, args: (...extra) => ['example-org/example-lib', ID, '--fields', join(dir, 'fields.json'), '--evidence', join(dir, 'evidence'), ...extra] };
}
function github(respond = (state, patch) => ({ ...state, ...patch, updated_at: later })) {
  const remote = { state: advisory(), calls: [], sent: [] };
  remote.gh = (args, input) => {
    remote.calls.push(args[1]);
    if (args[1] === 'PATCH') { remote.sent.push(JSON.parse(input)); remote.state = respond(remote.state, JSON.parse(input)); return remote.state; }
    return structuredClone(remote.state);
  };
  return remote;
}

test('a dry run records the baseline and planned payload and never sends', () => {
  const { dir, edit, evidence, args } = fixture({ summary: 'example-lib: Revised synthetic title' });
  const remote = github();
  assert.match(main(args(), remote.gh), /## summary: change[^]*Dry run: no remote change/);
  assert.deepEqual(remote.calls, ['GET']);
  assert.deepEqual(evidence('baseline.json'), advisory());
  assert.deepEqual(evidence('payload.json'), { summary: 'example-lib: Revised synthetic title' });
  assert.ok(!fs.existsSync(join(dir, 'evidence', 'after.json')));
  edit({ summary: 'example-lib: Second revised synthetic title' });
  remote.state = { ...remote.state, severity: 'medium' };
  main(args(), remote.gh);
  assert.deepEqual(evidence('payload.json'), { summary: 'example-lib: Second revised synthetic title' });
  assert.equal(evidence('baseline.json').severity, 'medium');
  assert.deepEqual(remote.calls, ['GET', 'GET']);
  assert.throws(() => main([...args(), '--force'], remote.gh), /Unknown option/);
  assert.throws(() => main(['example-org/example-lib', 'CVE-0000-0000', '--fields', 'x', '--evidence', dir], remote.gh), /Usage/);
  assert.throws(() => main(['example-org/example-lib', ID, '--fields', join(dir, 'fields.json')], remote.gh), /Usage/);
});

test('--apply sends exactly the reviewed payload, keeps evidence, and fails when GitHub ignores a field', () => {
  const { dir, evidence, args } = fixture({ summary: advisory().summary, description: '## Summary\n\nRevised synthetic text.\n' });
  const remote = github();
  main(args(), remote.gh);
  assert.match(main(args('--apply'), remote.gh), /Updated and verified description on https:\/\/github\.com\//);
  assert.deepEqual(remote.calls, ['GET', 'GET', 'PATCH', 'GET']);
  assert.deepEqual(remote.sent, [evidence('payload.json')]);
  assert.deepEqual(evidence('payload.json'), { description: '## Summary\n\nRevised synthetic text.\n' });
  assert.equal(evidence('baseline.json').updated_at, stamp);
  assert.equal(evidence('after.json').updated_at, later);
  const applied = fs.readFileSync(join(dir, 'evidence', 'after.json'), 'utf8');
  for (const extra of [[], ['--apply']]) assert.throws(() => main(args(...extra), remote.gh), /already records an applied update/);
  assert.deepEqual(remote.calls, ['GET', 'GET', 'PATCH', 'GET']);
  assert.equal(fs.readFileSync(join(dir, 'evidence', 'after.json'), 'utf8'), applied);

  const ignored = fixture({ description: '## Summary\n\nRevised synthetic text.\n' });
  const ignoring = github(state => ({ ...state, updated_at: later }));
  main(ignored.args(), ignoring.gh);
  assert.throws(() => main(ignored.args('--apply'), ignoring.gh), /Verification failed[^]*description does not match/);
  assert.ok(fs.existsSync(join(ignored.dir, 'evidence', 'after.json')));
});

test('--apply refuses a live change that left updated_at unchanged and names the field', () => {
  const { args } = fixture({ summary: 'example-lib: Revised synthetic title' });
  const remote = github();
  main(args(), remote.gh);
  remote.state = { ...remote.state, vulnerabilities: [range('example-lib', '>= 1.0.0')] };
  assert.equal(remote.state.updated_at, stamp);
  assert.throws(() => main(args('--apply'), remote.gh), /changed since the reviewed dry run: vulnerabilities\./);
  assert.deepEqual(remote.calls, ['GET', 'GET']);
});

test('--apply refuses a fields file edited after the dry run', () => {
  const { edit, args } = fixture({ summary: 'example-lib: Revised synthetic title' });
  const remote = github();
  main(args(), remote.gh);
  edit({ summary: 'example-lib: Revised synthetic title', cwe_ids: ['CWE-863'] });
  assert.throws(() => main(args('--apply'), remote.gh), /no longer produces the reviewed .*payload\.json/);
  assert.deepEqual(remote.calls, ['GET', 'GET']);
});

test('--apply refuses without a dry run of the same advisory', () => {
  const { dir, args } = fixture({ summary: 'example-lib: Revised synthetic title' });
  const remote = github();
  assert.throws(() => main(args('--apply'), remote.gh), /baseline\.json is missing/);
  assert.ok(!fs.existsSync(join(dir, 'evidence')));
  const other = 'GHSA-3456-789c-fghj';
  for (const [repo, url] of [['example-org/example-lib', `https://github.com/example-org/example-lib/security/advisories/${other}`], ['example-org/other-repo', `https://github.com/example-org/other-repo/security/advisories/${ID}`]]) {
    const elsewhere = { ...advisory(), ghsa_id: url.split('/').pop(), html_url: url };
    main([repo, elsewhere.ghsa_id, ...args().slice(2)], () => structuredClone(elsewhere));
    assert.throws(() => main(args('--apply'), remote.gh), /is a dry run of https:\/\/github\.com\/example-org\/[^]* not example-org\/example-lib GHSA-2345-6789-cfgh/);
  }
  assert.deepEqual(remote.calls, []);
});

test('an empty payload is a recorded no-op in both the dry run and --apply', () => {
  const { dir, evidence, args } = fixture({ summary: advisory().summary, cwe_ids: ['CWE-284'] });
  const remote = github();
  assert.match(main(args(), remote.gh), /## summary: unchanged\n## cwe_ids: unchanged\nNo field changes; nothing to apply\./);
  assert.deepEqual(evidence('payload.json'), {});
  assert.match(main(args('--apply'), remote.gh), /No field changes; nothing to apply\.$/);
  assert.deepEqual(remote.calls, ['GET', 'GET']);
  assert.ok(!fs.existsSync(join(dir, 'evidence', 'after.json')));
});
