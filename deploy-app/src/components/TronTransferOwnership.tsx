import { useState } from 'react';
import { useTron } from '../hooks/useTron';
import { TRON_BULK_SEND_ABI } from '../config/tron-contract.generated';

type TransferStatus = 'idle' | 'transferring' | 'success' | 'failed';

interface TronTransferOwnershipProps {
  contractAddress: string;
}

export function TronTransferOwnership({ contractAddress }: TronTransferOwnershipProps) {
  const { isConnected, network } = useTron();

  const [newOwner, setNewOwner] = useState('');
  const [status, setStatus] = useState<TransferStatus>('idle');
  const [txId, setTxId] = useState('');
  const [error, setError] = useState('');

  const isValidAddress = newOwner.length > 0 && window.tronWeb?.isAddress(newOwner);
  const canSubmit = isConnected && isValidAddress && contractAddress;

  const transferOwnership = async () => {
    if (!canSubmit || !window.tronWeb) return;

    setStatus('transferring');
    setTxId('');
    setError('');

    try {
      const tronWeb = window.tronWeb;
      const contract = await tronWeb.contract(TRON_BULK_SEND_ABI, contractAddress);

      const result = await contract.transferOwnership(newOwner).send({ feeLimit: 100_000_000 });

      setTxId(result);
      setStatus('success');
    } catch (err: any) {
      console.error('Tron transfer ownership error:', err);
      const msg = err?.message || String(err) || 'Transfer ownership failed';
      setError(msg.length > 120 ? msg.substring(0, 120) + '...' : msg);
      setStatus('failed');
    }
  };

  if (!isConnected || !contractAddress) return null;

  const explorerUrl = network === 'Shasta Testnet'
    ? 'https://shasta.tronscan.org'
    : 'https://tronscan.org';

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Transfer Ownership (Tron)</h2>

      <div>
        <p className="text-xs text-gray-400 mb-2">
          Contract: <span className="font-mono">{contractAddress}</span>
        </p>
        <label className="block text-sm text-gray-400 mb-1">New Owner Address</label>
        <input
          type="text"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          placeholder="T..."
          className={`w-full bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-2 ${
            newOwner && !isValidAddress ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
          }`}
          disabled={status === 'transferring'}
        />
        {newOwner && !isValidAddress && (
          <p className="text-red-400 text-xs mt-1">Invalid Tron address</p>
        )}
      </div>

      <button
        onClick={transferOwnership}
        disabled={!canSubmit || status === 'transferring'}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
      >
        {status === 'transferring' ? 'Transferring...' : 'Transfer Ownership'}
      </button>

      {status === 'success' && txId && (
        <div className="p-3 rounded bg-green-900">
          <p className="font-semibold">Ownership transfer initiated</p>
          <p className="text-xs text-gray-300 mt-1">
            The new owner must call <span className="font-mono">acceptOwnership</span> to complete the transfer.
          </p>
          <div className="mt-2">
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
