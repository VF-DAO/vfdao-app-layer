import { useCallback, useEffect, useState } from 'react';
import type { Transaction } from '@ref-finance/ref-sdk';
import { init_env } from '@ref-finance/ref-sdk';
import { useWallet } from '@/contexts/wallet-context';
import { getTokenMetadata, MAINNET_TOKENS } from '@/lib/swap-utils';
import Big from 'big.js';

interface PoolData {
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
  tvl: string;
  token0_ref_price: string;
  pool_kind?: string;
}

interface RpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: { result: Uint8Array };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface FunctionCall {
  methodName: string;
  args: Record<string, unknown>;
  gas: string;
  amount: string;
}

interface NearTransaction {
  receiverId: string;
  functionCalls: FunctionCall[];
}

export interface SwapEstimate {
  outputAmount: string;
  priceImpact: number;
  route: { pool_id: number }[];
  fee: number;
  minReceived?: string;
  highImpact?: boolean;
}

interface UseSwapReturn {
  pools: { loaded: boolean } | null;
  loading: boolean;
  error: string | null;
  tokenPrices: Record<string, { price: string; symbol?: string; decimal?: number }>;
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
    estimate?: SwapEstimate,
    rpcUrl?: string
  ) => Promise<Transaction[]>;
  refreshPools: () => Promise<void>;
  clearCache: () => Promise<void>;
}

// Helper function to get token metadata from local list
async function _getLocalTokenMetadata(tokenId: string) {
  // Special case: 'near' contract is used for NEAR display in UI
  if (tokenId === 'near') {
    return {
      id: 'near',
      name: 'Near',
      symbol: 'NEAR',
      decimals: 24,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjIgMiAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IndoaXRlIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjg0MjExIDIuMjE5MzlaVjEyLjQ4M0wxMC44OTQ3IDYuNDUxM0wxMC40MjExIDYuMDM1OUwxMy43OTk2IDAuODEyOTVDMTUuMjA5Ny0wLjY5NjAyNyAxOCAwLjE3ODQyNyAxOCA0LjEyOTY3VjEzLjMxMzlDMTggMTUuMjUxMiAxNS4yNDI5IDE2LjEzMzYgMTMuODE5OSAxNC42NTE4TDEwLjQyMTEgNi4wMzU4OUwxMC44OTQ3IDYuNDUxM0wxOCAxMi4xNzU3VjMuMjkyMTJMMTAuODk0NyA2LjQ1MTNMMTAuNDIxMSA2LjAzNTg5TDEzLjc5OTYgMC44MTI5NUMxNS4yMDk3LTAuNjk2MDI3IDE4IDAuMTc4NDI3IDE4IDQuMTI5NjdWMTEuMzEzOUMxOCAxMy4yNTEyIDE1LjI0MjkgMTQuMTMzNiAxMy44MTk5IDEyLjY1MThMMi44NDIxMSAyLjIxOTM5WiIgZmlsbD0iYmxhY2siIHRyYW5zZm9ybT0idHJhbnNsYXRlKDgsOCkgc2NhbGUoMC45LCAxKSIvPjwvc3ZnPg==',
    };
  }

  const token = MAINNET_TOKENS.find((t) => t.id === tokenId);
  if (!token) {
    // Try to get from dynamic metadata
    try {
      return await getTokenMetadata(tokenId);
    } catch {
      throw new Error(`Token ${tokenId} not found`);
    }
  }
  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    icon: token.icon ?? '',
  };
}

export function useSwap(): UseSwapReturn {
  const { accountId } = useWallet();
  const [pools, setPools] = useState<{ loaded: boolean } | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [tokenPrices, setTokenPrices] = useState<Record<string, { price: string; symbol?: string; decimal?: number }>>({});
  const [, setPricesLoading] = useState(false);

  // Initialize REF SDK with the configured RPC endpoint
  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
    console.warn('[useSwap] Initializing with RPC:', rpcUrl);
    try {
      init_env('mainnet', rpcUrl);
    } catch {
      console.warn('[useSwap] init_env failed (non-critical)');
    }
  }, []);

  // Fetch token prices from Ref Finance indexer
  const fetchTokenPrices = useCallback(async () => {
    setPricesLoading(true);
    try {
      const response = await fetch('https://mainnet-indexer.ref-finance.com/list-token-price', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token prices');
      }

      const prices = await response.json() as Record<string, { price: string; symbol?: string; decimal?: number }>;
      
      // Handle NEAR price mapping (same as Ref Finance logic)
      if (prices['wrap.near']) {
        prices.near = prices['wrap.near'];
        prices.NEAR = prices['wrap.near'];
      }

      // Calculate prices for tokens not in indexer using pool ratios
      // For VEGANFRIENDS in pool 5094 with wNEAR
      if (!prices['veganfriends.tkn.near'] && prices['wrap.near']) {
        try {
          const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
          const poolResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: '1',
              method: 'query',
              params: {
                request_type: 'call_function',
                account_id: 'v2.ref-finance.near',
                method_name: 'get_pool',
                args_base64: Buffer.from(JSON.stringify({ pool_id: 5094 })).toString('base64'),
                finality: 'final'
              }
            })
          });

          if (poolResponse.ok) {
            const poolData = await poolResponse.json() as RpcResponse;
            if (!poolData.result) {
              console.warn('[useSwap] No result in pool response');
              return;
            }
            const pool = JSON.parse(Buffer.from(poolData.result.result).toString()) as PoolData;
            
            // Find token indices
            const nearIndex = pool.token_account_ids.indexOf('wrap.near');
            const veganIndex = pool.token_account_ids.indexOf('veganfriends.tkn.near');
            
            if (nearIndex !== -1 && veganIndex !== -1) {
              const reserveNear = new Big(String(pool.amounts[nearIndex]));
              const reserveVegan = new Big(String(pool.amounts[veganIndex]));
              
              if (reserveNear.gt(0) && reserveVegan.gt(0)) {
                // price_VEGAN = (reserve_NEAR / reserve_VEGAN) * price_NEAR
                // Adjust for decimals: NEAR has 24 decimals, VEGAN has 18 decimals
                // Raw ratio needs to be multiplied by 10^(18-24) = 10^-6
                const nearPrice = parseFloat(String(prices['wrap.near'].price ?? '0'));
                const rawRatio = reserveNear.div(reserveVegan);
                const decimalAdjustment = new Big(10).pow(18 - 24); // 10^-6
                const adjustedRatio = rawRatio.mul(decimalAdjustment);
                const veganPrice = adjustedRatio.mul(nearPrice).toNumber();
                
                prices['veganfriends.tkn.near'] = {
                  price: veganPrice.toString(),
                  symbol: 'VEGANFRIENDS',
                  decimal: 18
                };
              }
            }
          }
        } catch {
          console.warn('[useSwap] Could not calculate VEGANFRIENDS price from pool');
        }
      }

      setTokenPrices(prices as Record<string, { price: string; symbol?: string; decimal?: number }>);
      console.warn(`[useSwap] Token prices updated: ${Object.keys(prices).length} tokens`);
    } catch (_err) {
      console.error('[useSwap] Failed to fetch token prices');
      // Don't set error state for prices, just log it
    } finally {
      setPricesLoading(false);
    }
  }, []);

  // Fetch prices on mount and periodically
  useEffect(() => {
    const fetchPrices = async () => {
      await fetchTokenPrices();
    };
    void fetchPrices();
    const interval = setInterval(() => {
      fetchTokenPrices().catch(() => {
        console.warn('[useSwap] Background price fetch failed');
      });
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchTokenPrices]);

  // Estimate swap output - amountIn is expected to be in yocto units
  const estimateSwapOutput = useCallback(
    async (
      tokenInId: string,
      tokenOutId: string,
      amountIn: string
    ): Promise<SwapEstimate | null> => {
      try {
        if (!amountIn || parseFloat(amountIn) <= 0) {
          return null;
        }

        console.warn('[useSwap] Estimating swap:', { tokenInId, tokenOutId, amountIn });

        // Get RPC URL from environment (consistent with other calls)
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';

        // For our single pool (5094: wNEAR-VEGANFRIENDS), query directly
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
              method_name: 'get_pool',
              args_base64: Buffer.from(JSON.stringify({ pool_id: 5094 })).toString('base64'),
              finality: 'final'
            }
          })
        });

        if (!response.ok) {
          console.warn('[useSwap] Pool query failed');
          return null;
        }

        const data = await response.json() as RpcResponse;
        
        // Check for JSON-RPC error
        if (data.error) {
          console.warn('[useSwap] RPC error occurred');
          return null;
        }
        
        if (!data.result) {
          console.warn('[useSwap] No result in response');
          return null;
        }
        
        const pool = JSON.parse(Buffer.from(data.result.result).toString()) as PoolData;

        // Find token indices
        const tokenInIndex = pool.token_account_ids.indexOf(tokenInId === 'near' ? 'wrap.near' : tokenInId);
        const tokenOutIndex = pool.token_account_ids.indexOf(tokenOutId === 'near' ? 'wrap.near' : tokenOutId);

        if (tokenInIndex === -1 || tokenOutIndex === -1) {
          console.warn('[useSwap] Tokens not found in pool');
          return null;
        }

        // Get reserves
        const reserveIn = new Big(String(pool.amounts[tokenInIndex]));
        const reserveOut = new Big(String(pool.amounts[tokenOutIndex]));

        console.warn('[useSwap] Pool reserves:', {
          tokenInIndex,
          tokenOutIndex,
          reserveIn: reserveIn.toString(),
          reserveOut: reserveOut.toString(),
          tokenIn: tokenInId === 'near' ? 'wrap.near' : tokenInId,
          tokenOut: tokenOutId === 'near' ? 'wrap.near' : tokenOutId
        });

        if (reserveIn.lte(0) || reserveOut.lte(0)) {
          console.warn('[useSwap] Invalid pool reserves');
          return null;
        }

        // Constant product formula: (x + dx) * (y - dy) = x * y
        // dy = (y * dx) / (x + dx)
        // amountIn is assumed to be in yocto units
        const amountInBig = new Big(amountIn);
        const numerator = reserveOut.mul(amountInBig);
        const denominator = reserveIn.add(amountInBig);
        const outputAmount = numerator.div(denominator);

        // Apply 0.3% fee (30 basis points)
        const feeAmount = outputAmount.mul(new Big(0.003));
        const finalOutput = outputAmount.sub(feeAmount);

        if (finalOutput.lte(0)) {
          console.warn('[useSwap] Invalid output amount');
          return null;
        }

        // Calculate actual price impact
        // Price impact = (spot price - effective price) / spot price
        const spotPrice = reserveOut.div(reserveIn); // tokens out per token in
        const effectivePrice = outputAmount.div(amountInBig); // actual rate received
        const priceImpactPercent = spotPrice.minus(effectivePrice).div(spotPrice).mul(100);
        const priceImpactValue = parseFloat(priceImpactPercent.toFixed(2));

        // Determine if this is a high impact trade (show warning above 5%)
        const highImpactThreshold = 5.0; // 5% threshold
        const isHighImpact = Math.abs(priceImpactValue) >= highImpactThreshold;

        // Calculate minimum received (with slippage protection)
        const defaultSlippage = 0.5; // 0.5% default slippage
        const minReceived = finalOutput.mul(new Big(1).minus(new Big(defaultSlippage).div(100)));

        console.warn('[useSwap] Direct pool estimate:', {
          output: finalOutput.toFixed(0),
          priceImpact: priceImpactValue + '%',
          fee: '0.3%',
          minReceived: minReceived.toFixed(0),
          highImpact: isHighImpact
        });

        return {
          outputAmount: finalOutput.toFixed(0),
          priceImpact: priceImpactValue,
          route: [{ pool_id: 5094 }],
          fee: 0.3,
          minReceived: minReceived.toFixed(0),
          highImpact: isHighImpact,
        };

      } catch (_err) {
        console.error('[useSwap] Estimate error');
        return null;
      }
    },
    []
  );

  // Execute swap with atomic registration + swap operations
  const executeSwap = useCallback(
    async (
      tokenInId: string,
      tokenOutId: string,
      amountIn: string,
      slippageTolerance: number,
      estimate?: SwapEstimate,
      rpcUrl?: string
    ): Promise<Transaction[]> => {
      if (!accountId) {
        throw new Error('Wallet not connected');
      }

      try {
        console.warn('[useSwap] Executing atomic swap with registration:', {
          accountId,
          tokenInId,
          tokenOutId,
          amountIn,
          slippageTolerance,
          estimate: estimate ? {
            minReceived: estimate.minReceived,
            outputAmount: estimate.outputAmount,
            hasRoute: !!estimate.route
          } : 'null'
        });

        const transactions: NearTransaction[] = [];
        const actualRpcUrl = rpcUrl ?? process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';

        // Helper function to check if token is registered
        const checkTokenRegistration = async (tokenId: string): Promise<boolean> => {
          try {
            const { ftGetStorageBalance } = await import('@/lib/swap-utils');
            const balance = await ftGetStorageBalance(tokenId, accountId, actualRpcUrl);
            const isRegistered = balance !== null;
            console.warn(`[useSwap] Registration check for ${tokenId}:`, { balance, isRegistered });
            return isRegistered;
          } catch (_err) {
            console.warn(`[useSwap] Could not check ${tokenId} registration, assuming needs registration`);
            return false; // Assume needs registration on error
          }
        };

        // Calculate min_amount_out using slippage tolerance
        const minAmountOut = (() => {
          if (!estimate) {
            console.error('[useSwap] No estimate provided for min_amount_out calculation');
            return '0';
          }
          
          // Use the slippageTolerance parameter instead of hardcoded 0.5%
          const slippagePercent = slippageTolerance || 0.5;
          const outputAmount = new Big(estimate.outputAmount);
          const minReceived = outputAmount.mul(new Big(1).minus(new Big(slippagePercent).div(100)));
          const result = minReceived.toFixed(0);
          
          console.warn('[useSwap] Min amount calculation:', {
            outputAmount: estimate.outputAmount,
            slippagePercent,
            minReceived: result,
            slippageTolerance
          });
          
          return result;
        })();

        console.warn('[useSwap] Calculated minAmountOut:', {
          minAmountOut,
          slippageTolerance,
          estimateOutput: estimate?.outputAmount
        });

        // Validate amounts before proceeding
        if (!amountIn || amountIn === '0' || parseFloat(amountIn) <= 0) {
          throw new Error(`Invalid amountIn: ${amountIn}`);
        }
        
        if (!minAmountOut || minAmountOut === '0' || parseFloat(minAmountOut) <= 0) {
          throw new Error(`Invalid minAmountOut: ${minAmountOut} (check slippage calculation)`);
        }

        // Handle NEAR input swaps (NEAR → Token)
        if (tokenInId === 'near') {
          const wNearRegistered = await checkTokenRegistration('wrap.near');
          const outputTokenRegistered = await checkTokenRegistration(tokenOutId);

          console.warn('[useSwap] NEAR input swap:', { wNearRegistered, outputTokenRegistered, tokenOutId });

          // Create separate transaction for output token registration if needed
          if (!outputTokenRegistered) {
            console.warn('[useSwap] Creating separate registration transaction for:', tokenOutId);
            const regTransaction: NearTransaction = {
              receiverId: tokenOutId,
              functionCalls: [{
                methodName: 'storage_deposit',
                args: {
                  registration_only: true,
                  account_id: accountId,
                },
                gas: '30000000000000',
                amount: '100000000000000000000000', // 0.1 NEAR
              }],
            };
            transactions.push(regTransaction);
          }

          const functionCalls: FunctionCall[] = [];

          // Add wNEAR registration if needed
          if (!wNearRegistered) {
            console.warn('[useSwap] Adding wNEAR registration');
            functionCalls.push({
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              amount: '100000000000000000000000', // 0.1 NEAR
            });
          }

          // Add NEAR deposit
          functionCalls.push({
            methodName: 'near_deposit',
            args: {},
            gas: '50000000000000',
            amount: amountIn,
          });

          // Add swap via ft_transfer_call
          console.warn('[useSwap] NEAR->Token ft_transfer_call params:', {
            amount: amountIn,
            minAmountOut,
            slippageTolerance,
            estimateExists: !!estimate,
            tokenIn: 'wrap.near',
            tokenOut: tokenOutId
          });
          functionCalls.push({
            methodName: 'ft_transfer_call',
            args: {
              receiver_id: 'v2.ref-finance.near',
              amount: amountIn,
              msg: JSON.stringify({
                actions: [
                  {
                    pool_id: 5094,
                    token_in: 'wrap.near', // Always wNEAR for NEAR input swaps
                    token_out: tokenOutId === 'near' ? 'wrap.near' : tokenOutId,
                    amount_in: amountIn,
                    min_amount_out: minAmountOut,
                  },
                ],
                ...(tokenOutId === 'near' ? { skip_unwrap_near: false } : {}),
              }),
            },
            gas: '180000000000000',
            amount: '1',
          });

          transactions.push({
            receiverId: 'wrap.near',
            functionCalls,
          });

        } else {
          // Handle Token input swaps (Token → Token or Token → NEAR)
          const inputTokenRegistered = await checkTokenRegistration(tokenInId);
          const outputTokenRegistered = await checkTokenRegistration(tokenOutId === 'near' ? 'wrap.near' : tokenOutId);

          console.warn('[useSwap] Token input swap:', { tokenInId, inputTokenRegistered, outputTokenRegistered, tokenOutId });

          // Create separate transaction for output token registration if needed
          const actualOutputToken = tokenOutId === 'near' ? 'wrap.near' : tokenOutId;
          if (!outputTokenRegistered) {
            console.warn('[useSwap] Creating separate registration transaction for:', actualOutputToken);
            const regTransaction: NearTransaction = {
              receiverId: actualOutputToken,
              functionCalls: [{
                methodName: 'storage_deposit',
                args: {
                  registration_only: true,
                  account_id: accountId,
                },
                gas: '30000000000000',
                amount: '100000000000000000000000', // 0.1 NEAR
              }],
            };
            transactions.push(regTransaction);
          }

          const functionCalls: FunctionCall[] = [];

          // Add input token registration if needed
          if (!inputTokenRegistered) {
            console.warn('[useSwap] Adding input token registration:', tokenInId);
            functionCalls.push({
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              amount: '100000000000000000000000', // 0.1 NEAR
            });
          }

          // Add swap via ft_transfer_call
          console.warn('[useSwap] Token->Token ft_transfer_call params:', {
            amount: amountIn,
            minAmountOut,
            slippageTolerance,
            estimateExists: !!estimate,
            tokenIn: tokenInId,
            tokenOut: tokenOutId
          });
          functionCalls.push({
            methodName: 'ft_transfer_call',
            args: {
              receiver_id: 'v2.ref-finance.near',
              amount: amountIn,
              msg: JSON.stringify({
                actions: [
                  {
                    pool_id: 5094,
                    token_in: tokenInId,
                    token_out: tokenOutId === 'near' ? 'wrap.near' : tokenOutId,
                    amount_in: amountIn,
                    min_amount_out: minAmountOut,
                  },
                ],
                ...(tokenOutId === 'near' ? { skip_unwrap_near: false } : {}),
              }),
            },
            gas: '180000000000000', // Reduced from 250 TGas to 180 TGas
            amount: '1',
          });

          transactions.push({
            receiverId: tokenInId,
            functionCalls,
          });
        }

        // Debug: log full transaction payload
        try {
          console.warn('[useSwap] Atomic transactions created:', transactions.length);
          transactions.forEach((tx, i) => {
            console.warn(`[useSwap] Transaction #${i} to ${tx.receiverId}:`, tx.functionCalls?.length, 'calls');
            tx.functionCalls?.forEach((fc: FunctionCall, j: number) => {
              console.warn(`  Call #${j}: ${fc.methodName}`, {
                gas: fc.gas,
                amount: fc.amount,
                args: fc.methodName === 'ft_transfer_call' ? 
                  { receiver_id: fc.args?.receiver_id, amount: fc.args?.amount, msg_length: JSON.stringify(fc.args?.msg).length } :
                  fc.args
              });
            });
          });

          // Validation
          const invalidCalls: string[] = [];
          transactions.forEach((tx, i) => {
            tx.functionCalls?.forEach((fc: FunctionCall, j: number) => {
              if (fc.methodName === 'ft_transfer_call') {
                const amount = fc.args?.amount;
                if (typeof amount !== 'string' || !/^\d+$/.test(amount)) {
                  invalidCalls.push(`tx#${i} call#${j} amount invalid: ${String(amount)}`);
                }
              }
            });
          });

          if (invalidCalls.length > 0) {
            console.error('[useSwap] Validation failed:', invalidCalls);
            throw new Error(`Invalid transaction payload: ${invalidCalls.join('; ')}`);
          }
        } catch (_err) {
          console.warn('[useSwap] Transaction debug/validation failed');
          throw _err;
        }

        return transactions as Transaction[];
      } catch (err) {
        console.error('[useSwap] Execute swap error');
        throw err;
      }
    },
    [accountId]
  );

  // Automatic cache refreshing - Ref Finance style
  // For our single pool, we mainly need to ensure fresh data on demand
  // Pool data is queried directly each time, so no persistent cache needed

  // Refresh pools and clear cache
  const refreshPools = useCallback(() => {
    console.warn('[useSwap] Manual pool refresh triggered');
    setPools({ loaded: true });
    // Force component re-render to get fresh data
    return Promise.resolve();
  }, []);

  // Clear cache and force refresh
  const clearCache = useCallback(() => {
    console.warn('[useSwap] Manual cache clear triggered');
    setPools({ loaded: true });
    // Force component re-render to get fresh data
    return Promise.resolve();
  }, []);

  return {
    pools,
    loading,
    error,
    tokenPrices,
    estimateSwapOutput,
    executeSwap,
    refreshPools,
    clearCache,
  };
}
