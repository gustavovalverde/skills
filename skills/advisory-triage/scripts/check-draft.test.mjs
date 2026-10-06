import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDraft, draftWarnings } from './check-draft.mjs';

const body = '## Am I affected?\n\nSynthetic versions 1.0.0 and later with the optional feature enabled. Both conditions are necessary.\n\n## Summary\n\nThe feature fails to enforce a documented limit.\n\n## Impact\n\nAn authenticated user can exceed that limit within their own account. No cross-account impact is established.\n\n## Patches\n\nNo fixed package has been released.\n';
const proposal = { summary: 'example-lib: Feature exceeds its configured limit', description: body, vulnerabilities: [{ package: { name: 'example-lib', ecosystem: 'npm' }, vulnerable_version_range: '>= 1.0.0', patched_versions: null }], cwe_ids: ['CWE-20'], cvss_vector_string: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N' };
const withImpact = s => body.replace('No cross-account impact is established.', `No cross-account impact is established. ${s}`);
const longBody = withImpact('The limit applies per account. '.repeat(60));

test('unfixed disclosure is representable without inventing a release', () => {
  assert.deepEqual(checkDraft(body, proposal), []);
  assert.deepEqual(checkDraft(body), []);
});
test('a metadata proposal carries a CWE and a CVSS 3.1 vector', () => {
  const { cwe_ids, cvss_vector_string, ...unscored } = proposal;
  assert.deepEqual(checkDraft(body, { ...proposal, cwe_ids: undefined }), ['Missing CWE IDs']);
  assert.deepEqual(checkDraft(body, { ...proposal, cwe_ids: [] }), ['Missing CWE IDs']);
  assert.deepEqual(checkDraft(body, { ...proposal, cvss_vector_string: undefined }), ['Missing CVSS 3.1 vector']);
  assert.deepEqual(checkDraft(body, unscored), ['Missing CWE IDs', 'Missing CVSS 3.1 vector']);
  assert.deepEqual(checkDraft(body, {}), ['Missing CWE IDs', 'Missing CVSS 3.1 vector']);
  assert.deepEqual(checkDraft(body, { ...proposal, cvss_vector_string: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N' }), ['Advisory has only a CVSS 4.0 vector; the scoring rubric uses CVSS 3.1']);
  assert.deepEqual(checkDraft(body, { ...proposal, cvss_vector_string: 'CVSS:3.0/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N' }), ['Expected a CVSS 3.1 vector']);
});
test('write proposal excludes lifecycle and unrelated authority', () => {
  for (const key of ['state', 'credits', 'collaborating_users', 'cve_id', 'private_fork', 'severity']) assert.ok(checkDraft(body, { ...proposal, [key]: 'forbidden' }).length, key);
  assert.ok(checkDraft(body, { ...proposal, severity: 'high', cvss_vector_string: 'CVSS:3.1/AV:N' }).length);
});
test('body and patch must match; required metadata cannot be fabricated with blanks', () => {
  assert.ok(checkDraft(body, { ...proposal, description: body.replace('No fixed package', 'A fixed package') }).length);
  for (const patch of [null, [], { summary: '' }, { cwe_ids: ['20'] }, { vulnerabilities: [] }, { vulnerabilities: [{ package: { name: 'x', ecosystem: 'npm' }, vulnerable_version_range: '' }] }]) assert.ok(checkDraft(body, patch).length);
});
test('body never restates the score, vector, or severity that the metadata carries', () => {
  for (const sentence of [
    'CVSS 3.1 rates this issue as 7.1 High: `CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N`.',
    'The issue has a CVSS 3.1 score of **6.4 (Medium)**.',
    'The issue is rated High because it can turn stale access into durable access.',
    'The advisory remains Medium severity.',
    'The vector is (7.4, High) for this configuration.',
    'Attack Complexity is High because a guessable credential is needed.',
  ]) assert.ok(checkDraft(withImpact(sentence)).some(e => e.includes('restates')), sentence);
  for (const sentence of [
    'Only a high-privilege administrator can change this setting.',
    'Requests at a high rate are still limited per address.',
    'Low-traffic deployments are affected in the same way.',
  ]) assert.deepEqual(checkDraft(withImpact(sentence)), [], sentence);
});
test('body avoids version references that go stale with the next release', () => {
  for (const sentence of ['This includes the current 1.9.2 release.', 'Version 1.9.2 (latest) is affected.', 'The latest version is still affected.']) assert.ok(checkDraft(withImpact(sentence)).some(e => e.includes('stale')), sentence);
  for (const sentence of ['Versions 1.4.0 and later are affected.', 'Upgrade to 2.0.1 or later.', 'Testing covered 1.8.0 and 1.9.2.']) assert.deepEqual(checkDraft(withImpact(sentence)), [], sentence);
});
test('title starts with the affected package and stays plain', () => {
  const sso = { package: { name: '@example/sso', ecosystem: 'npm' }, vulnerable_version_range: '>= 1.2.0', patched_versions: null };
  assert.deepEqual(checkDraft(body, { ...proposal, summary: 'example-lib: Invitations still work after the inviter loses access' }), []);
  assert.deepEqual(checkDraft(body, { ...proposal, summary: '@example/sso: Private-network protection is skipped on some edge runtimes', vulnerabilities: [sso] }), []);
  for (const summary of ['Invitations still work after the inviter loses access', 'core: Invitations still work', 'example-lib: `acceptInvitation` skips a check', 'example-lib: Invitations still work \u2014 even later', 'example-lib: High severity invitation bypass', `example-lib: ${'x'.repeat(100)}`]) assert.ok(checkDraft(body, { ...proposal, summary }).length, summary);
});
test('title package must be one of the affected packages', () => {
  const summary = '@example/sso: Private-network protection is skipped on some edge runtimes';
  const both = [...proposal.vulnerabilities, { package: { name: '@example/sso', ecosystem: 'npm' }, vulnerable_version_range: '>= 1.2.0', patched_versions: null }];
  assert.ok(checkDraft(body, { ...proposal, summary }).some(e => e.includes('not one of the affected packages')));
  assert.ok(checkDraft(body, { ...proposal, summary: 'example-core: Feature exceeds its configured limit' }).some(e => e.includes('not one of the affected packages')));
  assert.deepEqual(checkDraft(body, { ...proposal, summary, vulnerabilities: both }), []);
  const { vulnerabilities, ...unlisted } = proposal;
  assert.deepEqual(checkDraft(body, { ...unlisted, summary }), []); // A proposal without a package list has nothing to compare.
});
test('the title rule follows the proposal\'s affected packages, reports once, and is skipped for a prose-only check', () => {
  const widget = { package: { name: 'widget-core', ecosystem: 'npm' }, vulnerable_version_range: '>= 3.0.0', patched_versions: null };
  const both = [...proposal.vulnerabilities, widget];
  for (const summary of ['example-lib: Limit is skipped', 'widget-core: Limit is skipped']) assert.deepEqual(checkDraft(body, { ...proposal, summary, vulnerabilities: both }), [], summary);
  for (const summary of ['widget-extra: Limit is skipped', 'example-lib-extra: Limit is skipped', 'EXAMPLE-LIB: Limit is skipped']) {
    const errors = checkDraft(body, { ...proposal, summary, vulnerabilities: both });
    assert.deepEqual(errors, [`Title package ${summary.split(':')[0]} is not one of the affected packages: example-lib, widget-core`], summary);
  }
  for (const summary of ['Limit is skipped', 'example-lib limit is skipped', 'example-lib:Limit is skipped', 'example-lib: ']) {
    const errors = checkDraft(body, { ...proposal, summary, vulnerabilities: both });
    assert.equal(errors.length, 1, summary);
    assert.match(errors[0], /^Title must start with an affected package name followed by ": ", for example "example-lib: "/, summary);
  }
  const { vulnerabilities, ...unlisted } = proposal;
  assert.match(checkDraft(body, { ...unlisted, summary: 'Limit is skipped' })[0], /for example "package-name: "/);
  assert.deepEqual(checkDraft(body, { ...unlisted, summary: 'any-package: Limit is skipped' }), []);
  assert.deepEqual(checkDraft(body), []);
  assert.deepEqual(checkDraft(body, { ...proposal, summary: undefined }), []);
});
test('a closed affected range needs its patched version; an unfixed range stays open-ended', () => {
  const withRange = (vulnerable_version_range, patched_versions) => ({ ...proposal, vulnerabilities: [{ package: { name: 'example-lib', ecosystem: 'npm' }, vulnerable_version_range, patched_versions }] });
  for (const [range, patched] of [['< 2.0.0', null], ['>= 1.0.0, <= 1.9.9', ''], ['>= 1.0.0, < 1.9.3', undefined]]) assert.ok(checkDraft(body, withRange(range, patched)).some(e => e.includes('needs a patched version')), range);
  for (const [range, patched] of [['>= 1.0.0', null], ['>= 1.0.0, < 1.9.3', '1.9.3'], ['>= 2.0.0-beta.1, < 2.0.0-beta.4', '2.0.0-beta.4']]) assert.deepEqual(checkDraft(body, withRange(range, patched)), [], range);
  const lines = [...proposal.vulnerabilities, { package: { name: 'example-lib', ecosystem: 'npm' }, vulnerable_version_range: '>= 2.0.0-beta.1, < 2.0.0-beta.4', patched_versions: '2.0.0-beta.4' }];
  assert.deepEqual(checkDraft(body, { ...proposal, vulnerabilities: lines }), []);
});
test('a closed range without a fix is allowed only beside an open-ended entry, such as a pre-release line or a moved package', () => {
  const pre = { package: { name: 'example-lib', ecosystem: 'npm' }, vulnerable_version_range: '>= 2.0.0-beta.1, < 2.0.0', patched_versions: null };
  assert.deepEqual(checkDraft(body, { ...proposal, vulnerabilities: [...proposal.vulnerabilities, pre] }), []);
  const moved = { package: { name: '@example/moved', ecosystem: 'npm' }, vulnerable_version_range: '>= 2.1.0', patched_versions: null };
  assert.deepEqual(checkDraft(body, { ...proposal, summary: 'example-lib: Feature exceeds its configured limit', vulnerabilities: [pre, moved] }), []);
  assert.ok(checkDraft(body, { ...proposal, vulnerabilities: [pre] }).some(e => e.includes('Closed range')));
});
test('credit and CVE IDs belong to the metadata; a kept Credit section or CVE citation only warns', () => {
  const credited = `${body}\n## Credit\n\nSynthetic Team found this issue.\n`;
  assert.deepEqual(checkDraft(credited), []);
  assert.ok(draftWarnings(credited).some(w => w.includes('Credit section')));
  assert.ok(checkDraft(credited.replace('## Credit', '## Credit\n\nFirst.\n\n## Summary')).length);
  for (const sentence of ['This issue is tracked as CVE-2099-0001.', 'See https://example.com/vuln/detail/CVE-2099-123456 for details.']) {
    assert.deepEqual(checkDraft(withImpact(sentence)), [], sentence);
    assert.ok(draftWarnings(withImpact(sentence)).some(w => w.includes('CVE')), sentence);
  }
  assert.deepEqual(checkDraft(`${body}\n## References\n\n- https://example.com/synthetic-fix\n`), []);
  assert.deepEqual(checkDraft(withImpact('The weakness matches CWE-20.')), []);
});
test('long or code-heavy opening sections warn without failing the draft', () => {
  assert.deepEqual(draftWarnings(body), []);
  assert.ok(draftWarnings(longBody).some(w => w.includes('words')));
  assert.deepEqual(checkDraft(longBody), []);
  const coded = withImpact(Array.from({ length: 11 }, (_, i) => `\`option${i}\``).join(' '));
  assert.ok(draftWarnings(coded).some(w => w.includes('code spans')));
  assert.deepEqual(draftWarnings(withImpact(Array.from({ length: 10 }, (_, i) => `\`option${i}\``).join(' '))), []);
  assert.deepEqual(draftWarnings(`${body}\n## Technical details\n\n${'The counter is read before it is updated. '.repeat(60)}\n`), []);
});
test('the command prints warnings and still passes', () => {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), 'advisory-draft-'));
  try {
    const file = join(dir, 'advisory.md');
    writeFileSync(file, longBody);
    const run = spawnSync(process.execPath, [fileURLToPath(new URL('./check-draft.mjs', import.meta.url)), file], { encoding: 'utf8' });
    assert.equal(run.status, 0);
    assert.match(run.stderr, /^Warning: .*words/m);
    assert.match(run.stdout, /Draft checks passed/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('technical details are optional and sit after workarounds', () => {
  const withDetails = `${body}\n## Technical details\n\nThe limit is read before the counter is updated.\n`;
  assert.deepEqual(checkDraft(withDetails), []);
  assert.ok(checkDraft(withDetails.replace('## Summary', '## Technical details\n\nEarly.\n\n## Summary')).length);
});
test('template is rejected until replaced by a coherent disclosure', () => {
  const template = readFileSync(new URL('../assets/advisory.template.md', import.meta.url), 'utf8');
  assert.ok(checkDraft(template).length);
  assert.deepEqual(checkDraft(template.replace(/^\[.*\]$/gm, 'Synthetic text.')), []);
  assert.ok(checkDraft(body.replace('## Impact', '## Internal investigation')).length);
  assert.ok(checkDraft(body.replace('## Patches\n\nNo fixed package has been released.', '## Patches')).length);
});
test('the skill folder works when copied alone and run from another directory', () => {
  const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const temp = mkdtempSync(join(realpathSync(tmpdir()), 'advisory-skill-alone-'));
  try {
    const installed = join(temp, 'installed-skill'), elsewhere = join(temp, 'elsewhere'), repo = join(temp, 'checkout');
    cpSync(skill, installed, { recursive: true, filter: source => !source.endsWith('.test.mjs') });
    for (const dir of [elsewhere, repo]) mkdirSync(dir);
    const run = (script, ...args) => spawnSync(process.execPath, [join(installed, 'scripts', script), ...args], { cwd: elsewhere, encoding: 'utf8' });
    const draft = join(elsewhere, 'advisory.md');
    writeFileSync(draft, body);
    assert.equal(run('check-draft.mjs', draft).status, 0);
    assert.match(run('cvss.mjs', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N').stdout, /^9\.1 Critical /);
    execFileSync('git', ['init', '-q', repo]);
    appendFileSync(join(repo, '.git/info/exclude'), '\n/.notes/advisories/\n');
    const root = join(repo, '.notes/advisories');
    const init = run('workspace.mjs', 'init', root, '--repo', repo);
    assert.equal(init.status, 0, init.stderr);
    for (const file of ['case.schema.json', 'case.template.json']) assert.equal(readFileSync(join(root, file), 'utf8'), readFileSync(join(installed, 'assets', file), 'utf8'), file);
    const usage = run('workspace.mjs');
    assert.equal(usage.status, 1);
    assert.match(usage.stderr, /^Usage:\n {2}node workspace\.mjs init ROOT/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

const githubDefaultBody = '### Summary\n\nThe parser accepts an invalid header.\n\n### Details\n\nThe check runs after the value is used.\n\n### Impact\n\nA remote caller can bypass the limit.\n';
const githubDefaultProposal = { summary: 'Header limit bypass in the parser', description: githubDefaultBody, vulnerabilities: [{ package: { name: 'example-lib', ecosystem: 'npm' }, vulnerable_version_range: '< 2.4.1', patched_versions: '2.4.1' }], cwe_ids: ['CWE-20'], cvss_vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N' };

test('metadata-only checks accept a repository that uses its own advisory template', () => {
  assert.deepEqual(checkDraft(githubDefaultBody, githubDefaultProposal, { editorial: false }), []);
  assert.deepEqual(draftWarnings(githubDefaultBody, { editorial: false }), []);
  const editorial = checkDraft(githubDefaultBody, githubDefaultProposal);
  assert.ok(editorial.includes('Missing Am I affected? section'));
  assert.ok(editorial.some(e => e.startsWith('Title must start with an affected package')));
});
test('metadata-only checks still enforce metadata that applies to any advisory', () => {
  const { cwe_ids, ...noCwe } = githubDefaultProposal;
  assert.deepEqual(checkDraft(githubDefaultBody, noCwe, { editorial: false }), ['Missing CWE IDs']);
  const closed = { ...githubDefaultProposal, vulnerabilities: [{ ...githubDefaultProposal.vulnerabilities[0], patched_versions: null }] };
  assert.ok(checkDraft(githubDefaultBody, closed, { editorial: false }).some(e => e.startsWith('Closed range < 2.4.1 needs a patched version')));
  assert.deepEqual(checkDraft('### Summary\n\nTODO\n', undefined, { editorial: false }), ['Unfinished scaffold text']);
});
test('a package name with surrounding whitespace is reported in both modes', () => {
  const spaced = { ...githubDefaultProposal, vulnerabilities: [{ ...githubDefaultProposal.vulnerabilities[0], package: { name: ' example-lib', ecosystem: 'npm' } }] };
  for (const options of [{ editorial: false }, {}]) {
    assert.ok(checkDraft(githubDefaultBody, spaced, options).includes('Package name " example-lib" has leading or trailing whitespace'));
  }
});
test('the command line accepts --metadata-only', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-draft-metadata-'));
  try {
    writeFileSync(join(dir, 'advisory.md'), githubDefaultBody);
    writeFileSync(join(dir, 'proposal.json'), JSON.stringify(githubDefaultProposal));
    const script = fileURLToPath(new URL('./check-draft.mjs', import.meta.url));
    const strict = spawnSync(process.execPath, [script, join(dir, 'advisory.md'), join(dir, 'proposal.json')], { encoding: 'utf8' });
    assert.equal(strict.status, 1);
    const lenient = spawnSync(process.execPath, [script, join(dir, 'advisory.md'), join(dir, 'proposal.json'), '--metadata-only'], { encoding: 'utf8' });
    assert.equal(lenient.status, 0, lenient.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
