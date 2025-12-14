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

  const signIn = async (retryCount = 0) => {
    console.warn('[WalletContext] signIn called, connector initialized:', !!connector);
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
      
      // Add a longer delay to ensure iframe initialization completes
      // This is especially important for reconnections when iframe needs to reinitialize
      // Meteor Wallet and other iframe-based wallets need extra time on subsequent connections
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Connect wallet - state will be updated via event listeners
      await connector.connect();
      
      // Note: State is updated via wallet:signIn event listener
      // No need to manually update state here to avoid race conditions
    } catch (error) {
      setIsConnecting(false);
      
      // Handle user cancellation gracefully - this is normal behavior, not an error
      if (error instanceof Error && (error.message === 'User rejected' || error.message === 'Wallet closed')) {
        console.warn('[WalletContext] User cancelled wallet connection');
      } else if (error instanceof Error && error.message === 'Iframe not loaded') {
        // Iframe loading issue - can happen with MyNearWallet or other iframe-based wallets
        // Auto-retry once if this is the first attempt
        if (retryCount === 0) {
          console.warn('[WalletContext] Wallet iframe failed to load. Retrying automatically...');
          // Wait longer before retrying to allow iframe to fully initialize
          // This is critical for reconnections where iframe cleanup may be in progress
          await new Promise(resolve => setTimeout(resolve, 800));
          return signIn(1); // Retry once
        } else {
          console.warn('[WalletContext] Wallet iframe failed to load after retry. Please try connecting again.');
        }
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
        });
        console.warn('[WalletContext] NearConnector created successfully');

        // Listen for sign in events
        _connector.on('wallet:signIn', async (event: { accounts: { accountId: string }[] }) => {
          const accountIds = event.accounts.map((acc) => acc.accountId);
          console.warn('[WalletContext] wallet:signIn event received, accounts:', accountIds);
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
