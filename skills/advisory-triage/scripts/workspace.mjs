#!/usr/bin/env node
// Local record tooling. No remote writes, reporter-code execution, or product changes.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const assets = resolve(dirname(fileURLToPath(import.meta.url)), '../assets');
export const schema = JSON.parse(fs.readFileSync(join(assets, 'case.schema.json'), 'utf8'));
export const template = () => JSON.parse(fs.readFileSync(join(assets, 'case.template.json'), 'utf8'));
export const CASE_SCHEMA_VERSION = schema.properties.schema_version.const;
export const QUEUE_SCHEMA_VERSION = 'advisory-queue/v1';
// Identifiers and values written before the skill became repository-agnostic; records and queues that carry them stay readable.
export const LEGACY_ALIASES = {
  caseSchema: /^[a-z0-9]+(?:-[a-z0-9]+)*-advisory-case\/v2$/,
  queueSchema: /^[a-z0-9]+(?:-[a-z0-9]+)*-queue\/v1$/,
  branchStates: { fixed_on_next: 'fixed_on_prerelease', next_only_regression: 'prerelease_only_regression' },
};
const currentVocabulary = c => {
  if (c === null || typeof c !== 'object' || Array.isArray(c)) return c;
  const upgraded = LEGACY_ALIASES.caseSchema.test(c.schema_version ?? '') ? { ...c, schema_version: CASE_SCHEMA_VERSION } : c;
  const modern = x => x !== null && typeof x === 'object' && Object.hasOwn(LEGACY_ALIASES.branchStates, x.branch_state) ? { ...x, branch_state: LEGACY_ALIASES.branchStates[x.branch_state] } : x;
  return Array.isArray(upgraded.claims) ? { ...upgraded, claims: upgraded.claims.map(modern) } : upgraded;
};
const now = () => new Date().toISOString();
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const stable = v => Array.isArray(v) ? v.map(stable) : object(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
export const digest = v => createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const idCheck = id => assert(/^[a-z0-9][a-z0-9-]+$/.test(id || ''), 'Invalid case ID');
const ghsaCheck = id => assert(/^ghsa(?:-[23456789cfghjmpqrvwx]{4}){3}$/.test(id), 'Expected a GHSA case ID');
const time = v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v));

// Implements only the JSON Schema vocabulary used by the bundled contract.
// Unknown keywords fail closed so a schema extension cannot silently lose validation.
export function structural(value, rule = schema, path = '$') {
  const errors = [];
  const fail = text => errors.push(`${path}: ${text}`);
  const known = new Set(['$schema', '$id', 'title', 'description', '$defs', '$ref', 'type', 'const', 'enum', 'required', 'properties', 'additionalProperties', 'allOf', 'if', 'then', 'oneOf', 'items', 'minItems', 'minLength', 'pattern', 'format', 'minimum', 'maximum']);
  for (const key of Object.keys(rule)) if (!known.has(key)) fail(`unsupported schema keyword ${key}`);
  if (rule.$ref) {
    assert(rule.$ref.startsWith('#/$defs/'), 'Only bundled definitions are supported');
    errors.push(...structural(value, schema.$defs[rule.$ref.slice(8)], path));
  }
  if (rule.type) {
    const kind = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    if (![rule.type].flat().includes(kind)) { fail(`expected ${rule.type}`); return errors; }
  }
  if ('const' in rule && value !== rule.const) fail('unexpected constant');
  if (rule.enum && !rule.enum.includes(value)) fail(`unknown value ${String(value)}`);
  if (rule.oneOf && rule.oneOf.filter(r => !structural(value, r, path).length).length !== 1) fail('must match exactly one allowed shape');
  for (const r of rule.allOf || []) errors.push(...structural(value, r, path));
  if (rule.if && !structural(value, rule.if, path).length) errors.push(...structural(value, rule.then, path));
  if (object(value)) {
    for (const k of rule.required || []) if (!(k in value)) fail(`missing ${k}`);
    for (const [k, v] of Object.entries(value)) {
      if (rule.properties?.[k]) errors.push(...structural(v, rule.properties[k], `${path}.${k}`));
      else if (rule.additionalProperties === false) fail(`unknown field ${k}`);
    }
  }
  if (Array.isArray(value)) {
    if (value.length < (rule.minItems || 0)) fail('too few items');
    if (rule.items) value.forEach((v, i) => errors.push(...structural(v, rule.items, `${path}[${i}]`)));
  }
  if (typeof value === 'string') {
    if (value.trim().length < (rule.minLength || 0)) fail('empty or too short');
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) fail('invalid pattern');
    if (rule.format === 'date-time' && !time(value)) fail('invalid timestamp');
    if (rule.format === 'uri') { try { new URL(value); } catch { fail('invalid URI'); } }
  }
  if (typeof value === 'number' && (!Number.isFinite(value) || value < (rule.minimum ?? -Infinity) || value > (rule.maximum ?? Infinity))) fail('number out of bounds');
  return errors;
}

const publishedBaseline = c => c.source.github_state === 'published' && c.github_snapshot.before.state === 'published';
export function validate(c, { ready = false, publicationCheck = false } = {}) {
  const errors = structural(currentVocabulary(c));
  if (errors.length) return errors;
  const check = (ok, message) => { if (!ok) errors.push(message); };
  const scan = v => {
    if (object(v)) {
      check(!('severity' in v && 'cvss_vector_string' in v), 'severity and cvss_vector_string are mutually exclusive');
      Object.values(v).forEach(scan);
    } else if (Array.isArray(v)) v.forEach(scan);
  };
  scan(c);
  const r = c.repository;
  check((r.prerelease_ref === null) === (r.prerelease_sha === null), 'Prerelease ref and SHA must both be set or absent');
  check(new Set(c.claims.map(x => x.claim_id)).size === c.claims.length, 'Duplicate claim IDs');
  for (const claim of c.claims) {
    const label = claim.claim_id;
    if (claim.technical_verdict === 'unresolved') check(claim.proof_gaps.length > 0, `${label}: unresolved requires a proof gap`);
    if (claim.disposition === 'accept' && c.process_version !== '2.0.0') {
      check(claim.technical_verdict === 'confirmed' && claim.product_contract?.contract_violated === true, `${label}: accept requires a confirmed violated product contract`);
      const contract = claim.product_contract;
      if (contract) check(!['delivery', 'lifecycle', 'production_support'].some(k => contract[k] === 'unknown') && contract.default_enabled !== null, `${label}: acceptance requires resolved support and configuration`);
    }
    if (claim.disposition === 'close_duplicate') check(c.duplicate_assessment.candidate_ids.length > 0, `${label}: duplicate requires a canonical candidate`);
    if (claim.cvss_v3_1.vector !== null || claim.cvss_v3_1.score !== null) check(claim.technical_verdict === 'confirmed' && (c.process_version === '2.0.0' || claim.product_contract?.contract_violated === true), `${label}: CVSS requires an established security failure`);
    if (ready && claim.technical_verdict !== 'unresolved') check(claim.evidence.length > 0, `${label}: a resolved verdict requires evidence`);
  }
  if (c.process_version === '2.2.0') {
    if (c.claims.some(x => x.technical_verdict === 'unresolved' && x.disposition === 'clarify')) check(c.overall_disposition === 'clarify', 'Unresolved material claims require a provisional clarify rollup');
    else if (c.claims.some(x => x.disposition === 'accept')) check(c.overall_disposition === 'accept', 'Accepted claim must survive report rollup');
    if (c.overall_disposition === 'close_duplicate') check(c.claims.every(x => x.disposition === 'close_duplicate'), 'Whole-report duplicate closure requires coverage of every claim');
  }
  const pair = c.github_snapshot;
  if (pair.unchanged !== null) {
    check(pair.after !== null, 'Snapshot comparison requires after snapshot');
    if (pair.after) check(pair.unchanged === ['state', 'updated_at', 'metadata_digest'].every(k => pair.before[k] === pair.after[k]), 'Snapshot comparison contradicts its evidence');
  }
  const p = c.post_triage;
  // An observed publication is history, not a newly authorized workflow transition.
  const enforcePublication = publicationCheck || !publishedBaseline(c);
  if (enforcePublication && (p.advisory_published_at || publicationCheck) && !p.disclosure_exception) {
    const cutoff = Date.parse(p.advisory_published_at || now());
    for (const k of ['fix_merged_at', 'public_branch_verified_at', 'package_released_at', 'metadata_completed_at']) check(p[k] !== null && Date.parse(p[k]) <= cutoff, `Publication requires prior ${k}, or an explicit policy-based disclosure exception`);
  }
  if (p.disclosure_exception && p.advisory_published_at) check(Date.parse(p.disclosure_exception.approved_at) <= Date.parse(p.advisory_published_at), 'Disclosure exception must precede publication');
  // A pre-disclosure fix may predate acceptance; CVE reservation is independently authorized.
  if (enforcePublication) for (const [before, after] of [['fix_merged_at', 'public_branch_verified_at'], ['public_branch_verified_at', 'package_released_at']]) if (p[before] && p[after]) check(Date.parse(p[before]) <= Date.parse(p[after]), `${after} precedes ${before}`);
  if (ready) {
    check(['awaiting_clarification', 'awaiting_maintainer_decision', 'terminal'].includes(c.case_status), 'Finish or explicitly pause assessment before review-ready validation');
    check(c.process_version === '2.2.0', 'Legacy record: preserve a checkpoint, then explicitly adopt process 2.2.0');
    check(Boolean(c.continuity?.owner), 'A review-ready record needs an owner');
    check(!/^0+$/.test(r.stable_sha) && (r.prerelease_sha === null || !/^0+$/.test(r.prerelease_sha)), 'Replace placeholder revisions');
    check(Date.parse(c.last_triaged_at) >= Date.parse(c.source.updated_at), 'Source is newer than the assessment');
    check(pair.after !== null, 'Review-ready assessment requires a final GitHub snapshot');
    check(!/^0+$/.test(pair.before.metadata_digest), 'Replace placeholder snapshot digest');
    check(c.duplicate_assessment.queries.length > 0, 'Record the prior-work search or its access limitations');
    check(!/Replace with|State what|State the security|Complete the product-contract|Explain why this is an advisory/.test(JSON.stringify(c)), 'Replace scaffold guidance before review');
  }
  return errors;
}

export function drift(c, observation) {
  const seen = observation.snapshot.state, warnings = [];
  for (const [field, state] of [['source.github_state', c.source.github_state], ['github_snapshot.after.state', c.github_snapshot.after?.state]]) if (state && state !== seen) warnings.push(`${field} is ${state}, but GitHub reported ${seen}`);
  const requested = c.post_triage.metadata_request?.cvss_vector_string, vector = observation.advisory.cvss_severities?.cvss_v3?.vector_string ?? observation.advisory.cvss?.vector_string ?? null;
  if (requested && requested !== vector) warnings.push(`post_triage.metadata_request.cvss_vector_string is ${requested}, but GitHub reported ${vector ?? 'no CVSS 3.1 vector'}`);
  return warnings;
}

function noLinks(path) {
  let at = resolve(path);
  while (true) {
    if (fs.existsSync(at)) assert(!fs.lstatSync(at).isSymbolicLink(), `Refusing symlink: ${at}`);
    const parent = dirname(at); if (parent === at) break; at = parent;
  }
}
function writeNew(path, content) {
  noLinks(path);
  fs.writeFileSync(path, content, { flag: 'wx', mode: 0o600 });
}
function privateWorkspace(root, repo = resolve(root, '../..')) {
  assert(root === join(repo, '.notes/advisories'), 'Workspace must be REPO/.notes/advisories');
  assert(!execFileSync('git', ['-C', repo, 'ls-files', '--', '.notes/advisories'], { encoding: 'utf8' }).trim(), 'Case workspace contains tracked files');
  try { execFileSync('git', ['-C', repo, 'check-ignore', '-q', '.notes/advisories/privacy-check']); }
  catch { throw new Error('First add /.notes/advisories/ to this checkout\'s local Git exclude, then retry. Do not commit private records.'); }
}
const json = v => `${JSON.stringify(v, null, 2)}\n`;
function caseAt(root, id) { idCheck(id); const dir = join(root, id); noLinks(dir); return dir; }
function checkCase(dir, options) {
  noLinks(join(dir, 'case.json')); noLinks(join(dir, 'triage.md'));
  const c = read(join(dir, 'case.json'));
  const errors = validate(c, options);
  if (!fs.existsSync(join(dir, 'triage.md')) || !fs.readFileSync(join(dir, 'triage.md'), 'utf8').trim()) errors.push('Missing triage.md');
  if (fs.existsSync(join(dir, 'variants.md')) && !c.claims?.some(x => x.technical_verdict === 'confirmed')) errors.push('variants.md requires a confirmed claim');
  if (fs.existsSync(join(dir, 'advisory.md')) && (c.overall_disposition !== 'accept' || c.maintainer_decision.status !== 'approved')) errors.push('advisory.md requires explicit acceptance; metadata approval alone is insufficient');
  if (['advisory.review.md', 'metadata.review.json'].some(file => fs.existsSync(join(dir, file))) && (!publishedBaseline(c) || c.overall_disposition !== 'accept')) errors.push('A retrospective review-only body requires an observed published baseline and an advisory-eligible assessment (overall_disposition "accept")');
  assert(!errors.length, `${dir}:\n${errors.join('\n')}`);
  return c;
}
function latestObservation(dir) {
  const file = fs.readdirSync(dir).filter(f => /^observation-.+\.json$/.test(f)).sort().at(-1);
  if (!file) return null;
  noLinks(join(dir, file));
  return { file, ...read(join(dir, file)) };
}
function snapshot(raw, stamp = now()) {
  assert(['triage', 'draft', 'closed', 'published'].includes(raw.state) && time(raw.updated_at), 'Invalid GitHub advisory response');
  return { captured_at: stamp, state: raw.state, updated_at: raw.updated_at, metadata_digest: digest(raw) };
}
const repositoryName = /^[\w.-]+\/[\w.-]+$/;
const advisoryURL = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/security\/advisories\//;
const recordedRepository = c => c?.repository?.github ?? (typeof c?.source?.url === 'string' ? advisoryURL.exec(c.source.url)?.[1] : undefined);
// The GitHub repository comes from --repository or from what earlier commands recorded; there is no built-in default.
function githubRepository(given, recorded = []) {
  const known = [...new Map(recorded.filter(r => typeof r === 'string' && repositoryName.test(r)).map(r => [r.toLowerCase(), r])).values()];
  if (given !== undefined) {
    assert(repositoryName.test(given), 'Expected --repository OWNER/NAME');
    const other = known.find(r => r.toLowerCase() !== given.toLowerCase());
    assert(!other, `--repository ${given} differs from the recorded repository ${other}`);
    return given;
  }
  assert(known.length, 'Unknown GitHub repository. Pass --repository OWNER/NAME; later commands reuse the repository recorded in the case record or queue.');
  assert(known.length === 1, `Records name several repositories (${known.join(', ')}). Pass --repository OWNER/NAME.`);
  return known[0];
}
function checkAdvisoryURL(url, id, repository) {
  ghsaCheck(id);
  const prefix = `https://github.com/${repository}/security/advisories/`;
  assert(typeof url === 'string' && url.toLowerCase().startsWith(prefix.toLowerCase()) && url.slice(prefix.length).toLowerCase() === id, 'Unexpected advisory URL');
}
function getAdvisory(id, repository, file) {
  ghsaCheck(id);
  const raw = file ? read(file) : JSON.parse(execFileSync('gh', ['api', '--method', 'GET', `repos/${repository}/security-advisories/${id.toUpperCase()}`], { encoding: 'utf8' }));
  assert(raw.ghsa_id?.toLowerCase() === id, 'Snapshot belongs to a different advisory');
  checkAdvisoryURL(raw.html_url, id, repository);
  snapshot(raw); return raw;
}
const branchName = (value, flag) => { assert(/^\w[\w./-]*$/.test(value) && !value.includes('..'), `Invalid --${flag} ${value}`); return value; };
const fullSha = /^[a-f0-9]{40}$/;
function remoteHeads(repo, branches) {
  try {
    const refs = execFileSync('git', ['-C', repo, 'ls-remote', 'origin', ...branches.map(b => `refs/heads/${b}`)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return Object.fromEntries(refs.split('\n').filter(Boolean).map(line => line.split(/\s+/).reverse()));
  } catch { throw new Error(`Could not read branches from origin of ${repo}. Pass --stable SHA, --stable-branch NAME, and --prerelease SHA|absent to record revisions without a remote.`); }
}
function originDefaultBranch(repo) {
  let name;
  try { name = /^ref: refs\/heads\/(\S+)\s+HEAD$/m.exec(execFileSync('git', ['-C', repo, 'ls-remote', '--symref', 'origin', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))?.[1]; } catch { name = undefined; }
  if (!name) console.warn('Could not resolve the default branch of origin; using main. Pass --stable-branch NAME to choose another.');
  return name ?? 'main';
}
function workspaceRepositories(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(join(root, d.name, 'case.json'))).map(d => { noLinks(join(root, d.name, 'case.json')); return recordedRepository(read(join(root, d.name, 'case.json'))); });
}
export function queueRows(root, inventory) {
  const advisories = inventory.flat().filter(a => a.state === 'triage').sort((a, b) => b.created_at.localeCompare(a.created_at) || a.ghsa_id.localeCompare(b.ghsa_id));
  const ids = new Set();
  return advisories.map(a => {
    const id = a.ghsa_id.toLowerCase(); ghsaCheck(id);
    assert(!ids.has(id), 'Duplicate advisory in inventory'); ids.add(id);
    snapshot(a); assert(time(a.created_at), 'Invalid creation timestamp');
    const dir = caseAt(root, id);
    const path = join(dir, 'case.json');
    let status = fs.existsSync(join(dir, 'triage.md')) ? 'legacy_assessment_check_history' : 'history_check_required';
    let owner = null, next = 'Read discussion and shared records before treating this as new intake.';
    if (fs.existsSync(path)) {
      noLinks(path); const c = read(path);
      assert(c.case_id === id, 'Case directory and ID differ');
      assert(!structural(currentVocabulary(c)).length, `Invalid case ${id}; validate it before queue generation`);
      owner = c.continuity?.owner || null; next = c.continuity?.next_action || c.claims[0].recommended_next_step;
      status = a.updated_at !== c.source.updated_at || c.source.github_state !== a.state || Date.parse(c.last_triaged_at) < Date.parse(a.updated_at) ? 'stale_reassess' : c.continuity?.hold_reason ? 'on_hold' : c.case_status;
    }
    return { case_id: id, url: a.html_url, title: a.summary, created_at: a.created_at, updated_at: a.updated_at, local_status: status, owner, next_action: next };
  });
}
const cell = value => String(value ?? 'unassigned').replace(/[\r\n|<>]/g, ' ');
function queueMarkdown(rows, generated, mode) {
  const provenance = mode === 'live_github' ? `Live GitHub inventory retrieved ${generated}.` : `Supplied offline inventory; source collection time is unverified. Generated ${generated}.`;
  return `# Triage queue\n\nGitHub triage state only. ${provenance} Local completion is not remote acceptance or closure.\n\n| Advisory | GitHub updated | Local assessment | Owner | Next action |\n| --- | --- | --- | --- | --- |\n${rows.map(r => `| [${cell(r.case_id.toUpperCase())}](${r.url}) | ${r.updated_at} | ${cell(r.local_status)} | ${cell(r.owner)} | ${cell(r.next_action)} |`).join('\n')}\n`;
}

const usage = `Usage:
  node workspace.mjs init ROOT [--repo CHECKOUT]
  node workspace.mjs new ROOT ID --repository OWNER/NAME --owner NAME [--repo CHECKOUT] [--snapshot FILE] [--stable-branch NAME] [--stable SHA] [--prerelease-branch NAME] [--prerelease SHA|absent]
  node workspace.mjs capture ROOT ID before|after [--repository OWNER/NAME] [--snapshot FILE]
  node workspace.mjs validate ROOT [ID] [--ready] [--publication-check]
  node workspace.mjs queue ROOT [--repository OWNER/NAME] [--inventory FILE] [--check]
  node workspace.mjs checkpoint ROOT ID --reviewer NAME --reason TEXT [--ready]
  node workspace.mjs resume ROOT [ID] --from CHECKPOINT --expect SHA256 --owner NAME --repo CHECKOUT
ROOT is CHECKOUT/.notes/advisories. ID is the lowercase GHSA ID, for example ghsa-2345-6789-cfgh. --next is a legacy alias of --prerelease.`;
const commandOptions = {
  init: ['repo'],
  new: ['repository', 'repo', 'owner', 'snapshot', 'stable-branch', 'stable', 'prerelease-branch', 'prerelease', 'next'],
  capture: ['repository', 'snapshot'],
  validate: ['ready', 'publication-check'],
  queue: ['repository', 'inventory', 'check'],
  checkpoint: ['reviewer', 'reason', 'ready'],
  resume: ['from', 'expect', 'owner', 'repo'],
};
const flags = ['ready', 'publication-check', 'check'];

export function main(argv = process.argv.slice(2)) {
  const [command, rootArg, ...rest] = argv;
  assert(command && rootArg, usage);
  assert(Object.hasOwn(commandOptions, command), `Unknown command ${command}`);
  const root = resolve(rootArg); noLinks(root);
  assert(root !== dirname(root), 'Refusing filesystem root');
  const options = {}; const args = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      const key = rest[i].slice(2);
      assert(commandOptions[command].includes(key), `Unknown option ${key} for ${command}`);
      options[key] = flags.includes(key) ? true : rest[++i];
      assert(options[key], `Missing value for ${key}`);
    } else args.push(rest[i]);
  }
  const [id, phase] = args;
  if (['new', 'capture', 'queue', 'checkpoint', 'resume'].includes(command) && !options.check) privateWorkspace(root);
  if (command === 'init') {
    const repo = resolve(options.repo || process.cwd());
    privateWorkspace(root, repo);
    fs.mkdirSync(root, { recursive: true, mode: 0o700 });
    for (const file of ['case.schema.json', 'case.template.json']) {
      const dest = join(root, file); noLinks(dest);
      if (fs.existsSync(dest)) assert(fs.readFileSync(dest, 'utf8') === fs.readFileSync(join(assets, file), 'utf8'), `Existing ${file} differs. Preserve it; read the explicit migration instructions.`);
      else writeNew(dest, fs.readFileSync(join(assets, file)));
    }
  } else if (command === 'new') {
    assert(fs.existsSync(join(root, 'case.schema.json')), 'Initialize the workspace first');
    const dir = caseAt(root, id); assert(!fs.existsSync(dir), 'Case already exists; assess or resume it, never overwrite');
    const repository = githubRepository(options.repository);
    assert(options.owner, 'Specify --owner for the accountable maintainer');
    assert(options.prerelease === undefined || options.next === undefined, '--next is the legacy alias of --prerelease; pass only one');
    const raw = getAdvisory(id, repository, options.snapshot);
    const repo = resolve(options.repo || process.cwd());
    const stableBranch = branchName(options['stable-branch'] ?? originDefaultBranch(repo), 'stable-branch');
    let stableSha = options.stable, preSha = options.prerelease ?? options.next;
    // The legacy --next SHA always meant the next branch.
    const preBranch = options['prerelease-branch'] ? branchName(options['prerelease-branch'], 'prerelease-branch') : options.next && options.next !== 'absent' ? 'next' : undefined;
    const lookups = [...(stableSha ? [] : [stableBranch]), ...(preSha === undefined && preBranch ? [preBranch] : [])];
    const heads = lookups.length ? remoteHeads(repo, lookups) : {};
    stableSha ??= heads[`refs/heads/${stableBranch}`];
    if (preSha === undefined && preBranch) {
      preSha = heads[`refs/heads/${preBranch}`];
      assert(preSha, `Pre-release branch ${preBranch} not found on origin. Omit --prerelease-branch for a repository without one.`);
    }
    preSha ??= 'absent';
    assert(fullSha.test(stableSha || ''), `Need exact ${stableBranch} SHA: pass --stable SHA, or --stable-branch NAME for a branch that exists on origin`);
    assert(preSha === 'absent' || fullSha.test(preSha), 'Need an exact pre-release SHA or --prerelease absent');
    assert(preSha !== 'absent' || !options['prerelease-branch'], '--prerelease absent contradicts --prerelease-branch');
    assert(preSha === 'absent' || preBranch, 'Name the pre-release branch with --prerelease-branch NAME');
    const c = template(), stamp = now();
    c.case_id = id; c.repository = { ...c.repository, github: repository, path: repo, stable_ref: `origin/${stableBranch}`, stable_sha: stableSha, prerelease_ref: preSha === 'absent' ? null : `origin/${preBranch}`, prerelease_sha: preSha === 'absent' ? null : preSha };
    c.source = { ...c.source, url: raw.html_url, title: raw.summary, github_state: raw.state, reporter: raw.author?.login || null, created_at: raw.created_at, updated_at: raw.updated_at, retrieved_at: stamp, acknowledgement_deadline: new Date(Date.parse(raw.created_at) + 72 * 3600000).toISOString() };
    c.authorization.recorded_at = stamp; c.authorization.basis = 'Local case setup and read-only intake; no external or runtime action authorized.';
    c.authorization.github_read = options.snapshot ? 'not_authorized' : 'authorized';
    if (options.snapshot) c.authorization.basis = 'Local-only intake from supplied observations; no live GitHub read, external write, or runtime action authorized.';
    c.duplicate_assessment.checked_at = stamp; c.last_triaged_at = stamp;
    c.continuity.owner = options.owner; c.github_snapshot.before = snapshot(raw, stamp);
    if (raw.state === 'published') {
      c.source.publicly_disclosed = true;
      if (raw.published_at) c.post_triage.advisory_published_at = raw.published_at;
    }
    assert(!validate(c).length, validate(c).join('\n'));
    fs.mkdirSync(dir, { mode: 0o700 });
    writeNew(join(dir, 'case.json'), json(c)); writeNew(join(dir, 'triage.md'), fs.readFileSync(join(assets, 'triage.template.md')));
    writeNew(join(dir, `source-${stamp.replace(/[:.]/g, '-')}.json`), json(raw));
  } else if (command === 'capture') {
    assert(['before', 'after'].includes(phase), 'Use capture ROOT ID before|after');
    const dir = caseAt(root, id), c = checkCase(dir);
    assert(options.snapshot || c.authorization.github_read === 'authorized', 'Live GitHub reads are not authorized in this case. Record explicit read authority or supply --snapshot.');
    const raw = getAdvisory(id, githubRepository(options.repository, [recordedRepository(c)]), options.snapshot), stamp = now();
    // Prepare an immutable observation. The agent must reconcile it, never blindly stamp a review fresh.
    writeNew(join(dir, `observation-${stamp.replace(/[:.]/g, '-')}.json`), json({ phase, snapshot: snapshot(raw, stamp), advisory: raw }));
    console.log('Observation saved. Compare all metadata and discussion; explicitly update case.json without changing last_triaged_at until review is complete.');
  } else if (command === 'validate') {
    const dirs = id ? [caseAt(root, id)] : fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(join(root, d.name, 'case.json'))).map(d => join(root, d.name));
    assert(dirs.length, 'No case manifests found');
    const failures = [];
    for (const dir of dirs) {
      try {
        const c = checkCase(dir, { ready: options.ready, publicationCheck: options['publication-check'] }), observation = latestObservation(dir);
        for (const warning of observation ? drift(c, observation) : []) console.warn(`Drift warning ${c.case_id}: ${warning} in ${observation.file}. Reconcile case.json or explain the difference in triage.md.`);
      } catch (error) { failures.push(error.message); }
    }
    assert(!failures.length, `${failures.join('\n')}\n${dirs.length - failures.length}/${dirs.length} records passed; historical records were not changed.`);
    console.log(`${dirs.length} record(s) valid${options.ready ? ' for assessment review' : ' structurally and semantically; not proof of triage completion'}. Not publication approval.${options['publication-check'] ? ' Publication chronology checked; human readiness review still required.' : ''}`);
  } else if (command === 'queue') {
    const stamp = now();
    const mode = options.inventory ? 'supplied_inventory' : 'live_github';
    const path = join(root, 'QUEUE.team.json'), md = join(root, 'QUEUE.team.md');
    noLinks(path); noLinks(md);
    const queued = fs.existsSync(path) ? read(path).repository : undefined;
    const repository = githubRepository(options.repository, queued ? [queued] : options.repository ? [] : workspaceRepositories(root));
    const inventory = options.inventory ? read(options.inventory) : JSON.parse(execFileSync('gh', ['api', '--method', 'GET', '--paginate', '--slurp', `repos/${repository}/security-advisories?per_page=100&state=triage`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
    assert(Array.isArray(inventory), 'Expected paginated advisory arrays');
    for (const raw of inventory.flat()) checkAdvisoryURL(raw.html_url, raw.ghsa_id?.toLowerCase() || '', repository);
    const rows = queueRows(root, inventory);
    if (options.check) {
      const old = read(path);
      assert(old.schema_version === QUEUE_SCHEMA_VERSION || LEGACY_ALIASES.queueSchema.test(old.schema_version ?? ''), 'Unsupported queue schema_version; regenerate the queue');
      assert(old.source_mode === mode, 'Queue provenance differs: regenerate with the intended live or supplied inventory');
      assert(digest(old.advisories) === digest(rows), 'Queue is stale: regenerate from current GitHub and case records');
      assert(fs.readFileSync(md, 'utf8') === queueMarkdown(rows, old.generated_at, mode), 'Queue Markdown is stale or edited');
    } else {
      for (const p of [path, md]) if (fs.existsSync(p)) assert(fs.statSync(p).nlink === 1, 'Refusing linked output');
      fs.writeFileSync(path, json({ schema_version: QUEUE_SCHEMA_VERSION, repository, state_filter: 'triage', source_mode: mode, generated_at: stamp, retrieved_at: options.inventory ? null : stamp, advisories: rows }), { mode: 0o600 });
      fs.writeFileSync(md, queueMarkdown(rows, stamp, mode), { mode: 0o600 });
    }
  } else if (command === 'checkpoint') {
    const dir = caseAt(root, id), c = checkCase(dir, { ready: options.ready });
    assert(options.reason && options.reviewer, 'Checkpoint needs --reviewer and --reason');
    const files = { 'case.json': fs.readFileSync(join(dir, 'case.json'), 'utf8'), 'triage.md': fs.readFileSync(join(dir, 'triage.md'), 'utf8') };
    const payload = { case_id: c.case_id, created_at: now(), reviewer: options.reviewer, reason: options.reason, files };
    const revision = digest(payload), history = join(dir, 'history'); noLinks(history);
    fs.mkdirSync(history, { recursive: true, mode: 0o700 });
    writeNew(join(history, `${revision}.json`), json({ revision, ...payload }));
    console.log(`Checkpoint ${revision}. Private content: share only after reviewing audience and evidence access. This command did not upload anything.`);
  } else if (command === 'resume') {
    assert(options.from && options.expect && options.owner && options.repo, 'Resume needs --from CHECKPOINT --expect SHA256 --owner NAME --repo CHECKOUT');
    noLinks(options.from); const saved = read(options.from), { revision, ...payload } = saved;
    assert(revision === options.expect && digest(payload) === revision, 'Checkpoint checksum mismatch; verify its revision with the sending maintainer');
    assert(object(saved.files) && Object.keys(saved.files).sort().join(',') === 'case.json,triage.md', 'Only case.json and triage.md are portable; no attachments or executable artifacts');
    assert(Object.values(saved.files).every(v => typeof v === 'string' && v.trim()), 'Checkpoint files must contain text');
    const c = JSON.parse(saved.files['case.json']);
    assert(!validate(c).length, validate(c).join('\n')); assert(saved.case_id === c.case_id, 'Checkpoint identity mismatch');
    if (id) assert(id === c.case_id, 'Requested case differs from checkpoint');
    const dir = caseAt(root, c.case_id); assert(!fs.existsSync(dir), 'Existing case: compare checkpoints and reconcile manually; refusing overwrite');
    assert(fs.existsSync(join(root, 'case.schema.json')), 'Initialize the receiving workspace first');
    assert(c.process_version === '2.2.0', 'Explicitly migrate legacy records before cross-maintainer resume');
    c.continuity.last_reviewed_revision = revision; c.continuity.owner = options.owner;
    c.continuity.next_action = 'Verify checkpoint audience and evidence access; refresh live discussion, metadata, and refs before relying on the prior recommendation.';
    c.repository.path = resolve(options.repo);
    c.authorization = { ...c.authorization, github_read: 'not_authorized', github_write: 'not_authorized', dynamic_validation: 'not_authorized', remediation: 'not_authorized', recorded_at: now(), basis: 'Resumed for local review only. Prior approvals remain historical; re-establish read and action-specific authority.' };
    c.case_status = 'static_triage';
    fs.mkdirSync(dir, { mode: 0o700 }); fs.mkdirSync(join(dir, 'history'), { mode: 0o700 });
    writeNew(join(dir, 'history', `${revision}.json`), json(saved));
    writeNew(join(dir, 'case.json'), json(c)); writeNew(join(dir, 'triage.md'), saved.files['triage.md']);
    console.log('Resumed with external actions disabled. Prior evidence and approvals are historical, not fresh validation.');
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
