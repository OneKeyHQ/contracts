import type { DeploymentResult } from './DeployButton';

interface DeploymentReportProps {
  results: DeploymentResult[];
}

export function DeploymentReport({ results }: DeploymentReportProps) {
  const successfulDeployments = results.filter(r => r.status === 'success');

  const exportJSON = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      contracts: Object.fromEntries(
        successfulDeployments.map(r => [
          r.chainName.toLowerCase().replace(/\s+/g, '_'),
          {
            address: r.address,
            chainId: r.chainId,
            txHash: r.txHash,
            deployedAt: new Date().toISOString(),
          }
        ])
      ),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployments-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (successfulDeployments.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Deployment Report</h2>
        <button
          onClick={exportJSON}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Export JSON
        </button>
      </div>

      <div className="space-y-2">
        {successfulDeployments.map((result) => (
          <div key={result.chainId} className="bg-gray-700 p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">{result.chainName}</span>
              <span className="text-green-400 text-sm">Deployed</span>
            </div>
            <p className="font-mono text-xs mt-1 text-gray-300 break-all">
              {result.address}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
