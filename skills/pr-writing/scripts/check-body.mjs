#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TITLE_MAX = 72;
export const SUMMARY_SENTENCES_MAX = 3;
export const SUMMARY_BULLETS_MAX = 4;
export const WORDS_MAX = 400;

const USAGE = 'Usage: node check-body.mjs BODY.md [--title "TITLE"] [--max-words N]';

const FENCE = /^(`{3,}|~{3,})[^]*?^\1[^\S\n]*$/gm;

function prose(text) {
  return text.replace(FENCE, '').replace(/<!--[^]*?-->/g, '');
}

export function countWords(body) {
  return prose(body).split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
}

export function countSentences(text) {
  const flat = text
    .replace(/`[^`\n]*`/g, 'code')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\b(?:e\.g|i\.e|etc|vs)\./gi, 'abbr');
  return flat.split(/[.!?]+(?=\s|$)/).filter(part => /[\p{L}\p{N}]/u.test(part)).length;
}

function sections(body) {
  const text = body.replace(FENCE, '\n(code block)\n').replace(/<!--[^]*?-->/g, '');
  const found = [];
  const heading = /^(#{1,6})[^\S\n]+(.+?)[^\S\n]*$/gm;
  let match;
  while ((match = heading.exec(text))) found.push({ level: match[1].length, name: match[2], start: match.index, end: heading.lastIndex });
  return found.map((section, i) => {
    const next = found.slice(i + 1).find(other => other.level <= section.level);
    return { ...section, text: text.slice(section.end, next ? next.start : text.length).trim() };
  });
}

export function checkBody(body, { title, maxWords = WORDS_MAX } = {}) {
  const errors = [];
  if (title !== undefined) {
    const length = [...title.trim()].length;
    if (!length) errors.push('Title is empty');
    if (length > TITLE_MAX) errors.push(`Title has ${length} characters; keep it to ${TITLE_MAX} or split the PR`);
  }
  if (/<!--/.test(body.replace(FENCE, ''))) errors.push('Template comment left in the body; remove HTML comments');
  for (const section of sections(body)) {
    const content = section.text.replace(/^#{1,6}[^\S\n].*$/gm, '').trim();
    if (!content) errors.push(`"${section.name}" is empty; delete the section`);
    else if (/^(?:none|n\/?a|not applicable|nothing)\.?$/i.test(content)) errors.push(`"${section.name}" says "${content}"; delete the section`);
    if (!/^summary$/i.test(section.name)) continue;
    const bullets = content.split('\n').filter(line => /^\s*(?:[-*+]|\d+\.)\s/.test(line)).length;
    const sentences = countSentences(content.replace(/^\s*(?:[-*+]|\d+\.)\s/gm, ''));
    if (bullets > SUMMARY_BULLETS_MAX) errors.push(`Summary has ${bullets} bullets; keep it to ${SUMMARY_BULLETS_MAX}`);
    else if (!bullets && sentences > SUMMARY_SENTENCES_MAX) errors.push(`Summary has ${sentences} sentences; keep it to ${SUMMARY_SENTENCES_MAX} and move the rest to reviewer notes`);
  }
  const words = countWords(body);
  if (words > maxWords) errors.push(`Body has ${words} words outside code blocks; keep it under ${maxWords}`);
  return { errors, words };
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) { console.log(USAGE); process.exit(0); }
    const options = {};
    const files = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--title') options.title = args[++i];
      else if (args[i] === '--max-words') options.maxWords = Number(args[++i]);
      else if (args[i].startsWith('--')) throw new Error(`Unknown option ${args[i]}\n${USAGE}`);
      else files.push(args[i]);
    }
    if (files.length !== 1) throw new Error(USAGE);
    if (args.includes('--title') && options.title === undefined) throw new Error(`--title needs a value\n${USAGE}`);
    if (args.includes('--max-words') && !(options.maxWords > 0)) throw new Error(`--max-words needs a positive number\n${USAGE}`);
    const { errors, words } = checkBody(readFileSync(files[0], 'utf8'), options);
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`Body checks passed: ${words} words outside code blocks. Accuracy, evidence, and what to leave out still need review.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
