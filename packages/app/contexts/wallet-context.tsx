import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Linking } from 'react-native';

interface WalletContextType {
  accountId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getBalance: () => Promise<string>;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    console.log('[Wallet] Connect button pressed');
    
    try {
      setIsConnecting(true);
      setError(null);

      // Check if we're in a development client or Expo Go
      const isDemoMode = !__DEV__;
      
      if (isDemoMode) {
        // DEMO MODE: Simulate wallet connection for Expo Go
        console.log('[Wallet] Demo mode: Simulating wallet connection...');
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Set demo account and connection
        setAccountId('demo.near');
        setIsConnected(true);
        console.log('[Wallet] Connected successfully (demo): demo.near');
        
        // Fetch balance
        await getBalance();
      } else {
        // REAL MODE: Use deep links to open wallet apps
        // This works in EAS development build, not in Expo Go
        const walletOptions = [
          { name: 'HOT Wallet', deepLink: 'hot://' },
          { name: 'HERE Wallet', deepLink: 'here://' },
          { name: 'MyNearWallet', deepLink: 'mynearwallet://' },
          { name: 'Meteor Wallet', deepLink: 'meteor://' },
        ];

        let walletOpened = false;

        for (const wallet of walletOptions) {
          try {
            await Linking.openURL(wallet.deepLink);
            console.log(`[Wallet] Opened ${wallet.name}`);
            walletOpened = true;
            break;
          } catch (err) {
            console.log(`[Wallet] ${wallet.name} not available, trying next...`);
            continue;
          }
        }

        if (!walletOpened) {
          setError('No NEAR wallet app installed. Please install HOT Wallet, HERE Wallet, MyNearWallet, or Meteor Wallet.');
          console.error('[Wallet] No wallet apps found. Tried:', walletOptions.map(w => w.name).join(', '));
        }
      }
    } catch (error) {
      console.error('[Wallet] Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      setAccountId(null);
      setIsConnected(false);
      setBalance(null);
    } catch (error) {
      console.error('[Wallet] Disconnect error:', error);
    }
  };

  const getBalance = async (): Promise<string> => {
    if (!accountId) return '0';
    
    try {
      // Fetch account state from NEAR RPC
      const response = await fetch('https://rpc.mainnet.near.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'query',
          params: {
            request_type: 'view_account',
            finality: 'final',
            account_id: accountId,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.result && data.result.amount) {
        // Convert from yoctoNEAR (10^-24) to NEAR
        const balanceInNear = (BigInt(data.result.amount) / BigInt(10 ** 24)).toString();
        setBalance(balanceInNear);
        return balanceInNear;
      }
      
      return '0';
    } catch (error) {
      console.error('[Wallet] Error fetching balance:', error);
      return '0';
    }
  };

  return (
    <WalletContext.Provider
      value={{
        accountId,
        isConnected,
        isConnecting,
        balance,
        error,
        connect,
        disconnect,
        getBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
