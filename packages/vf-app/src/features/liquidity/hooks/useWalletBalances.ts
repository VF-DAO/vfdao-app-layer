import { useCallback, useEffect, useState } from 'react';
import { providers } from 'near-api-js';

interface UseWalletBalancesResult {
  rawBalances: Record<string, string>;
  isLoadingBalances: boolean;
  refetchBalances: () => Promise<void>;
}

export function useWalletBalances(accountId: string | null): UseWalletBalancesResult {
  const [rawBalances, setRawBalances] = useState<Record<string, string>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!accountId) return;

    setIsLoadingBalances(true);
    try {
      const newRawBalances: Record<string, string> = {};
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });

      // Fetch NEAR balance
      try {
        const account = (await provider.query({
          request_type: 'view_account',
          account_id: accountId,
          finality: 'final',
        })) as unknown as { amount: string; storage_usage: string };

        const STORAGE_PRICE_PER_BYTE = BigInt('10000000000000000000');
        const storageCost = BigInt(account.storage_usage) * STORAGE_PRICE_PER_BYTE;
        const availableNearBalance = BigInt(account.amount) - storageCost;

        // Store raw balance for calculations
        const rawBalance = availableNearBalance.toString();
        newRawBalances.near = rawBalance;
        newRawBalances['wrap.near'] = rawBalance;
      } catch (nearError) {
        console.error('[useWalletBalances] Failed to fetch NEAR balance:', nearError);
        newRawBalances.near = '0';
        newRawBalances['wrap.near'] = '0';
      }

      // Fetch VF token balance
      try {
        const vfResult = (await provider.query({
          request_type: 'call_function',
          account_id: 'veganfriends.tkn.near',
          method_name: 'ft_balance_of',
          args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
          finality: 'final',
        })) as unknown as { result: number[] };
        const vfBalance = JSON.parse(Buffer.from(vfResult.result).toString()) as string;

        // Store raw balance for calculations
        newRawBalances['veganfriends.tkn.near'] = vfBalance;
      } catch {
        newRawBalances['veganfriends.tkn.near'] = '0';
      }

      setRawBalances(newRawBalances);
    } catch (error) {
      console.error('[useWalletBalances] Failed to fetch balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      void fetchBalances();
    } else {
      // Reset balances when wallet disconnects
      setRawBalances({});
      setIsLoadingBalances(false);
    }
  }, [accountId, fetchBalances]);

  return {
    rawBalances,
    isLoadingBalances,
    refetchBalances: fetchBalances,
  };
}
