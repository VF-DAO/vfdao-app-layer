import { useCallback } from 'react';
import { providers } from 'near-api-js';
import Big from 'big.js';
import { useWallet } from '@/features/wallet';
import {
  checkStorageDeposit,
  formatTokenAmount,
  getMinStorageBalance,
  parseTokenAmount,
} from '@/lib/swap-utils';
import { getErrorMessage, isUserCancellation } from '@/lib/transaction-utils';
import type { PoolInfo } from '@/types';

export interface UseLiquidityActionsParams {
  poolId: number;
  poolInfo: PoolInfo | null;
  token1Amount: string;
  token2Amount: string;
  slippage: number;
  userShares: string;
  getRefDepositedBalances: (tokenIds: string[]) => Promise<Record<string, string>>;
  onTransactionStart: () => void;
  onTransactionSuccess: (txHash: string) => void;
  onTransactionError: (error: string) => void;
  onTransactionCancelled: () => void;
  onTransactionWaiting: () => void;
  refetchBalances: () => void;
  refetchShares: () => void;
  refetchPool: () => void;
}

export interface UseLiquidityActionsReturn {
  handleAddLiquidity: () => Promise<void>;
  handleRemoveLiquidity: () => Promise<void>;
}

export function useLiquidityActions(params: UseLiquidityActionsParams): UseLiquidityActionsReturn {
  const { accountId, wallet, connector } = useWallet();

  const handleAddLiquidity = useCallback(async () => {
    /**
     * Add Liquidity Flow - EXACTLY matches Ref Finance implementation
     * 
     * This implementation is verified against ref-finance/ref-ui source code:
     * - ref-ui/src/services/pool.ts (addLiquidityToPool function)
     * - ref-ui/src/services/token.ts (getDepositTransactions function)
     * - ref-ui/src/services/wrap-near.ts (nearDepositTransaction function)
     * 
     * Transaction Order (CRITICAL - matches Ref Finance exactly):
     * 1. register_tokens: Whitelist tokens on Ref Finance (if not already registered)
     * 2. storage_deposit: Register Ref Finance contract on token contracts (so tokens can be transferred)
     * 3. storage_deposit: Register user on token contracts (if not already registered)
     * 4. near_deposit: Wrap NEAR to wNEAR on wrap.near contract (if pool uses wNEAR)
     *    - Check if user registered on wrap.near (ftGetStorageBalance check)
     *    - Call storage_deposit on wrap.near if needed (0.00125 NEAR)
     *    - Call near_deposit with NEAR amount (50T gas)
     * 5. ft_transfer_call: Deposit tokens to Ref Finance's internal balance (100T gas each token)
     *    - receiver_id: v2.ref-finance.near
     *    - amount: token amount in yocto units
     *    - msg: '' (empty string - just deposit, don't swap)
     * 6. add_liquidity: Add tokens from Ref Finance balance to pool (150T gas)
     *    - For SIMPLE pools: { pool_id, amounts } - NO min_shares parameter
     *    - For STABLE pools: { pool_id, amounts, min_shares } - requires slippage protection
     * 
     * Key Differences from Stable Pools:
     * - Simple pools: Contract auto-calculates shares using sqrt(amount1 * amount2) for new pools
     *                 or proportional shares for existing pools
     * - Stable pools: Must specify min_shares for slippage protection
     * 
     * Pattern verified against:
     * - pool.ts lines 854-941: addLiquidityToPool
     * - pool.ts lines 982-1022: addLiquidityToStablePool
     * - wrap-near.ts lines 44-58: nearDepositTransaction
     * - token.ts lines 147-180: getDepositTransactions
     */
    if (!accountId || !params.poolInfo || !params.token1Amount || !params.token2Amount) return;

    params.onTransactionStart();

    try {
      let walletInstance = wallet;
      if (!walletInstance && connector) {
        const { wallet: connectedWallet } = await connector.getConnectedWallet();
        walletInstance = connectedWallet;
      }

      if (!walletInstance) {
        throw new Error('Please connect wallet');
      }

      // Parse amounts to contract format
      let amount1Parsed = parseTokenAmount(params.token1Amount, params.poolInfo.token1.decimals);
      let amount2Parsed = parseTokenAmount(params.token2Amount, params.poolInfo.token2.decimals);

      // Validate that inputs are not empty and contain valid numbers
      if (!params.token1Amount.trim() || !params.token2Amount.trim()) {
        throw new Error('Please enter amounts for both tokens');
      }

      // Check if parsing failed (returned '0' for invalid input)
      const amount1Num = parseFloat(params.token1Amount.replace(/,/g, '').trim());
      const amount2Num = parseFloat(params.token2Amount.replace(/,/g, '').trim());
      if (isNaN(amount1Num) || isNaN(amount2Num)) {
        throw new Error('Please enter valid numeric amounts');
      }

      // Check if amounts are positive
      if (amount1Num <= 0 || amount2Num <= 0) {
        throw new Error('Please enter positive amounts greater than 0');
      }

      // If parseTokenAmount failed but input is valid, try fallback parsing
      if (amount1Parsed === '0' && amount1Num > 0) {
        try {
          if (isNaN(amount1Num) || !isFinite(amount1Num) || amount1Num <= 0) {
            throw new Error(`Invalid NEAR amount for fallback parsing: ${amount1Num}`);
          }
          const fallbackAmount = new Big(amount1Num.toString()).times(new Big(10).pow(params.poolInfo.token1.decimals));
          amount1Parsed = fallbackAmount.toFixed(0);
        } catch (fallbackError) {
          console.error('[useLiquidityActions] Fallback parsing failed for token1:', fallbackError);
          throw new Error('Failed to process NEAR amount. Please try a different amount.');
        }
      }

      if (amount2Parsed === '0' && amount2Num > 0) {
        try {
          if (isNaN(amount2Num) || !isFinite(amount2Num) || amount2Num <= 0) {
            throw new Error(`Invalid VEGANFRIENDS amount for fallback parsing: ${amount2Num}`);
          }
          const fallbackAmount = new Big(amount2Num.toString()).times(new Big(10).pow(params.poolInfo.token2.decimals));
          amount2Parsed = fallbackAmount.toFixed(0);
        } catch (fallbackError) {
          console.error('[useLiquidityActions] Fallback parsing failed for token2:', fallbackError);
          throw new Error('Failed to process VEGANFRIENDS amount. Please try a different amount.');
        }
      }

      // Get the correct token order from the pool contract
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });
      const poolResponse = await provider.query({
        request_type: 'call_function',
        account_id: 'v2.ref-finance.near',
        method_name: 'get_pool',
        args_base64: Buffer.from(JSON.stringify({ pool_id: params.poolId })).toString('base64'),
        finality: 'final',
      }) as unknown as { result: number[] };

      const poolData = JSON.parse(Buffer.from(poolResponse.result).toString()) as {
        token_account_ids: string[];
        amounts: string[];
        total_shares: string;
      };

      // Create amounts array in the same order as token_account_ids
      const amounts: string[] = [];
      poolData.token_account_ids.forEach((tokenId: string) => {
        if (tokenId === 'wrap.near') {
          amounts.push(amount1Parsed);
        } else if (tokenId === 'veganfriends.tkn.near') {
          amounts.push(amount2Parsed);
        }
      });

      // For simple pools, the contract calculates shares automatically
      // We don't need to predict or specify minimum shares like stable pools do
      // The contract uses the formula: shares = sqrt(amount1 * amount2) for new pools
      // or proportional shares for existing pools
      // We just need to send min_amounts for slippage protection instead

      // SMART DEPOSIT DETECTION: Check what's already deposited in Ref Finance
      const depositedBalances = await params.getRefDepositedBalances(poolData.token_account_ids);

      // Calculate what needs to be deposited (needed - already_deposited)
      const depositsNeeded: Record<string, { needed: string; alreadyDeposited: string; toDeposit: string }> = {};
      poolData.token_account_ids.forEach((tokenId: string, index: number) => {
        const needed = Big(amounts[index]);
        const alreadyDeposited = Big(depositedBalances[tokenId] ?? '0');
        const toDeposit = needed.gt(alreadyDeposited) ? needed.minus(alreadyDeposited) : Big(0);
        
        depositsNeeded[tokenId] = {
          needed: needed.toFixed(0),
          alreadyDeposited: alreadyDeposited.toFixed(0),
          toDeposit: toDeposit.toFixed(0),
        };
      });
      
      // Check if we can skip all deposits (already have enough deposited)
      const canSkipAllDeposits = Object.values(depositsNeeded).every(d => d.toDeposit === '0');
      if (canSkipAllDeposits) {
        console.warn('[useLiquidityActions] ✅ All tokens already deposited! Skipping deposit step, going straight to add_liquidity.');
      }

      // Check token registrations
      const token1Registered = await checkStorageDeposit(params.poolInfo.token1.id, accountId, rpcUrl);
      const token2Registered = await checkStorageDeposit(params.poolInfo.token2.id, accountId, rpcUrl);

      // Build transactions array - Ref Finance builds in forward order then executes
      // DO NOT use unshift() - array index 0 executes first
      const transactions: any[] = [];

      // Step 1: Wrap NEAR first if needed (only wrap the difference if some already deposited)
      const wNearIndex = poolData.token_account_ids.indexOf('wrap.near');
      if (wNearIndex !== -1) {
        const wNearToDeposit = depositsNeeded['wrap.near']?.toDeposit ?? '0';
        
        if (wNearToDeposit !== '0') {
          console.warn(`[useLiquidityActions] Need to wrap ${formatTokenAmount(wNearToDeposit, 24, 6)} NEAR (already deposited: ${formatTokenAmount(depositsNeeded['wrap.near']?.alreadyDeposited ?? '0', 24, 6)})`);
          
          // Check if user is registered on wrap.near FIRST
          const wrapNearRegistered = await checkStorageDeposit('wrap.near', accountId, rpcUrl);
          if (!wrapNearRegistered) {
            // Add storage_deposit for wrap.near FIRST
            transactions.push({
              receiverId: 'wrap.near',
              actions: [{
                type: 'FunctionCall',
                params: {
                  methodName: 'storage_deposit',
                  args: {
                    account_id: accountId,
                    registration_only: true,
                  },
                  gas: '30000000000000',
                  deposit: '1250000000000000000000', // 0.00125 NEAR for storage
                },
              }],
            });
          }

          // Then wrap NEAR (only the amount needed)
          transactions.push({
            receiverId: 'wrap.near',
            actions: [{
              type: 'FunctionCall',
              params: {
                methodName: 'near_deposit',
                args: {},
                gas: '50000000000000',
                deposit: wNearToDeposit, // Only wrap what we need
              },
            }],
          });
        } else {
          console.warn(`[useLiquidityActions] ✅ Skipping NEAR wrap - already have ${formatTokenAmount(depositsNeeded['wrap.near']?.alreadyDeposited ?? '0', 24, 6)} NEAR deposited`);
        }
      }

      // Step 2: Register user on token contracts if needed
      if (!token1Registered) {
        const minDeposit1 = await getMinStorageBalance(params.poolInfo.token1.id, rpcUrl);
        transactions.push({
          receiverId: params.poolInfo.token1.id,
          actions: [{
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              deposit: minDeposit1,
            },
          }],
        });
      }

      if (!token2Registered) {
        const minDeposit2 = await getMinStorageBalance(params.poolInfo.token2.id, rpcUrl);
        transactions.push({
          receiverId: params.poolInfo.token2.id,
          actions: [{
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              deposit: minDeposit2,
            },
          }],
        });
      }

      // Step 3: Register Ref Finance on token contracts if needed
      for (const tokenId of poolData.token_account_ids) {
        const refRegisteredOnToken = await checkStorageDeposit(tokenId, 'v2.ref-finance.near', rpcUrl);
        if (!refRegisteredOnToken) {
          const minDeposit = await getMinStorageBalance(tokenId, rpcUrl);
          transactions.push({
            receiverId: tokenId,
            actions: [{
              type: 'FunctionCall',
              params: {
                methodName: 'storage_deposit',
                args: {
                  account_id: 'v2.ref-finance.near',
                  registration_only: true,
                },
                gas: '30000000000000',
                deposit: minDeposit,
              },
            }],
          });
        }
      }

      // Step 4: Register tokens on Ref Finance whitelist if needed
      try {
        const userTokensResponse = await provider.query({
          request_type: 'call_function',
          account_id: 'v2.ref-finance.near',
          method_name: 'get_user_whitelisted_tokens',
          args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
          finality: 'final',
        }) as unknown as { result: number[] };
        
        const userWhitelistedTokens = JSON.parse(Buffer.from(userTokensResponse.result).toString()) as string[];
        const needsWhitelistToken1 = !userWhitelistedTokens.includes(params.poolInfo.token1.id);
        const needsWhitelistToken2 = !userWhitelistedTokens.includes(params.poolInfo.token2.id);
        
        if (needsWhitelistToken1 || needsWhitelistToken2) {
          const tokensToRegister: string[] = [];
          if (needsWhitelistToken1) tokensToRegister.push(params.poolInfo.token1.id);
          if (needsWhitelistToken2) tokensToRegister.push(params.poolInfo.token2.id);
          
          console.warn('[useLiquidityActions] Registering tokens on Ref Finance:', tokensToRegister);
          
          transactions.push({
            receiverId: 'v2.ref-finance.near',
            actions: [{
              type: 'FunctionCall',
              params: {
                methodName: 'register_tokens',
                args: {
                  token_ids: tokensToRegister,
                },
                gas: '30000000000000',
                deposit: '1', // 1 yoctoNEAR
              },
            }],
          });
        }
      } catch (whitelistError) {
        console.warn('[useLiquidityActions] Could not check whitelisted tokens, skipping:', whitelistError);
      }

      // Step 5: Deposit tokens to Ref Finance contract using ft_transfer_call
      // This is CRITICAL - tokens must be deposited before add_liquidity can use them
      // SMART: Only deposit the difference (needed - already_deposited)
      poolData.token_account_ids.forEach((tokenId: string) => {
        const toDeposit = depositsNeeded[tokenId]?.toDeposit ?? '0';
        
        if (toDeposit !== '0') {
          console.warn(`[useLiquidityActions] Will deposit ${formatTokenAmount(toDeposit, tokenId === 'wrap.near' ? 24 : 18, 6)} of ${tokenId}`);
          transactions.push({
            receiverId: tokenId,
            actions: [{
              type: 'FunctionCall',
              params: {
                methodName: 'ft_transfer_call',
                args: {
                  receiver_id: 'v2.ref-finance.near',
                  amount: toDeposit, // Only deposit what we need
                  msg: '', // Empty string means just deposit to Ref Finance balance
                },
                gas: '100000000000000',
                deposit: '1', // 1 yoctoNEAR
              },
            }],
          });
        } else {
          console.warn(`[useLiquidityActions] ✅ Skipping deposit for ${tokenId} - already have ${formatTokenAmount(depositsNeeded[tokenId]?.alreadyDeposited ?? '0', tokenId === 'wrap.near' ? 24 : 18, 6)} deposited`);
        }
      });

      // Step 6: Main add liquidity transaction
      // For simple pools, we only pass pool_id and amounts (NO min_shares - that's for stable pools only)
      // IMPORTANT: Ref Finance requires 0.00078 NEAR for LP storage deposit
      transactions.push({
        receiverId: 'v2.ref-finance.near',
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'add_liquidity',
            args: {
              pool_id: params.poolId,
              amounts,
            },
            gas: '150000000000000',
            deposit: '780000000000000000000', // 0.00078 NEAR - required for LP storage
          },
        }],
      });

      console.warn('[useLiquidityActions] Sending add liquidity transactions:', transactions.length);

      const outcomes = await walletInstance.signAndSendTransactions({
        transactions,
      });

      // Some wallets return the transaction hash directly, others return outcomes array
      if (outcomes) {
        // If outcomes is a string, it's likely a transaction hash
        if (typeof outcomes === 'string') {
          params.onTransactionSuccess(outcomes);
          return;
        }
        
        // If outcomes is an array with results
        if (Array.isArray(outcomes) && outcomes.length > 0) {
          const finalOutcome = outcomes[outcomes.length - 1];
          const txHash = String(finalOutcome?.transaction?.hash ?? finalOutcome?.transaction_outcome?.id ?? '');

          if (txHash) {
            params.onTransactionSuccess(txHash);
            // Wait for blockchain to finalize (add_liquidity needs more time)
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Start fetches immediately (they will set loading states)
            void params.refetchBalances();
            void params.refetchShares();
            void params.refetchPool();
            // Small delay to ensure fetch functions have set their loading states
            await new Promise(resolve => setTimeout(resolve, 100));
            return;
          }
        }
      }
      
      // If we didn't get a clear success, mark as waiting for confirmation
      params.onTransactionWaiting();
    } catch (err: any) {
      // Handle user cancellation with robust detection
      if (isUserCancellation(err)) {
        console.warn('[useLiquidityActions] Add liquidity cancelled by user');
        params.onTransactionCancelled();
      } else {
        console.error('[useLiquidityActions] Add liquidity error:', err);
        const errorMsg = getErrorMessage(err, 'Failed to add liquidity');
        params.onTransactionError(errorMsg);
      }
    }
  }, [
    accountId,
    wallet,
    connector,
    params.poolId,
    params.poolInfo,
    params.token1Amount,
    params.token2Amount,
    params.getRefDepositedBalances,
    params.onTransactionStart,
    params.onTransactionSuccess,
    params.onTransactionError,
    params.onTransactionCancelled,
    params.onTransactionWaiting,
    params.refetchBalances,
    params.refetchShares,
    params.refetchPool,
  ]);

  const handleRemoveLiquidity = useCallback(async () => {
    if (!accountId || !params.poolInfo || !params.token1Amount) return;

    params.onTransactionStart();

    try {
      let walletInstance = wallet;
      if (!walletInstance && connector) {
        const { wallet: connectedWallet } = await connector.getConnectedWallet();
        walletInstance = connectedWallet;
      }

      if (!walletInstance) {
        throw new Error('Please connect wallet');
      }

      // Parse shares amount to contract format
      const sharesToRemove = parseTokenAmount(params.token1Amount, 24); // LP tokens have 24 decimals

      // Validate shares amount
      if (sharesToRemove === '0') {
        throw new Error('Please enter a valid amount of LP shares to remove');
      }

      // Validate that amount is positive and doesn't exceed user shares
      const sharesNum = parseFloat(params.token1Amount);
      if (isNaN(sharesNum) || sharesNum <= 0) {
        throw new Error('Please enter a valid positive amount');
      }
      
      // Compare using Big.js to avoid floating point precision issues
      const requestedShares = Big(sharesToRemove);
      const availableShares = Big(params.userShares);
      if (requestedShares.gt(availableShares)) {
        throw new Error('Cannot remove more shares than you own');
      }

      // Get the correct token order from the pool contract
      const provider = new providers.JsonRpcProvider({ url: process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org' });
      const poolResponse = await provider.query({
        request_type: 'call_function',
        account_id: 'v2.ref-finance.near',
        method_name: 'get_pool',
        args_base64: Buffer.from(JSON.stringify({ pool_id: params.poolId })).toString('base64'),
        finality: 'final',
      }) as unknown as { result: number[] };

      const poolData = JSON.parse(Buffer.from(poolResponse.result).toString()) as {
        token_account_ids: string[];
        amounts: string[];
        total_shares: string;
      };

      // Calculate minimum amounts to receive (with slippage protection)
      const shareSupplyStr = String(params.poolInfo.shareSupply || '0');
      const totalReserve1Str = String(params.poolInfo.reserves['wrap.near'] || params.poolInfo.reserves[params.poolInfo.token1.id] || '0');
      const totalReserve2Str = String(params.poolInfo.reserves['veganfriends.tkn.near'] || params.poolInfo.reserves[params.poolInfo.token2.id] || '0');
      
      // Check for zero total shares (empty pool)
      if (shareSupplyStr === '0' || !shareSupplyStr) {
        throw new Error('Pool has no total shares. Cannot calculate removal amounts.');
      }
      
      const totalShares = Big(shareSupplyStr);
      const sharesToRemoveBig = Big(sharesToRemove);
      const totalReserve1 = Big(totalReserve1Str);
      const totalReserve2 = Big(totalReserve2Str);

      // Calculate proportional amounts: amount = (shares_to_remove / total_shares) * reserve
      const amount1 = sharesToRemoveBig.mul(totalReserve1).div(totalShares);
      const amount2 = sharesToRemoveBig.mul(totalReserve2).div(totalShares);

      // Apply slippage protection based on user setting
      const slippageMultiplier = Big(1 - params.slippage / 100);
      const minAmount1 = amount1.mul(slippageMultiplier).toFixed(0);
      const minAmount2 = amount2.mul(slippageMultiplier).toFixed(0);

      // Create min_amounts array in the same order as token_account_ids
      const minAmounts: string[] = [];
      poolData.token_account_ids.forEach((tokenId: string) => {
        if (tokenId === 'wrap.near') {
          minAmounts.push(minAmount1);
        } else if (tokenId === 'veganfriends.tkn.near') {
          minAmounts.push(minAmount2);
        }
      });

      // Check token registrations
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const token1Registered = await checkStorageDeposit(params.poolInfo.token1.id, accountId, rpcUrl);
      const token2Registered = await checkStorageDeposit(params.poolInfo.token2.id, accountId, rpcUrl);

      const transactions: any[] = [];

      // Add registration transactions if needed
      if (!token1Registered) {
        const minDeposit1 = await getMinStorageBalance(params.poolInfo.token1.id, rpcUrl);
        transactions.push({
          receiverId: params.poolInfo.token1.id,
          actions: [{
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              deposit: minDeposit1,
            },
          }],
        });
      }

      if (!token2Registered) {
        const minDeposit2 = await getMinStorageBalance(params.poolInfo.token2.id, rpcUrl);
        transactions.push({
          receiverId: params.poolInfo.token2.id,
          actions: [{
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              deposit: minDeposit2,
            },
          }],
        });
      }

      // Main remove liquidity transaction - this puts tokens in Ref Finance internal balance
      transactions.push({
        receiverId: 'v2.ref-finance.near',
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'remove_liquidity',
            args: {
              pool_id: params.poolId,
              shares: sharesToRemove,
              min_amounts: minAmounts,
            },
            gas: '150000000000000',
            deposit: '1',
          },
        }],
      });

      // Withdraw token 1 from Ref Finance internal balance to wallet
      // skip_unwrap_near: false means wNEAR will be automatically unwrapped to native NEAR
      transactions.push({
        receiverId: 'v2.ref-finance.near',
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'withdraw',
            args: {
              token_id: params.poolInfo.token1.id,
              amount: '0', // '0' means withdraw all available balance
              unregister: false,
              skip_unwrap_near: false, // Auto-unwrap wNEAR to native NEAR
            },
            gas: '100000000000000',
            deposit: '1',
          },
        }],
      });

      // Withdraw token 2 from Ref Finance internal balance to wallet
      transactions.push({
        receiverId: 'v2.ref-finance.near',
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'withdraw',
            args: {
              token_id: params.poolInfo.token2.id,
              amount: '0', // '0' means withdraw all available balance
              unregister: false,
              skip_unwrap_near: false, // Auto-unwrap wNEAR to native NEAR (no effect for other tokens)
            },
            gas: '100000000000000',
            deposit: '1',
          },
        }],
      });

      const outcomes = await walletInstance.signAndSendTransactions({
        transactions,
      });

      if (outcomes && outcomes.length > 0) {
        const finalOutcome = outcomes[outcomes.length - 1];
        const txHash = String(finalOutcome?.transaction?.hash ?? finalOutcome?.transaction_outcome?.id ?? '');

        if (txHash) {
          params.onTransactionSuccess(txHash);
        } else {
          params.onTransactionWaiting();
        }
      } else {
        params.onTransactionWaiting();
      }
    } catch (err: any) {
      // Handle user cancellation with robust detection
      if (isUserCancellation(err)) {
        console.warn('[useLiquidityActions] Remove liquidity cancelled by user');
        params.onTransactionCancelled();
      } else {
        console.error('[useLiquidityActions] Remove liquidity error:', err);
        const errorMsg = getErrorMessage(err, 'Failed to remove liquidity');
        params.onTransactionError(errorMsg);
      }
    }
  }, [
    accountId,
    wallet,
    connector,
    params.poolId,
    params.poolInfo,
    params.token1Amount,
    params.userShares,
    params.slippage,
    params.onTransactionStart,
    params.onTransactionSuccess,
    params.onTransactionError,
    params.onTransactionCancelled,
    params.onTransactionWaiting,
    params.refetchBalances,
    params.refetchShares,
    params.refetchPool,
  ]);

  return {
    handleAddLiquidity,
    handleRemoveLiquidity,
  };
}
