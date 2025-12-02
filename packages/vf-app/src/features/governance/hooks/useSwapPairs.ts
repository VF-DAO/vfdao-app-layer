import { useCallback, useEffect, useMemo, useState } from 'react';

interface TokenInfo {
  contractId: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

interface PoolInfo {
  pool_id: number;
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
  pool_kind?: string;
}

// USDC contract ID for Rhea DCL pool
const USDC_CONTRACT = '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1';
// VEGANFRIENDS token contract ID (pool 5094 with wNEAR)
const VEGANFRIENDS_CONTRACT = 'veganfriends.tkn.near';

/**
 * Hook to fetch and cache available swap pairs from Ref Finance pools
 * Returns a map of tokenIn -> available tokenOut options
 */
export function useSwapPairs(availableTokens: TokenInfo[]) {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pools from Ref Finance
  const fetchPools = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';

      // Fetch first 500 pools (covers most active pools)
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'query',
          params: {
            request_type: 'call_function',
            account_id: 'v2.ref-finance.near',
            method_name: 'get_pools',
            args_base64: Buffer.from(JSON.stringify({ from_index: 0, limit: 500 })).toString('base64'),
            finality: 'final'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pools');
      }

      const data = await response.json();
      if (!data.result?.result) {
        throw new Error('Invalid pool response');
      }

      const fetchedPools: PoolInfo[] = JSON.parse(Buffer.from(data.result.result).toString());
      
      // Filter to only pools with liquidity
      const activePools = fetchedPools.filter(pool => 
        pool.amounts && 
        pool.amounts.length >= 2 &&
        pool.amounts.every((amount: string) => parseInt(amount) > 0)
      );

      setPools(activePools);
    } catch (err) {
      console.error('[useSwapPairs] Failed to fetch pools:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch pools on mount
  useEffect(() => {
    void fetchPools();
  }, [fetchPools]);

  // Build a map of token -> available pairs
  const tokenPairMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const tokenContractIds = new Set(availableTokens.map(t => t.contractId));

    // Add all pool-based pairs
    for (const pool of pools) {
      const poolTokens = pool.token_account_ids.filter(t => tokenContractIds.has(t));
      
      // For each token in the pool, add all other tokens as valid pairs
      for (const tokenIn of poolTokens) {
        if (!map.has(tokenIn)) {
          map.set(tokenIn, new Set());
        }
        for (const tokenOut of poolTokens) {
          if (tokenIn !== tokenOut) {
            map.get(tokenIn)!.add(tokenOut);
          }
        }
      }
    }

    // Add NEAR <-> USDC pair via Rhea DCL (dclv2.ref-labs.near)
    // This is a special high-liquidity pool that exists outside of regular Ref pools
    if (tokenContractIds.has('wrap.near') && tokenContractIds.has(USDC_CONTRACT)) {
      if (!map.has('wrap.near')) {
        map.set('wrap.near', new Set());
      }
      map.get('wrap.near')!.add(USDC_CONTRACT);

      if (!map.has(USDC_CONTRACT)) {
        map.set(USDC_CONTRACT, new Set());
      }
      map.get(USDC_CONTRACT)!.add('wrap.near');
    }

    // Add NEAR <-> VEGANFRIENDS pair (pool 5094)
    // Explicitly add this pair to ensure it's always available
    if (tokenContractIds.has('wrap.near') && tokenContractIds.has(VEGANFRIENDS_CONTRACT)) {
      if (!map.has('wrap.near')) {
        map.set('wrap.near', new Set());
      }
      map.get('wrap.near')!.add(VEGANFRIENDS_CONTRACT);

      if (!map.has(VEGANFRIENDS_CONTRACT)) {
        map.set(VEGANFRIENDS_CONTRACT, new Set());
      }
      map.get(VEGANFRIENDS_CONTRACT)!.add('wrap.near');
    }

    return map;
  }, [pools, availableTokens]);

  // Get available output tokens for a given input token
  const getAvailableOutputTokens = useCallback((tokenIn: string): TokenInfo[] => {
    const validOutputIds = tokenPairMap.get(tokenIn);
    if (!validOutputIds || validOutputIds.size === 0) {
      return [];
    }

    return availableTokens.filter(t => validOutputIds.has(t.contractId));
  }, [tokenPairMap, availableTokens]);

  // Check if a specific pair is valid
  const isPairValid = useCallback((tokenIn: string, tokenOut: string): boolean => {
    const validOutputIds = tokenPairMap.get(tokenIn);
    return validOutputIds?.has(tokenOut) ?? false;
  }, [tokenPairMap]);

  // Get tokens that have at least one valid pair (for input token selection)
  const tokensWithPairs = useMemo(() => {
    return availableTokens.filter(t => {
      const pairs = tokenPairMap.get(t.contractId);
      return pairs && pairs.size > 0;
    });
  }, [availableTokens, tokenPairMap]);

  return {
    pools,
    isLoading,
    error,
    getAvailableOutputTokens,
    isPairValid,
    tokensWithPairs,
    refetch: fetchPools,
  };
}
