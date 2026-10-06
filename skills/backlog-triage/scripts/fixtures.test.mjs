import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const fixturePath = new URL('./fixtures/triage-batch.json', import.meta.url);
const evaluatorOnlyKeys = new Set(['expected', 'answer', 'verdict', 'rationale', 'scoring']);

function validateFixture(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ['fixture must be an object'];
  if (input.synthetic !== true) errors.push('synthetic must be true');
  if (!Array.isArray(input.groups) || input.groups.length === 0) return [...errors, 'groups must be a nonempty array'];

  const groupIds = new Set();
  const memberNumbers = new Set();
  for (const [index, group] of input.groups.entries()) {
    const label = `group ${index + 1}`;
    if (!group || typeof group !== 'object' || Array.isArray(group)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    if (typeof group.id !== 'string' || group.id.trim() === '') {
      errors.push(`${label} id must be nonempty text`);
    } else if (groupIds.has(group.id)) {
      errors.push(`duplicate group id ${group.id}`);
    } else {
      groupIds.add(group.id);
    }

    for (const key of ['issues', 'pull_requests']) {
      if (!Array.isArray(group[key])) {
        errors.push(`${label} ${key} must be an array`);
        continue;
      }
      for (const [memberIndex, member] of group[key].entries()) {
        if (!member || typeof member !== 'object' || Array.isArray(member)) {
          errors.push(`${label} ${key}[${memberIndex}] must be an object`);
          continue;
        }
        if (!Number.isInteger(member.number) || member.number <= 0) {
          errors.push(`${label} ${key}[${memberIndex}] number must be a positive integer`);
        } else if (memberNumbers.has(member.number)) {
          errors.push(`duplicate member number ${member.number}`);
        } else {
          memberNumbers.add(member.number);
        }
      }
    }

    const hasMembers = ['issues', 'pull_requests'].some(key => Array.isArray(group[key]) && group[key].length > 0);
    if (!hasMembers && (typeof group.intake !== 'string' || group.intake.trim() === '')) {
      errors.push(`${label} with no issue or PR needs a nonempty intake request`);
    }
  }

  function inspectKeys(value, path = 'fixture') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => inspectKeys(item, `${path}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (evaluatorOnlyKeys.has(key.toLowerCase())) errors.push(`${path} contains evaluator-only key ${key}`);
      inspectKeys(child, `${path}.${key}`);
    }
  }
  inspectKeys(input);
  return errors;
}

test('triage batch is synthetic, structurally isolated, and has stable identities', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  assert.deepEqual(validateFixture(fixture), []);
});

test('fixture validation rejects invalid identities, shapes, and evaluator data', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  const invalidCases = [
    ['empty group id', data => { data.groups[0].id = '  '; }, /id must be nonempty text/],
    ['duplicate group id', data => { data.groups[1].id = data.groups[0].id; }, /duplicate group id/],
    ['non-array issue list', data => { data.groups[0].issues = {}; }, /issues must be an array/],
    ['non-array PR list', data => { data.groups[0].pull_requests = null; }, /pull_requests must be an array/],
    ['duplicate issue and PR number', data => { data.groups[0].pull_requests.push({ number: data.groups[0].issues[0].number }); }, /duplicate member number/],
    ['non-positive member number', data => { data.groups[0].issues[0].number = 0; }, /positive integer/],
    ['evaluator-only nested key', data => { data.groups[0].comments = [{ rationale: 'hidden' }]; }, /evaluator-only key rationale/],
    ['empty intake request', data => { data.groups.push({ id: 'empty-intake', issues: [], pull_requests: [], intake: '  ' }); }, /nonempty intake request/],
  ];

  for (const [name, mutate, expected] of invalidCases) {
    const invalid = structuredClone(fixture);
    mutate(invalid);
    assert.match(validateFixture(invalid).join('\n'), expected, name);
  }
});
