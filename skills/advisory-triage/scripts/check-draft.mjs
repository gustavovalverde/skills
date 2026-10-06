#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';

import { fileURLToPath } from 'node:url';

const order = ['Am I affected?', 'Summary', 'Impact', 'Patches', 'Workarounds', 'Technical details', 'References', 'Credit'];

// Editorial rules encode this skill's disclosure template; metadata rules apply to any advisory.
export function checkDraft(body, proposal, { editorial = true } = {}) {
  const errors = [];
  if (editorial) editorialBodyErrors(body, errors);
  if (/\[(?:List |Explain |State |Name |Give |Use |URL|TODO)|\bTODO\b|<insert|PLACEHOLDER/.test(body)) errors.push('Unfinished scaffold text');
  return metadataErrors(body, proposal, errors, editorial);
}

function editorialBodyErrors(body, errors) {
  const headings = [...body.matchAll(/^## (.+)$/gm)].map(m => m[1]);
  const known = headings.filter(h => order.includes(h));
  for (const required of order.slice(0, 4)) if (!headings.includes(required)) errors.push(`Missing ${required} section`);
  if (new Set(headings).size !== headings.length) errors.push('Duplicate sections');
  if (headings.some(h => !order.includes(h))) errors.push('Unexpected disclosure section; use the maintained template');
  if (known.some((h, i) => i && order.indexOf(h) < order.indexOf(known[i - 1]))) errors.push('Sections are out of order');
  const sections = body.split(/^## .+$/m).slice(1);
  if (sections.some(s => !s.trim() || /^<!--[^]*-->$/.test(s.trim()))) errors.push('Empty disclosure section');
  const level = '(?:critical|high|medium|low)';
  const scoreText = new RegExp(`\\bCVSS\\b|\\b(?:attack vector|attack complexity|base score)\\b|\\b${level}[- ]severity\\b|\\bseverity(?: is| of|:)? ${level}\\b|\\b(?:rated|rates|scored|scores) (?:as |this issue as )?${level}\\b|\\b\\d{1,2}\\.\\d\\s*\\(?${level}\\b|\\(\\d{1,2}\\.\\d,? ${level}\\)`, 'i');
  if (scoreText.test(body)) errors.push('Body restates a CVSS score, vector, or severity; the metadata carries it');
  if (/\b(?:current|latest|newest)(?: stable| published)?(?: `?v?\d+(?:\.\d+)*(?:-[\w.]+)?`?)? (?:release|version)\b|\(latest\)|\bnpm latest\b/i.test(body)) errors.push('Body names the current or latest release, which goes stale; state a stable range instead');
}

function metadataErrors(body, proposal, errors, editorial) {
  if (proposal !== undefined) {
    if (proposal === null || typeof proposal !== 'object' || Array.isArray(proposal)) return [...errors, 'Metadata proposal must be an object'];
    const allowed = new Set(['summary', 'description', 'vulnerabilities', 'cwe_ids', 'cvss_vector_string']);
    for (const key of Object.keys(proposal)) if (!allowed.has(key)) errors.push(`Field is outside body/metadata scope: ${key}`);
    if (proposal.description !== undefined && proposal.description !== body) errors.push('Proposed description differs from reviewed body');
    if (proposal.summary !== undefined && (typeof proposal.summary !== 'string' || !proposal.summary.trim())) errors.push('Summary must be nonempty text');
    else if (proposal.summary !== undefined && editorial) {
      const packages = Array.isArray(proposal.vulnerabilities) ? [...new Set(proposal.vulnerabilities.map(v => v?.package?.name).filter(name => typeof name === 'string' && name.trim()))] : [];
      const prefix = /^(\S+): \S/.exec(proposal.summary)?.[1];
      if (!prefix) errors.push(`Title must start with an affected package name followed by ": ", for example "${packages[0] ?? 'package-name'}: "`);
      else if (packages.length && !packages.includes(prefix)) errors.push(`Title package ${prefix} is not one of the affected packages: ${packages.join(', ')}`);
      if (/[`\u2014]/.test(proposal.summary)) errors.push('Title must not contain code formatting or em dashes');
      if (/\b(?:critical|high|medium|low)[- ]severity\b|\bCVSS\b/i.test(proposal.summary)) errors.push('Title must not state severity');
      if (proposal.summary.length > 100) errors.push('Title should stay under about 90 characters');
    }
    const { cwe_ids: cwes, cvss_vector_string: vector } = proposal;
    if (cwes == null || (Array.isArray(cwes) && !cwes.length)) errors.push('Missing CWE IDs');
    else if (!Array.isArray(cwes) || cwes.some(c => !/^CWE-[0-9]+$/.test(c))) errors.push('Invalid CWE IDs');
    if (vector == null) errors.push('Missing CVSS 3.1 vector');
    else if (typeof vector === 'string' && /^CVSS:4\.0\//.test(vector)) errors.push('Advisory has only a CVSS 4.0 vector; the scoring rubric uses CVSS 3.1');
    else if (typeof vector !== 'string' || !/^CVSS:3\.1\//.test(vector)) errors.push('Expected a CVSS 3.1 vector');
    if (proposal.vulnerabilities !== undefined) {
      if (!Array.isArray(proposal.vulnerabilities) || !proposal.vulnerabilities.length) errors.push('Vulnerabilities must be a nonempty complete package list');
      else for (const v of proposal.vulnerabilities) {
        if (!v || typeof v !== 'object' || !v.package || typeof v.package.name !== 'string' || !v.package.name.trim() || typeof v.package.ecosystem !== 'string' || !v.package.ecosystem.trim() || typeof v.vulnerable_version_range !== 'string' || !v.vulnerable_version_range.trim()) errors.push('Package identity and affected range are required');
        if (typeof v?.package?.name === 'string' && v.package.name.trim() && v.package.name !== v.package.name.trim()) errors.push(`Package name ${JSON.stringify(v.package.name)} has leading or trailing whitespace`);
        if (v && v.patched_versions !== undefined && v.patched_versions !== null && (typeof v.patched_versions !== 'string' || !v.patched_versions.trim())) errors.push('Patched versions must be a known range or null');
        // A closed range may end where the code continues in another entry: an affected stable release after a pre-release line, or a package the plugin moved to.
        const openEnded = proposal.vulnerabilities.some(o => o !== v && typeof o?.vulnerable_version_range === 'string' && !o.vulnerable_version_range.includes('<'));
        if (typeof v?.vulnerable_version_range === 'string' && v.vulnerable_version_range.includes('<') && !openEnded && (typeof v.patched_versions !== 'string' || !v.patched_versions.trim())) errors.push(`Closed range ${v.vulnerable_version_range} needs a patched version; an unfixed range stays open-ended`);
      }
    }
  }
  return errors;
}

export function draftWarnings(body, { editorial = true } = {}) {
  if (!editorial) return [];
  const lead = body.split(/^## /m).slice(1).filter(s => order.slice(0, 4).includes(s.split('\n', 1)[0].trim())).map(s => s.replace(/^.*(?:\n|$)/, '')).join('\n');
  const words = lead.match(/\S*[\p{L}\p{N}]\S*/gu)?.length ?? 0;
  const spans = lead.match(/`[^`\n]+`/g)?.length ?? 0;
  const warnings = [];
  if (/^## Credit$/m.test(body)) warnings.push('Credit section present; keep it only for attribution the advisory credits field does not carry');
  if (/\bCVE-\d{4}-\d{4,}\b/i.test(body)) warnings.push('CVE identifier in the body; the advisory\'s own CVE lives in its metadata, so cite only other projects\' CVEs');
  if (words > 250) warnings.push(`The first four sections run ${words} words; move precision into Technical details to stay near 250`);
  if (spans > 10) warnings.push(`The first four sections use ${spans} code spans; keep near 10 by naming only what readers configure or search for`);
  return warnings;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) { console.log('Usage: node check-draft.mjs advisory.md [metadata-proposal.json] [--metadata-only]'); process.exit(0); }
    const editorial = !args.includes('--metadata-only');
    const [bodyFile, proposalFile] = args.filter(a => a !== '--metadata-only');
    if (!bodyFile) throw new Error('Usage: node check-draft.mjs advisory.md [metadata-proposal.json] [--metadata-only]');
    const body = readFileSync(bodyFile, 'utf8');
    for (const warning of draftWarnings(body, { editorial })) console.warn(`Warning: ${warning}`);
    const errors = checkDraft(body, proposalFile ? JSON.parse(readFileSync(proposalFile, 'utf8')) : undefined, { editorial });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Draft checks passed. Evidence, scoring accuracy, readability, and human approval still require review. No remote action occurred.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
