import { useAccount } from 'wagmi';
import { type Chain } from 'viem';
import { supportedChains, allMainnetChains } from '../config/chains';
import { useStaggeredBalances, formatBalance, hasEnoughBalance } from '../hooks/useStaggeredBalances';

interface ChainItemProps {
  chain: Chain;
  selected: boolean;
  onToggle: () => void;
  balance: bigint | null;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  error: Error | null;
  minBalance: bigint | null;
}

function ChainItem({ chain, selected, onToggle, balance, symbol, decimals, isLoading, error, minBalance }: ChainItemProps) {
  const formattedBalance = formatBalance(balance, decimals);
  const formattedMinBalance = formatBalance(minBalance, decimals);
  const hasSufficientBalance = hasEnoughBalance(balance, minBalance);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
        selected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
      } ${!hasSufficientBalance && !isLoading ? 'opacity-50' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4"
        />
        <span>{chain.name}</span>
      </div>
      <div className="text-sm text-gray-300">
        {isLoading ? (
          <span className="text-gray-500">Loading...</span>
        ) : error ? (
          <span className="text-yellow-500" title={error.message}>RPC Error</span>
        ) : formattedBalance !== null ? (
          <span className={!hasSufficientBalance ? 'text-red-400' : ''}>
            {formattedBalance} {symbol}
            {formattedMinBalance && (
              <span className="text-gray-500 ml-1">(≥{formattedMinBalance})</span>
            )}
          </span>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </div>
    </div>
  );
}

interface ChainSelectorProps {
  selectedChains: number[];
  onSelectionChange: (chainIds: number[]) => void;
}

export function ChainSelector({ selectedChains, onSelectionChange }: ChainSelectorProps) {
  const { address, isConnected } = useAccount();

  // Get all chain IDs for parallel balance fetching
  const allChainIds = allMainnetChains.map(c => c.id);
  const balances = useStaggeredBalances(address, allChainIds, { concurrency: 5, enabled: isConnected });

  // Create a map for quick balance lookup
  const balanceMap = new Map(balances.map(b => [b.chainId, b]));

  const toggleChain = (chainId: number) => {
    if (selectedChains.includes(chainId)) {
      onSelectionChange(selectedChains.filter(id => id !== chainId));
    } else {
      onSelectionChange([...selectedChains, chainId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(allMainnetChains.map(c => c.id));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  const renderChainItem = (chain: Chain) => {
    const balanceData = balanceMap.get(chain.id);
    // When wallet is not connected, show as not loading with null balance (displays "-")
    const isLoading = isConnected ? (balanceData?.isLoading ?? true) : false;
    return (
      <ChainItem
        key={chain.id}
        chain={chain}
        selected={selectedChains.includes(chain.id)}
        onToggle={() => toggleChain(chain.id)}
        balance={balanceData?.balance ?? null}
        symbol={balanceData?.symbol ?? chain.nativeCurrency.symbol}
        decimals={balanceData?.decimals ?? chain.nativeCurrency.decimals}
        isLoading={isLoading}
        error={balanceData?.error ?? null}
        minBalance={balanceData?.minBalance ?? null}
      />
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Select Chains</h2>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-sm text-blue-400 hover:text-blue-300">
            Select All
          </button>
          <button onClick={selectNone} className="text-sm text-gray-400 hover:text-gray-300">
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm text-gray-400 mb-2">P0 - Priority</h3>
          <div className="space-y-2">
            {supportedChains.mainnet.p0.map(renderChainItem)}
          </div>
        </div>

        <div>
          <h3 className="text-sm text-gray-400 mb-2">P1 - Secondary</h3>
          <div className="space-y-2">
            {supportedChains.mainnet.p1.map(renderChainItem)}
          </div>
        </div>

        <div>
          <h3 className="text-sm text-gray-400 mb-2">P2 - Extended</h3>
          <div className="space-y-2">
            {supportedChains.mainnet.p2.map(renderChainItem)}
          </div>
        </div>
      </div>
    </div>
  );
}
