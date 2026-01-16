import { http, createConfig } from 'wagmi';
import { mainnet, bsc, arbitrum, polygon, base, optimism, avalanche, linea, zkSync, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, bsc, arbitrum, polygon, base, optimism, avalanche, linea, zkSync, sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [avalanche.id]: http(),
    [linea.id]: http(),
    [zkSync.id]: http(),
    [sepolia.id]: http(),
  },
});
