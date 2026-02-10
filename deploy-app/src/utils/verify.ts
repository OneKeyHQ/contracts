import { BULK_SEND_VERIFY_DATA } from '../config/contract.generated';

/** Explorer API configuration per chain */
const EXPLORER_APIS: Record<number, { apiUrl: string; envKey: string; name: string }> = {
  1:     { apiUrl: 'https://api.etherscan.io/api',              envKey: 'VITE_ETHERSCAN_API_KEY',    name: 'Etherscan' },
  56:    { apiUrl: 'https://api.bscscan.com/api',               envKey: 'VITE_BSCSCAN_API_KEY',      name: 'BscScan' },
  42161: { apiUrl: 'https://api.arbiscan.io/api',               envKey: 'VITE_ARBISCAN_API_KEY',     name: 'Arbiscan' },
  137:   { apiUrl: 'https://api.polygonscan.com/api',            envKey: 'VITE_POLYGONSCAN_API_KEY',  name: 'PolygonScan' },
  8453:  { apiUrl: 'https://api.basescan.org/api',               envKey: 'VITE_BASESCAN_API_KEY',     name: 'BaseScan' },
  10:    { apiUrl: 'https://api-optimistic.etherscan.io/api',    envKey: 'VITE_OPSCAN_API_KEY',       name: 'Optimistic Etherscan' },
  43114: { apiUrl: 'https://api.snowtrace.io/api',               envKey: 'VITE_SNOWTRACE_API_KEY',    name: 'SnowTrace' },
  59144: { apiUrl: 'https://api.lineascan.build/api',            envKey: 'VITE_LINEASCAN_API_KEY',    name: 'LineaScan' },
};

export type VerifyStatus = 'pending' | 'verifying' | 'verified' | 'verify-failed' | 'skipped';

function getApiKey(chainId: number): string | null {
  const config = EXPLORER_APIS[chainId];
  if (!config) return null;
  const key = import.meta.env[config.envKey];
  return key && key.length > 0 ? key : null;
}

/**
 * Submit source code verification to an Etherscan-compatible explorer API.
 * Returns the verification GUID on success.
 */
async function submitVerification(
  chainId: number,
  contractAddress: string,
  apiKey: string,
): Promise<string> {
  const config = EXPLORER_APIS[chainId];
  if (!config) throw new Error(`No explorer API configured for chain ${chainId}`);

  const params = new URLSearchParams({
    apikey: apiKey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: contractAddress,
    sourceCode: BULK_SEND_VERIFY_DATA.sourceCode,
    codeformat: 'solidity-single-file',
    contractname: 'BulkSend',
    compilerversion: BULK_SEND_VERIFY_DATA.compilerVersion,
    optimizationUsed: BULK_SEND_VERIFY_DATA.optimizationUsed ? '1' : '0',
    runs: String(BULK_SEND_VERIFY_DATA.runs),
    constructorArguements: BULK_SEND_VERIFY_DATA.constructorArguments, // Etherscan typo is intentional
    licenseType: '3', // MIT
  });

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();
  if (data.status === '1') {
    return data.result; // GUID
  }
  throw new Error(data.result || 'Verification submission failed');
}

/**
 * Check verification status by GUID.
 * Returns true if verified, false if pending, throws on failure.
 */
async function checkVerificationStatus(
  chainId: number,
  guid: string,
  apiKey: string,
): Promise<boolean> {
  const config = EXPLORER_APIS[chainId];
  if (!config) throw new Error(`No explorer API configured for chain ${chainId}`);

  const params = new URLSearchParams({
    apikey: apiKey,
    module: 'contract',
    action: 'checkverifystatus',
    guid,
  });

  const response = await fetch(`${config.apiUrl}?${params.toString()}`);
  const data = await response.json();

  if (data.result === 'Pending in queue') return false;
  if (data.result === 'Pass - Verified') return true;
  if (data.result?.includes('Already Verified')) return true;
  throw new Error(data.result || 'Verification check failed');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify a deployed contract on the chain's block explorer.
 *
 * Returns the final status:
 * - 'verified' if verification succeeded
 * - 'verify-failed' if verification failed
 * - 'skipped' if no API key is configured or no source code available
 */
export async function verifyContract(
  chainId: number,
  contractAddress: string,
): Promise<{ status: VerifyStatus; message: string }> {
  // Check if source code is available
  if (!BULK_SEND_VERIFY_DATA.sourceCode) {
    return {
      status: 'skipped',
      message: 'No source code available. Run `npm run generate` with Foundry installed.',
    };
  }

  // Check if explorer is supported for this chain
  if (!EXPLORER_APIS[chainId]) {
    return { status: 'skipped', message: `No explorer API configured for chain ${chainId}` };
  }

  // Check for API key
  const apiKey = getApiKey(chainId);
  if (!apiKey) {
    const config = EXPLORER_APIS[chainId];
    return {
      status: 'skipped',
      message: `No API key configured. Set ${config.envKey} in .env`,
    };
  }

  try {
    // Submit verification
    const guid = await submitVerification(chainId, contractAddress, apiKey);

    // Poll for result (max 60 seconds)
    const maxAttempts = 12;
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(5000);
      try {
        const verified = await checkVerificationStatus(chainId, guid, apiKey);
        if (verified) {
          return { status: 'verified', message: `Verified on ${EXPLORER_APIS[chainId].name}` };
        }
      } catch (e) {
        // If it's a real error (not "pending"), stop polling
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('Pending')) {
          return { status: 'verify-failed', message: msg };
        }
      }
    }

    return { status: 'verify-failed', message: 'Verification timed out after 60s' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: 'verify-failed', message: msg };
  }
}
