import { useState, useCallback } from 'react';
import { useAccount, useSwitchChain, useConfig } from 'wagmi';
import { getPublicClient, getWalletClient } from 'wagmi/actions';
import { allMainnetChains } from '../config/chains';
import { BULK_SEND_BYTECODE, BULK_SEND_ABI } from '../config/contract';
import { withRetry, sleep, getErrorMessage } from '../utils/retry';

/** Delay between chain deployments to avoid rate limiting (ms) */
const INTER_DEPLOYMENT_DELAY = 2000;

/** Polling interval for transaction receipt (ms) - reduced to avoid rate limiting */
const TX_POLLING_INTERVAL = 5000;

export interface DeploymentResult {
  chainId: number;
  chainName: string;
  address?: string;
  txHash?: string;
  error?: string;
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'retrying';
}

interface DeployButtonProps {
  selectedChains: number[];
  onDeploymentUpdate: (results: DeploymentResult[]) => void;
}

export function DeployButton({ selectedChains, onDeploymentUpdate }: DeployButtonProps) {
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();
  const [isDeploying, setIsDeploying] = useState(false);
  const [results, setResults] = useState<DeploymentResult[]>([]);

  const updateResult = useCallback((
    deployResults: DeploymentResult[],
    index: number,
    update: Partial<DeploymentResult>
  ) => {
    deployResults[index] = { ...deployResults[index], ...update };
    setResults([...deployResults]);
    onDeploymentUpdate([...deployResults]);
  }, [onDeploymentUpdate]);

  const deployToChain = async (
    chainId: number,
    deployResults: DeploymentResult[],
    index: number
  ): Promise<void> => {
    // Always switch chain before deployment to ensure wallet is on correct network
    updateResult(deployResults, index, { error: 'Switching network...' });
    await switchChainAsync({ chainId });

    // Small delay to ensure wallet state is updated after chain switch
    await sleep(500);

    // Get fresh clients for the target chain
    const walletClient = await getWalletClient(config, { chainId });
    const publicClient = getPublicClient(config, { chainId });

    if (!walletClient) {
      throw new Error('Failed to get wallet client after chain switch');
    }
    if (!publicClient) {
      throw new Error('Failed to get public client for chain');
    }

    updateResult(deployResults, index, { error: undefined });

    // Deploy contract with retry
    const hash = await withRetry(
      () => walletClient.deployContract({
        abi: BULK_SEND_ABI,
        bytecode: BULK_SEND_BYTECODE,
        account: address!,
      }),
      {
        maxRetries: 3,
        onRetry: (retryError, attempt, _delay) => {
          updateResult(deployResults, index, {
            status: 'retrying',
            error: `Retry ${attempt}/3: ${getErrorMessage(retryError)}`,
          });
        },
      }
    );

    updateResult(deployResults, index, { txHash: hash });

    // Wait for transaction with retry (reduced polling frequency to avoid rate limiting)
    const receipt = await withRetry(
      () => publicClient.waitForTransactionReceipt({
        hash,
        pollingInterval: TX_POLLING_INTERVAL,
      }),
      {
        maxRetries: 3,
        onRetry: (_error, attempt) => {
          updateResult(deployResults, index, {
            error: `Waiting for confirmation (retry ${attempt}/3)...`,
          });
        },
      }
    );

    updateResult(deployResults, index, {
      status: 'success',
      address: receipt.contractAddress || undefined,
      error: undefined,
    });
  };

  const deploy = async (chainsToDeployTo?: number[]) => {
    if (!address) return;

    const targetChains = chainsToDeployTo || selectedChains;
    if (targetChains.length === 0) return;

    setIsDeploying(true);

    // Initialize or update results
    let deployResults: DeploymentResult[];
    if (chainsToDeployTo) {
      // Retry failed - keep existing results, reset failed ones
      deployResults = results.map(r =>
        targetChains.includes(r.chainId)
          ? { ...r, status: 'pending' as const, error: undefined }
          : r
      );
    } else {
      // Fresh deploy
      deployResults = targetChains.map(chainId => {
        const chain = allMainnetChains.find(c => c.id === chainId);
        return {
          chainId,
          chainName: chain?.name || `Chain ${chainId}`,
          status: 'pending' as const,
        };
      });
    }

    setResults(deployResults);
    onDeploymentUpdate(deployResults);

    for (let i = 0; i < targetChains.length; i++) {
      const chainId = targetChains[i];
      const resultIndex = deployResults.findIndex(r => r.chainId === chainId);

      // Add delay between deployments (skip first)
      if (i > 0) {
        await sleep(INTER_DEPLOYMENT_DELAY);
      }

      updateResult(deployResults, resultIndex, { status: 'deploying' });

      try {
        await deployToChain(chainId, deployResults, resultIndex);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Deployment failed');
        updateResult(deployResults, resultIndex, {
          status: 'failed',
          error: getErrorMessage(err),
        });
      }
    }

    setIsDeploying(false);
  };

  const retryFailed = () => {
    const failedChains = results
      .filter(r => r.status === 'failed')
      .map(r => r.chainId);
    if (failedChains.length > 0) {
      deploy(failedChains);
    }
  };

  const hasFailedDeployments = results.some(r => r.status === 'failed');

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex gap-2">
        <button
          onClick={() => deploy()}
          disabled={isDeploying || selectedChains.length === 0 || !address}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
        >
          {isDeploying
            ? 'Deploying...'
            : `Deploy to ${selectedChains.length} chain${selectedChains.length !== 1 ? 's' : ''}`}
        </button>
        {hasFailedDeployments && !isDeploying && (
          <button
            onClick={retryFailed}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-3 rounded-lg font-semibold"
          >
            Retry Failed
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((result) => (
            <div
              key={result.chainId}
              className={`p-2 rounded text-sm ${
                result.status === 'success' ? 'bg-green-900' :
                result.status === 'failed' ? 'bg-red-900' :
                result.status === 'deploying' ? 'bg-yellow-900' :
                result.status === 'retrying' ? 'bg-orange-900' :
                'bg-gray-700'
              }`}
            >
              <div className="flex justify-between">
                <span>{result.chainName}</span>
                <span className="capitalize">{result.status}</span>
              </div>
              {result.address && (
                <p className="font-mono text-xs mt-1 text-gray-300">{result.address}</p>
              )}
              {result.error && (
                <p className="text-xs mt-1 text-red-300">{result.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
