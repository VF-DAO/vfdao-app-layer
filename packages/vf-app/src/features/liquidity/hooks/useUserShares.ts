import { useCallback, useEffect, useState } from 'react';
import { providers } from 'near-api-js';

interface UseUserSharesResult {
  userShares: string;
  isLoadingShares: boolean;
  refetchShares: () => Promise<string>;
  setLoadingState: (loading: boolean) => void;
}

export function useUserShares(poolId: number, accountId: string | null): UseUserSharesResult {
  const [userShares, setUserShares] = useState('0');
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  const fetchUserShares = useCallback(async (): Promise<string> => {
    if (!accountId) {
      setUserShares('0');
      setIsLoadingShares(false);
      return '0';
    }

    setIsLoadingShares(true);
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });

      // Try get_pool_shares first (standard method)
      try {
        const sharesResult = (await provider.query({
          request_type: 'call_function',
          account_id: 'v2.ref-finance.near',
          method_name: 'get_pool_shares',
          args_base64: Buffer.from(
            JSON.stringify({
              pool_id: poolId,
              account_id: accountId,
            })
          ).toString('base64'),
          finality: 'final',
        })) as unknown as { result: number[] };

        const shares = JSON.parse(Buffer.from(sharesResult.result).toString()) as string;
        setUserShares(shares);
        return shares;
      } catch {
        // Fallback to mft_balance_of (alternative method)
        const mftResult = (await provider.query({
          request_type: 'call_function',
          account_id: 'v2.ref-finance.near',
          method_name: 'mft_balance_of',
          args_base64: Buffer.from(
            JSON.stringify({
              token_id: `:${poolId}`,
              account_id: accountId,
            })
          ).toString('base64'),
          finality: 'final',
        })) as unknown as { result: number[] };

        const shares = JSON.parse(Buffer.from(mftResult.result).toString()) as string;
        setUserShares(shares);
        return shares;
      }
    } catch (error) {
      console.error('[useUserShares] Failed to fetch user shares (both methods):', error);
      setUserShares('0');
      return '0';
    } finally {
      setIsLoadingShares(false);
    }
  }, [poolId, accountId]);

  useEffect(() => {
    if (accountId) {
      void fetchUserShares();
    } else {
      // Reset shares when wallet disconnects
      setUserShares('0');
      setIsLoadingShares(false);
    }
  }, [accountId, fetchUserShares]);

  return {
    userShares,
    isLoadingShares,
    refetchShares: fetchUserShares,
    setLoadingState: setIsLoadingShares,
  };
}
