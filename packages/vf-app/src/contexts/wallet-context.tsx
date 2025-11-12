'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Type-only imports to avoid SSR issues
type NearConnector = any;
type NearWalletBase = any;

interface WalletContextType {
  connector: NearConnector | null;
  wallet: NearWalletBase | null;
  accounts: { accountId: string }[];
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const WalletContext = createContext<WalletContextType>({
  connector: null,
  wallet: null,
  accounts: [],
  accountId: null,
  isConnected: false,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

interface WalletProviderProps {
  children: ReactNode;
  contractId?: string;
  network?: 'testnet' | 'mainnet';
}

export function WalletProvider({
  children,
  contractId = 'vfdao.near',
  network = 'mainnet',
}: WalletProviderProps) {
  const [connector, setConnector] = useState<NearConnector | null>(null);
  const [wallet, setWallet] = useState<NearWalletBase | null>(null);
  const [accounts, setAccounts] = useState<{ accountId: string }[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signIn = async () => {
    if (connector) {
      try {
        console.log('[WalletContext] Attempting to connect wallet...');
        // Wait for manifest to load before connecting
        await connector.whenManifestLoaded;
        console.log('[WalletContext] Manifest loaded, showing wallet selector...');
        const connectedWallet = await connector.connect();
        console.log('[WalletContext] Wallet connected:', connectedWallet);
        
        // Manually update state after connection (event listener should also fire)
        if (connectedWallet) {
          const { wallet: walletInstance, accounts: connectedAccounts } = await connector.getConnectedWallet();
          console.log('[WalletContext] Setting wallet state:', { accounts: connectedAccounts });
          setWallet(walletInstance);
          setAccounts(connectedAccounts.map((acc: any) => ({ accountId: acc.accountId })));
          setAccountId(connectedAccounts[0]?.accountId ?? null);
        }
      } catch (error) {
        // Handle user rejection gracefully - don't treat as error
        if (error instanceof Error && (error.message === 'User rejected' || error.message === 'Wallet closed')) {
          console.log('[WalletContext] User cancelled wallet connection');
        } else {
          console.error('[WalletContext] Failed to connect wallet:', error);
        }
      }
    } else {
      console.error('[WalletContext] Connector not initialized');
    }
  };

  const signOut = async () => {
    if (wallet) {
      await wallet.signOut();
      setWallet(null);
      setAccounts([]);
      setAccountId(null);
    }
  };

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    async function initConnector() {
      try {
        // Dynamic import to avoid SSR issues
        const { NearConnector } = await import('@hot-labs/near-connect');
        
        const _connector = new NearConnector({
          network: network === 'testnet' ? 'testnet' : 'mainnet',
          
          // Optional: WalletConnect configuration
          walletConnect: {
            projectId: 'c4f79cc821944d9680842e34466bfbad',
            metadata: {
              name: 'VF DAO',
              description: 'Decentralized infrastructure for the vegan community. Built on NEAR Protocol.',
              url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001',
              icons: ['https://vfdao.org/icon.png'],
            },
          },
        });

        // Listen for sign in events
        _connector.on('wallet:signIn', async (event: any) => {
          const connectedWallet = await _connector.wallet();
          setWallet(connectedWallet);
          setAccounts(event.accounts.map((acc: any) => ({ accountId: acc.accountId })));
          setAccountId(event.accounts[0]?.accountId ?? null);
        });

        // Listen for sign out events
        _connector.on('wallet:signOut', async () => {
          setWallet(null);
          setAccounts([]);
          setAccountId(null);
        });

        setConnector(_connector);
        
        // Check if wallet is already connected
        try {
          const { wallet: connectedWallet, accounts: connectedAccounts } = await _connector.getConnectedWallet();
          if (connectedWallet && connectedAccounts.length > 0) {
            console.log('[WalletContext] Found connected wallet:', connectedAccounts[0]?.accountId);
            setWallet(connectedWallet);
            setAccounts(connectedAccounts.map((acc: any) => ({ accountId: acc.accountId })));
            setAccountId(connectedAccounts[0]?.accountId ?? null);
          } else {
            console.log('[WalletContext] No wallet connected on mount');
          }
        } catch (err) {
          // No wallet connected yet, this is fine
          console.log('[WalletContext] No wallet connected on mount (error):', err);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to initialize HOT Connect:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    void initConnector();
  }, [network]);

  const value: WalletContextType = {
    connector,
    wallet,
    accounts,
    accountId,
    isConnected: !!accountId,
    isLoading,
    signIn,
    signOut,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
