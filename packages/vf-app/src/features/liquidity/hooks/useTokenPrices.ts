import { useCallback, useEffect, useRef, useState } from 'react';
import type { PoolInfo } from '@/types';
import { calculateVfPriceFromPool } from '@/lib/swap-utils';

interface UseTokenPricesResult {
  tokenPrices: Record<string, number>;
  isLoading: boolean;      // True only on initial load (no data yet)
  isRefreshing: boolean;   // True when refreshing (has data, updating)
  hasPrices: boolean;
  refetchPrices: () => Promise<void>;
}

/**
 * Hook to fetch and manage token prices from Ref Finance API
 * Calculates VF price from pool ratio if not available in API
 * 
 * Loading states:
 * - isLoading: True only on initial load when no data exists
 * - isRefreshing: True when updating existing data (for fade effect)
 */
export function useTokenPrices(poolInfo: PoolInfo | null): UseTokenPricesResult {
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  
  // Use ref to access latest poolInfo without causing effect re-runs
  const poolInfoRef = useRef(poolInfo);
  useEffect(() => {
    poolInfoRef.current = poolInfo;
  }, [poolInfo]);

  const fetchTokenPrices = useCallback(async () => {
    // If we've loaded before, this is a refresh (show fade effect)
    // Otherwise, it's initial load (show loading dots)
    if (hasLoadedOnce.current) {
      setIsRefreshing(true);
    }
    
    try {
      // Create AbortController with 15 second timeout (API can be slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error('Request timeout')), 15000);
      
      const response = await fetch('https://indexer.ref.finance/list-token-price', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const prices = await response.json() as Record<string, { price: string }>;
      
      const priceMap: Record<string, number> = {};
      
      // Get NEAR price (wrap.near in the API)
      if (prices['wrap.near']) {
        priceMap.near = parseFloat(prices['wrap.near'].price);
        priceMap['wrap.near'] = parseFloat(prices['wrap.near'].price);
      }
      
      // Get VF token price - from API if available
      if (prices['veganfriends.tkn.near']) {
        priceMap['veganfriends.tkn.near'] = parseFloat(prices['veganfriends.tkn.near'].price);
      }
      
      // If VF price not in API but we have pool info, calculate from pool ratio
      const currentPoolInfo = poolInfoRef.current;
      if (!priceMap['veganfriends.tkn.near'] && currentPoolInfo && priceMap['wrap.near']) {
        const vfPrice = calculateVfPriceFromPool(
          currentPoolInfo.reserves[currentPoolInfo.token1.id], // NEAR reserve
          currentPoolInfo.reserves[currentPoolInfo.token2.id], // VF reserve
          priceMap['wrap.near']
        );
        if (vfPrice > 0) {
          priceMap['veganfriends.tkn.near'] = vfPrice;
        }
      }
      
      setTokenPrices(priceMap);
      hasLoadedOnce.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (error) {
      // Handle timeout gracefully - will retry on next interval
      if (error instanceof Error && error.name === 'AbortError') {
        // Silent timeout - will retry
      } else {
        console.error('[useTokenPrices] Failed to fetch token prices:', error);
      }
      // On error during refresh, just stop refreshing state
      // On initial load error, keep loading state to retry
      if (hasLoadedOnce.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    void fetchTokenPrices();
  }, [fetchTokenPrices]);

  // Re-fetch when poolInfo becomes available (for VF price calculation)
  useEffect(() => {
    if (poolInfo && Object.keys(tokenPrices).length > 0 && !tokenPrices['veganfriends.tkn.near']) {
      // We have prices but no VF price - try to calculate it now that poolInfo is available
      void fetchTokenPrices();
    }
  }, [poolInfo, tokenPrices, fetchTokenPrices]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchTokenPrices();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchTokenPrices]);

  const hasPrices = Object.keys(tokenPrices).length > 0 && tokenPrices['wrap.near'] !== undefined;

  return {
    tokenPrices,
    isLoading,
    isRefreshing,
    hasPrices,
    refetchPrices: fetchTokenPrices,
  };
}
