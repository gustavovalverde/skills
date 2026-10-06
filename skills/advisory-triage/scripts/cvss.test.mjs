import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cvssScore } from './cvss.mjs';

test('base scores match the CVSS 3.1 specification calculator', () => {
  const cases = {
    'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N': [9.1, 'Critical'],
    'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N': [7.4, 'High'],
    'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L': [8.3, 'High'],
    'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N': [7.1, 'High'],
    'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:L/I:N/A:N': [5.0, 'Medium'],
    'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H': [10.0, 'Critical'],
    'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N': [0, 'None'],
    'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N': [3.7, 'Low'],
  };
  for (const [vector, [score, severity]] of Object.entries(cases)) assert.deepEqual(cvssScore(vector), { score, severity }, vector);
});

test('malformed, partial, and version-mismatched vectors are rejected', () => {
  for (const vector of ['', 'CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H', 'CVSS:3.1/AC:L/AV:N/PR:N/UI:N/S:U/C:H/I:H/A:N', 'CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N']) {
    assert.throws(() => cvssScore(vector), vector);
  }
});

test('every worked example in the scoring rubric states its computed score', () => {
  const rubric = readFileSync(new URL('../references/scoring.md', import.meta.url), 'utf8');
  const rows = [...rubric.matchAll(/`(CVSS:3\.1\/[^`]+)` \| (\d+\.\d) (\w+) \|/g)];
  assert.ok(rows.length >= 10);
  for (const [, vector, score, severity] of rows) assert.deepEqual(cvssScore(vector), { score: Number(score), severity }, vector);
});
