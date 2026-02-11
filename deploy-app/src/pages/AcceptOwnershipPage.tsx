import { useState } from 'react';
import { WalletConnect } from '../components/WalletConnect';
import { AcceptOwnership } from '../components/AcceptOwnership';
import { TronConnect } from '../components/TronConnect';
import { TronAcceptOwnership } from '../components/TronAcceptOwnership';

type NetworkTab = 'evm' | 'tron';

export function AcceptOwnershipPage() {
  const [activeTab, setActiveTab] = useState<NetworkTab>('evm');

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Accept Ownership</h1>

      <p className="text-sm text-gray-400 mb-6">
        Complete a 2-step ownership transfer by calling acceptOwnership() on a BulkSend contract.
        The current owner must have already called transferOwnership() with your address.
      </p>

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
          <AcceptOwnership />
        </div>
      )}

      {/* Tron Tab Content */}
      {activeTab === 'tron' && (
        <div className="space-y-6">
          <TronConnect />
          <TronAcceptOwnership />
        </div>
      )}
    </>
  );
}
