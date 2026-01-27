import { http, fallback, createConfig } from 'wagmi';
import { mainnet, bsc, arbitrum, polygon, base, optimism, avalanche, linea, zkSync, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { RPC_ENDPOINTS } from './rpc';

/**
 * Create a fallback transport for a chain with multiple RPC endpoints.
 * Automatically switches to the next RPC if one fails.
 */
function createFallbackTransport(chainId: number) {
  const endpoints = RPC_ENDPOINTS[chainId];

  if (!endpoints || endpoints.length === 0) {
    return http();
  }

  return fallback(
    endpoints.map(url =>
      http(url, {
        timeout: 15_000, // 15 second timeout per request
        retryCount: 2, // Retry twice before trying next RPC
        retryDelay: 1000, // 1 second between retries
      })
    )
  );
}

export const config = createConfig({
  chains: [mainnet, bsc, arbitrum, polygon, base, optimism, avalanche, linea, zkSync, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: createFallbackTransport(mainnet.id),
    [bsc.id]: createFallbackTransport(bsc.id),
    [arbitrum.id]: createFallbackTransport(arbitrum.id),
    [polygon.id]: createFallbackTransport(polygon.id),
    [base.id]: createFallbackTransport(base.id),
    [optimism.id]: createFallbackTransport(optimism.id),
    [avalanche.id]: createFallbackTransport(avalanche.id),
    [linea.id]: createFallbackTransport(linea.id),
    [zkSync.id]: createFallbackTransport(zkSync.id),
    [sepolia.id]: createFallbackTransport(sepolia.id),
  },
});
