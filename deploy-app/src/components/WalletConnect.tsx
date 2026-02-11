import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const formatBalance = (b: typeof balance) => {
    if (!b) return null;
    return parseFloat(formatUnits(b.value, b.decimals)).toFixed(4);
  };

  if (isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Connected</p>
            <p className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
            {chain && <p className="text-sm text-gray-400">{chain.name}</p>}
            {balance && (
              <p className="text-sm text-gray-400">
                {formatBalance(balance)} {balance.symbol}
              </p>
            )}
          </div>
          <button
            onClick={() => disconnect()}
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
      <p className="mb-3 text-gray-400">Connect wallet to deploy</p>
      <div className="flex gap-2">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            {connector.name}
          </button>
        ))}
      </div>
    </div>
  );
}
