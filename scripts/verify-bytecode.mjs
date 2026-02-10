#!/usr/bin/env node

/**
 * verify-bytecode.mjs
 *
 * CI verification script: compares the committed contract.generated.ts
 * against a fresh forge build to ensure bytecode integrity.
 *
 * Usage: node scripts/verify-bytecode.mjs
 * Expects: forge build has already been run (out/ directory exists)
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ARTIFACT_PATH = resolve(ROOT, 'out/BulkSend.sol/BulkSend.json');
const GENERATED_PATH = resolve(ROOT, 'deploy-app/src/config/contract.generated.ts');

function extractBytecodeFromTS(content) {
  const match = content.match(/BULK_SEND_BYTECODE\s*=\s*'(0x[0-9a-fA-F]+)'/);
  return match ? match[1] : null;
}

function extractABIFromTS(content) {
  // Match the ABI array between "BULK_SEND_ABI = " and " as const;"
  const match = content.match(/BULK_SEND_ABI\s*=\s*(\[[\s\S]*?\])\s*as\s*const/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function preview(str, len = 60) {
  if (!str) return '(null)';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

// ---- Main ----

console.log('Verifying bytecode integrity...\n');

// Read fresh artifact
let artifact;
try {
  artifact = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf-8'));
} catch (e) {
  console.error(`Error: Cannot read build artifact at ${ARTIFACT_PATH}`);
  console.error('Make sure to run "forge build" before verification.');
  process.exit(1);
}

// Read committed generated file
let generatedContent;
try {
  generatedContent = readFileSync(GENERATED_PATH, 'utf-8');
} catch (e) {
  console.error(`Error: Cannot read generated file at ${GENERATED_PATH}`);
  console.error('Run "npm run generate" in deploy-app/ to create it.');
  process.exit(1);
}

const expectedBytecode = artifact.bytecode.object;
const committedBytecode = extractBytecodeFromTS(generatedContent);

const expectedABI = artifact.abi;
const committedABI = extractABIFromTS(generatedContent);

let failed = false;

// Compare bytecode
if (!committedBytecode) {
  console.error('ERROR: Could not parse BULK_SEND_BYTECODE from generated file.');
  failed = true;
} else if (expectedBytecode !== committedBytecode) {
  console.error('BYTECODE MISMATCH!');
  console.error(`  Expected (forge build): ${preview(expectedBytecode)} (${expectedBytecode.length} chars)`);
  console.error(`  Found (generated.ts):   ${preview(committedBytecode)} (${committedBytecode.length} chars)`);
  failed = true;
} else {
  console.log(`Bytecode: MATCH (${expectedBytecode.length} chars)`);
}

// Compare ABI
if (!committedABI) {
  console.error('ERROR: Could not parse BULK_SEND_ABI from generated file.');
  failed = true;
} else {
  const expectedJSON = JSON.stringify(expectedABI);
  const committedJSON = JSON.stringify(committedABI);
  if (expectedJSON !== committedJSON) {
    console.error('ABI MISMATCH!');
    console.error(`  Expected entries: ${expectedABI.length}`);
    console.error(`  Found entries:    ${committedABI.length}`);
    failed = true;
  } else {
    console.log(`ABI: MATCH (${expectedABI.length} entries)`);
  }
}

if (failed) {
  console.error('\nVerification FAILED.');
  console.error('Run "npm run generate" in deploy-app/ to update the generated file.');
  process.exit(1);
} else {
  console.log('\nVerification PASSED.');
}
