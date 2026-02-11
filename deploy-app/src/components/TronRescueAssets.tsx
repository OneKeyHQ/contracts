import { useState } from 'react';
import { useTron } from '../hooks/useTron';
import { TRON_BULK_SEND_ABI } from '../config/tron-contract';

type AssetType = 'trx' | 'trc20' | 'trc721' | 'trc1155';
type WithdrawStatus = 'idle' | 'withdrawing' | 'success' | 'failed';

export function TronRescueAssets() {
  const { isConnected, address: walletAddress, network } = useTron();

  const [contractAddress, setContractAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('trx');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<WithdrawStatus>('idle');
  const [txId, setTxId] = useState('');
  const [error, setError] = useState('');

  const recipientAddr = recipient || walletAddress || '';

  const isValidContract = contractAddress.length > 0 && window.tronWeb?.isAddress(contractAddress);
  const isValidRecipient = recipientAddr.length > 0 && (window.tronWeb?.isAddress(recipientAddr) ?? false);
  const isValidToken = assetType === 'trx' || (tokenAddress.length > 0 && (window.tronWeb?.isAddress(tokenAddress) ?? false));
  const isValidTokenId = assetType !== 'trc721' && assetType !== 'trc1155' || (() => {
    try { BigInt(tokenId); return tokenId !== ''; } catch { return false; }
  })();
  const isValidAmount = assetType !== 'trc1155' || (() => {
    try { BigInt(amount); return amount !== '' && BigInt(amount) > 0n; } catch { return false; }
  })();

  const canSubmit = isConnected && isValidContract && isValidRecipient && isValidToken && isValidTokenId && isValidAmount;

  const withdraw = async () => {
    if (!canSubmit || !window.tronWeb) return;

    setStatus('withdrawing');
    setTxId('');
    setError('');

    try {
      const tronWeb = window.tronWeb;
      const contract = await tronWeb.contract(TRON_BULK_SEND_ABI, contractAddress);
      const to = recipientAddr;

      let result: any;

      if (assetType === 'trx') {
        result = await contract.withdrawStuckTRX(to).send({ feeLimit: 100_000_000 });
      } else if (assetType === 'trc20') {
        result = await contract.withdrawStuckTRC20(tokenAddress, to).send({ feeLimit: 100_000_000 });
      } else if (assetType === 'trc721') {
        result = await contract.withdrawStuckTRC721(tokenAddress, to, tokenId).send({ feeLimit: 100_000_000 });
      } else {
        result = await contract.withdrawStuckTRC1155(tokenAddress, to, tokenId, amount).send({ feeLimit: 100_000_000 });
      }

      setTxId(result);
      setStatus('success');
    } catch (err: any) {
      console.error('Tron rescue error:', err);
      const msg = err?.message || String(err) || 'Withdraw failed';
      setError(msg.length > 120 ? msg.substring(0, 120) + '...' : msg);
      setStatus('failed');
    }
  };

  if (!isConnected) return null;

  const explorerUrl = network === 'Shasta Testnet'
    ? 'https://shasta.tronscan.org'
    : 'https://tronscan.org';

  const assetTabs: { key: AssetType; label: string }[] = [
    { key: 'trx', label: 'TRX' },
    { key: 'trc20', label: 'TRC20' },
    { key: 'trc721', label: 'TRC721' },
    { key: 'trc1155', label: 'TRC1155' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Rescue Stuck Assets (Tron)</h2>

      {/* Contract address */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Contract Address</label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="T..."
          className={`w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
            contractAddress && !isValidContract ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
          }`}
        />
        {contractAddress && !isValidContract && (
          <p className="text-red-400 text-xs mt-1">Invalid Tron address</p>
        )}
      </div>

      {/* Recipient */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={walletAddress || 'T... (defaults to connected wallet)'}
          className={`w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
            recipient && !window.tronWeb?.isAddress(recipient) ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
          }`}
        />
        {recipient && !window.tronWeb?.isAddress(recipient) && (
          <p className="text-red-400 text-xs mt-1">Invalid Tron address</p>
        )}
        {!recipient && walletAddress && (
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
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional fields */}
      {assetType !== 'trx' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="T..."
            className={`w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
              tokenAddress && !window.tronWeb?.isAddress(tokenAddress) ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
            }`}
          />
          {tokenAddress && !window.tronWeb?.isAddress(tokenAddress) && (
            <p className="text-red-400 text-xs mt-1">Invalid Tron address</p>
          )}
        </div>
      )}

      {(assetType === 'trc721' || assetType === 'trc1155') && (
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

      {assetType === 'trc1155' && (
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
        disabled={!canSubmit || status === 'withdrawing'}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
      >
        {status === 'withdrawing' ? 'Withdrawing...' : 'Withdraw'}
      </button>

      {/* Result */}
      {status === 'success' && txId && (
        <div className="p-3 rounded bg-green-900">
          <p className="font-semibold">Success</p>
          <div className="mt-1">
            <p className="text-xs text-gray-400">Transaction:</p>
            <a
              href={`${explorerUrl}/#/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-blue-400 hover:underline break-all"
            >
              {txId}
            </a>
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
