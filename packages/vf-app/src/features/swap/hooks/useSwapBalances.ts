import { useCallback, useEffect, useState } from 'react';
import { providers } from 'near-api-js';
import type { TokenMetadata } from '@/types';
import { formatTokenAmount } from '@/lib/swap-utils';

export interface UseSwapBalancesReturn {
  balances: Record<string, string>;
  rawBalances: Record<string, string>;
  isLoadingBalances: boolean;
  fetchBalances: () => Promise<void>;
  resetBalances: () => void;
  setLoadingState: (loading: boolean) => void;
  invalidateBalance: (tokenId: string) => void;
}

export function useSwapBalances(
  accountId: string | null,
  wallet: any,
  tokenIn: TokenMetadata | undefined,
  tokenOut: TokenMetadata | undefined
): UseSwapBalancesReturn {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [rawBalances, setRawBalances] = useState<Record<string, string>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (!accountId || !wallet) {
      return;
    }

    setIsLoadingBalances(true);
    try {
      const newBalances: Record<string, string> = {};
      const newRawBalances: Record<string, string> = {};

      // Fetch NEAR balance
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });
      const account = (await provider.query({
        request_type: 'view_account',
        account_id: accountId,
        finality: 'final',
      }) as unknown) as { amount: string; storage_usage: string };
      const totalNearBalance = account.amount;
      
      // Calculate available balance (total - storage reserve)
      const STORAGE_PRICE_PER_BYTE = BigInt('10000000000000000000');
      const storageCost = BigInt(account.storage_usage) * STORAGE_PRICE_PER_BYTE;
      const availableNearBalance = BigInt(totalNearBalance) - storageCost;
      
      // Store available balance for NEAR token
      newBalances.near = formatTokenAmount(availableNearBalance.toString(), 24, 6);
      newRawBalances.near = availableNearBalance.toString();

      // Fetch FT token balances
      const tokensToFetch = [tokenIn, tokenOut].filter(Boolean);
      for (const token of tokensToFetch) {
        if (token && token.id !== 'near') {
          try {
            const result = (await provider.query({
              request_type: 'call_function',
              account_id: token.id,
              method_name: 'ft_balance_of',
              args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
              finality: 'final',
            })) as unknown as { result: number[] };
            const balance = JSON.parse(Buffer.from(result.result).toString()) as string;
            newBalances[token.id] = formatTokenAmount(balance, token.decimals, 6);
            newRawBalances[token.id] = balance;
          } catch {
            newBalances[token.id] = '0';
          }
        }
      }

      setBalances(newBalances);
      setRawBalances(newRawBalances);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [accountId, wallet, tokenIn, tokenOut]);

  // Reset balances
  const resetBalances = useCallback(() => {
    setBalances({});
    setRawBalances({});
    setIsLoadingBalances(false);
  }, []);

  // Manually set loading state (useful for showing spinner before fetch)
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoadingBalances(loading);
  }, []);

  // Invalidate a specific token balance (remove it from cache)
  const invalidateBalance = useCallback((tokenId: string) => {
    setBalances(prev => {
      const newBalances = { ...prev };
      delete newBalances[tokenId];
      return newBalances;
    });
    setRawBalances(prev => {
      const newRawBalances = { ...prev };
      delete newRawBalances[tokenId];
      return newRawBalances;
    });
  }, []);

  // Fetch balances when account or tokens change
  useEffect(() => {
    void (async () => {
      try {
        await fetchBalances();
      } catch (error) {
        console.warn('[SwapBalances] Failed to fetch balances:', error);
      }
    })();
  }, [fetchBalances]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!accountId) {
      resetBalances();
    }
  }, [accountId, resetBalances]);

  return {
    balances,
    rawBalances,
    isLoadingBalances,
    fetchBalances,
    resetBalances,
    setLoadingState,
    invalidateBalance,
  };
}
