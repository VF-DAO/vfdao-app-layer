'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Proper types from @hot-labs/near-connect
type NearConnector = any; // TODO: Import proper types when available
type NearWalletBase = any; // TODO: Import proper types when available

export interface WalletContextType {
  connector: NearConnector | null;
  wallet: NearWalletBase | null;
  accounts: { accountId: string }[];
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  connector: null,
  wallet: null,
  accounts: [],
  accountId: null,
  isConnected: false,
  isLoading: true,
  isConnecting: false,
  signIn: async () => {
    // Placeholder - implemented in provider
  },
  signOut: async () => {
    // Placeholder - implemented in provider
  },
});

export function useWallet() {
  return useContext(WalletContext);
}

interface WalletProviderProps {
  children: ReactNode;
  network?: 'testnet' | 'mainnet';
}

export function WalletProvider({
  children,
  network = 'mainnet',
}: WalletProviderProps) {
  const [connector, setConnector] = useState<NearConnector>(null);
  const [wallet, setWallet] = useState<NearWalletBase>(null);
  const [accounts, setAccounts] = useState<{ accountId: string }[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const signIn = async () => {
    console.warn('[WalletContext] signIn called, connector:', !!connector);
    if (!connector) {
      console.error('[WalletContext] Connector not initialized');
      return;
    }

    try {
      setIsConnecting(true);
      console.warn('[WalletContext] Attempting to connect wallet...');
      
      // Wait for manifest to load before connecting
      await connector.whenManifestLoaded;
      console.warn('[WalletContext] Manifest loaded, showing wallet selector...');
      
      // Connect wallet - state will be updated via event listeners
      await connector.connect();
      
      // Note: State is updated via wallet:signIn event listener
      // No need to manually update state here to avoid race conditions
    } catch (error) {
      setIsConnecting(false);
      
      // Handle user cancellation gracefully - this is normal behavior, not an error
      if (error instanceof Error && (error.message === 'User rejected' || error.message === 'Wallet closed')) {
        console.warn('[WalletContext] User cancelled wallet connection');
      } else if (error === null || error === undefined) {
        // User cancelled without throwing a specific error - this is normal
        console.warn('[WalletContext] Wallet connection cancelled');
      } else {
        // Only log actual errors (network issues, invalid config, etc.)
        console.error('[WalletContext] Failed to connect wallet:', error);
      }
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
        console.warn('[WalletContext] Initializing connector...');
        // Dynamic import to avoid SSR issues
        const { NearConnector } = await import('@hot-labs/near-connect');
        console.warn('[WalletContext] NearConnector imported successfully');
        
        const _connector = new NearConnector({
          network: network === 'testnet' ? 'testnet' : 'mainnet',
          
          // Optional: WalletConnect configuration
          walletConnect: {
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '1292473190ce7eb75c9de67e15aaad99',
            metadata: {
              name: 'VF DAO',
              description: 'Decentralized infrastructure for the vegan community. Built on NEAR Protocol.',
              url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001',
              icons: ['https://vfdao.org/icon.png'],
            },
          },
        });
        console.warn('[WalletContext] NearConnector created successfully');

        // Listen for sign in events
        _connector.on('wallet:signIn', async (event: { accounts: { accountId: string }[] }) => {
          console.warn('[WalletContext] wallet:signIn event received:', event);
          const connectedWallet = await _connector.wallet();
          setWallet(connectedWallet);
          setAccounts(event.accounts.map((acc) => ({ accountId: acc.accountId })));
          setAccountId(event.accounts[0]?.accountId ?? null);
          setIsConnecting(false);
        });

        // Listen for sign out events
        _connector.on('wallet:signOut', () => {
          console.warn('[WalletContext] wallet:signOut event received');
          setWallet(null);
          setAccounts([]);
          setAccountId(null);
          setIsConnecting(false);
        });

        setConnector(_connector);
        console.warn('[WalletContext] Connector set successfully');
        
        // Check if wallet is already connected
        try {
          const { wallet: connectedWallet, accounts: connectedAccounts } = await _connector.getConnectedWallet();
          if (connectedWallet && connectedAccounts.length > 0) {
            console.warn('[WalletContext] Found connected wallet:', connectedAccounts[0]?.accountId);
            setWallet(connectedWallet);
            setAccounts(connectedAccounts.map((acc: any) => ({ accountId: acc.accountId })));
            setAccountId(connectedAccounts[0]?.accountId ?? null);
          } else {
            console.warn('[WalletContext] No wallet connected on mount');
          }
        } catch (err) {
          // No wallet connected yet, this is fine
          console.warn('[WalletContext] No wallet connected on mount (error):', err);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to initialize HOT Connect:', errorMessage);
        console.error('Full error:', error);
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
    isConnecting,
    signIn,
    signOut,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
