# BulkSend Contract

A free public bulk send contract service supporting native tokens, ERC20, ERC721, and ERC1155.

## Quick Start

```bash
# Install dependencies
forge install

# Build
forge build

# Test
forge test

# Test with verbosity
forge test -vvv

# Gas report
forge test --gas-report

# Format
forge fmt
```

## Project Structure

```
contracts/
├── contracts/
│   ├── evm/
│   │   └── BulkSend.sol      # EVM version
│   └── tron/
│       └── BulkSend.sol      # Tron version
├── test/
│   ├── unit/                  # Unit tests
│   ├── gas/                   # Gas benchmarks
│   └── mocks/                 # Mock contracts
├── script/
│   └── Deploy.s.sol          # Foundry deploy script
└── config/
    ├── chains.json           # Chain configurations
    ├── testnet.json          # Testnet chain list
    └── mainnet.json          # Mainnet chain list
```

## Contract Functions

### Native Token
- `sendNative(TokenTransfer[] transfers)` - Send different amounts
- `sendNativeSameAmount(address[] recipients, uint256 amount)` - Send same amount

### ERC20 Token
- `sendToken(address token, TokenTransfer[] transfers)` - Send different amounts
- `sendTokenSameAmount(address token, address[] recipients, uint256 amount)` - Send same amount

### ERC721 NFT
- `sendERC721(address token, ERC721Transfer[] transfers)` - Send NFTs

### ERC1155 Multi-Token
- `sendERC1155(address token, ERC1155Transfer[] transfers)` - Send different tokens/amounts
- `sendERC1155SameToken(address token, address[] recipients, uint256 tokenId, uint256 amount)` - Send same token

### Emergency (Owner Only)
- `withdrawStuckNative(address to)` - Withdraw stuck native tokens
- `withdrawStuckToken(address token, address to)` - Withdraw stuck ERC20
- `withdrawStuckERC721(address token, address to, uint256 tokenId)` - Withdraw stuck NFT
- `withdrawStuckERC1155(address token, address to, uint256 tokenId, uint256 amount)` - Withdraw stuck ERC1155

## Deployment

```bash
# Deploy to a network
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast --verify

# Example: Deploy to Ethereum mainnet
forge script script/Deploy.s.sol --rpc-url ethereum --broadcast --verify
```

## Supported Chains

**P0 (Priority)**
- Ethereum
- BNB Chain
- Tron (separate contract)

**P1**
- Arbitrum One
- Polygon
- Base

**P2**
- Optimism
- Avalanche
- Linea
- zkSync Era
