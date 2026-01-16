import { useState } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { ChainSelector } from './components/ChainSelector';
import { DeployButton, type DeploymentResult } from './components/DeployButton';
import { DeploymentReport } from './components/DeploymentReport';
import { TronConnect } from './components/TronConnect';
import { TronDeploy } from './components/TronDeploy';

type NetworkTab = 'evm' | 'tron';

function App() {
  const [selectedChains, setSelectedChains] = useState<number[]>([]);
  const [deploymentResults, setDeploymentResults] = useState<DeploymentResult[]>([]);
  const [activeTab, setActiveTab] = useState<NetworkTab>('evm');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">BulkSend Deployer</h1>

        {/* Network Tabs */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('evm')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'evm'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            EVM Chains
          </button>
          <button
            onClick={() => setActiveTab('tron')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'tron'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Tron
          </button>
        </div>

        {/* EVM Tab Content */}
        {activeTab === 'evm' && (
          <div className="space-y-6">
            <WalletConnect />
            <ChainSelector
              selectedChains={selectedChains}
              onSelectionChange={setSelectedChains}
            />
            <DeployButton
              selectedChains={selectedChains}
              onDeploymentUpdate={setDeploymentResults}
            />
            <DeploymentReport results={deploymentResults} />
          </div>
        )}

        {/* Tron Tab Content */}
        {activeTab === 'tron' && (
          <div className="space-y-6">
            <TronConnect />
            <TronDeploy />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
