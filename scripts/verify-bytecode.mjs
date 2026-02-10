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

// EVM paths
const EVM_ARTIFACT_PATH = resolve(ROOT, 'out/BulkSend.sol/BulkSend.json');
const EVM_GENERATED_PATH = resolve(ROOT, 'deploy-app/src/config/contract.generated.ts');

// Tron paths
const TRON_ARTIFACT_PATH = resolve(ROOT, 'out-tron/tron/BulkSend.sol/BulkSend.json');
const TRON_GENERATED_PATH = resolve(ROOT, 'deploy-app/src/config/tron-contract.generated.ts');

function extractBytecodeFromTS(content, varName = 'BULK_SEND_BYTECODE') {
  const re = new RegExp(`${varName}\\s*=\\s*'(0x[0-9a-fA-F]+)'`);
  const match = content.match(re);
  return match ? match[1] : null;
}

function extractABIFromTS(content, varName = 'BULK_SEND_ABI') {
  const re = new RegExp(`${varName}\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*as\\s*const`);
  const match = content.match(re);
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

function verifyContract({ label, artifactPath, generatedPath, bytecodeVar, abiVar }) {
  console.log(`--- ${label} ---`);

  // Read fresh artifact
  let artifact;
  try {
    artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));
  } catch (e) {
    console.error(`Error: Cannot read build artifact at ${artifactPath}`);
    console.error('Make sure to run the appropriate forge build before verification.');
    return false;
  }

  // Read committed generated file
  let generatedContent;
  try {
    generatedContent = readFileSync(generatedPath, 'utf-8');
  } catch (e) {
    console.error(`Error: Cannot read generated file at ${generatedPath}`);
    console.error('Run "npm run generate" in deploy-app/ to create it.');
    return false;
  }

  const expectedBytecode = artifact.bytecode.object;
  const committedBytecode = extractBytecodeFromTS(generatedContent, bytecodeVar);

  const expectedABI = artifact.abi;
  const committedABI = extractABIFromTS(generatedContent, abiVar);

  let ok = true;

  // Compare bytecode
  if (!committedBytecode) {
    console.error(`ERROR: Could not parse ${bytecodeVar} from generated file.`);
    ok = false;
  } else if (expectedBytecode !== committedBytecode) {
    console.error('BYTECODE MISMATCH!');
    console.error(`  Expected (forge build): ${preview(expectedBytecode)} (${expectedBytecode.length} chars)`);
    console.error(`  Found (generated.ts):   ${preview(committedBytecode)} (${committedBytecode.length} chars)`);
    ok = false;
  } else {
    console.log(`Bytecode: MATCH (${expectedBytecode.length} chars)`);
  }

  // Compare ABI
  if (!committedABI) {
    console.error(`ERROR: Could not parse ${abiVar} from generated file.`);
    ok = false;
  } else {
    const expectedJSON = JSON.stringify(expectedABI);
    const committedJSON = JSON.stringify(committedABI);
    if (expectedJSON !== committedJSON) {
      console.error('ABI MISMATCH!');
      console.error(`  Expected entries: ${expectedABI.length}`);
      console.error(`  Found entries:    ${committedABI.length}`);
      ok = false;
    } else {
      console.log(`ABI: MATCH (${expectedABI.length} entries)`);
    }
  }

  return ok;
}

// ---- Main ----

console.log('Verifying bytecode integrity...\n');

const evmOk = verifyContract({
  label: 'EVM Contract',
  artifactPath: EVM_ARTIFACT_PATH,
  generatedPath: EVM_GENERATED_PATH,
  bytecodeVar: 'BULK_SEND_BYTECODE',
  abiVar: 'BULK_SEND_ABI',
});

console.log('');

const tronOk = verifyContract({
  label: 'Tron Contract',
  artifactPath: TRON_ARTIFACT_PATH,
  generatedPath: TRON_GENERATED_PATH,
  bytecodeVar: 'TRON_BULK_SEND_BYTECODE',
  abiVar: 'TRON_BULK_SEND_ABI',
});

if (!evmOk || !tronOk) {
  console.error('\nVerification FAILED.');
  console.error('Run "npm run generate" in deploy-app/ to update the generated files.');
  process.exit(1);
} else {
  console.log('\nAll verifications PASSED.');
}
