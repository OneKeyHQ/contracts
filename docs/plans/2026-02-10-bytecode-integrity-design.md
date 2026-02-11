# Bytecode Integrity & Verification Pipeline Design

## Problem

The deploy-app uses hardcoded bytecode strings that are manually copy-pasted from Foundry build output. There is no automated mechanism to ensure the bytecode matches the Solidity source code. This has already caused an incident where deployed contracts were missing `ViaContract` functions (commit `7ad3975`).

## Goals

1. **Bytecode generation**: Auto-generate TypeScript config from Foundry build artifacts
2. **CI verification**: Fail CI if committed bytecode doesn't match fresh compilation
3. **Post-deploy verification**: Auto-submit source code to Etherscan after deployment
4. **Tron separation**: Separate pipeline for Tron (Phase 2)

## Migration Plan

1. Create `scripts/generate-bytecode.mjs`
2. Create `scripts/verify-bytecode.mjs`
3. Run generate → produces `contract.generated.ts`
4. Update all imports from `contract.ts` → `contract.generated.ts`
5. Delete `contract.ts` and `tron-bytecode.txt`
6. Add `verify-bytecode` job to CI
7. Implement `deploy-app/src/utils/verify.ts`
8. Integrate verification into `DeployButton.tsx`
9. Update `.env.example` with explorer API key variables
10. Update `CLAUDE.md` documentation
