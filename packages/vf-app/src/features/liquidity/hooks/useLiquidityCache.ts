import { useEffect, useRef, useState } from 'react';
import { providers } from 'near-api-js';
import Big from 'big.js';
import { checkStorageDeposit, parseTokenAmount } from '@/lib/swap-utils';
import type { PoolInfo } from '@/types';

interface LiquidityCache {
  poolData: {
    token_account_ids: string[];
    amounts: string[];
    total_shares: string;
  } | null;
  depositedBalances: Record<string, string> | null;
  registrations: {
    token1: boolean;
    token2: boolean;
    wrapNear: boolean;
  } | null;
  timestamp: number;
}

export function useLiquidityCache(
  poolId: number,
  poolInfo: PoolInfo | null,
  token1Amount: string,
  token2Amount: string,
  accountId: string | null,
  getRefDepositedBalances: (tokenIds: string[]) => Promise<Record<string, string>>
) {
  const [cache, setCache] = useState<LiquidityCache>({
    poolData: null,
    depositedBalances: null,
    registrations: null,
    timestamp: 0,
  });
  const [isPreloading, setIsPreloading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous preload if amounts change
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!accountId || !poolInfo || !token1Amount || !token2Amount) {
      return;
    }

    const timer = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      setIsPreloading(true);

      try {
        const amount1Num = parseFloat(token1Amount.replace(/,/g, '').trim());
        const amount2Num = parseFloat(token2Amount.replace(/,/g, '').trim());
        
        if (isNaN(amount1Num) || isNaN(amount2Num) || amount1Num <= 0 || amount2Num <= 0) {
          return;
        }

        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
        const provider = new providers.JsonRpcProvider({ url: rpcUrl });

        // Fetch pool data
        const poolResponse = await provider.query({
          request_type: 'call_function',
          account_id: 'v2.ref-finance.near',
          method_name: 'get_pool',
          args_base64: Buffer.from(JSON.stringify({ pool_id: poolId })).toString('base64'),
          finality: 'final',
        }) as unknown as { result: number[] };

        if (controller.signal.aborted) return;

        const poolData = JSON.parse(Buffer.from(poolResponse.result).toString()) as {
          token_account_ids: string[];
          amounts: string[];
          total_shares: string;
        };

        // Get deposited balances in parallel with registrations
        const [depositedBalances, token1Registered, token2Registered, wrapNearRegistered] = await Promise.all([
          getRefDepositedBalances(poolData.token_account_ids),
          checkStorageDeposit(poolInfo.token1.id, accountId, rpcUrl),
          checkStorageDeposit(poolInfo.token2.id, accountId, rpcUrl),
          poolData.token_account_ids.includes('wrap.near') 
            ? checkStorageDeposit('wrap.near', accountId, rpcUrl)
            : Promise.resolve(true),
        ]);

        if (controller.signal.aborted) return;

        setCache({
          poolData,
          depositedBalances,
          registrations: {
            token1: token1Registered,
            token2: token2Registered,
            wrapNear: wrapNearRegistered,
          },
          timestamp: Date.now(),
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('[useLiquidityCache] Preload failed:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPreloading(false);
        }
      }
    }, 500); // Debounce 500ms

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [poolId, poolInfo, token1Amount, token2Amount, accountId, getRefDepositedBalances]);

  const isStale = cache.timestamp === 0 || (Date.now() - cache.timestamp) > 30000; // 30 seconds

  return {
    cache,
    isPreloading,
    isStale,
    isCached: !isStale && cache.poolData !== null,
  };
}
