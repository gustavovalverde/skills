import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = dirname(dirname(fileURLToPath(import.meta.url)));

// Skill installers link skill folders into agent directories, so the helper must run through a symlinked path.
test('the ledger runs when the skill folder is reached through a symlink', () => {
  const dir = mkdtempSync(join(tmpdir(), 'backlog-entrypoint-'));
  try {
    const linked = join(dir, 'linked-skill');
    symlinkSync(skill, linked, 'dir');
    const result = spawnSync(process.execPath, [join(linked, 'scripts', 'ledger.mjs')], { encoding: 'utf8', cwd: dir });
    assert.notEqual(result.status, 0, 'ledger.mjs exited 0 without arguments');
    assert.match(result.stderr + result.stdout, /usage/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
