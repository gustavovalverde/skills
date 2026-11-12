#!/usr/bin/env node
// Claude Code PreToolUse hook for the Bash tool. It checks the title and body of
// `gh pr create` and `gh pr edit` with check-body.mjs and denies a call that
// exceeds the limits. Usage: node gh-pr-hook.mjs [--note "TEXT"] < hook-input.json
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBody } from './check-body.mjs';

const VALUE = `(?:"((?:[^"\\\\]|\\\\.)*)"|'([^']*)'|(\\S+))`;
// gh only at the start of a command, with its arguments up to the next unquoted separator.
const CALL = /(?:^|[;&|(])\s*(?:[A-Za-z_]\w*=\S+\s+)*gh pr (?:create|edit)\b((?:"(?:[^"\\]|\\.)*"|'[^']*'|\\\n|[^;&|\n"'])*)/m;

const value = match => match.slice(1).find(group => group !== undefined) ?? '';
const expand = path => (path === '~' || path.startsWith('~/') ? join(homedir(), path.slice(1)) : path);
const isFile = path => existsSync(path) && statSync(path).isFile();

// Returns undefined when the command posts no PR body, or { decision, text }.
export function decide(input, { note = '' } = {}) {
  const command = input?.tool_input?.command ?? '';
  const call = CALL.exec(command);
  if (!call) return undefined;
  const args = call[1];
  const bodyFile = new RegExp(`(?:--body-file|(?<=\\s)-F)[=\\s]+${VALUE}`).exec(args);
  const inlineBody = /(?<=\s)(?:--body(?!-file)|-b)(?:[=\s]|$)/.test(args);
  if (!bodyFile && !inlineBody) return undefined;
  if (inlineBody) return { decision: 'deny', text: 'Write the PR body to a file in an earlier step and pass it with --body-file, so the body check can read it.' };
  const given = value(bodyFile);
  if (given === '-') return { decision: 'allow', text: note };
  let path = expand(given);
  if (!isAbsolute(path)) {
    const bases = [input.cwd ?? process.cwd()];
    const moved = new RegExp(`\\bcd\\s+${VALUE}`).exec(command.slice(0, call.index));
    if (moved) bases.unshift(expand(value(moved)));
    path = bases.map(base => join(base, path)).find(isFile) ?? path;
  }
  if (!isFile(path)) return { decision: 'deny', text: `The body file ${given} does not exist yet. Write it in an earlier step, then pass its absolute path with --body-file.` };
  const options = {};
  const title = new RegExp(`(?:--title|(?<=\\s)-t)[=\\s]+${VALUE}`).exec(args);
  if (title) options.title = value(title);
  const limit = /\bPR_BODY_MAX_WORDS=(\d+)/.exec(command);
  if (limit) options.maxWords = Number(limit[1]);
  const { errors, words } = checkBody(readFileSync(path, 'utf8'), options);
  if (errors.length) {
    return { decision: 'deny', text: `The PR title or body exceeds the pr-writing limits:\n${errors.join('\n')}\nRevise it with the pr-writing skill and try again. Only when the user asked for a longer body, prefix the command with PR_BODY_MAX_WORDS=N.` };
  }
  return { decision: 'allow', text: `Body checks passed: ${words} words outside code blocks.${note ? ` ${note}` : ''}` };
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  // A hook that fails must not block every Bash call, so errors exit quietly.
  try {
    const args = process.argv.slice(2);
    const note = args[0] === '--note' ? args[1] ?? '' : '';
    const result = decide(JSON.parse(readFileSync(0, 'utf8')), { note });
    if (result && (result.decision === 'deny' || result.text)) {
      const key = result.decision === 'deny' ? 'permissionDecisionReason' : 'additionalContext';
      console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: result.decision, [key]: result.text } }));
    }
  } catch { /* stay silent */ }
}
