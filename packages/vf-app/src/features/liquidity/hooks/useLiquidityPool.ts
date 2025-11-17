import { useCallback, useEffect, useState } from 'react';
import { providers } from 'near-api-js';
import type { PoolInfo, TokenMetadata } from '@/types';

interface UseLiquidityPoolResult {
  poolInfo: PoolInfo | null;
  isLoadingPool: boolean;
  error: string | null;
  refetchPool: () => Promise<void>;
}

export function useLiquidityPool(
  poolId: number,
  availableTokens: TokenMetadata[]
): UseLiquidityPoolResult {
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolInfo = useCallback(async () => {
    if (availableTokens.length === 0) return;

    setIsLoadingPool(true);
    setError(null);

    try {
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });

      // Get pool data
      const poolResponse = (await provider.query({
        request_type: 'call_function',
        account_id: 'v2.ref-finance.near',
        method_name: 'get_pool',
        args_base64: Buffer.from(JSON.stringify({ pool_id: poolId })).toString('base64'),
        finality: 'final',
      })) as unknown as { result: number[] };

      const pool = JSON.parse(Buffer.from(poolResponse.result).toString()) as {
        token_account_ids: string[];
        amounts: string[];
        total_shares: string;
        shares_total_supply?: string;
      };

      // Use shares_total_supply if total_shares is not available
      const shareSupply = pool.total_shares ?? pool.shares_total_supply ?? '0';

      // Get token metadata with icons
      const nearToken =
        availableTokens.find((t) => t.symbol === 'NEAR') ?? {
          id: 'near',
          symbol: 'NEAR',
          name: 'Near',
          decimals: 24,
          icon: 'https://assets.ref.finance/images/near.svg',
        };

      const vfToken =
        availableTokens.find((t) => t.id === 'veganfriends.tkn.near') ?? {
          id: 'veganfriends.tkn.near',
          symbol: 'VEGANFRIENDS',
          name: 'Vegan Friends Token',
          decimals: 18,
          icon: undefined,
        };

      if (nearToken && vfToken) {
        // Map reserves based on token_account_ids order from the contract
        const reserves: Record<string, string> = {};
        pool.token_account_ids.forEach((tokenId: string, index: number) => {
          reserves[tokenId] = pool.amounts[index];
        });

        // Find the correct NEAR id used in the pool
        const poolNearId =
          pool.token_account_ids.find((id: string) => id === 'wrap.near' || id === 'near') ??
          pool.token_account_ids.find((id: string) => id.includes('near')) ??
          nearToken.id;

        const nearMetaForPool: TokenMetadata = {
          ...nearToken,
          id: poolNearId,
          symbol: 'NEAR',
          decimals: nearToken.decimals,
        };

        // Ensure vfToken id matches contract id
        const vfMetaForPool: TokenMetadata = {
          ...vfToken,
          id: pool.token_account_ids.find((id: string) => id === vfToken.id) ?? vfToken.id,
        };

        setPoolInfo({
          id: poolId,
          token1: nearMetaForPool,
          token2: vfMetaForPool,
          reserves,
          shareSupply,
        });
      }
    } catch (err) {
      console.error('[useLiquidityPool] Failed to fetch pool info:', err);
      setError('Failed to load pool information');
    } finally {
      setIsLoadingPool(false);
    }
  }, [poolId, availableTokens]);

  useEffect(() => {
    void fetchPoolInfo();
  }, [fetchPoolInfo]);

  return {
    poolInfo,
    isLoadingPool,
    error,
    refetchPool: fetchPoolInfo,
  };
}
