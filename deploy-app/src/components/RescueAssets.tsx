import { useState } from 'react';
import { useAccount, useSwitchChain, useConfig } from 'wagmi';
import { getPublicClient, getWalletClient } from 'wagmi/actions';
import { isAddress } from 'viem';
import { WITHDRAW_ABI } from '../config/contract';
import { allMainnetChains } from '../config/chains';
import { sepolia } from 'wagmi/chains';
import { sleep } from '../utils/retry';

type AssetType = 'native' | 'erc20' | 'erc721' | 'erc1155';
type WithdrawStatus = 'idle' | 'switching' | 'withdrawing' | 'success' | 'failed';

const chains = [...allMainnetChains, sepolia];

export function RescueAssets() {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();

  const [chainId, setChainId] = useState<number>(chains[0].id);
  const [contractAddress, setContractAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('native');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<WithdrawStatus>('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const selectedChain = chains.find(c => c.id === chainId)!;
  const recipientAddr = recipient || address || '';

  const isValidContract = isAddress(contractAddress);
  const isValidRecipient = isAddress(recipientAddr);
  const isValidToken = assetType === 'native' || isAddress(tokenAddress);
  const isValidTokenId = assetType !== 'erc721' && assetType !== 'erc1155' || (() => {
    try { BigInt(tokenId); return tokenId !== ''; } catch { return false; }
  })();
  const isValidAmount = assetType !== 'erc1155' || (() => {
    try { BigInt(amount); return amount !== '' && BigInt(amount) > 0n; } catch { return false; }
  })();

  const canSubmit = isConnected && isValidContract && isValidRecipient && isValidToken && isValidTokenId && isValidAmount;

  const withdraw = async () => {
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

      setStatus('withdrawing');

      const to = recipientAddr as `0x${string}`;
      const contract = contractAddress as `0x${string}`;
      let hash: `0x${string}`;

      if (assetType === 'native') {
        hash = await walletClient.writeContract({
          address: contract,
          abi: WITHDRAW_ABI,
          functionName: 'withdrawStuckNative',
          args: [to],
          account: address!,
        });
      } else if (assetType === 'erc20') {
        hash = await walletClient.writeContract({
          address: contract,
          abi: WITHDRAW_ABI,
          functionName: 'withdrawStuckToken',
          args: [tokenAddress as `0x${string}`, to],
          account: address!,
        });
      } else if (assetType === 'erc721') {
        hash = await walletClient.writeContract({
          address: contract,
          abi: WITHDRAW_ABI,
          functionName: 'withdrawStuckERC721',
          args: [tokenAddress as `0x${string}`, to, BigInt(tokenId)],
          account: address!,
        });
      } else {
        hash = await walletClient.writeContract({
          address: contract,
          abi: WITHDRAW_ABI,
          functionName: 'withdrawStuckERC1155',
          args: [tokenAddress as `0x${string}`, to, BigInt(tokenId), BigInt(amount)],
          account: address!,
        });
      }

      await publicClient.waitForTransactionReceipt({ hash });
      setTxHash(hash);
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Withdraw failed';
      setError(msg.length > 120 ? msg.substring(0, 120) + '...' : msg);
      setStatus('failed');
    }
  };

  const explorerUrl = selectedChain.blockExplorers?.default?.url;

  const assetTabs: { key: AssetType; label: string }[] = [
    { key: 'native', label: 'Native' },
    { key: 'erc20', label: 'ERC20' },
    { key: 'erc721', label: 'ERC721' },
    { key: 'erc1155', label: 'ERC1155' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Rescue Stuck Assets (EVM)</h2>

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

      {/* Recipient */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={address || '0x... (defaults to connected wallet)'}
          className={`w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
            recipient && !isAddress(recipient) ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
          }`}
        />
        {recipient && !isAddress(recipient) && (
          <p className="text-red-400 text-xs mt-1">Invalid address</p>
        )}
        {!recipient && address && (
          <p className="text-gray-500 text-xs mt-1">Defaults to connected wallet</p>
        )}
      </div>

      {/* Asset type tabs */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Asset Type</label>
        <div className="flex border-b border-gray-700">
          {assetTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setAssetType(tab.key)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                assetType === tab.key
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional fields */}
      {assetType !== 'native' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className={`w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
              tokenAddress && !isAddress(tokenAddress) ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
            }`}
          />
          {tokenAddress && !isAddress(tokenAddress) && (
            <p className="text-red-400 text-xs mt-1">Invalid address</p>
          )}
        </div>
      )}

      {(assetType === 'erc721' || assetType === 'erc1155') && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Token ID</label>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="0"
            className="w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {assetType === 'erc1155' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1"
            className="w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Withdraw button */}
      <button
        onClick={withdraw}
        disabled={!canSubmit || status === 'switching' || status === 'withdrawing'}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
      >
        {status === 'switching' ? 'Switching chain...' :
         status === 'withdrawing' ? 'Withdrawing...' :
         'Withdraw'}
      </button>

      {/* Result */}
      {status === 'success' && txHash && (
        <div className="p-3 rounded bg-green-900">
          <p className="font-semibold">Success</p>
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
