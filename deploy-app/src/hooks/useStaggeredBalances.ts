import { useState, useEffect, useRef } from 'react';
import { formatUnits, createPublicClient, http } from 'viem';
import { config } from '../config/wagmi';
import { RPC_ENDPOINTS } from '../config/rpc';

export interface BalanceResult {
  chainId: number;
  balance: bigint | null;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  error: Error | null;
}

interface UseStaggeredBalancesOptions {
  /** Maximum concurrent requests (default: 5) */
  concurrency?: number;
  /** Whether to enable fetching (default: true) */
  enabled?: boolean;
}

/**
 * Fetch balance for a single chain with RPC fallback.
 * Tries each RPC endpoint in order until one succeeds.
 */
async function fetchBalanceWithFallback(
  address: `0x${string}`,
  chainId: number,
  signal: AbortSignal
): Promise<bigint> {
  const chain = config.chains.find(c => c.id === chainId);
  const rpcUrls = RPC_ENDPOINTS[chainId] || [];

  if (!chain || rpcUrls.length === 0) {
    throw new Error(`No RPC configured for chain ${chainId}`);
  }

  let lastError: Error | null = null;

  for (const rpcUrl of rpcUrls) {
    if (signal.aborted) {
      throw new Error('Aborted');
    }

    try {
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl, { timeout: 10_000 }),
      });

      const balance = await client.getBalance({ address });
      return balance;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Failed to fetch balance');
      // Continue to next RPC endpoint
    }
  }

  throw lastError || new Error('All RPC endpoints failed');
}

/**
 * Hook to fetch balances for multiple chains in parallel.
 * Uses RPC fallback when an endpoint fails.
 */
export function useStaggeredBalances(
  address: `0x${string}` | undefined,
  chainIds: number[],
  options: UseStaggeredBalancesOptions = {}
): BalanceResult[] {
  const { concurrency = 5, enabled = true } = options;
  const [balances, setBalances] = useState<Map<number, BalanceResult>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!address || !enabled || chainIds.length === 0) {
      setBalances(new Map());
      return;
    }

    // Cancel any ongoing fetches
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Initialize all chains as loading
    const initialBalances = new Map<number, BalanceResult>();
    chainIds.forEach(chainId => {
      const chain = config.chains.find(c => c.id === chainId);
      initialBalances.set(chainId, {
        chainId,
        balance: null,
        symbol: chain?.nativeCurrency.symbol || 'ETH',
        decimals: chain?.nativeCurrency.decimals || 18,
        isLoading: true,
        error: null,
      });
    });
    setBalances(initialBalances);

    // Fetch balance for a single chain and update state
    const fetchSingleBalance = async (chainId: number) => {
      const chain = config.chains.find(c => c.id === chainId);

      try {
        const balance = await fetchBalanceWithFallback(address, chainId, signal);

        if (signal.aborted) return;

        setBalances(prev => {
          const updated = new Map(prev);
          updated.set(chainId, {
            chainId,
            balance,
            symbol: chain?.nativeCurrency.symbol || 'ETH',
            decimals: chain?.nativeCurrency.decimals || 18,
            isLoading: false,
            error: null,
          });
          return updated;
        });
      } catch (error) {
        if (signal.aborted) return;

        setBalances(prev => {
          const updated = new Map(prev);
          const existing = prev.get(chainId);
          updated.set(chainId, {
            chainId,
            balance: null,
            symbol: existing?.symbol || 'ETH',
            decimals: existing?.decimals || 18,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Failed to fetch balance'),
          });
          return updated;
        });
      }
    };

    // Fetch balances in parallel with concurrency limit
    const fetchAllBalances = async () => {
      const chunks: number[][] = [];
      for (let i = 0; i < chainIds.length; i += concurrency) {
        chunks.push(chainIds.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        if (signal.aborted) return;
        await Promise.all(chunk.map(chainId => fetchSingleBalance(chainId)));
      }
    };

    fetchAllBalances();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [address, chainIds.join(','), concurrency, enabled]);

  // Convert map to array in the same order as chainIds
  return chainIds.map(chainId => {
    const result = balances.get(chainId);
    if (result) return result;

    const chain = config.chains.find(c => c.id === chainId);
    return {
      chainId,
      balance: null,
      symbol: chain?.nativeCurrency.symbol || 'ETH',
      decimals: chain?.nativeCurrency.decimals || 18,
      isLoading: true,
      error: null,
    };
  });
}

/**
 * Format balance for display
 */
export function formatBalance(balance: bigint | null, decimals: number): string | null {
  if (balance === null) return null;
  return parseFloat(formatUnits(balance, decimals)).toFixed(4);
}

/**
 * Check if balance is sufficient (> 0.01)
 */
export function hasEnoughBalance(balance: bigint | null, decimals: number): boolean {
  if (balance === null) return false;
  return parseFloat(formatUnits(balance, decimals)) > 0.01;
}
