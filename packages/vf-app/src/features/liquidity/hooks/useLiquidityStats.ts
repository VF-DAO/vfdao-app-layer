import { useCallback, useEffect, useRef, useState } from 'react';
import Big from 'big.js';
import type { PoolInfo, PoolStats } from '@/types';

interface UseLiquidityStatsResult {
  poolStats: PoolStats;
  isLoadingPoolStats: boolean;
  hasLoadedPoolStats: boolean;
  refetchStats: () => Promise<void>;
}

export function useLiquidityStats(
  poolId: number,
  poolInfo: PoolInfo | null,
  tokenPrices: Record<string, number>,
  transactionState: string | null
): UseLiquidityStatsResult {
  const [poolStats, setPoolStats] = useState<PoolStats>({
    volume24h: '0',
    fee24h: '0',
    apy: 0,
  });
  const [isLoadingPoolStats, setIsLoadingPoolStats] = useState(true);
  const [hasLoadedPoolStats, setHasLoadedPoolStats] = useState(false);

  // Use refs to access latest values without causing effect re-runs
  const poolInfoRef = useRef(poolInfo);
  const tokenPricesRef = useRef(tokenPrices);
  const poolIdRef = useRef(poolId);
  
  useEffect(() => {
    poolInfoRef.current = poolInfo;
    tokenPricesRef.current = tokenPrices;
    poolIdRef.current = poolId;
  }, [poolInfo, tokenPrices, poolId]);

  const fetchPoolStats = useCallback(
    async (retryCount = 0, isRetry = false) => {
      const maxRetries = 3;

      // Set loading state at the start (unless this is a retry)
      if (!isRetry) {
        setIsLoadingPoolStats(true);
      }

      try {
        let volume24h = '0';

        // Fetch 24h volume from our Next.js API route (avoids CORS)
        // The API route proxies the request to Ref Finance server-side
        // Only fetch on client-side to avoid SSR issues
        if (typeof window !== 'undefined') {
          try {
            // Create AbortController with 15 second timeout (API can be slow)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(new Error('Request timeout')), 15000);

            const volumeResponse = await fetch(`/api/pool-volume?pool_id=${poolIdRef.current}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (volumeResponse.ok) {
              const data = (await volumeResponse.json()) as { volume?: string };
              volume24h = data.volume ?? '0';
            }
          } catch (volumeError) {
            // Handle timeout (AbortError) gracefully - this is expected behavior
            if (volumeError instanceof Error && volumeError.name === 'AbortError') {
              // Silent timeout - will use fallback value
            } else {
              // Network error - check if we should retry
              console.error('[useLiquidityStats] Could not fetch 24h volume:', volumeError);

              // Retry on network errors (not on AbortError from timeout)
              if (retryCount < maxRetries) {
                // Reset loading state before retry to avoid stuck loading indicator
                setIsLoadingPoolStats(false);
                setTimeout(() => {
                  void fetchPoolStats(retryCount + 1, true); // Mark as retry
                }, (retryCount + 1) * 1000); // Exponential backoff
                return; // Don't continue with setting state on retry
              }
            }
            // Don't rethrow - we want to continue with volume = '0'
          }
        }

        // Calculate Fee (24h) and APY if we have pool info and volume
        let fee24h = '0';
        let apy = 0;

        const currentPoolInfo = poolInfoRef.current;
        const currentTokenPrices = tokenPricesRef.current;

        if (currentPoolInfo && Number(volume24h) > 0) {
          // Fee calculation: (pool.total_fee / 10000) * 0.8 * volume24h
          // Ref Finance pools typically have 0.3% fee (30 basis points), 80% goes to LPs
          const poolFee = 30; // 0.3% = 30 basis points
          const fee24hValue = (poolFee / 10000) * 0.8 * Number(volume24h);
          fee24h = fee24hValue.toString();

          // APY calculation: ((fee24h * 365) / tvl) * 100
          // Calculate TVL from pool reserves
          const token1Price =
            currentTokenPrices[currentPoolInfo.token1.id] ?? currentTokenPrices.near ?? currentTokenPrices['wrap.near'] ?? 0;
          const token2Price = currentTokenPrices[currentPoolInfo.token2.id] ?? 0;

          if (token1Price > 0) {
            const token1Reserve = Big(currentPoolInfo.reserves[currentPoolInfo.token1.id]).div(
              Big(10).pow(currentPoolInfo.token1.decimals)
            );
            const token2Reserve = Big(currentPoolInfo.reserves[currentPoolInfo.token2.id]).div(
              Big(10).pow(currentPoolInfo.token2.decimals)
            );

            const token1TVL = token1Reserve.mul(token1Price);
            const token2TVL = token2Reserve.mul(token2Price > 0 ? token2Price : 0);
            const tvl = token1TVL.plus(token2TVL).toNumber();

            if (tvl > 0) {
              apy = ((fee24hValue * 365) / tvl) * 100;
            }
          }
        }

        setPoolStats({
          volume24h,
          fee24h,
          apy,
        });
      } catch (error) {
        console.error('[useLiquidityStats] Failed to fetch pool stats:', error);
        // Set default values on error
        setPoolStats({
          volume24h: '0',
          fee24h: '0',
          apy: 0,
        });
      } finally {
        // Always set loading to false when we're done (success or final failure)
        setIsLoadingPoolStats(false);
        // Mark as loaded after first fetch attempt (success or failure)
        setHasLoadedPoolStats(true);
      }
    },
    [] // Empty deps - function never recreates, uses refs for latest values
  );

  // Fetch pool stats immediately on mount
  useEffect(() => {
    void fetchPoolStats();
  }, []); // Run once on mount
  
  // Re-fetch when poolInfo or tokenPrices change
  useEffect(() => {
    // Always fetch - volume can be fetched even without poolInfo
    // Calculations will happen when poolInfo and prices are available
    void fetchPoolStats();
  }, [poolInfo, tokenPrices, fetchPoolStats]);

  // Auto-refresh pool stats every 60 seconds
  useEffect(() => {
    if (!poolInfo || Object.keys(tokenPrices).length === 0) return;

    const interval = setInterval(() => {
      // Only refresh if not loading, not in transaction, and no modal open
      if (!isLoadingPoolStats && transactionState === null) {
        void fetchPoolStats();
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [poolInfo, tokenPrices, isLoadingPoolStats, transactionState, fetchPoolStats]);

  return {
    poolStats,
    isLoadingPoolStats,
    hasLoadedPoolStats,
    refetchStats: fetchPoolStats,
  };
}
