#!/usr/bin/env node
// Read-only. Runs the draft rules over live advisories; makes no remote writes.
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';

import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkDraft, draftWarnings } from './check-draft.mjs';

const usage = 'Usage: node audit-advisories.mjs OWNER/REPO [--state draft,published] [GHSA-ID ...] [--metadata-only] [--json]';
const ghsaPattern = /^GHSA(?:-[23456789cfghjmpqrvwx]{4}){3}$/i;
const assert = (ok, message) => { if (!ok) throw new Error(message); };

function affectedCweIds(advisory) {
  return advisory.cwe_ids ?? advisory.cwes?.map(c => c.cwe_id);
}
function vectorString(advisory) {
  return advisory.cvss_vector_string ?? advisory.cvss_severities?.cvss_v3?.vector_string ?? advisory.cvss?.vector_string ?? advisory.cvss_severities?.cvss_v4?.vector_string;
}
function affectedVulnerabilities(advisory) {
  // GitHub reports an unset patched version as an empty string.
  return Array.isArray(advisory.vulnerabilities) && advisory.vulnerabilities.length ? advisory.vulnerabilities.map(v => ({ ...v, patched_versions: v.patched_versions || null })) : undefined;
}

export function auditAdvisory(advisory, { editorial = true } = {}) {
  const body = advisory.description ?? '';
  const proposal = { summary: advisory.summary, vulnerabilities: affectedVulnerabilities(advisory), cwe_ids: affectedCweIds(advisory), cvss_vector_string: vectorString(advisory) };
  const errors = checkDraft(body, proposal, { editorial });
  if (editorial && advisory.cve_id && body.includes(advisory.cve_id)) errors.push(`Body restates the advisory's own CVE ID ${advisory.cve_id}; the CVE assignment carries it`);
  return { id: advisory.ghsa_id ?? 'unknown', state: advisory.state ?? 'unknown', errors, warnings: draftWarnings(body, { editorial }) };
}

export function report(results, json) {
  const errors = results.reduce((n, r) => n + r.errors.length, 0);
  const warnings = results.reduce((n, r) => n + r.warnings.length, 0);
  if (json) return { text: JSON.stringify({ advisories: results, summary: { advisories: results.length, errors, warnings } }, null, 2), errors };
  const lines = results.map(r => [`${r.id} (${r.state}): ${r.errors.length} error(s), ${r.warnings.length} warning(s)`, ...r.errors.map(e => `  Error: ${e}`), ...r.warnings.map(w => `  Warning: ${w}`)].join('\n'));
  lines.push(`Audited ${results.length} advisor${results.length === 1 ? 'y' : 'ies'}: ${errors} error(s), ${warnings} warning(s).`);
  return { text: lines.join('\n'), errors };
}

const api = args => JSON.parse(execFileSync('gh', ['api', ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
const advisoryStates = new Set(['triage', 'draft', 'published', 'closed']);
// Request each state from the API so a published-only audit never downloads private reports.
const listAdvisories = (repo, states, gh) => [...states].flatMap(state => gh(['--paginate', '--slurp', `repos/${repo}/security-advisories?state=${state}&per_page=100`]).flat()).filter(a => states.has(a.state));
const fetchAdvisory = (repo, id, gh) => gh(['--method', 'GET', `repos/${repo}/security-advisories/${id.toUpperCase()}`]);

export function main(argv = process.argv.slice(2), gh = api) {
  if (argv.includes('--help') || argv.includes('-h')) return { text: usage, errors: 0 };
  const { values: o, positionals: [repo, ...ids] } = parseArgs({ args: argv, allowPositionals: true, options: { state: { type: 'string' }, json: { type: 'boolean', default: false }, 'metadata-only': { type: 'boolean', default: false } } });
  assert(/^[\w.-]+\/[\w.-]+$/.test(repo ?? ''), usage);
  for (const id of ids) assert(ghsaPattern.test(id), `Invalid GHSA ID: ${id}`);
  const states = new Set((o.state ?? 'draft,published').split(',').map(s => s.trim()).filter(Boolean));
  for (const state of states) assert(advisoryStates.has(state), `Unknown advisory state: ${state}. Use ${[...advisoryStates].join(', ')}`);
  const advisories = ids.length ? ids.map(id => fetchAdvisory(repo, id, gh)) : listAdvisories(repo, states, gh);
  const editorial = !o['metadata-only'];
  return report(advisories.map(a => auditAdvisory(a, { editorial })), o.json);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const { text, errors } = main();
    console.log(text);
    if (errors) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
