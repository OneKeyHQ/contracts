import { useState, useCallback } from 'react';
import { useAccount, useSwitchChain, useConfig } from 'wagmi';
import { getPublicClient, getWalletClient } from 'wagmi/actions';
import { isAddress } from 'viem';
import type { DeploymentResult } from './DeployButton';
import { TRANSFER_OWNERSHIP_ABI } from '../config/contract';
import { sleep } from '../utils/retry';

type TransferStatus = 'idle' | 'switching' | 'transferring' | 'success' | 'failed';

interface ChainTransferState {
  status: TransferStatus;
  error?: string;
}

interface TransferOwnershipProps {
  results: DeploymentResult[];
}

export function TransferOwnership({ results }: TransferOwnershipProps) {
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();
  const [newOwner, setNewOwner] = useState('');
  const [transferStates, setTransferStates] = useState<Record<number, ChainTransferState>>({});
  const [isTransferringAll, setIsTransferringAll] = useState(false);

  const successfulDeployments = results.filter(r => r.status === 'success' && r.address);

  const updateState = useCallback((chainId: number, state: ChainTransferState) => {
    setTransferStates(prev => ({ ...prev, [chainId]: state }));
  }, []);

  const transferOnChain = async (deployment: DeploymentResult) => {
    const { chainId, address: contractAddress } = deployment;
    if (!contractAddress || !address) return;

    updateState(chainId, { status: 'switching' });

    try {
      await switchChainAsync({ chainId });
      await sleep(500);

      const walletClient = await getWalletClient(config, { chainId });
      const publicClient = getPublicClient(config, { chainId });

      if (!walletClient) throw new Error('Failed to get wallet client');
      if (!publicClient) throw new Error('Failed to get public client');

      updateState(chainId, { status: 'transferring' });

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: TRANSFER_OWNERSHIP_ABI,
        functionName: 'transferOwnership',
        args: [newOwner as `0x${string}`],
        account: address,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      updateState(chainId, { status: 'success' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Transfer failed';
      updateState(chainId, { status: 'failed', error: msg.length > 100 ? msg.substring(0, 100) + '...' : msg });
    }
  };

  const transferAll = async () => {
    if (!isValidAddress) return;
    setIsTransferringAll(true);

    for (const deployment of successfulDeployments) {
      const state = transferStates[deployment.chainId];
      if (state?.status === 'success') continue;
      await transferOnChain(deployment);
    }

    setIsTransferringAll(false);
  };

  const isValidAddress = isAddress(newOwner);
  const hasTransferableContracts = successfulDeployments.length > 0;

  if (!hasTransferableContracts) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Transfer Ownership</h2>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">New Owner Address</label>
        <input
          type="text"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          placeholder="0x..."
          className={`w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
            newOwner && !isValidAddress ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
          }`}
          disabled={isTransferringAll}
        />
        {newOwner && !isValidAddress && (
          <p className="text-red-400 text-xs mt-1">Invalid Ethereum address</p>
        )}
      </div>

      <button
        onClick={transferAll}
        disabled={!isValidAddress || !address || isTransferringAll}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold mb-4"
      >
        {isTransferringAll ? 'Transferring...' : `Transfer All (${successfulDeployments.length} contracts)`}
      </button>

      <div className="space-y-2">
        {successfulDeployments.map((deployment) => {
          const state = transferStates[deployment.chainId];
          const status = state?.status ?? 'idle';

          return (
            <div
              key={deployment.chainId}
              className={`p-3 rounded ${
                status === 'success' ? 'bg-green-900' :
                status === 'failed' ? 'bg-red-900' :
                status === 'switching' || status === 'transferring' ? 'bg-yellow-900' :
                'bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{deployment.chainName}</span>
                  <p className="font-mono text-xs text-gray-300 break-all">{deployment.address}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <span className="text-sm capitalize">
                    {status === 'idle' ? '' :
                     status === 'switching' ? 'Switching...' :
                     status === 'transferring' ? 'Transferring...' :
                     status === 'success' ? 'Transferred' :
                     'Failed'}
                  </span>
                  {status !== 'success' && status !== 'switching' && status !== 'transferring' && !isTransferringAll && (
                    <button
                      onClick={() => transferOnChain(deployment)}
                      disabled={!isValidAddress || !address}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                    >
                      Transfer
                    </button>
                  )}
                </div>
              </div>
              {state?.error && (
                <p className="text-xs mt-1 text-red-300">{state.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
