#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { closeSync, linkSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const text = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const array = value => Array.isArray(value);
const unique = values => new Set(values).size === values.length;
const stable = value => array(value) ? value.map(stable) : object(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const canonical = value => JSON.stringify(stable(value));
const actions = new Set(['keep_open', 'decision_needed', 'close_duplicate', 'close_resolved', 'close_answered', 'close_superseded', 'close_not_planned']);
const kinds = new Set(['issue', 'pull_request']);
const coverageStatuses = new Set(['covered', 'partial', 'missing', 'unknown']);
const bases = new Set(['canonical_scope', 'candidate_pr', 'current_code', 'released', 'contract']);
const evidenceKinds = new Set(['issue_thread', 'pull_request', 'source', 'docs', 'release', 'runtime', 'contract', 'maintainer_decision', 'other']);
const memberStates = { issue: new Set(['open', 'closed', 'unknown']), pull_request: new Set(['open', 'closed', 'merged', 'unknown']) };
const fail = message => { throw new Error(message); };
const requireValue = (condition, message, errors) => { if (!condition) errors.push(message); };
const byId = (items, id) => items.find(item => item?.id === id);
const memberByNumber = (record, number) => record.members.find(member => member?.number === number);
const urlMatches = (url, repo, kind, number) => url === `https://github.com/${repo}/${kind === 'issue' ? 'issues' : 'pull'}/${number}`;
const timestamp = value => text(value) && Number.isFinite(Date.parse(value));
const hasMemberLocator = (locator, member) => typeof locator === 'string' && Boolean(member) && (locator === member.url || (locator.startsWith(`${member.url}#`) && locator.length > member.url.length + 1));

export function validateRecord(record, { ready = false } = {}) {
  const errors = [];
  requireValue(object(record), 'record must be a JSON object', errors);
  if (!object(record)) return errors;
  requireValue(record.schema_version === 1, 'schema_version must be 1', errors);
  requireValue(/^[\w.-]+\/[\w.-]+$/.test(record.repo ?? ''), 'repo must be OWNER/REPO', errors);
  requireValue(/^[a-z0-9][a-z0-9-]{1,63}$/.test(record.id ?? ''), 'id must be a lowercase hyphenated group ID', errors);
  requireValue(typeof record.coordinator === 'string', 'coordinator must be text', errors);
  for (const key of ['members', 'criteria', 'evidence', 'coverage', 'selected_prs', 'decisions']) requireValue(array(record[key]), `${key} must be an array`, errors);
  if (!array(record.members) || !array(record.criteria) || !array(record.evidence) || !array(record.coverage) || !array(record.selected_prs) || !array(record.decisions)) return errors;

  const memberNumbers = record.members.map(m => m?.number);
  const criterionIds = record.criteria.map(c => c?.id);
  const evidenceIds = record.evidence.map(e => e?.id);
  requireValue(unique(memberNumbers), 'members contain a duplicate item number', errors);
  requireValue(unique(criterionIds), 'criteria contain duplicate IDs', errors);
  requireValue(unique(evidenceIds), 'evidence contains duplicate IDs', errors);
  requireValue(unique(record.selected_prs), 'selected_prs contains duplicate numbers', errors);
  requireValue(unique(record.decisions.map(d => d?.item_id)), 'decisions contain more than one decision for an item', errors);

  for (const member of record.members) {
    requireValue(object(member) && kinds.has(member.kind) && Number.isInteger(member.number) && member.number > 0 && text(member.url) && timestamp(member.observed_at) && typeof member.context_complete === 'boolean' && memberStates[member.kind]?.has(member.state), 'each member needs kind, positive number, URL, parseable observed_at, known state, and context_complete', errors);
    if (!object(member)) continue;
    requireValue(urlMatches(member.url, record.repo, member.kind, member.number), `member ${member.number} URL does not match repo/kind/number`, errors);
    if (member.kind === 'pull_request') requireValue(member.state === 'unknown' ? (member.head_sha == null || text(member.head_sha)) : text(member.head_sha), `PR #${member.number} needs head_sha unless state is unknown`, errors);
    else requireValue(member.head_sha == null, `issue #${member.number} must not have head_sha`, errors);
  }
  for (const criterion of record.criteria) {
    requireValue(object(criterion) && text(criterion.id) && text(criterion.request) && text(criterion.requested_surface) && !/[\r\n\u0000-\u001f]/.test(criterion.requested_surface) && array(criterion.member_ids), 'each criterion needs id, request, explicit requested_surface, and member_ids', errors);
    if (!object(criterion) || !array(criterion.member_ids)) continue;
    requireValue(criterion.member_ids.length > 0, `criterion ${criterion.id} must include at least one member`, errors);
    requireValue(unique(criterion.member_ids), `criterion ${criterion.id} has duplicate member_ids`, errors);
    for (const number of criterion.member_ids) requireValue(record.members.some(m => m?.number === number), `criterion ${criterion.id} references unknown member #${number}`, errors);
  }
  for (const evidence of record.evidence) {
    requireValue(object(evidence) && text(evidence.id) && evidenceKinds.has(evidence.kind) && text(evidence.locator) && timestamp(evidence.observed_at) && typeof evidence.complete === 'boolean' && (evidence.revision == null || text(evidence.revision)) && (evidence.member_id == null || Number.isInteger(evidence.member_id)), 'each evidence item needs id, supported kind, locator, parseable observed_at, complete, and optional revision/member_id', errors);
    if (!object(evidence)) continue;
    if (['source', 'release', 'runtime'].includes(evidence.kind)) requireValue(text(evidence.revision), `${evidence.kind} evidence ${evidence.id} needs a revision, commit, or release version`, errors);
    if (evidence.member_id != null) requireValue(memberByNumber(record, evidence.member_id), `evidence ${evidence.id} references unknown member #${evidence.member_id}`, errors);
    if (evidence.kind === 'pull_request') {
      const pr = evidence.member_id == null ? record.members.find(m => m?.kind === 'pull_request' && hasMemberLocator(evidence.locator, m)) : memberByNumber(record, evidence.member_id);
      requireValue(pr?.kind === 'pull_request' && hasMemberLocator(evidence.locator, pr), `PR evidence ${evidence.id} must identify a PR member by its URL`, errors);
    }
    if (evidence.kind === 'issue_thread') {
      const issue = evidence.member_id == null ? record.members.find(m => m?.kind === 'issue' && hasMemberLocator(evidence.locator, m)) : memberByNumber(record, evidence.member_id);
      requireValue(issue?.kind === 'issue' && hasMemberLocator(evidence.locator, issue), `issue evidence ${evidence.id} must identify an issue member or comment`, errors);
    }
  }
  const coverageKeys = record.coverage.map(c => JSON.stringify([c?.item_id, c?.criterion_id, c?.surface, c?.basis, c?.target_id ?? null]));
  requireValue(unique(coverageKeys), 'coverage contains duplicate item/criterion/surface/basis/target tuples', errors);
  for (const row of record.coverage) {
    requireValue(object(row) && Number.isInteger(row.item_id) && text(row.criterion_id) && text(row.surface) && bases.has(row.basis) && coverageStatuses.has(row.status) && array(row.evidence_ids) && (row.target_id == null || Number.isInteger(row.target_id)), 'each coverage row needs item_id, criterion_id, explicit surface, supported basis, status, evidence_ids, and optional target_id', errors);
    if (!object(row) || !array(row.evidence_ids)) continue;
    requireValue(memberByNumber(record, row.item_id), `coverage references unknown member #${row.item_id}`, errors);
    const criterion = byId(record.criteria, row.criterion_id);
    requireValue(criterion, `coverage references unknown criterion ${row.criterion_id}`, errors);
    requireValue(Array.isArray(criterion?.member_ids) && criterion.member_ids.includes(row.item_id), `criterion ${row.criterion_id} is not in scope for #${row.item_id}`, errors);
    requireValue(unique(row.evidence_ids), `coverage for #${row.item_id}/${row.criterion_id} repeats evidence IDs`, errors);
    for (const id of row.evidence_ids) requireValue(byId(record.evidence, id), `coverage references unknown evidence ${id}`, errors);
    if (row.basis === 'canonical_scope') requireValue(Number.isInteger(row.target_id) && record.canonical_issue === row.target_id && record.members.some(m => m?.kind === 'issue' && m.number === row.target_id), 'canonical_scope coverage must target canonical_issue', errors);
    if (row.basis === 'candidate_pr') requireValue(Number.isInteger(row.target_id) && record.members.some(m => m?.kind === 'pull_request' && m.number === row.target_id), 'candidate_pr coverage must target a PR member', errors);
    if (['current_code', 'released', 'contract'].includes(row.basis)) requireValue(row.target_id == null, `${row.basis} coverage must not target an item`, errors);
  }
  for (const number of record.selected_prs) requireValue(record.members.some(m => m?.kind === 'pull_request' && m.number === number), `selected_prs references unknown PR #${number}`, errors);
  requireValue(record.canonical_issue === null || (Number.isInteger(record.canonical_issue) && record.members.some(m => m?.kind === 'issue' && m.number === record.canonical_issue)), 'canonical_issue must be null or an issue member number', errors);

  for (const decision of record.decisions) {
    requireValue(object(decision) && Number.isInteger(decision.item_id) && actions.has(decision.action) && text(decision.rationale) && array(decision.evidence_ids), 'each decision needs item_id, action, rationale, and evidence_ids', errors);
    if (!object(decision) || !array(decision.evidence_ids)) continue;
    const subject = memberByNumber(record, decision.item_id);
    requireValue(subject, `decision references unknown member #${decision.item_id}`, errors);
    for (const id of decision.evidence_ids) requireValue(byId(record.evidence, id), `decision references unknown evidence ${id}`, errors);
    if (decision.action === 'close_duplicate') {
      requireValue(subject?.kind === 'issue', `close_duplicate requires an issue, not #${decision.item_id}`, errors);
      requireValue(Number.isInteger(decision.target_id) && decision.target_id !== decision.item_id, `duplicate decision for #${decision.item_id} needs a different target_id`, errors);
      const target = memberByNumber(record, decision.target_id);
      requireValue(target?.kind === 'issue', `duplicate target #${decision.target_id} must be an issue member`, errors);
      requireValue(record.canonical_issue === decision.target_id, `duplicate target #${decision.target_id} must equal canonical_issue`, errors);
    } else if (decision.action === 'close_resolved') {
      requireValue(subject?.kind === 'issue', 'close_resolved requires an issue', errors);
      requireValue(decision.target_id == null || record.members.some(m => m?.kind === 'pull_request' && m.number === decision.target_id), `resolution target for #${decision.item_id} must be a member PR`, errors);
    } else if (decision.action === 'close_answered') {
      requireValue(subject?.kind === 'issue', 'close_answered requires an issue', errors);
      requireValue(decision.target_id == null, `${decision.action} must not specify target_id`, errors);
    } else if (decision.action === 'close_superseded') {
      requireValue(subject?.kind === 'pull_request', 'close_superseded requires a PR', errors);
      requireValue(Number.isInteger(decision.target_id) && decision.target_id !== decision.item_id && record.selected_prs.includes(decision.target_id), 'close_superseded needs a different selected PR target', errors);
    } else if (decision.action === 'close_not_planned') {
      requireValue(subject?.kind === 'pull_request', 'close_not_planned requires a PR', errors);
      requireValue(decision.target_id == null, 'close_not_planned must not specify target_id', errors);
    } else requireValue(decision.target_id == null, `${decision.action} must not specify target_id`, errors);
  }

  const reconciliation = record.reconciliation;
  requireValue(object(reconciliation) && ['pending', 'complete'].includes(reconciliation.status) && typeof reconciliation.rationale === 'string' && array(reconciliation.scope_decisions) && array(reconciliation.unresolved_conflicts), 'reconciliation needs status, rationale, scope_decisions, and unresolved_conflicts', errors);
  if (object(reconciliation) && array(reconciliation.scope_decisions)) {
    requireValue(unique(reconciliation.scope_decisions.map(decision => decision?.criterion_id)), 'scope_decisions contain more than one decision for a criterion', errors);
    for (const decision of reconciliation.scope_decisions) {
      requireValue(object(decision) && text(decision.criterion_id) && text(decision.requested_surface) && text(decision.accepted_surface) && text(decision.decision_authority) && text(decision.rationale), 'scope decisions need criterion_id, requested_surface, accepted_surface, decision_authority, and rationale', errors);
      if (object(decision)) {
        const criterion = byId(record.criteria, decision.criterion_id);
        requireValue(criterion, `scope decision references unknown criterion ${decision.criterion_id}`, errors);
        requireValue(criterion?.requested_surface === decision.requested_surface, `scope decision for ${decision.criterion_id} does not match the requested surface`, errors);
      }
    }
  }
  requireValue(object(record.verification) && typeof record.verification.reviewer === 'string' && typeof record.verification.result_revision === 'string' && ['confirmed', 'changes_needed'].includes(record.verification.verdict) && typeof record.verification.pending === 'boolean', 'verification needs reviewer, result_revision, verdict, and pending', errors);

  if (ready && errors.length === 0) validateReady(record, errors);
  return [...new Set(errors)];
}

function validateReady(record, errors) {
  const reconciliation = record.reconciliation;
  requireValue(record.members.length > 0 && record.criteria.length > 0, 'ready validation requires at least one member and one material criterion', errors);
  requireValue(reconciliation?.status === 'complete' && text(reconciliation.rationale), 'ready validation requires complete group reconciliation and rationale', errors);
  requireValue(text(record.coordinator), 'ready validation requires a coordinator', errors);
  requireValue(array(reconciliation?.unresolved_conflicts) && reconciliation.unresolved_conflicts.length === 0, 'ready validation requires no unresolved conflicts', errors);
  for (const row of record.coverage.filter(c => ['covered', 'partial'].includes(c.status))) {
    for (const id of row.evidence_ids) {
      const item = byId(record.evidence, id);
      requireValue(item?.complete === true, `coverage evidence ${id} is incomplete`, errors);
      if (item?.kind === 'pull_request') {
        const pr = item.member_id == null ? record.members.find(m => m.kind === 'pull_request' && hasMemberLocator(item.locator, m)) : memberByNumber(record, item.member_id);
        requireValue(pr?.kind === 'pull_request' && hasMemberLocator(item.locator, pr) && item.revision === pr.head_sha, `PR evidence ${id} is stale or not bound to a current PR head`, errors);
      }
    }
  }
  for (const criterion of record.criteria) {
    for (const scope of reconciliation.scope_decisions ?? []) if (scope.criterion_id === criterion.id) requireValue(scope.requested_surface === criterion.requested_surface, `scope decision for ${criterion.id} differs from requested surface`, errors);
  }
  for (const decision of record.decisions) {
    if (!decision || !['close_duplicate', 'close_resolved', 'close_answered', 'close_superseded', 'close_not_planned'].includes(decision.action)) continue;
    const member = memberByNumber(record, decision.item_id);
    requireValue(member?.state === 'open', `${decision.action} for #${decision.item_id} requires an open item`, errors);
    const relevant = record.criteria.filter(c => c.member_ids.includes(decision.item_id));
    requireValue(relevant.length > 0, `${decision.action} for #${decision.item_id} has no material criteria`, errors);
    requireValue(member?.context_complete === true, `${decision.action} for #${decision.item_id} requires complete member context`, errors);
    if (decision.action === 'close_not_planned') {
      const decisionEvidence = decision.evidence_ids.map(id => byId(record.evidence, id)).filter(Boolean);
      for (const evidence of decisionEvidence) {
        requireValue(evidence.complete === true, `close_not_planned for PR #${decision.item_id} uses incomplete evidence ${evidence.id}`, errors);
        if (['issue_thread', 'pull_request'].includes(evidence.kind)) requireValue(evidenceIdentifiesCurrentMember(evidence, record), `decision evidence ${evidence.id} is not a current member observation`, errors);
      }
      const prObservation = decisionEvidence.some(evidence => evidenceIdentifiersMemberAtHead(evidence, member));
      const basisEvidence = decisionEvidence.some(evidence => evidence.complete && ['contract', 'docs', 'source', 'maintainer_decision'].includes(evidence.kind));
      requireValue(prObservation, `close_not_planned for PR #${decision.item_id} requires a complete observation of its current head`, errors);
      requireValue(basisEvidence, `close_not_planned for PR #${decision.item_id} requires contract, docs, source, or maintainer-decision evidence`, errors);
      continue;
    }
    if (decision.action === 'close_duplicate') {
      const canonical = memberByNumber(record, decision.target_id);
      requireValue(record.canonical_issue === decision.target_id && canonical?.kind === 'issue', `duplicate #${decision.item_id} must target canonical_issue`, errors);
      requireValue(canonical?.state === 'open' || canonical?.state === 'closed', `duplicate target #${decision.target_id} needs a known open or closed state`, errors);
      requireValue(canonical?.context_complete === true, `canonical issue #${decision.target_id} needs complete context`, errors);
    }
    if (decision.action === 'close_resolved' && decision.target_id != null) {
      const fix = memberByNumber(record, decision.target_id);
      requireValue(fix?.kind === 'pull_request' && fix.state === 'merged', `resolution target PR #${decision.target_id} must be a merged member PR`, errors);
    }
    if (decision.action === 'close_superseded') {
      const replacement = memberByNumber(record, decision.target_id);
      requireValue(replacement?.kind === 'pull_request' && replacement.number !== decision.item_id && record.selected_prs.includes(replacement.number), `superseding target #${decision.target_id} must be a different selected member PR`, errors);
      requireValue(replacement?.state !== 'unknown' && replacement?.context_complete === true, `superseding target #${decision.target_id} needs known context and state`, errors);
      requireValue(replacement?.state === 'open' || replacement?.state === 'merged', `superseding target #${decision.target_id} must be open or merged`, errors);
    }
    for (const criterion of relevant) {
      const accepted = reconciliation.scope_decisions?.find(d => d.criterion_id === criterion.id && d.requested_surface === criterion.requested_surface);
      const acceptedSurface = accepted?.accepted_surface ?? criterion.requested_surface;
      if (accepted) requireValue(text(accepted.decision_authority) && text(accepted.rationale), `alternate surface for ${criterion.id} needs explicit decision authority and rationale`, errors);
      const basis = decision.action === 'close_duplicate' ? 'canonical_scope' : decision.action === 'close_answered' ? 'contract' : decision.action === 'close_superseded' ? null : null;
      const requiredBases = decision.action === 'close_resolved' ? ['current_code', 'released'] : decision.action === 'close_superseded' ? ['candidate_pr', 'current_code'] : [basis];
      let rows = record.coverage.filter(c => c.item_id === decision.item_id && c.criterion_id === criterion.id && c.surface === acceptedSurface && requiredBases.includes(c.basis));
      if (decision.action === 'close_duplicate') rows = rows.filter(c => c.target_id === record.canonical_issue);
      if (decision.action === 'close_superseded') rows = rows.filter(c => c.target_id === decision.target_id || (c.basis === 'current_code' && c.target_id == null));
      if (decision.action === 'close_resolved') rows = rows.filter(c => c.target_id == null);
      if (decision.action === 'close_answered') rows = rows.filter(c => c.target_id == null);
      const row = rows.find(c => c.status === 'covered');
      requireValue(row, `${decision.action} for #${decision.item_id} requires covered ${requiredBases.join(' or ')} evidence for criterion ${criterion.id}`, errors);
      requireValue(row?.evidence_ids?.length > 0, `${decision.action} for #${decision.item_id} requires evidence for criterion ${criterion.id}`, errors);
      if (row) validateBasisEvidence(record, row, decision, errors);
    }
    if (decision.action === 'close_duplicate') {
      for (const criterion of relevant) {
        const canonicalSurface = reconciliation.scope_decisions?.find(d => d.criterion_id === criterion.id)?.accepted_surface ?? criterion.requested_surface;
        const canonicalRow = record.coverage.find(c => c.item_id === decision.target_id && c.criterion_id === criterion.id && c.surface === canonicalSurface && c.basis === 'canonical_scope' && c.target_id === decision.target_id && c.status === 'covered');
        requireValue(canonicalRow, `canonical issue #${decision.target_id} needs covered canonical_scope for criterion ${criterion.id}`, errors);
        if (canonicalRow) validateBasisEvidence(record, canonicalRow, decision, errors);
      }
    }
    for (const evidenceId of decision.evidence_ids) {
      const evidence = byId(record.evidence, evidenceId);
      requireValue(evidence?.complete === true, `${decision.action} for #${decision.item_id} uses incomplete evidence ${evidenceId}`, errors);
      if (evidence && ['issue_thread', 'pull_request'].includes(evidence.kind)) requireValue(evidenceIdentifiesCurrentMember(evidence, record), `decision evidence ${evidenceId} is not a current member observation`, errors);
    }
  }
  for (const member of record.members) {
    if (member.state !== 'open') continue;
    requireValue(record.decisions.some(decision => decision.item_id === member.number), `open member #${member.number} needs an explicit decision`, errors);
  }
  const consequential = record.decisions.some(d => ['close_duplicate', 'close_resolved', 'close_answered', 'close_superseded', 'close_not_planned'].includes(d.action));
  if (consequential) {
    const digest = digestRecord(record);
    requireValue(record.verification?.pending === false && record.verification?.verdict === 'confirmed', 'consequential closures require completed independent verification', errors);
    requireValue(record.verification?.reviewer && record.verification.reviewer !== record.coordinator, 'verification reviewer must be independent of the coordinator', errors);
    requireValue(record.verification?.result_revision === digest, 'verification result_revision must match the current record digest', errors);
  }
}

function evidenceIdentifiesCurrentMember(evidence, record) {
  if (!evidence.complete) return false;
  if (evidence.member_id != null) {
    const member = memberByNumber(record, evidence.member_id);
    if (!member) return false;
    return hasMemberLocator(evidence.locator, member) && (member.kind !== 'pull_request' || evidence.kind !== 'pull_request' || evidence.revision === member.head_sha);
  }
  return record.members.some(member => hasMemberLocator(evidence.locator, member) && (member.kind !== 'pull_request' || evidence.kind !== 'pull_request' || evidence.revision === member.head_sha));
}

function evidenceIdentifiersMemberAtHead(evidence, member) {
  return evidence?.complete === true && evidence.kind === 'pull_request' && member?.kind === 'pull_request' && evidence.revision === member.head_sha && (evidence.member_id == null || evidence.member_id === member.number) && hasMemberLocator(evidence.locator, member);
}

function validateBasisEvidence(record, row, decision, errors) {
  const evidence = row.evidence_ids.map(id => byId(record.evidence, id)).filter(Boolean);
  for (const item of evidence) {
    requireValue(item.complete, `coverage evidence ${item.id} is incomplete`, errors);
    if (item.kind === 'pull_request') {
      const pr = item.member_id == null ? record.members.find(m => m.kind === 'pull_request' && hasMemberLocator(item.locator, m)) : memberByNumber(record, item.member_id);
      requireValue(pr?.kind === 'pull_request' && hasMemberLocator(item.locator, pr) && item.revision === pr.head_sha, `PR evidence ${item.id} is stale or not bound to a current PR head`, errors);
    }
  }
  const basisEvidence = {
    candidate_pr: item => item.kind === 'pull_request' && (item.member_id == null || item.member_id === row.target_id) && hasMemberLocator(item.locator, memberByNumber(record, row.target_id)),
    current_code: item => ['source', 'runtime'].includes(item.kind),
    released: item => ['release', 'runtime'].includes(item.kind),
    contract: item => ['contract', 'docs', 'source'].includes(item.kind),
  };
  const supported = row.basis === 'canonical_scope'
    ? evidence.some(item => item.kind === 'issue_thread' && evidenceMatchesMember(item, memberByNumber(record, row.target_id))) && evidence.some(item => item.kind === 'issue_thread' && evidenceMatchesMember(item, memberByNumber(record, row.item_id)))
    : evidence.some(basisEvidence[row.basis]);
  requireValue(supported, `${decision.action} requires ${row.basis} evidence, not only issue discussion or candidate work`, errors);
}

function evidenceMatchesMember(evidence, member) {
  return Boolean(evidence && member && evidence.complete && hasMemberLocator(evidence.locator, member) && (member.kind !== 'pull_request' || evidence.kind !== 'pull_request' || evidence.revision === member.head_sha));
}

export function digestRecord(record) {
  const { verification: _verification, ...content } = record;
  return createHash('sha256').update(canonical(content)).digest('hex');
}

function readRecord(path) {
  let parsed;
  try { parsed = JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { fail(`Cannot read valid JSON from ${path}: ${error.message}`); }
  const errors = validateRecord(parsed);
  if (errors.length) fail(`Invalid group record ${path}:\n${errors.map(e => `- ${e}`).join('\n')}`);
  if (basename(path) !== 'group.json' || basename(dirname(resolve(path))) !== parsed.id) fail(`Path/id mismatch: expected <${parsed.id}>/group.json, got ${path}`);
  return parsed;
}

function atomicCreate(path, contents) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temp = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  let fd;
  try {
    fd = openSync(temp, 'wx', 0o600);
    writeFileSync(fd, contents);
    closeSync(fd); fd = undefined;
    linkSync(temp, path);
  } catch (error) {
    if (fd !== undefined) closeSync(fd);
    throw new Error(`${path} was not written: ${error.code === 'EEXIST' ? 'it already exists' : error.message}`);
  } finally { try { unlinkSync(temp); } catch {} }
}

export function createDraft(path, repo, id) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '')) fail('repo must be OWNER/REPO');
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id ?? '')) fail('id must be a lowercase hyphenated group ID');
  if (basename(path) !== 'group.json' || basename(dirname(resolve(path))) !== id) fail(`FILE must be <${id}>/group.json`);
  const templatePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'group.template.json');
  const record = JSON.parse(readFileSync(templatePath, 'utf8'));
  record.repo = repo;
  record.id = id;
  atomicCreate(path, `${JSON.stringify(record, null, 2)}\n`);
  return `Created draft ${path}. It is not ready until reconciled and validated.`;
}

export function validateFile(path, { ready = false } = {}) {
  const record = readRecord(path);
  const errors = validateRecord(record, { ready });
  return { valid: errors.length === 0, errors, record };
}

export function renderMatrix(directory) {
  const paths = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name === 'group.json') paths.push(path);
    }
  }
  walk(directory);
  if (!paths.length) fail(`No group.json files found under ${directory}`);
  const records = paths.sort().map(path => ({ record: readRecord(path), path }));
  const rows = ['# Backlog group matrix', '', 'Actions below are local recommendations, not applied GitHub changes.', '', '| Group | Repository | Coordinator | Members | Readiness | Verification | Closure recommendations | Coverage gaps |', '|---|---|---|---|---|---|---|---|'];
  for (const entry of records) {
    const record = entry.record;
    const path = relative(directory, entry.path).replaceAll('\\', '/');
    const href = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const members = record.members.map(m => `${m.kind === 'issue' ? '#' : 'PR #'}${m.number}`).join(', ') || '—';
    const recommendations = record.decisions.filter(d => d.action.startsWith('close_')).map(d => `${memberByNumber(record, d.item_id)?.kind === 'pull_request' ? 'PR #' : '#'}${d.item_id}: recommend ${d.action.replace('close_', '').replaceAll('_', ' ')}${d.target_id == null ? '' : ` → #${d.target_id}`}`).join('; ') || 'none';
    const gaps = [
      ...record.coverage.filter(c => ['partial', 'missing', 'unknown'].includes(c.status)).map(c => `${c.status}: #${c.item_id}/${c.criterion_id}/${c.surface}`),
      ...record.criteria.flatMap(c => c.member_ids.filter(number => !record.coverage.some(row => row.item_id === number && row.criterion_id === c.id && row.status === 'covered')).map(number => `uncovered: #${number}/${c.id}/${c.requested_surface}`)),
    ].join('; ') || 'none recorded';
    const ready = validateRecord(record, { ready: true }).length === 0;
    const hasClosure = record.decisions.some(d => d.action.startsWith('close_'));
    const verification = !hasClosure ? 'not required' : record.verification.pending ? 'pending' : `${record.verification.verdict} (${record.verification.result_revision === digestRecord(record) ? 'current' : 'stale'})`;
    rows.push(`| [${escapeCell(record.id)}](${href}) | ${escapeCell(record.repo)} | ${escapeCell(record.coordinator || '—')} | ${escapeCell(members)} | ${ready ? 'ready' : 'pending'} | ${escapeCell(verification)} | ${escapeCell(recommendations)} | ${escapeCell(gaps)} |`);
  }
  const out = join(directory, 'matrix.md');
  atomicReplace(out, `${rows.join('\n')}\n`);
  return `Rendered ${records.length} groups to ${out}`;
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
}

function atomicReplace(path, contents) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temp = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  let fd;
  try {
    fd = openSync(temp, 'wx', 0o600);
    writeFileSync(fd, contents);
    closeSync(fd); fd = undefined;
    renameSync(temp, path);
  } catch (error) {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temp); } catch {}
    throw new Error(`${path} was not replaced: ${error.message}`);
  }
}

export function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  if (command === 'new') {
    const [path, ...flags] = args;
    const options = parseFlags(flags, ['repo', 'id']);
    return createDraft(path, options.repo, options.id);
  }
  if (command === 'validate') {
    const [path, ...flags] = args;
    if (flags.length > 1 || flags.some(flag => flag !== '--ready')) fail('Usage: ledger.mjs validate FILE [--ready]');
    const result = validateFile(path, { ready: flags.includes('--ready') });
    if (!result.valid) fail(result.errors.join('\n'));
    return flags.includes('--ready') ? `Ready: ${path}` : `Valid draft: ${path}`;
  }
  if (command === 'digest') {
    if (args.length !== 1) fail('Usage: ledger.mjs digest FILE');
    return digestRecord(readRecord(args[0]));
  }
  if (command === 'render') {
    if (args.length !== 1) fail('Usage: ledger.mjs render DIR');
    return renderMatrix(args[0]);
  }
  fail('Usage: ledger.mjs new FILE --repo OWNER/REPO --id GROUP_ID | validate FILE [--ready] | digest FILE | render DIR');
}

function parseFlags(flags, expected) {
  const result = {};
  for (let i = 0; i < flags.length; i += 2) {
    const key = flags[i]?.replace(/^--/, '');
    if (!expected.includes(key) || !flags[i + 1] || flags[i + 1].startsWith('--')) fail(`Expected --${expected.join(' and --')} VALUE`);
    if (key in result) fail(`Duplicate --${key}`);
    result[key] = flags[i + 1];
  }
  if (expected.some(key => !result[key])) fail(`Required options: ${expected.map(key => `--${key}`).join(' ')}`);
  return result;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try { console.log(main()); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
