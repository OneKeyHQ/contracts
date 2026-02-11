import { useState } from 'react';
import { useAccount, useSwitchChain, useConfig } from 'wagmi';
import { getPublicClient, getWalletClient } from 'wagmi/actions';
import { isAddress } from 'viem';
import { ACCEPT_OWNERSHIP_ABI } from '../config/contract';
import { allMainnetChains } from '../config/chains';
import { sepolia } from 'wagmi/chains';
import { sleep } from '../utils/retry';

type AcceptStatus = 'idle' | 'checking' | 'switching' | 'accepting' | 'success' | 'failed';

const chains = [...allMainnetChains, sepolia];

export function AcceptOwnership() {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();

  const [chainId, setChainId] = useState<number>(chains[0].id);
  const [contractAddress, setContractAddress] = useState('');
  const [status, setStatus] = useState<AcceptStatus>('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const selectedChain = chains.find(c => c.id === chainId)!;
  const isValidContract = isAddress(contractAddress);
  const canSubmit = isConnected && isValidContract;

  const acceptOwnership = async () => {
    if (!canSubmit) return;

    setStatus('switching');
    setTxHash('');
    setError('');

    try {
      await switchChainAsync({ chainId });
      await sleep(500);

      const walletClient = await getWalletClient(config, { chainId });
      const publicClient = getPublicClient(config, { chainId });

      if (!walletClient) throw new Error('Failed to get wallet client');
      if (!publicClient) throw new Error('Failed to get public client');

      const contract = contractAddress as `0x${string}`;

      // Check pendingOwner before sending tx
      setStatus('checking');
      const pendingOwner = await publicClient.readContract({
        address: contract,
        abi: ACCEPT_OWNERSHIP_ABI,
        functionName: 'pendingOwner',
      });

      if (pendingOwner.toLowerCase() !== address!.toLowerCase()) {
        throw new Error(
          `Connected wallet is not the pending owner. Pending owner: ${pendingOwner}`
        );
      }

      setStatus('accepting');
      const hash = await walletClient.writeContract({
        address: contract,
        abi: ACCEPT_OWNERSHIP_ABI,
        functionName: 'acceptOwnership',
        account: address!,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxHash(hash);
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Accept ownership failed';
      setError(msg.length > 120 ? msg.substring(0, 120) + '...' : msg);
      setStatus('failed');
    }
  };

  const explorerUrl = selectedChain.blockExplorers?.default?.url;

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accept Ownership (EVM)</h2>

      {/* Chain selector */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Chain</label>
        <select
          value={chainId}
          onChange={(e) => setChainId(Number(e.target.value))}
          className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          {chains.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Contract address */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Contract Address</label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="0x..."
          className={`w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
            contractAddress && !isValidContract ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
          }`}
        />
        {contractAddress && !isValidContract && (
          <p className="text-red-400 text-xs mt-1">Invalid address</p>
        )}
      </div>

      {/* Accept button */}
      <button
        onClick={acceptOwnership}
        disabled={!canSubmit || status === 'switching' || status === 'checking' || status === 'accepting'}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
      >
        {status === 'switching' ? 'Switching chain...' :
         status === 'checking' ? 'Checking pending owner...' :
         status === 'accepting' ? 'Accepting ownership...' :
         'Accept Ownership'}
      </button>

      {/* Result */}
      {status === 'success' && txHash && (
        <div className="p-3 rounded bg-green-900">
          <p className="font-semibold">Ownership accepted successfully</p>
          <div className="mt-1">
            <p className="text-xs text-gray-400">Transaction:</p>
            {explorerUrl ? (
              <a
                href={`${explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-400 hover:underline break-all"
              >
                {txHash}
              </a>
            ) : (
              <p className="font-mono text-xs break-all">{txHash}</p>
            )}
          </div>
        </div>
      )}

      {status === 'failed' && error && (
        <div className="p-3 rounded bg-red-900">
          <p className="font-semibold">Failed</p>
          <p className="text-xs mt-1 text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
