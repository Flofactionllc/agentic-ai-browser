#!/usr/bin/env node
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const checks = [];

function ok(msg) {
  checks.push({ ok: true, msg });
}
function bad(msg) {
  checks.push({ ok: false, msg });
}

const major = Number(process.versions.node.split('.')[0]);
if (major >= 20) ok(`Node ${process.versions.node}`);
else bad(`Node ${process.versions.node} — need >= 20`);

for (const f of [
  'package.json',
  'docs/INSPECTION.md',
  'docs/DESIGN.md',
  'docs/COMMERCIAL.md',
  'THIRD_PARTY_NOTICES.md',
  'src/app/MissionControl.js',
  'src/config/divisions.js',
]) {
  if (fs.existsSync(path.join(root, f))) ok(`found ${f}`);
  else bad(`missing ${f}`);
}

try {
  require.resolve('cesium', { paths: [root] });
  ok('cesium dependency resolvable');
} catch {
  bad('cesium not installed — run npm install in flo-eye-view/');
}

try {
  require.resolve('vite', { paths: [root] });
  ok('vite dependency resolvable');
} catch {
  bad('vite not installed — run npm install in flo-eye-view/');
}

// Commercial safety: ensure we did not vendor NC GEV datasets
const banned = [
  'telegeography_submarine_cables',
  'bhote-koshi-2026',
  'bhoteKoshiFloodPath',
];
for (const b of banned) {
  const hit = walkContains(root, b);
  if (hit) bad(`banned NC reference found: ${hit}`);
  else ok(`no banned payload: ${b}`);
}

console.log('\nFlo Eye View doctor\n');
for (const c of checks) console.log(`${c.ok ? '✔' : '✖'} ${c.msg}`);
const failed = checks.filter((c) => !c.ok).length;
console.log(failed ? `\n${failed} issue(s)\n` : '\nReady for local Mission Control.\n');
process.exit(failed ? 1 : 0);

function walkContains(dir, needle, depth = 0) {
  if (depth > 4) return null;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const ent of entries) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.name.includes(needle) || p.includes(needle)) return p;
    if (ent.isDirectory()) {
      const nested = walkContains(p, needle, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}
