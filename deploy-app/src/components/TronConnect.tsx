import { useTron } from '../hooks/useTron';

export function TronConnect() {
  const { isInstalled, isConnected, address, balance, network, connect, disconnect } = useTron();

  if (isConnected && address) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Tron Connected</p>
            <p className="font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</p>
            {network && <p className="text-sm text-gray-400">{network}</p>}
            {balance && <p className="text-sm text-gray-400">{balance} TRX</p>}
          </div>
          <button
            onClick={disconnect}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="mb-3 text-gray-400">Connect TronLink for Tron deployment</p>
      <button
        onClick={connect}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
      >
        {isInstalled ? 'Connect TronLink' : 'Install TronLink'}
      </button>
    </div>
  );
}
