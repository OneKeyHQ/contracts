import { mainnet, bsc, arbitrum, polygon, base, optimism, avalanche, linea, zkSync, sepolia } from 'wagmi/chains';

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
