import { useCallback, useEffect, useState } from 'react';
import type { EstimateSwapView, Pool, TokenMetadata, Transaction } from '@ref-finance/ref-sdk';
import {
  DCLSwap,
  estimateSwap,
  fetchAllPools,
  ftGetTokenMetadata,
  getExpectedOutputFromSwapTodos,
  init_env,
  instantSwap,
  listDCLPools,
  quote,
} from '@ref-finance/ref-sdk';
import { useWallet } from '@/contexts/wallet-context';
import { MAINNET_TOKENS } from '@/lib/swap-utils';

export interface SwapEstimate {
  outputAmount: string;
  priceImpact: number;
  route: EstimateSwapView[];
  fee: number;
  isV2?: boolean;
  poolId?: string; // For V2
}

interface UseSwapReturn {
  pools: { simplePools: Pool[]; ratedPools: Pool[]; unRatedPools: Pool[] } | null;
  loading: boolean;
  error: string | null;
  tokenPrices: Record<string, any>;
  estimateSwapOutput: (
    tokenInId: string,
    tokenOutId: string,
    amountIn: string
  ) => Promise<SwapEstimate | null>;
  executeSwap: (
    tokenInId: string,
    tokenOutId: string,
    amountIn: string,
    slippageTolerance: number,
    estimate?: SwapEstimate
  ) => Promise<Transaction[]>;
  refreshPools: () => Promise<void>;
}

// Helper function to get token metadata with fallback to local token list
async function getTokenMetadataWithFallback(
  tokenId: string,
  cache: Record<string, TokenMetadata>,
  setCache: (cache: Record<string, TokenMetadata>) => void
): Promise<TokenMetadata> {
  // Check cache first
  if (cache[tokenId]) {
    return cache[tokenId];
  }

  try {
    // Try to get from REF Finance registry first
    const metadata = await ftGetTokenMetadata(tokenId);
    // Cache the result
    setCache({ ...cache, [tokenId]: metadata as unknown as TokenMetadata });
    return metadata;
  } catch (err) {
    console.warn(`[useSwap] Token ${tokenId} not in REF registry, using local metadata`);

    // Fallback to our local token list
    const localToken = MAINNET_TOKENS.find((token) => token.id === tokenId);
    if (!localToken) {
      throw new Error(`Token ${tokenId} not found in local registry either`);
    }

    // Convert our token format to REF SDK TokenMetadata format
    const metadata = {
      id: localToken.id,
      name: localToken.name,
      symbol: localToken.symbol,
      decimals: localToken.decimals,
      icon: localToken.icon ?? '',
      reference: null,
      reference_hash: null,
      spec: 'ft-1.0.0',
    } as TokenMetadata;

    // Cache the result
    setCache({ ...cache, [tokenId]: metadata as unknown as TokenMetadata });
    return metadata;
  }
}

export function useSwap(): UseSwapReturn {
  const { accountId } = useWallet();
  const [pools, setPools] = useState<{
    simplePools: Pool[];
    ratedPools: Pool[];
    unRatedPools: Pool[];
  } | null>(null);
  const [dclPools, setDclPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenPrices, setTokenPrices] = useState<Record<string, any>>({});
  const [tokenMetadataCache, setTokenMetadataCache] = useState<Record<string, TokenMetadata>>({});

  // Initialize REF SDK environment with Lava RPC (much faster and more reliable)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET) {
      init_env('mainnet', process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET);
    }
  }, []);

  // Fetch token prices on mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        console.warn('[useSwap] Fetching token prices...');

        // Try to fetch from Ref Finance indexer API directly
        const response = await fetch('https://indexer.ref.finance/list-token-price');
        if (response.ok) {
          const data = await response.json();
          console.warn(
            '[useSwap] Token prices fetched from indexer:',
            Object.keys(data).length,
            'tokens'
          );
          setTokenPrices(data as unknown as Record<string, any>);
        } else {
          // Fallback: try alternative endpoint
          console.warn('[useSwap] Trying alternative price endpoint...');
          const altResponse = await fetch('https://api.ref.finance/api/token-prices');
          if (altResponse.ok) {
            const altData = await altResponse.json();
            console.warn(
              '[useSwap] Token prices fetched from alternative API:',
              Object.keys(altData).length,
              'tokens'
            );
            setTokenPrices(altData as unknown as Record<string, any>);
          } else {
            console.warn('[useSwap] Failed to fetch token prices from APIs, using fallback prices');
            // Fallback prices for common tokens
            setTokenPrices({
              'wrap.near': { price: '4.50' },
              'usdt.tether-token.near': { price: '1.00' },
              '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1': { price: '1.00' },
              dac17f958d2ee523a2206206994597c13d831ec7: { price: '1.00' },
              'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near': { price: '1.00' },
            } as Record<string, any>);
          }
        }
      } catch (err) {
        console.warn('[useSwap] Failed to fetch token prices:', err);
        // Fallback prices
        setTokenPrices({
          'wrap.near': { price: '4.50' },
          'usdt.tether-token.near': { price: '1.00' },
          '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1': { price: '1.00' },
        } as Record<string, any>);
      }
    };

    void fetchPrices();
  }, []);

  // Fetch pools on demand (when needed for a swap)
  const fetchPools = useCallback(async () => {
    if (pools) return pools; // Return cached pools if already loaded

    try {
      setLoading(true);
      setError(null);
      console.warn('[useSwap] Fetching pools...');

      const poolsData = await fetchAllPools(100);

      console.warn('[useSwap] Pools fetched:', {
        simple: poolsData.simplePools.length,
        rated: poolsData.ratedPools.length,
        unRated: poolsData.unRatedPools.length,
      });

      // Log some pool token ids
      const allPools = [
        ...poolsData.simplePools,
        ...poolsData.ratedPools,
        ...poolsData.unRatedPools,
      ];
      const uniqueTokens = new Set<string>();
      allPools.forEach((pool) => {
        pool.tokenIds.forEach((tokenId: string) => uniqueTokens.add(tokenId));
      });
      console.warn('[useSwap] Unique tokens in pools:', Array.from(uniqueTokens));

      setPools(
        poolsData as unknown as { simplePools: any[]; ratedPools: any[]; unRatedPools: any[] }
      );

      // Also fetch DCL pools
      try {
        const dclPoolsData = await listDCLPools();
        console.warn('[useSwap] DCL pools fetched:', dclPoolsData.length);
        setDclPools(dclPoolsData as any[]);
      } catch (err) {
        console.warn('[useSwap] Failed to fetch DCL pools:', err);
      }

      return poolsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pools';
      console.error('[useSwap] Pool fetch error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pools]);

  // Estimate V2 DCL swap
  const estimateV2Swap = useCallback(
    async (
      tokenIn: TokenMetadata,
      tokenOut: TokenMetadata,
      amountIn: string
    ): Promise<SwapEstimate | null> => {
      try {
        console.warn('[useSwap] Estimating V2 swap:', {
          tokenIn: tokenIn.id,
          tokenOut: tokenOut.id,
          amountIn,
        });

        // Find DCL pools for this pair
        const relevantPools = dclPools.filter((pool) => {
          const tokens = [pool.token_x, pool.token_y];
          return tokens.includes(tokenIn.id) && tokens.includes(tokenOut.id);
        });

        if (relevantPools.length === 0) {
          console.warn('[useSwap] No V2 pools found for pair');
          return null;
        }

        console.warn(
          '[useSwap] Found V2 pools:',
          relevantPools.map((p) => p.pool_id)
        );

        // Try to quote for each pool
        for (const pool of relevantPools) {
          try {
            const result = await quote({
              pool_ids: [pool.pool_id],
              input_token: tokenIn,
              output_token: tokenOut,
              input_amount: amountIn,
            });

            console.warn('[useSwap] V2 quote result:', result);

            if (result?.amount) {
              return {
                outputAmount: result.amount,
                priceImpact: 0, // TODO
                route: [], // V2 doesn't use swapTodos
                fee: pool.fee / 10000, // Convert basis points to percentage
                isV2: true,
                poolId: pool.pool_id,
              };
            }
          } catch (err) {
            console.warn(`[useSwap] V2 quote failed for pool ${pool.pool_id}:`, err);
          }
        }

        console.warn('[useSwap] No V2 quote succeeded');
        return null;
      } catch (err) {
        console.error('[useSwap] V2 estimate error:', err);
        return null;
      }
    },
    [dclPools]
  );

  // Estimate swap output
  const estimateSwapOutput = useCallback(
    async (
      tokenInId: string,
      tokenOutId: string,
      amountIn: string
    ): Promise<SwapEstimate | null> => {
      try {
        // Wait for pools to be loaded (either from preload or fetch on demand)
        let currentPools = pools;
        if (!currentPools) {
          console.warn('[useSwap] Pools not preloaded, fetching on demand...');
          currentPools = await fetchPools();
        }

        if (!currentPools) {
          console.error('[useSwap] Failed to load pools');
          throw new Error('Failed to load liquidity pools. Please try again.');
        }

        console.warn('[useSwap] Estimating swap:', { tokenInId, tokenOutId, amountIn });

        // Get token metadata
        const tokenIn = await getTokenMetadataWithFallback(
          tokenInId,
          tokenMetadataCache,
          setTokenMetadataCache
        );
        const tokenOut = await getTokenMetadataWithFallback(
          tokenOutId,
          tokenMetadataCache,
          setTokenMetadataCache
        );

        console.warn('[useSwap] Token metadata:', { tokenIn, tokenOut });

        // Estimate swap with smart routing
        const swapTodos = await estimateSwap({
          tokenIn,
          tokenOut,
          amountIn,
          simplePools: currentPools.simplePools,
          options: {
            enableSmartRouting: true,
            stablePools: [...currentPools.ratedPools, ...currentPools.unRatedPools],
          },
        });

        console.warn('[useSwap] Swap todos:', swapTodos);

        if (swapTodos?.length === 0) {
          console.warn('[useSwap] No V1 route found, trying V2...');
          // Try V2 DCL swap
          return await estimateV2Swap(tokenIn, tokenOut, amountIn);
        }

        // Get expected output
        const outputAmount = getExpectedOutputFromSwapTodos(swapTodos, tokenOut.id);
        const outputAmountStr = outputAmount.toString();

        // Calculate price impact
        const inputValue = parseFloat(amountIn);
        const outputValue = parseFloat(outputAmountStr);

        // Calculate actual rate from the swap
        const actualRate = inputValue > 0 ? outputValue / inputValue : 0;

        // Calculate expected rate from token prices (market rate)
        let priceImpact = 0;
        if (tokenPrices[tokenIn.id]?.price && tokenPrices[tokenOut.id]?.price) {
          const tokenInPrice = parseFloat(String(tokenPrices[tokenIn.id].price));
          const tokenOutPrice = parseFloat(String(tokenPrices[tokenOut.id].price));

          if (tokenInPrice > 0 && tokenOutPrice > 0) {
            // Expected rate based on market prices
            const expectedRate = tokenInPrice / tokenOutPrice;
            // Price impact as percentage
            priceImpact = ((expectedRate - actualRate) / expectedRate) * 100;
          }
        }

        // Calculate total fee
        const totalFee =
          swapTodos.reduce((acc, todo) => {
            return acc + (todo.pool?.fee || 0);
          }, 0) / swapTodos.length;

        console.warn('[useSwap] Estimate result:', {
          outputAmount: outputAmountStr,
          route: swapTodos.length,
          fee: totalFee,
          priceImpact: priceImpact.toFixed(2) + '%',
        });

        return {
          outputAmount: outputAmountStr,
          priceImpact,
          route: swapTodos,
          fee: totalFee,
        };
      } catch (err) {
        console.error('[useSwap] Estimate error:', err);
        throw err; // Re-throw to let the UI handle the error
      }
    },
    [pools, fetchPools, estimateV2Swap, tokenMetadataCache, tokenPrices]
  );

  // Execute swap
  const executeSwap = useCallback(
    async (
      tokenInId: string,
      tokenOutId: string,
      amountIn: string,
      slippageTolerance: number,
      estimate?: SwapEstimate
    ): Promise<Transaction[]> => {
      if (!accountId) {
        throw new Error('Wallet not connected');
      }

      try {
        console.warn('[useSwap] Executing swap:', {
          tokenInId,
          tokenOutId,
          amountIn,
          slippageTolerance,
          isV2: estimate?.isV2,
        });

        // Get token metadata
        const tokenIn = await getTokenMetadataWithFallback(
          tokenInId,
          tokenMetadataCache,
          setTokenMetadataCache
        );
        const tokenOut = await getTokenMetadataWithFallback(
          tokenOutId,
          tokenMetadataCache,
          setTokenMetadataCache
        );

        if (estimate?.isV2 && estimate.poolId) {
          // V2 DCL swap
          console.warn('[useSwap] Using V2 DCL swap');

          const transactions = await DCLSwap({
            swapInfo: {
              tokenA: tokenIn,
              tokenB: tokenOut,
              amountA: amountIn,
            },
            Swap: {
              pool_ids: [estimate.poolId],
              min_output_amount: '0', // TODO: Calculate with slippage
            },
            AccountId: accountId,
          });

          console.warn('[useSwap] V2 swap transactions created:', transactions.length);
          return transactions;
        } else {
          // V1 swap
          // Load pools if not already loaded
          const currentPools = await fetchPools();
          if (!currentPools) {
            throw new Error('Pools not loaded');
          }

          // Estimate swap to get route
          const swapTodos = await estimateSwap({
            tokenIn,
            tokenOut,
            amountIn,
            simplePools: currentPools.simplePools,
            options: {
              enableSmartRouting: true,
              stablePools: [...currentPools.ratedPools, ...currentPools.unRatedPools],
            },
          });

          if (swapTodos?.length === 0) {
            throw new Error('No swap route found');
          }

          // Create swap transactions with referral
          const transactions = await instantSwap({
            tokenIn,
            tokenOut,
            amountIn,
            swapTodos,
            slippageTolerance: slippageTolerance / 100, // Convert percentage to decimal
            AccountId: accountId,
            referralId: 'vfdao.near', // Earn referral fees
          });

          console.warn('[useSwap] V1 swap transactions created:', transactions.length);
          return transactions;
        }
      } catch (err) {
        console.error('[useSwap] Execute swap error:', err);
        throw err;
      }
    },
    [accountId, fetchPools]
  );

  // Refresh pools
  const refreshPools = useCallback(async () => {
    await fetchPools();
  }, [fetchPools]);

  return {
    pools,
    loading,
    error,
    tokenPrices,
    estimateSwapOutput,
    executeSwap,
    refreshPools,
  };
}
