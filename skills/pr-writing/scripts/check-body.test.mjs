import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBody, countSentences, countWords } from './check-body.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-body.mjs');
const small = 'Fixes #812\n\nRetrying a failed export left the job failed. Retry now clears the failure state first.\n';
const headed = summary => `Fixes #1\n\n## Summary\n\n${summary}\n\n## Evidence\n\nThe retry test fails without the change.\n`;

test('a short body without headings passes', () => {
  assert.deepEqual(checkBody(small, { title: 'fix(exports): start a new attempt on retry' }).errors, []);
});
test('the title limit counts the type prefix', () => {
  assert.deepEqual(checkBody(small, { title: 'x'.repeat(72) }).errors, []);
  assert.match(checkBody(small, { title: 'x'.repeat(73) }).errors[0], /73 characters/);
  assert.deepEqual(checkBody(small, { title: ' ' }).errors, ['Title is empty']);
});
test('the Summary allows three sentences or four bullets', () => {
  assert.deepEqual(checkBody(headed('One. Two. Three.')).errors, []);
  assert.match(checkBody(headed('One. Two. Three. Four.')).errors[0], /4 sentences/);
  assert.deepEqual(checkBody(headed('- One. More.\n- Two.\n- Three.\n- Four.')).errors, []);
  assert.match(checkBody(headed('- a\n- b\n- c\n- d\n- e')).errors[0], /5 bullets/);
});
test('sentence counting ignores code, link targets, and abbreviations', () => {
  assert.equal(countSentences('Set `a.b.c` first, e.g. in [the docs](https://example.com/a.b). Then retry?'), 2);
  assert.equal(countSentences('Version 1.7.2 fixes it'), 1);
});
test('words inside code blocks and comments do not count', () => {
  assert.equal(countWords('one two\n\n```diff\n- three four\n+ five\n```\n\n<!-- six -->\nseven — 8\n'), 4);
  const long = `${'word '.repeat(401)}\n`;
  assert.match(checkBody(long).errors[0], /401 words/);
  assert.deepEqual(checkBody(long, { maxWords: 500 }).errors, []);
});
test('empty and placeholder sections are reported', () => {
  assert.deepEqual(checkBody('## Summary\n\nOne.\n\n## Reviewer notes\n\n## Evidence\n\nN/A\n').errors, ['"Reviewer notes" is empty; delete the section', '"Evidence" says "N/A"; delete the section']);
  assert.deepEqual(checkBody('## Summary\n\nOne.\n\n## Solution\n\n### Tests\n\nThe retry test.\n').errors, []);
  assert.deepEqual(checkBody('## Summary\n\nOne.\n\n## Evidence\n\n```text\nok\n```\n').errors, []);
});
test('template comments are reported outside code blocks only', () => {
  assert.match(checkBody('<!-- Describe the change -->\nOne.\n').errors[0], /Template comment/);
  assert.deepEqual(checkBody('One.\n\n```html\n<!-- kept -->\n```\n').errors, []);
});
test('the command reports the word count or the errors', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-body-'));
  try {
    const file = join(dir, 'body.md');
    writeFileSync(file, small);
    const ok = spawnSync(process.execPath, [script, file, '--title', 'fix: retry'], { encoding: 'utf8' });
    assert.equal(ok.status, 0);
    assert.match(ok.stdout, /Body checks passed: \d+ words/);
    const long = spawnSync(process.execPath, [script, file, '--title', 'x'.repeat(80)], { encoding: 'utf8' });
    assert.equal(long.status, 1);
    assert.match(long.stderr, /80 characters/);
    assert.equal(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status, 1);
    assert.equal(spawnSync(process.execPath, [script, file, '--nope'], { encoding: 'utf8' }).status, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
