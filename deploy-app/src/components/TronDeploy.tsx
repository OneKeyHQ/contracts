import { useState } from 'react';
import { useTron } from '../hooks/useTron';
import { TRON_BULK_SEND_BYTECODE, TRON_BULK_SEND_ABI } from '../config/tron-contract.generated';

interface TronDeployResult {
  address?: string;
  txId?: string;
  error?: string;
  status: 'idle' | 'deploying' | 'success' | 'failed';
}

interface TronDeployProps {
  onDeploySuccess?: (address: string) => void;
}

export function TronDeploy({ onDeploySuccess }: TronDeployProps) {
  const { isConnected, network } = useTron();
  const [result, setResult] = useState<TronDeployResult>({ status: 'idle' });

  const deploy = async () => {
    if (!window.tronWeb || !isConnected) return;

    setResult({ status: 'deploying' });

    try {
      const tronWeb = window.tronWeb;

      // Deploy contract using tronWeb.transactionBuilder
      const transaction = await tronWeb.transactionBuilder.createSmartContract({
        abi: TRON_BULK_SEND_ABI,
        bytecode: TRON_BULK_SEND_BYTECODE.replace('0x', ''),
        feeLimit: 1000000000, // 1000 TRX
        callValue: 0,
        userFeePercentage: 100,
        originEnergyLimit: 10000000,
      }, tronWeb.defaultAddress.hex);

      // Sign the transaction
      const signedTransaction = await tronWeb.trx.sign(transaction);

      // Broadcast the transaction
      const receipt = await tronWeb.trx.sendRawTransaction(signedTransaction);

      if (receipt.result) {
        // Get contract address from transaction
        const txId = receipt.txid;

        // Wait for confirmation and get contract address
        let contractAddress = '';
        let attempts = 0;
        const maxAttempts = 30;

        while (!contractAddress && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          try {
            const txInfo = await tronWeb.trx.getTransactionInfo(txId);
            if (txInfo && txInfo.contract_address) {
              contractAddress = tronWeb.address.fromHex(txInfo.contract_address);
              break;
            }
          } catch {
            // Transaction not confirmed yet
          }
          attempts++;
        }

        setResult({
          status: 'success',
          address: contractAddress || 'Pending confirmation...',
          txId,
        });

        if (contractAddress) {
          onDeploySuccess?.(contractAddress);
        }
      } else {
        throw new Error(receipt.message || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('Tron deployment error:', error);
      setResult({
        status: 'failed',
        error: error.message || 'Deployment failed',
      });
    }
  };

  if (!isConnected) return null;

  const explorerUrl = network === 'Shasta Testnet'
    ? 'https://shasta.tronscan.org'
    : 'https://tronscan.org';

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Tron Deployment</h2>

      <p className="text-sm text-gray-400 mb-4">
        Deploy BulkSend contract to {network || 'Tron'}.
        Make sure you have enough TRX for deployment fees (~100-200 TRX).
      </p>

      <button
        onClick={deploy}
        disabled={result.status === 'deploying'}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
      >
        {result.status === 'deploying' ? 'Deploying...' : 'Deploy to Tron'}
      </button>

      {result.status !== 'idle' && (
        <div className={`mt-4 p-3 rounded ${
          result.status === 'success' ? 'bg-green-900' :
          result.status === 'failed' ? 'bg-red-900' :
          'bg-yellow-900'
        }`}>
          <p className="capitalize font-semibold">{result.status}</p>
          {result.address && (
            <div className="mt-2">
              <p className="text-xs text-gray-400">Contract Address:</p>
              <a
                href={`${explorerUrl}/#/contract/${result.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-400 hover:underline break-all"
              >
                {result.address}
              </a>
            </div>
          )}
          {result.txId && (
            <div className="mt-2">
              <p className="text-xs text-gray-400">Transaction:</p>
              <a
                href={`${explorerUrl}/#/transaction/${result.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-400 hover:underline break-all"
              >
                {result.txId}
              </a>
            </div>
          )}
          {result.error && <p className="text-xs mt-2 text-red-300">{result.error}</p>}
        </div>
      )}
    </div>
  );
}
