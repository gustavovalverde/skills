import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = dirname(dirname(fileURLToPath(import.meta.url)));

// Skill installers link skill folders into agent directories, so helpers must run through a symlinked path.
test('helpers run when the skill folder is reached through a symlink', () => {
  const dir = mkdtempSync(join(tmpdir(), 'advisory-entrypoint-'));
  try {
    const linked = join(dir, 'linked-skill');
    symlinkSync(skill, linked, 'dir');
    const run = (script, args = []) => spawnSync(process.execPath, [join(linked, 'scripts', script), ...args], { encoding: 'utf8', cwd: dir });
    const scored = run('cvss.mjs', ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N']);
    assert.equal(scored.status, 0);
    assert.match(scored.stdout, /^9\.1 Critical /);
    for (const script of ['check-draft.mjs', 'audit-advisories.mjs', 'release-lines.mjs', 'advisory-update.mjs', 'workspace.mjs']) {
      const result = run(script);
      assert.notEqual(result.status, 0, `${script} exited 0 without arguments`);
      assert.match(result.stderr + result.stdout, /usage/i, `${script} printed no usage`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
