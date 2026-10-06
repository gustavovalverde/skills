import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditAdvisory, report, main } from './audit-advisories.mjs';

const body = '## Am I affected?\n\nSynthetic versions 1.0.0 and later with the optional feature enabled.\n\n## Summary\n\nThe feature fails to enforce a documented limit.\n\n## Impact\n\nAn authenticated user can exceed that limit within their own account.\n\n## Patches\n\nNo fixed package has been released.\n';
const vulnerability = { package: { name: 'example-lib', ecosystem: 'npm' }, vulnerable_version_range: '>= 1.0.0', patched_versions: null };
const draftAdvisory = (overrides = {}) => ({
  ghsa_id: 'GHSA-2345-6789-cfgh', state: 'draft', summary: 'example-lib: Feature exceeds its configured limit',
  description: body, vulnerabilities: [vulnerability], cwes: [{ cwe_id: 'CWE-20', name: 'Improper Input Validation' }],
  cvss_severities: { cvss_v3: { vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', score: 5.3 } },
  ...overrides,
});

test('a well-formed draft advisory has no errors or warnings', () => {
  assert.deepEqual(auditAdvisory(draftAdvisory()), { id: 'GHSA-2345-6789-cfgh', state: 'draft', errors: [], warnings: [] });
});
test('a missing section is reported for the advisory it belongs to', () => {
  const result = auditAdvisory(draftAdvisory({ description: body.replace('## Impact\n\nAn authenticated user can exceed that limit within their own account.\n\n', '') }));
  assert.ok(result.errors.some(e => e.includes('Missing Impact section')));
});
test('an empty patched version from the GitHub API reads as no fix', () => {
  assert.deepEqual(auditAdvisory(draftAdvisory({ vulnerabilities: [{ ...vulnerability, patched_versions: '' }] })).errors, []);
});
test('a kept Credit section warns, and a restated own CVE ID is an error', () => {
  const credited = auditAdvisory(draftAdvisory({ description: `${body}\n## Credit\n\nSynthetic Team found this issue.\n` }));
  assert.deepEqual(credited.errors, []);
  assert.ok(credited.warnings.some(w => w.includes('Credit section')));
  const own = auditAdvisory(draftAdvisory({ cve_id: 'CVE-2099-0001', description: body.replace('No fixed package has been released.', 'No fixed package has been released for CVE-2099-0001.') }));
  assert.ok(own.errors.some(e => e.includes("own CVE ID")));
  const upstream = auditAdvisory(draftAdvisory({ cve_id: 'CVE-2099-0001', description: body.replace('No fixed package has been released.', 'No fixed package has been released. The dependency flaw is CVE-2099-0002.') }));
  assert.deepEqual(upstream.errors, []);
});
test('cwe_ids and cvss_vector_string are read from the shapes the GitHub API returns', () => {
  assert.deepEqual(auditAdvisory(draftAdvisory({ cwes: undefined, cwe_ids: ['CWE-20'] })).errors, []);
  assert.deepEqual(auditAdvisory(draftAdvisory({ cvss_severities: undefined, cvss: { vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N' } })).errors, []);
});
test('an advisory without a CWE or a CVSS 3.1 vector fails, including one scored only with CVSS 4.0', () => {
  const v4 = 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N';
  const scored = (v3, v4) => ({ cvss: { vector_string: v3, score: null }, cvss_severities: { cvss_v3: { vector_string: v3, score: null }, cvss_v4: { vector_string: v4, score: null } } });
  assert.deepEqual(auditAdvisory(draftAdvisory({ cwes: [] })).errors, ['Missing CWE IDs']);
  assert.deepEqual(auditAdvisory(draftAdvisory({ cwes: undefined, cwe_ids: [] })).errors, ['Missing CWE IDs']);
  assert.deepEqual(auditAdvisory(draftAdvisory(scored(null, null))).errors, ['Missing CVSS 3.1 vector']);
  assert.deepEqual(auditAdvisory(draftAdvisory({ cvss_severities: undefined })).errors, ['Missing CVSS 3.1 vector']);
  assert.deepEqual(auditAdvisory(draftAdvisory(scored(null, v4))).errors, ['Advisory has only a CVSS 4.0 vector; the scoring rubric uses CVSS 3.1']);
  assert.deepEqual(auditAdvisory(draftAdvisory(scored('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', v4))).errors, []);
  assert.equal(report([auditAdvisory(draftAdvisory({ cwes: [], ...scored(null, v4) }))], false).errors, 2);
});
test('a bare title without an affected package still fails the same rule', () => {
  const result = auditAdvisory(draftAdvisory({ summary: 'Feature exceeds its configured limit' }));
  assert.ok(result.errors.some(e => e.includes('affected package')));
});
test('an unrelated advisory is unaffected by another one in the same batch', () => {
  const clean = draftAdvisory();
  const broken = draftAdvisory({ ghsa_id: 'GHSA-3456-789c-fghj', description: body.replace('## Patches\n\nNo fixed package has been released.\n', '') });
  const results = [clean, broken].map(auditAdvisory);
  assert.deepEqual(results[0].errors, []);
  assert.ok(results[1].errors.length);
});

test('report totals errors and warnings across advisories', () => {
  const results = [auditAdvisory(draftAdvisory()), auditAdvisory(draftAdvisory({ ghsa_id: 'GHSA-3456-789c-fghj', description: body.replace('## Patches\n\nNo fixed package has been released.\n', '') }))];
  const { text, errors } = report(results, false);
  assert.match(text, /GHSA-2345-6789-cfgh \(draft\): 0 error\(s\), 0 warning\(s\)/);
  assert.match(text, /GHSA-3456-789c-fghj \(draft\): 1 error\(s\)/);
  assert.match(text, /Audited 2 advisories: 1 error\(s\), 0 warning\(s\)\.$/);
  assert.equal(errors, 1);
});
test('report emits parseable JSON with the same counts', () => {
  const results = [auditAdvisory(draftAdvisory())];
  const { text, errors } = report(results, true);
  const parsed = JSON.parse(text);
  assert.deepEqual(parsed.summary, { advisories: 1, errors: 0, warnings: 0 });
  assert.equal(parsed.advisories[0].id, 'GHSA-2345-6789-cfgh');
  assert.equal(errors, 0);
});
test('a single advisory reports itself as one advisory, not one advisories', () => {
  assert.match(report([auditAdvisory(draftAdvisory())], false).text, /Audited 1 advisory: /);
});

function fakeGh(advisories) {
  const calls = [];
  const gh = args => {
    calls.push(args);
    if (args[0] === '--paginate') {
      const state = new URL(args[2], 'https://api.invalid/').searchParams.get('state');
      return [advisories.filter(a => a.state === state)];
    }
    const id = args[2].split('/').pop().toLowerCase();
    const found = advisories.find(a => a.ghsa_id.toLowerCase() === id);
    assert.ok(found, `no fixture for ${id}`);
    return found;
  };
  return { gh, calls };
}

test('main lists advisories in the requested states without touching the network', () => {
  const draft = draftAdvisory();
  const published = draftAdvisory({ ghsa_id: 'GHSA-3456-789c-fghj', state: 'published' });
  const triage = draftAdvisory({ ghsa_id: 'GHSA-4567-89cf-ghjm', state: 'triage' });
  const { gh, calls } = fakeGh([draft, published, triage]);
  const { text, errors } = main(['example-org/example-lib'], gh);
  assert.match(text, /GHSA-2345-6789-cfgh/);
  assert.match(text, /GHSA-3456-789c-fghj/);
  assert.ok(!text.includes('GHSA-4567-89cf-ghjm'));
  assert.equal(errors, 0);
  assert.deepEqual(calls, [
    ['--paginate', '--slurp', 'repos/example-org/example-lib/security-advisories?state=draft&per_page=100'],
    ['--paginate', '--slurp', 'repos/example-org/example-lib/security-advisories?state=published&per_page=100'],
  ]);
});
test('main narrows the state filter and fetches explicit IDs directly', () => {
  const draft = draftAdvisory();
  const published = draftAdvisory({ ghsa_id: 'GHSA-3456-789c-fghj', state: 'published' });
  const { text: onlyPublished } = main(['example-org/example-lib', '--state', 'published'], fakeGh([draft, published]).gh);
  assert.ok(!onlyPublished.includes('GHSA-2345-6789-cfgh'));
  assert.match(onlyPublished, /GHSA-3456-789c-fghj/);
  const { gh, calls } = fakeGh([draft, published]);
  const { text: byId } = main(['example-org/example-lib', 'GHSA-3456-789c-fghj'], gh);
  assert.ok(!byId.includes('GHSA-2345-6789-cfgh'));
  assert.match(byId, /GHSA-3456-789c-fghj/);
  assert.deepEqual(calls, [['--method', 'GET', 'repos/example-org/example-lib/security-advisories/GHSA-3456-789C-FGHJ']]);
});
test('main rejects a malformed repo or GHSA ID before any lookup', () => {
  assert.throws(() => main(['not-a-repo'], () => { throw new Error('must not be called'); }), /Usage/);
  assert.throws(() => main(['example-org/example-lib', 'not-a-ghsa-id'], () => { throw new Error('must not be called'); }), /Invalid GHSA ID/);
});

test('the command exits nonzero only when an advisory has errors, without a network call for bad arguments', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('./audit-advisories.mjs', import.meta.url)), 'not-a-repo'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Usage: node audit-advisories\.mjs/);
});

test('--metadata-only audits a repository that uses its own advisory template', () => {
  const ownTemplate = draftAdvisory({ summary: 'Header limit bypass in the parser', description: '### Summary\n\nThe parser accepts an invalid header.\n\n### Impact\n\nA remote caller can bypass the limit.\n' });
  assert.ok(main(['example-org/example-lib'], fakeGh([ownTemplate]).gh).errors > 0);
  assert.equal(main(['example-org/example-lib', '--metadata-only'], fakeGh([ownTemplate]).gh).errors, 0);
  const missingCwe = draftAdvisory({ summary: ownTemplate.summary, description: ownTemplate.description, cwes: [] });
  assert.equal(main(['example-org/example-lib', '--metadata-only'], fakeGh([missingCwe]).gh).errors, 1);
});

test('a published-only audit never requests draft or triage advisories', () => {
  const { gh, calls } = fakeGh([draftAdvisory(), draftAdvisory({ ghsa_id: 'GHSA-3456-789c-fghj', state: 'published' }), draftAdvisory({ ghsa_id: 'GHSA-4567-89cf-ghjm', state: 'triage' })]);
  main(['example-org/example-lib', '--state', 'published'], gh);
  assert.deepEqual(calls, [['--paginate', '--slurp', 'repos/example-org/example-lib/security-advisories?state=published&per_page=100']]);
  assert.throws(() => main(['example-org/example-lib', '--state', 'secret'], () => { throw new Error('must not be called'); }), /Unknown advisory state/);
});
test('--help prints usage without a lookup', () => {
  const { text, errors } = main(['--help'], () => { throw new Error('must not be called'); });
  assert.match(text, /^Usage:/);
  assert.equal(errors, 0);
});
