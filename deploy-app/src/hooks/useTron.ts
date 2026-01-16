import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    tronWeb?: any;
    tronLink?: any;
  }
}

export interface TronState {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  network: string | null;
}

export function useTron() {
  const [state, setState] = useState<TronState>({
    isInstalled: false,
    isConnected: false,
    address: null,
    balance: null,
    network: null,
  });

  const checkTronLink = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const tronWeb = window.tronWeb;
    const tronLink = window.tronLink;

    if (!tronLink || !tronWeb) {
      setState(prev => ({ ...prev, isInstalled: false }));
      return;
    }

    setState(prev => ({ ...prev, isInstalled: true }));

    if (tronWeb.ready && tronWeb.defaultAddress?.base58) {
      const address = tronWeb.defaultAddress.base58;
      let balance = null;

      try {
        const balanceInSun = await tronWeb.trx.getBalance(address);
        balance = (balanceInSun / 1e6).toFixed(4);
      } catch (e) {
        console.error('Failed to get Tron balance:', e);
      }

      const network = tronWeb.fullNode?.host?.includes('shasta') ? 'Shasta Testnet' : 'Mainnet';

      setState({
        isInstalled: true,
        isConnected: true,
        address,
        balance,
        network,
      });
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.tronLink) {
      window.open('https://www.tronlink.org/', '_blank');
      return;
    }

    try {
      const res = await window.tronLink.request({ method: 'tron_requestAccounts' });
      if (res.code === 200) {
        await checkTronLink();
      }
    } catch (e) {
      console.error('Failed to connect TronLink:', e);
    }
  }, [checkTronLink]);

  const disconnect = useCallback(() => {
    setState({
      isInstalled: true,
      isConnected: false,
      address: null,
      balance: null,
      network: null,
    });
  }, []);

  useEffect(() => {
    checkTronLink();

    // Listen for account changes
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.message?.action === 'setAccount' ||
          e.data?.message?.action === 'setNode') {
        checkTronLink();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkTronLink]);

  return { ...state, connect, disconnect };
}
