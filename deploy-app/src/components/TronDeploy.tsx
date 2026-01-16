import { useState } from 'react';
import { useTron } from '../hooks/useTron';

interface TronDeployResult {
  address?: string;
  error?: string;
  status: 'idle' | 'deploying' | 'success' | 'failed';
}

export function TronDeploy() {
  const { isConnected } = useTron();
  const [result, setResult] = useState<TronDeployResult>({ status: 'idle' });

  const deploy = async () => {
    if (!window.tronWeb || !isConnected) return;

    setResult({ status: 'deploying' });

    try {
      // Tron contract deployment requires TronIDE or tronbox CLI
      setResult({
        status: 'success',
        address: 'Deployment not implemented - use TronIDE or tronbox',
      });
    } catch (error: any) {
      setResult({
        status: 'failed',
        error: error.message || 'Deployment failed',
      });
    }
  };

  if (!isConnected) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Tron Deployment</h2>

      <p className="text-sm text-gray-400 mb-4">
        Note: Tron contract deployment requires TronIDE or tronbox CLI.
        This interface shows your connected TronLink wallet.
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
          <p className="capitalize">{result.status}</p>
          {result.address && <p className="font-mono text-xs mt-1">{result.address}</p>}
          {result.error && <p className="text-xs mt-1 text-red-300">{result.error}</p>}
        </div>
      )}
    </div>
  );
}
