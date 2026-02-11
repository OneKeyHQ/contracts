import { useState } from 'react';
import { useTron } from '../hooks/useTron';
import { TRON_BULK_SEND_ABI } from '../config/tron-contract';

type AcceptStatus = 'idle' | 'checking' | 'accepting' | 'success' | 'failed';

export function TronAcceptOwnership() {
  const { isConnected, address: walletAddress, network } = useTron();

  const [contractAddress, setContractAddress] = useState('');
  const [status, setStatus] = useState<AcceptStatus>('idle');
  const [txId, setTxId] = useState('');
  const [error, setError] = useState('');

  const isValidContract = contractAddress.length > 0 && window.tronWeb?.isAddress(contractAddress);
  const canSubmit = isConnected && isValidContract;

  const acceptOwnership = async () => {
    if (!canSubmit || !window.tronWeb) return;

    setStatus('checking');
    setTxId('');
    setError('');

    try {
      const tronWeb = window.tronWeb;
      const contract = await tronWeb.contract(TRON_BULK_SEND_ABI, contractAddress);

      // Check pendingOwner before sending tx
      const pendingOwner = await contract.pendingOwner().call();
      const pendingOwnerBase58 = tronWeb.address.fromHex(pendingOwner);

      if (pendingOwnerBase58 !== walletAddress) {
        throw new Error(
          `Connected wallet is not the pending owner. Pending owner: ${pendingOwnerBase58}`
        );
      }

      setStatus('accepting');
      const result = await contract.acceptOwnership().send({ feeLimit: 100_000_000 });

      setTxId(result);
      setStatus('success');
    } catch (err: any) {
      console.error('Tron accept ownership error:', err);
      const msg = err?.message || String(err) || 'Accept ownership failed';
      setError(msg.length > 120 ? msg.substring(0, 120) + '...' : msg);
      setStatus('failed');
    }
  };

  if (!isConnected) return null;

  const explorerUrl = network === 'Shasta Testnet'
    ? 'https://shasta.tronscan.org'
    : 'https://tronscan.org';

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accept Ownership (Tron)</h2>

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

      {/* Accept button */}
      <button
        onClick={acceptOwnership}
        disabled={!canSubmit || status === 'checking' || status === 'accepting'}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
      >
        {status === 'checking' ? 'Checking pending owner...' :
         status === 'accepting' ? 'Accepting ownership...' :
         'Accept Ownership'}
      </button>

      {/* Result */}
      {status === 'success' && txId && (
        <div className="p-3 rounded bg-green-900">
          <p className="font-semibold">Ownership accepted successfully</p>
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
