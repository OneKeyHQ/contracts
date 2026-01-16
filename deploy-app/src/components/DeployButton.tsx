import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { allMainnetChains } from '../config/chains';
import { BULK_SEND_BYTECODE, BULK_SEND_ABI } from '../config/contract';

export interface DeploymentResult {
  chainId: number;
  chainName: string;
  address?: string;
  txHash?: string;
  error?: string;
  status: 'pending' | 'deploying' | 'success' | 'failed';
}

interface DeployButtonProps {
  selectedChains: number[];
  onDeploymentUpdate: (results: DeploymentResult[]) => void;
}

export function DeployButton({ selectedChains, onDeploymentUpdate }: DeployButtonProps) {
  const { address, chain: currentChain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isDeploying, setIsDeploying] = useState(false);
  const [results, setResults] = useState<DeploymentResult[]>([]);

  const deploy = async () => {
    if (!walletClient || !address || selectedChains.length === 0) return;

    setIsDeploying(true);
    const deployResults: DeploymentResult[] = selectedChains.map(chainId => {
      const chain = allMainnetChains.find(c => c.id === chainId);
      return {
        chainId,
        chainName: chain?.name || `Chain ${chainId}`,
        status: 'pending' as const,
      };
    });
    setResults(deployResults);
    onDeploymentUpdate(deployResults);

    for (let i = 0; i < selectedChains.length; i++) {
      const chainId = selectedChains[i];

      // Update status to deploying
      deployResults[i].status = 'deploying';
      setResults([...deployResults]);
      onDeploymentUpdate([...deployResults]);

      try {
        // Switch chain if needed
        if (currentChain?.id !== chainId) {
          await switchChainAsync({ chainId });
        }

        // Deploy contract
        const hash = await walletClient.deployContract({
          abi: BULK_SEND_ABI,
          bytecode: BULK_SEND_BYTECODE,
          account: address,
        });

        // Wait for transaction
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        deployResults[i] = {
          ...deployResults[i],
          status: 'success',
          txHash: hash,
          address: receipt?.contractAddress || undefined,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Deployment failed';
        deployResults[i] = {
          ...deployResults[i],
          status: 'failed',
          error: errorMessage,
        };
      }

      setResults([...deployResults]);
      onDeploymentUpdate([...deployResults]);
    }

    setIsDeploying(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <button
        onClick={deploy}
        disabled={isDeploying || selectedChains.length === 0 || !address}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
      >
        {isDeploying
          ? 'Deploying...'
          : `Deploy to ${selectedChains.length} chain${selectedChains.length !== 1 ? 's' : ''}`
        }
      </button>

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((result) => (
            <div
              key={result.chainId}
              className={`p-2 rounded text-sm ${
                result.status === 'success' ? 'bg-green-900' :
                result.status === 'failed' ? 'bg-red-900' :
                result.status === 'deploying' ? 'bg-yellow-900' :
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
