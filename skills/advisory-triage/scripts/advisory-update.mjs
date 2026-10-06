#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseVector } from './cvss.mjs';

const usage = 'Usage: node advisory-update.mjs OWNER/REPO GHSA-ID --fields fields.json --evidence DIR [--apply]';
const creditTypes = ['analyst', 'finder', 'reporter', 'coordinator', 'remediation_developer', 'remediation_reviewer', 'remediation_verifier', 'tool', 'sponsor', 'other'];
const derived = { cvss_vector_string: ['severity', 'cvss', 'cvss_severities'], cwe_ids: ['cwes'], credits: ['credits_detailed'] };
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const text = v => typeof v === 'string' && v.trim() !== '';
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const stable = v => Array.isArray(v) ? v.map(stable) : object(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
const canonical = v => JSON.stringify(stable(v ?? null));
const markdown = v => String(v ?? '').replace(/\r/g, '').replace(/[ \t]+$/gm, '').trimEnd();
const setOf = (list, key) => JSON.stringify((list ?? []).map(key).sort());
const vulnerabilityKey = v => JSON.stringify([v.package?.ecosystem, v.package?.name, v.vulnerable_version_range, v.patched_versions || null]);
const creditKey = c => JSON.stringify([String(c.login).toLowerCase(), c.type]);
const unique = (list, key, message) => { assert(new Set(list.map(key)).size === list.length, message); return list; };
const show = v => typeof v === 'string' ? v : JSON.stringify(v, null, 2);

const normalize = {
  summary: v => { assert(text(v), 'summary must be nonempty text'); return v.trim(); },
  description: v => { assert(text(v), 'description must be nonempty text'); return v; },
  cvss_vector_string: v => { parseVector(v); return v; },
  cwe_ids: v => {
    assert(Array.isArray(v) && v.length && v.every(c => /^CWE-\d+$/.test(c)), 'cwe_ids must be a nonempty list of CWE-<number> IDs');
    return unique(v, String, 'Duplicate CWE IDs');
  },
  vulnerabilities: list => {
    assert(Array.isArray(list) && list.length, 'vulnerabilities must list every affected package; the update replaces the whole collection');
    return unique(list.map(v => {
      assert(object(v) && object(v.package) && text(v.package.ecosystem) && text(v.package.name) && text(v.vulnerable_version_range), 'Each vulnerability needs package.ecosystem, package.name, and vulnerable_version_range');
      assert(v.patched_versions == null || typeof v.patched_versions === 'string', 'patched_versions must be a range or null');
      assert(!v.vulnerable_functions?.length, 'vulnerable_functions are not supported');
      const range = v.vulnerable_version_range.trim(), patched = v.patched_versions?.trim() || null;
      assert(!range.includes('<') || patched, `Closed range ${range} needs patched_versions; an unfixed range stays open-ended`);
      return { package: { ecosystem: v.package.ecosystem.trim(), name: v.package.name.trim() }, vulnerable_version_range: range, patched_versions: patched, vulnerable_functions: [] };
    }), vulnerabilityKey, 'Duplicate vulnerability entries');
  },
  credits: list => {
    assert(Array.isArray(list) && list.every(c => object(c) && text(c.login) && creditTypes.includes(c.type)), `credits must be a list of { login, type } with type one of ${creditTypes.join(', ')}`);
    return unique(list.map(c => ({ login: c.login.trim(), type: c.type })), creditKey, 'Duplicate credits');
  },
};
const same = {
  summary: (a, b) => a === b,
  description: (a, b) => markdown(a) === markdown(b),
  cvss_vector_string: (a, b) => a === b,
  cwe_ids: (a, b) => setOf(a, String) === setOf(b, String),
  vulnerabilities: (a, b) => setOf(a, vulnerabilityKey) === setOf(b, vulnerabilityKey),
  credits: (a, b) => setOf(a, creditKey) === setOf(b, creditKey),
};
const current = (advisory, field) => field === 'cvss_vector_string' ? advisory.cvss_severities?.cvss_v3?.vector_string ?? advisory.cvss?.vector_string ?? null : advisory[field] ?? null;

export function buildPayload(fields) {
  assert(object(fields) && Object.keys(fields).length, 'Fields must be a nonempty JSON object');
  assert(!('severity' in fields), 'Do not send severity; GitHub derives it from cvss_vector_string');
  for (const key of Object.keys(fields)) assert(key in normalize, `Field is outside the update scope: ${key}`);
  return Object.fromEntries(Object.entries(fields).map(([field, value]) => [field, normalize[field](value)]));
}

export function planDiff(advisory, payload) {
  return Object.entries(payload).map(([field, proposed]) => {
    const value = current(advisory, field);
    return { field, current: value, proposed, changed: !same[field](value, proposed) };
  });
}

function unexpectedChanges(before, after, requested = []) {
  const expected = new Set(['updated_at', ...requested.flatMap(field => [field, ...(derived[field] ?? [])])]);
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => !expected.has(key) && canonical(before[key]) !== canonical(after[key]));
}

export function verifyAfter(before, after, patch) {
  const errors = Object.entries(patch).filter(([field, value]) => !same[field](current(after, field), value)).map(([field]) => `${field} does not match the requested value`);
  return [...errors, ...unexpectedChanges(before, after, Object.keys(patch)).map(key => `${key} changed without being requested`)];
}

const api = (args, input) => JSON.parse(execFileSync('gh', ['api', ...args], { encoding: 'utf8', input, maxBuffer: 16 * 1024 * 1024 }));

export function main(argv = process.argv.slice(2), gh = api) {
  const { values: o, positionals: [repo, id, ...extra] } = parseArgs({ args: argv, allowPositionals: true, options: { fields: { type: 'string' }, evidence: { type: 'string' }, apply: { type: 'boolean', default: false } } });
  assert(/^[\w.-]+\/[\w.-]+$/.test(repo ?? '') && /^GHSA(?:-[23456789cfghjmpqrvwx]{4}){3}$/i.test(id ?? '') && !extra.length && o.fields && o.evidence, usage);
  const payload = buildPayload(JSON.parse(readFileSync(o.fields, 'utf8')));
  const file = name => join(o.evidence, name);
  const load = name => { assert(existsSync(file(name)), `${file(name)} is missing. Run the dry run into ${o.evidence} and review it before applying.`); return JSON.parse(readFileSync(file(name), 'utf8')); };
  const save = (name, value, flag) => writeFileSync(file(name), `${JSON.stringify(value, null, 2)}\n`, { flag, mode: 0o600 });
  assert(!existsSync(file('after.json')), `${o.evidence} already records an applied update; use a new evidence directory.`);
  const reviewed = o.apply && { baseline: load('baseline.json'), payload: load('payload.json') };
  if (reviewed) assert(String(reviewed.baseline?.html_url).toLowerCase().endsWith(`/${repo}/security/advisories/${id}`.toLowerCase()), `${file('baseline.json')} is a dry run of ${reviewed.baseline?.html_url ?? 'an unidentified advisory'}, not ${repo} ${id}.`);
  const path = `repos/${repo}/security-advisories/${id}`;
  const before = gh(['--method', 'GET', path]);
  if (reviewed) {
    const drift = unexpectedChanges(reviewed.baseline, before);
    assert(!drift.length, `${id} changed since the reviewed dry run: ${drift.join(', ')}. Review the concurrent change, then run and review a new dry run before applying.`);
  }
  const diff = planDiff(before, payload);
  const lines = diff.map(d => d.changed ? `## ${d.field}: change\n--- current\n${show(d.current)}\n+++ proposed\n${show(d.proposed)}` : `## ${d.field}: unchanged`);
  const patch = Object.fromEntries(diff.filter(d => d.changed).map(d => [d.field, payload[d.field]]));
  const empty = !Object.keys(patch).length;
  if (!o.apply) {
    mkdirSync(o.evidence, { recursive: true, mode: 0o700 });
    save('baseline.json', before, 'w');
    save('payload.json', patch, 'w');
    return [...lines, empty ? `No field changes; nothing to apply. Saved baseline.json and an empty payload.json in ${o.evidence}.` : `Dry run: no remote change. Saved baseline.json and payload.json in ${o.evidence}. Once this payload is approved, re-run with --apply and the same --evidence directory.`].join('\n');
  }
  assert(canonical(patch) === canonical(reviewed.payload), `${o.fields} no longer produces the reviewed ${file('payload.json')}. Run and review a new dry run before applying.`);
  if (empty) return [...lines, 'No field changes; nothing to apply.'].join('\n');
  try { gh(['--method', 'PATCH', path, '--input', '-'], JSON.stringify(reviewed.payload)); }
  catch (error) { throw new Error(`Update request failed with an uncertain result; re-fetch ${id} before retrying. ${error.message}`); }
  const after = gh(['--method', 'GET', path]);
  save('after.json', after, 'wx');
  const errors = verifyAfter(before, after, patch);
  assert(!errors.length, `Verification failed for ${id}:\n${errors.join('\n')}\nEvidence: ${o.evidence}`);
  return [...lines, `Updated and verified ${Object.keys(patch).join(', ')} on ${after.html_url ?? id}. Evidence: ${o.evidence}`].join('\n');
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try { console.log(main()); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
