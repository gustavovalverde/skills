import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide } from './gh-pr-hook.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'gh-pr-hook.mjs');
const dir = mkdtempSync(join(tmpdir(), 'gh-pr-hook-'));
mkdirSync(join(dir, 'sub'));
writeFileSync(join(dir, 'ok.md'), 'Fixes #1\n\nRetry now clears the failure state first.\n');
writeFileSync(join(dir, 'sub', 'ok.md'), 'Retry now clears the failure state first.\n');
writeFileSync(join(dir, 'long.md'), `${'word '.repeat(450)}\n`);
test.after(() => rmSync(dir, { recursive: true, force: true }));

const run = (command, options) => decide({ tool_input: { command }, cwd: dir }, options);
const G = 'gh pr';

test('a body within the limits is allowed with its word count', () => {
  const result = run(`${G} create --title "fix: retry" --body-file ok.md`, { note: 'Team note.' });
  assert.equal(result.decision, 'allow');
  assert.match(result.text, /^Body checks passed: \d+ words outside code blocks\. Team note\.$/);
});
test('a long body or title is denied with the limit it broke', () => {
  assert.match(run(`cd /tmp && ${G} edit 35 --body-file ${join(dir, 'long.md')}`).text, /450 words/);
  const title = run(`${G} create -t '${'x'.repeat(80)}' -F ok.md`);
  assert.equal(title.decision, 'deny');
  assert.match(title.text, /80 characters/);
});
test('PR_BODY_MAX_WORDS raises the word limit', () => {
  assert.equal(run(`PR_BODY_MAX_WORDS=500 ${G} edit 35 --body-file long.md`).decision, 'allow');
});
test('an inline body is denied, also across continuation lines', () => {
  const result = run(`${G} create \\\n  --title "fix: x" \\\n  --body "inline"`);
  assert.equal(result.decision, 'deny');
  assert.match(result.text, /--body-file/);
  assert.equal(run(`${G} edit 35 -b text`).decision, 'deny');
});
test('a body file that does not exist yet is denied', () => {
  const result = run(`cat > new.md <<EOF\ntext\nEOF\n${G} create --body-file new.md`);
  assert.equal(result.decision, 'deny');
  assert.match(result.text, /new\.md does not exist yet/);
});
test('a relative path resolves against an earlier cd', () => {
  assert.equal(run(`cd ${join(dir, 'sub')} && ${G} create --body-file ok.md`).decision, 'allow');
  assert.equal(run(`cd "${join(dir, 'sub')}"; ${G} create --body-file=ok.md`).decision, 'allow');
});
test('flags of a later command are not read', () => {
  assert.equal(run(`${G} create --body-file ok.md && echo --body x`).decision, 'allow');
  assert.equal(run(`${G} create --body-file ok.md; other --title ${'x'.repeat(90)}`).decision, 'allow');
});
test('a body on standard input is allowed unchecked', () => {
  assert.deepEqual(run(`cat ok.md | ${G} create --body-file -`, { note: 'Note.' }), { decision: 'allow', text: 'Note.' });
});
test('commands that post no body are ignored', () => {
  for (const command of [`${G} edit 35 --title "fix: x"`, `${G} view 35 --json body`, `echo '${G} create --body x'`, `git commit -m "docs: explain ${G} create --body usage"`, 'ls', '']) {
    assert.equal(run(command), undefined, command);
  }
  assert.equal(decide({}), undefined);
});
test('the command prints a hook decision and stays silent otherwise', () => {
  const call = (command, args = []) => spawnSync(process.execPath, [script, ...args], { input: JSON.stringify({ tool_input: { command }, cwd: dir }), encoding: 'utf8' });
  const denied = JSON.parse(call(`${G} create --body-file long.md`).stdout).hookSpecificOutput;
  assert.equal(denied.permissionDecision, 'deny');
  assert.match(denied.permissionDecisionReason, /450 words/);
  const allowed = JSON.parse(call(`${G} create --body-file ok.md`, ['--note', 'Note.']).stdout).hookSpecificOutput;
  assert.equal(allowed.permissionDecision, 'allow');
  assert.match(allowed.additionalContext, /Note\.$/);
  assert.equal(call('ls').stdout, '');
  const broken = spawnSync(process.execPath, [script], { input: 'not json', encoding: 'utf8' });
  assert.equal(broken.status, 0);
  assert.equal(broken.stdout, '');
});
