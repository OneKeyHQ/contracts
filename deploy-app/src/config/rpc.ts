/**
 * RPC endpoints configuration with fallbacks for each supported chain.
 * Multiple public RPC endpoints are provided per chain to handle:
 * - RPC unavailability
 * - Rate limiting
 * - Network issues
 *
 * Endpoints are tried in order until one succeeds.
 */

export const RPC_ENDPOINTS: Record<number, string[]> = {
  // Ethereum Mainnet (chainId: 1)
  1: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://1rpc.io/eth',
    'https://ethereum.publicnode.com',
  ],

  // BNB Smart Chain (chainId: 56)
  56: [
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.defibit.io',
    'https://rpc.ankr.com/bsc',
    'https://1rpc.io/bnb',
    'https://bsc.publicnode.com',
  ],

  // Arbitrum One (chainId: 42161)
  42161: [
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
    'https://1rpc.io/arb',
    'https://arbitrum.publicnode.com',
  ],

  // Polygon (chainId: 137)
  137: [
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
    'https://1rpc.io/matic',
    'https://polygon-bor.publicnode.com',
  ],

  // Base (chainId: 8453)
  8453: [
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://rpc.ankr.com/base',
    'https://1rpc.io/base',
    'https://base.publicnode.com',
  ],

  // Optimism (chainId: 10)
  10: [
    'https://mainnet.optimism.io',
    'https://rpc.ankr.com/optimism',
    'https://1rpc.io/op',
    'https://optimism.publicnode.com',
  ],

  // Avalanche C-Chain (chainId: 43114)
  43114: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://rpc.ankr.com/avalanche',
    'https://1rpc.io/avax/c',
    'https://avalanche-c-chain.publicnode.com',
  ],

  // Linea (chainId: 59144)
  59144: [
    'https://rpc.linea.build',
    'https://linea.drpc.org',
    'https://1rpc.io/linea',
    'https://linea.blockpi.network/v1/rpc/public',
  ],

  // zkSync Era (chainId: 324)
  324: [
    'https://mainnet.era.zksync.io',
    'https://zksync.drpc.org',
    'https://1rpc.io/zksync2-era',
    'https://zksync-era.blockpi.network/v1/rpc/public',
  ],

  // Sepolia Testnet (chainId: 11155111)
  11155111: [
    'https://rpc.sepolia.org',
    'https://rpc.ankr.com/eth_sepolia',
    'https://1rpc.io/sepolia',
    'https://ethereum-sepolia.publicnode.com',
  ],
};
