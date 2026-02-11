# Rescue Stuck Assets - Design

## Overview

Add a separate page to the deploy-app for withdrawing assets accidentally sent to BulkSend contracts. Supports both EVM and Tron chains. Only the contract owner can execute these functions.

## Contract Functions

### EVM
- `withdrawStuckNative(address to)` — withdraw all native token balance
- `withdrawStuckToken(address token, address to)` — withdraw all ERC20 balance
- `withdrawStuckERC721(address token, address to, uint256 tokenId)` — withdraw specific NFT
- `withdrawStuckERC1155(address token, address to, uint256 tokenId, uint256 amount)` — withdraw specific amount

### Tron
- `withdrawStuckTRX(address to)`
- `withdrawStuckTRC20(address token, address to)`
- `withdrawStuckTRC721(address token, address to, uint256 tokenId)`
- `withdrawStuckTRC1155(address token, address to, uint256 tokenId, uint256 amount)`

## UI Design

### Routing
- Add `react-router-dom`
- `/` — existing Deploy page (unchanged)
- `/rescue` — new Rescue Assets page
- Shared top navigation bar (Deploy | Rescue Assets)

### Rescue Page Layout
- Top: EVM / Tron tab toggle (same style as deploy page)
- Common fields:
  - Chain selector (EVM only, single select dropdown)
  - Contract Address (manual input)
  - Recipient Address (defaults to connected wallet)
- Asset type toggle: `Native | ERC20 | ERC721 | ERC1155`
  - **Native**: no extra fields
  - **ERC20**: Token Address
  - **ERC721**: Token Address + Token ID
  - **ERC1155**: Token Address + Token ID + Amount
- Withdraw button
- Transaction status + explorer link

## File Structure

New files:
- `src/pages/DeployPage.tsx` — extract existing deploy content from App.tsx
- `src/pages/RescuePage.tsx` — page shell with EVM/Tron tabs
- `src/components/NavBar.tsx` — shared navigation
- `src/components/RescueAssets.tsx` — EVM rescue form + logic
- `src/components/TronRescueAssets.tsx` — Tron rescue form + logic

Modified files:
- `src/App.tsx` — replace with router setup
- `src/config/contract.ts` — add withdraw function ABIs

No changes needed:
- `src/config/tron-contract.ts` — already has full ABI including withdraw functions

## Technical Approach

- EVM: wagmi `writeContract` + `waitForTransactionReceipt` (same pattern as TransferOwnership)
- Tron: `tronWeb.contract().at(address)` to load contract instance, call methods directly

## Out of Scope

- No balance pre-query
- No batch operations
- No address book / history
