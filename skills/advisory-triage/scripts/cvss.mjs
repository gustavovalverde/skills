#!/usr/bin/env node
import { realpathSync } from 'node:fs';

import { fileURLToPath } from 'node:url';

const weights = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  UI: { N: 0.85, R: 0.62 },
  C: { H: 0.56, L: 0.22, N: 0 },
  I: { H: 0.56, L: 0.22, N: 0 },
  A: { H: 0.56, L: 0.22, N: 0 },
};
const privileges = { U: { N: 0.85, L: 0.62, H: 0.27 }, C: { N: 0.85, L: 0.68, H: 0.5 } };
const order = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];

// CVSS 3.1 Appendix A: round up to one decimal without floating-point drift.
const roundUp = x => {
  const i = Math.round(x * 100000);
  return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10;
};
const severity = s => (s === 0 ? 'None' : s < 4 ? 'Low' : s < 7 ? 'Medium' : s < 9 ? 'High' : 'Critical');

export function parseVector(vector) {
  const parts = String(vector).split('/');
  if (parts[0] !== 'CVSS:3.1' || parts.length !== 9) throw new Error(`Expected a complete CVSS:3.1 Base vector: ${vector}`);
  const metrics = Object.fromEntries(parts.slice(1).map(p => p.split(':')));
  parts.slice(1).forEach((p, i) => {
    const [key, value] = p.split(':');
    const allowed = key === 'PR' ? ['N', 'L', 'H'] : key === 'S' ? ['U', 'C'] : Object.keys(weights[key] ?? {});
    if (key !== order[i] || !allowed.includes(value)) throw new Error(`Invalid or out-of-order metric ${p} in ${vector}`);
  });
  return metrics;
}

export function cvssScore(vector) {
  const m = parseVector(vector);
  const iss = 1 - (1 - weights.C[m.C]) * (1 - weights.I[m.I]) * (1 - weights.A[m.A]);
  const impact = m.S === 'U' ? 6.42 * iss : 7.52 * (iss - 0.029) - 3.25 * (iss - 0.02) ** 15;
  const exploitability = 8.22 * weights.AV[m.AV] * weights.AC[m.AC] * privileges[m.S][m.PR] * weights.UI[m.UI];
  const score = impact <= 0 ? 0 : roundUp(Math.min(m.S === 'U' ? impact + exploitability : 1.08 * (impact + exploitability), 10));
  return { score, severity: severity(score) };
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    if (process.argv.length < 3) throw new Error('Usage: node cvss.mjs CVSS:3.1/AV:_/AC:_/PR:_/UI:_/S:_/C:_/I:_/A:_ [...]');
    for (const vector of process.argv.slice(2)) {
      const { score, severity: label } = cvssScore(vector);
      console.log(`${score.toFixed(1)} ${label} ${vector}`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
