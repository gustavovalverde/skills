#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';

import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const usage = 'Usage: node release-lines.mjs --repo CHECKOUT (--commit SHA | --pr NUMBER)... [--package NPM_NAME]';
const tagPattern = /^(?:(.+)@)?v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
const assert = (ok, message) => { if (!ok) throw new Error(message); };

export function parseVersion(tag) {
  const m = tagPattern.exec(String(tag).trim());
  if (!m) return null;
  const [, pkg, major, minor, patch, prerelease] = m;
  return { raw: tag, pkg: pkg ?? null, major: Number(major), minor: Number(minor), patch: Number(patch), prerelease: prerelease ?? null };
}

export function compareVersions(a, b) {
  for (const key of ['major', 'minor', 'patch']) if (a[key] !== b[key]) return a[key] - b[key];
  if (!a.prerelease || !b.prerelease) return !a.prerelease - !b.prerelease;
  const ap = a.prerelease.split('.'), bp = b.prerelease.split('.');
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    if (ap[i] === undefined) return -1;
    if (bp[i] === undefined) return 1;
    const an = /^\d+$/.test(ap[i]), bn = /^\d+$/.test(bp[i]);
    if (an && bn) { if (Number(ap[i]) !== Number(bp[i])) return Number(ap[i]) - Number(bp[i]); }
    else if (an || bn) return an ? -1 : 1;
    else if (ap[i] !== bp[i]) return ap[i] < bp[i] ? -1 : 1;
  }
  return 0;
}

export function groupByLine(versions) {
  const groups = {};
  for (const v of versions) (groups[v.prerelease ? `${v.major}.${v.minor}.${v.patch}-${v.prerelease.split('.')[0]}` : `${v.major}.${v.minor}`] ??= []).push(v);
  for (const group of Object.values(groups)) group.sort(compareVersions);
  return groups;
}

export function firstFixedPerLine(versions) {
  return Object.fromEntries(Object.entries(groupByLine(versions)).map(([line, group]) => [line, group[0]]));
}

const plain = v => `${v.major}.${v.minor}.${v.patch}${v.prerelease ? `-${v.prerelease}` : ''}`;
const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).split('\n').filter(Boolean);
const npmVersions = name => [JSON.parse(execFileSync('npm', ['view', name, 'versions', '--json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }))].flat();

export function main(argv = process.argv.slice(2), registry = npmVersions) {
  if (argv.includes('--help') || argv.includes('-h')) return usage;
  const { values: o } = parseArgs({ args: argv, options: { repo: { type: 'string' }, commit: { type: 'string', multiple: true }, pr: { type: 'string', multiple: true }, package: { type: 'string' } } });
  assert(o.repo && (o.commit || o.pr), usage);
  for (const pr of o.pr ?? []) assert(/^\d+$/.test(pr), `Invalid PR number: ${pr}`);
  const shas = [...(o.commit ?? []), ...(o.pr ?? []).flatMap(pr => {
    const found = git(o.repo, ['log', '--all', '--extended-regexp', `--grep=\\(#${pr}\\)$`, '--format=%H']);
    assert(found.length, `No commit found with a subject ending in (#${pr})`);
    return found;
  })];
  const tags = new Set(shas.flatMap(sha => git(o.repo, ['tag', '--contains', sha])));
  const versions = [...tags].map(parseVersion).filter(v => v && (!o.package || v.pkg === null || v.pkg === o.package));
  assert(versions.length, 'No release tag contains these commits');
  const published = o.package ? new Set(registry(o.package)) : null;
  const releases = published && groupByLine([...published].map(parseVersion).filter(Boolean));
  const lines = Object.entries(firstFixedPerLine(versions)).sort(([, a], [, b]) => compareVersions(a, b)).flatMap(([line, fixed]) => {
    const earlier = fixed.prerelease ? (releases?.[line] ?? []).filter(v => compareVersions(v, fixed) < 0) : [];
    return [`${line}: ${fixed.raw}${published ? (published.has(plain(fixed)) ? ' (published)' : ' (unpublished)') : ''}`, ...(earlier.length ? [`  affected pre-releases: ${earlier.map(plain).join(', ')}`] : [])];
  });
  return [...lines, 'A line not listed has no release tag containing these commits; check whether it is affected or needs a backport.'].join('\n');
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try { console.log(main()); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
