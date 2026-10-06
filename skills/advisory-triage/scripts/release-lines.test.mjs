import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseVersion, compareVersions, groupByLine, firstFixedPerLine, main } from './release-lines.mjs';

test('parseVersion reads plain, prefixed, and scoped tags', () => {
  assert.deepEqual(parseVersion('v1.7.0-beta.4'), { raw: 'v1.7.0-beta.4', pkg: null, major: 1, minor: 7, patch: 0, prerelease: 'beta.4' });
  assert.deepEqual(parseVersion('1.2.3'), { raw: '1.2.3', pkg: null, major: 1, minor: 2, patch: 3, prerelease: null });
  assert.deepEqual(parseVersion('widget@1.2.3'), { raw: 'widget@1.2.3', pkg: 'widget', major: 1, minor: 2, patch: 3, prerelease: null });
  assert.deepEqual(
    parseVersion('@example/widget@1.2.3-alpha.1'),
    { raw: '@example/widget@1.2.3-alpha.1', pkg: '@example/widget', major: 1, minor: 2, patch: 3, prerelease: 'alpha.1' },
  );
});

test('parseVersion rejects non-version tags', () => {
  for (const tag of ['', 'latest', 'release-notes', 'v1.2', 'v1.2.3.4']) assert.equal(parseVersion(tag), null);
});

test('compareVersions orders numeric fields, then prerelease precedence', () => {
  const v = (s) => parseVersion(s);
  assert.ok(compareVersions(v('1.2.3'), v('1.3.0')) < 0);
  assert.ok(compareVersions(v('1.3.0'), v('1.2.3')) > 0);
  assert.ok(compareVersions(v('1.2.3'), v('1.2.3')) === 0);
  assert.ok(compareVersions(v('1.2.3-alpha.1'), v('1.2.3')) < 0, 'a prerelease sorts before its release');
  assert.ok(compareVersions(v('1.2.3'), v('1.2.3-alpha.1')) > 0);
  assert.ok(compareVersions(v('1.2.3-alpha.4'), v('1.2.3-alpha.10')) < 0, 'numeric prerelease identifiers compare numerically');
  assert.ok(compareVersions(v('1.2.3-alpha'), v('1.2.3-alpha.1')) < 0, 'fewer prerelease fields sorts first');
  assert.ok(compareVersions(v('1.2.3-alpha.1'), v('1.2.3-beta.1')) < 0, 'alphanumeric identifiers compare lexically');
  assert.ok(compareVersions(v('1.2.3-1'), v('1.2.3-alpha')) < 0, 'numeric identifiers sort before alphanumeric ones');
});

test('groupByLine buckets stable releases by major.minor and pre-releases by major.minor.patch-id', () => {
  const tags = ['v1.7.0', 'v1.7.3', 'v1.8.0', 'v1.8.0-alpha.1', 'v1.8.0-alpha.2', 'v1.8.0-beta.1'];
  const groups = groupByLine(tags.map(parseVersion));
  assert.deepEqual(Object.keys(groups).sort(), ['1.7', '1.8', '1.8.0-alpha', '1.8.0-beta'].sort());
  assert.equal(groups['1.7'].length, 2);
  assert.equal(groups['1.8.0-alpha'].length, 2);
  assert.equal(groups['1.8.0-alpha'][0].raw, 'v1.8.0-alpha.1');
});

test('firstFixedPerLine returns the earliest tag per line in semver order', () => {
  const tags = ['v1.7.3', 'v1.7.1', 'v1.7.2', 'v1.8.0-beta.2', 'v1.8.0-beta.1', 'v2.0.0'];
  const result = firstFixedPerLine(tags.map(parseVersion));
  assert.deepEqual(Object.fromEntries(Object.entries(result).map(([line, v]) => [line, v.raw])), {
    '1.7': 'v1.7.1',
    '1.8.0-beta': 'v1.8.0-beta.1',
    '2.0': 'v2.0.0',
  });
});

test('main reports the first fixed tag per line, including a backport found by PR number', () => {
  const repo = mkdtempSync(join(realpathSync(tmpdir()), 'release-lines-test-'));
  const git = (...args) => execFileSync('git', ['-C', repo, '-c', 'user.name=synthetic', '-c', 'user.email=synthetic@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args], { encoding: 'utf8' }).trim();
  const commit = (message, tag) => { git('commit', '-q', '--no-verify', '--allow-empty', '-m', message); if (tag) git('tag', tag); return git('rev-parse', 'HEAD'); };
  try {
    git('init', '-q');
    commit('chore: base', 'v1.0.0');
    commit('feat: synthetic feature', 'v1.1.0-beta.1');
    const fix = commit('fix: synthetic guard (#12)', 'v1.1.0-beta.2');
    commit('chore: release', 'v1.1.0');
    git('checkout', '-q', '-b', 'release-1.0', 'v1.0.0');
    commit('fix: synthetic guard (#12)', 'v1.0.1');
    assert.equal(main(['--repo', repo, '--commit', fix], () => assert.fail('registry must not be read without --package')), '1.1.0-beta: v1.1.0-beta.2\n1.1: v1.1.0\nA line not listed has no release tag containing these commits; check whether it is affected or needs a backport.');
    const registry = name => { assert.equal(name, 'example-lib'); return ['1.0.0', '1.0.1', '1.1.0-beta.1', '1.1.0-beta.2']; };
    assert.deepEqual(main(['--repo', repo, '--pr', '12', '--package', 'example-lib'], registry).split('\n').slice(0, 4), ['1.0: v1.0.1 (published)', '1.1.0-beta: v1.1.0-beta.2 (published)', '  affected pre-releases: 1.1.0-beta.1', '1.1: v1.1.0 (unpublished)']);
    assert.throws(() => main(['--repo', repo, '--pr', '99']), /No commit found/);
    assert.throws(() => main(['--repo', repo, '--pr', '12|.*']), /Invalid PR number/);
    assert.throws(() => main(['--repo', repo]), /Usage/);
    assert.throws(() => main(['--repo', repo, '--commit', fix, '--force']), /Unknown option/);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test('the command prints usage and fails without arguments', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('./release-lines.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /^Usage: node release-lines\.mjs/);
});
