import { useAccount, useBalance } from 'wagmi';
import { type Chain, formatUnits } from 'viem';
import { supportedChains, allMainnetChains } from '../config/chains';

interface ChainItemProps {
  chain: Chain;
  selected: boolean;
  onToggle: () => void;
}

function ChainItem({ chain, selected, onToggle }: ChainItemProps) {
  const { address } = useAccount();
  const { data: balance, isLoading } = useBalance({
    address,
    chainId: chain.id
  });

  const formatBal = (b: typeof balance) => {
    if (!b) return null;
    return parseFloat(formatUnits(b.value, b.decimals)).toFixed(4);
  };

  const hasBalance = balance && parseFloat(formatUnits(balance.value, balance.decimals)) > 0.01;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
        selected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
      } ${!hasBalance && !isLoading ? 'opacity-50' : ''}`}
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
        ) : balance ? (
          <span className={!hasBalance ? 'text-red-400' : ''}>
            {formatBal(balance)} {balance.symbol}
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
            {supportedChains.mainnet.p0.map(chain => (
              <ChainItem
                key={chain.id}
                chain={chain}
                selected={selectedChains.includes(chain.id)}
                onToggle={() => toggleChain(chain.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm text-gray-400 mb-2">P1 - Secondary</h3>
          <div className="space-y-2">
            {supportedChains.mainnet.p1.map(chain => (
              <ChainItem
                key={chain.id}
                chain={chain}
                selected={selectedChains.includes(chain.id)}
                onToggle={() => toggleChain(chain.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm text-gray-400 mb-2">P2 - Extended</h3>
          <div className="space-y-2">
            {supportedChains.mainnet.p2.map(chain => (
              <ChainItem
                key={chain.id}
                chain={chain}
                selected={selectedChains.includes(chain.id)}
                onToggle={() => toggleChain(chain.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
