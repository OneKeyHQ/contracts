import { mainnet, bsc, arbitrum, polygon, base, optimism, avalanche, linea, zkSync, sepolia } from 'wagmi/chains';

// Static minimum balance fallback values (in native token units)
// Used when dynamic gas estimation fails
export const MIN_BALANCE_FALLBACK: Record<number, number> = {
  [mainnet.id]: 0.01,      // ETH
  [bsc.id]: 0.005,         // BNB
  [arbitrum.id]: 0.001,    // ETH
  [polygon.id]: 1,         // POL
  [base.id]: 0.001,        // ETH
  [optimism.id]: 0.001,    // ETH
  [avalanche.id]: 0.1,     // AVAX
  [linea.id]: 0.001,       // ETH
  [zkSync.id]: 0.001,      // ETH
  [sepolia.id]: 0.01,      // ETH
};

// Estimated gas for contract deployment (BulkSend contract)
export const DEPLOY_GAS_ESTIMATE = 2_500_000n;

export const supportedChains = {
  mainnet: {
    p0: [mainnet, bsc],
    p1: [arbitrum, polygon, base],
    p2: [optimism, avalanche, linea, zkSync],
  },
  testnet: [sepolia],
};

export const allMainnetChains = [
  ...supportedChains.mainnet.p0,
  ...supportedChains.mainnet.p1,
  ...supportedChains.mainnet.p2,
];
