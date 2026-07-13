#!/usr/bin/env node
/**
 * Merge V2-only ABI fragments into the shared Cosmic Game JSON ABI.
 * Skips entries that already exist (same type + name + input types).
 *
 * Ported from the blue frontend (scripts/merge-cosmic-game-v2-abi.mjs),
 * extended to also merge custom error fragments (used by errorDecoder.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const fragments = JSON.parse(
  fs.readFileSync(path.join(root, 'src/contracts/cosmicGameV2AbiFragments.json'), 'utf8'),
);

const targets = ['CosmicGame.json'];

function fragmentKey(item) {
  if (item.type !== 'function' && item.type !== 'error') return null;
  return `${item.type}:${item.name}:${JSON.stringify(item.inputs)}`;
}

for (const fileName of targets) {
  const filePath = path.join(root, 'src/contracts', fileName);
  const abi = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const existing = new Set(abi.map(fragmentKey).filter(Boolean));
  let added = 0;
  for (const fragment of fragments) {
    const key = fragmentKey(fragment);
    if (!key || existing.has(key)) continue;
    abi.push(fragment);
    existing.add(key);
    added++;
  }
  fs.writeFileSync(filePath, `${JSON.stringify(abi, null, 2)}\n`);
  console.log(`${fileName}: added ${added} V2 fragment(s)`);
}
