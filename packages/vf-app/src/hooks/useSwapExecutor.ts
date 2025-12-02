import { useCallback } from 'react';
import { useWallet } from '@/features/wallet';
import { useSwap } from '@/features/swap/hooks';
import Big from 'big.js';

export interface SwapData {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  poolId: string;
}

export interface TokenInfo {
  contractId: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

/**
 * Hook for executing swaps - can be used for both direct execution and DAO proposals
 * Provides unified interface for swap operations
 */
export function useSwapExecutor() {
  const { wallet, accountId } = useWallet();
  const { estimateSwapOutput, executeSwap } = useSwap();

  /**
   * Execute a swap directly (for test swaps)
   */
  const executeDirectSwap = useCallback(async (
    swapData: SwapData,
    availableTokens: TokenInfo[]
  ) => {
    if (!wallet || !accountId) {
      throw new Error('Wallet not connected');
    }

    // Convert amount to yocto units for the estimate
    const tokenInInfo = availableTokens.find(t => t.contractId === swapData.tokenIn);
    const amountInYocto = tokenInInfo ?
      Big(swapData.amountIn).times(Big(10).pow(tokenInInfo.decimals)).toFixed(0) :
      swapData.amountIn;

    // Convert wrap.near to near for the swap functions (useSwap expects 'near' for NEAR input/output)
    const swapTokenIn = swapData.tokenIn === 'wrap.near' ? 'near' : swapData.tokenIn;
    const swapTokenOut = swapData.tokenOut === 'wrap.near' ? 'near' : swapData.tokenOut;

    // Special handling for NEAR->USDC using Rhea's dclv2.ref-labs.near contract
    if (swapData.tokenIn === 'wrap.near' && swapData.tokenOut === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1') {
      console.warn('[Direct Swap] Using Rhea contract for NEAR->USDC');

      // Get estimate using Rhea contract
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'query',
          params: {
            request_type: 'call_function',
            account_id: 'dclv2.ref-labs.near',
            method_name: 'quote',
            args_base64: Buffer.from(JSON.stringify({
              pool_ids: [`${swapData.tokenOut}|${swapData.tokenIn}|100`],
              input_token: swapData.tokenIn,
              output_token: swapData.tokenOut,
              input_amount: amountInYocto
            })).toString('base64'),
            finality: 'final'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get swap estimate from Rhea contract');
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('No result from Rhea contract estimation');
      }

      const result = JSON.parse(Buffer.from(data.result.result).toString());
      const estimatedOutput = result.amount;

      if (!estimatedOutput || estimatedOutput === '0') {
        throw new Error('Invalid estimation result from Rhea contract');
      }

      // Apply 0.5% slippage for min output
      const minReceived = new Big(estimatedOutput).mul(new Big(0.995)).toFixed(0);

      // Execute the swap using Rhea contract
      const wsTransactions = [{
        signerId: accountId,
        receiverId: 'wrap.near',
        actions: [
          {
            type: "FunctionCall" as const,
            params: {
              methodName: 'near_deposit',
              args: {},
              gas: '50000000000000',
              deposit: amountInYocto,
            },
          },
          {
            type: "FunctionCall" as const,
            params: {
              methodName: 'ft_transfer_call',
              args: {
                receiver_id: 'dclv2.ref-labs.near',
                amount: amountInYocto,
                msg: JSON.stringify({
                  Swap: {
                    pool_ids: [`${swapData.tokenOut}|${swapData.tokenIn}|100`],
                    output_token: swapData.tokenOut,
                    min_output_amount: minReceived
                  }
                }),
              },
              gas: '180000000000000',
              deposit: '1',
            },
          },
        ],
      }];

      // Execute the transaction
      const outcomes = await wallet.signAndSendTransactions({
        transactions: wsTransactions as any,
      });

      if (outcomes && outcomes.length > 0) {
        const finalOutcome = outcomes[outcomes.length - 1];
        const txHash = finalOutcome?.transaction?.hash ?? finalOutcome?.transaction_outcome?.id;
        return txHash;
      } else {
        throw new Error('Transaction failed - no outcome received');
      }
    }

    // First get an estimate
    // Special handling for NEAR<->USDC using Rhea's dclv2.ref-labs.near contract
    const isNearUsdcSwap = (
      (swapData.tokenIn === 'wrap.near' && swapData.tokenOut === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1') ||
      (swapData.tokenIn === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1' && swapData.tokenOut === 'wrap.near')
    );

    let estimate;
    if (isNearUsdcSwap) {
      // Use Rhea estimation for NEAR-USDC swaps
      const direction = swapTokenIn === 'wrap.near' ? 'NEAR->USDC' : 'USDC->NEAR';
      console.warn(`[Direct Swap] Estimating ${direction} using Rhea approach`);

      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';

      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: '1',
            method: 'query',
            params: {
              request_type: 'call_function',
              account_id: 'dclv2.ref-labs.near',
              method_name: 'quote',
              args_base64: Buffer.from(JSON.stringify({
                pool_ids: [`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100`],
                input_token: swapData.tokenIn,
                output_token: swapData.tokenOut,
                input_amount: amountInYocto
              })).toString('base64'),
              finality: 'final'
            }
          })
        });

        if (!response.ok) {
          console.warn('[Rhea Swap] Estimation query failed');
          throw new Error('Failed to get swap estimate from Rhea contract');
        }

        const data = await response.json();
        if (!data.result) {
          console.warn('[Rhea Swap] No result in estimation response');
          throw new Error('No result from Rhea contract estimation');
        }

        const result = JSON.parse(Buffer.from(data.result.result).toString());
        const estimatedOutput = result.amount;

        if (!estimatedOutput || estimatedOutput === '0') {
          console.warn('[Rhea Swap] Invalid estimation result');
          throw new Error('Invalid estimation result from Rhea contract');
        }

        // Apply 0.5% slippage for min output
        const minReceived = new Big(estimatedOutput).mul(new Big(0.995)).toFixed(0);

        estimate = {
          outputAmount: estimatedOutput,
          minReceived,
          route: [{ pool_id: `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100` }],
          fee: 0.3,
        };

      } catch (err) {
        console.warn('[Rhea Swap] Estimation failed:', err);
        throw new Error('Failed to get swap estimate. Please check the pool ID and token addresses.');
      }
    } else {
      // Use regular Ref Finance estimation for other pairs
      estimate = await estimateSwapOutput(swapTokenIn, swapTokenOut, amountInYocto);
    }

    if (!estimate) {
      throw new Error('Failed to get swap estimate. Please check the pool ID and token addresses.');
    }

    // Execute the swap with the estimate
    let transactions;
    if (isNearUsdcSwap) {
      // Construct Rhea transactions manually for NEAR-USDC swaps
      if (swapData.tokenIn === 'wrap.near') {
        // NEAR -> USDC
        transactions = [{
          receiverId: 'wrap.near',
          functionCalls: [
            {
              methodName: 'near_deposit',
              args: {},
              gas: '50000000000000',
              amount: amountInYocto,
            },
            {
              methodName: 'ft_transfer_call',
              args: {
                receiver_id: 'dclv2.ref-labs.near',
                amount: amountInYocto,
                msg: JSON.stringify({
                  Swap: {
                    pool_ids: [`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100`],
                    output_token: swapData.tokenOut,
                    min_output_amount: estimate.minReceived
                  }
                }),
              },
              gas: '180000000000000',
              amount: '1',
            },
          ],
        }];
      } else {
        // USDC -> NEAR
        transactions = [{
          receiverId: swapData.tokenIn,
          functionCalls: [
            {
              methodName: 'ft_transfer_call',
              args: {
                receiver_id: 'dclv2.ref-labs.near',
                amount: amountInYocto,
                msg: JSON.stringify({
                  Swap: {
                    pool_ids: [`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100`],
                    output_token: swapData.tokenOut,
                    min_output_amount: estimate.minReceived
                  }
                }),
              },
              gas: '180000000000000',
              amount: '1',
            },
          ],
        }];
      }
    } else {
      // Use regular Ref Finance execution for other pairs
      transactions = await executeSwap(
        swapTokenIn,
        swapTokenOut,
        amountInYocto,
        0.5, // 0.5% slippage
        estimate
      );
    }

    // Convert transactions to wallet format
    const wsTransactions = transactions.map((tx) => {
      const actions = tx.functionCalls?.map((fc) => {
        const baseGas = fc.gas ? BigInt(fc.gas.toString()) : BigInt('20000000000000');
        const gasBuffer = BigInt('10000000000000');
        const gasBigInt = baseGas + gasBuffer;

        return {
          type: "FunctionCall" as const,
          params: {
            methodName: fc.methodName,
            args: fc.args ?? {},
            gas: gasBigInt.toString(),
            deposit: (fc.amount ?? '0').toString(),
          }
        };
      }) || [];

      return {
        signerId: accountId,
        receiverId: tx.receiverId,
        actions,
      };
    });

    // Execute the transaction
    const outcomes = await wallet.signAndSendTransactions({
      transactions: wsTransactions as any,
    });

    if (outcomes && outcomes.length > 0) {
      const finalOutcome = outcomes[outcomes.length - 1];
      const txHash = finalOutcome?.transaction?.hash ?? finalOutcome?.transaction_outcome?.id;
      return txHash;
    } else {
      throw new Error('Transaction failed - no outcome received');
    }
  }, [wallet, accountId, estimateSwapOutput, executeSwap]);

  /**
   * Construct swap transactions for DAO proposals (supports multi-hop routing)
   */
  const constructProposalSwapTransactions = useCallback((
    swapData: SwapData,
    availableTokens: TokenInfo[],
    estimate?: SwapEstimate
  ) => {
    // Convert amounts to smallest units
    const tokenInInfo = availableTokens.find(t => t.contractId === swapData.tokenIn);
    const tokenOutInfo = availableTokens.find(t => t.contractId === swapData.tokenOut);

    const amountInSmallestUnit = new Big(swapData.amountIn).times(new Big(10).pow(tokenInInfo?.decimals ?? 24)).toString();
    const minAmountOutSmallestUnit = new Big(swapData.minAmountOut).times(new Big(10).pow(tokenOutInfo?.decimals ?? 24)).toString();

    // Convert wrap.near to near for the transaction construction
    // But keep wrap.near for Ref Finance contract calls (matches useSwap logic)
    const proposalTokenIn = swapData.tokenIn === 'wrap.near' ? 'wrap.near' : swapData.tokenIn;
    const proposalTokenOut = swapData.tokenOut === 'wrap.near' ? 'wrap.near' : swapData.tokenOut;

    // Handle NEAR input swaps - supports multi-hop routing
    if (swapData.tokenIn === 'wrap.near') { // NEAR input (represented as wrap.near in our system)
      // Special handling for NEAR<->USDC using Rhea's dclv2.ref-labs.near contract
      if (swapData.tokenOut === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1') {
        console.warn('[Proposal Swap] Using Rhea contract for NEAR->USDC');
        return [{
          receiverId: 'wrap.near',
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: 'near_deposit',
                args: {},
                gas: '50000000000000',
                deposit: amountInSmallestUnit,
              },
            },
            {
              type: "FunctionCall",
              params: {
                methodName: 'ft_transfer_call',
                args: {
                  receiver_id: 'dclv2.ref-labs.near',
                  amount: amountInSmallestUnit,
                  msg: JSON.stringify({
                    Swap: {
                      pool_ids: [`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100`],
                      output_token: swapData.tokenOut,
                      min_output_amount: minAmountOutSmallestUnit
                    }
                  }),
                },
                gas: '180000000000000',
                deposit: '1',
              },
            },
          ],
        }];
      }

      // If we have a multi-hop route from the estimate, use it
      if (estimate?.route && estimate.route.length > 1) {
        console.warn('[Proposal Swap] Constructing multi-hop NEAR transaction with route:', estimate.route);

        // Build actions array from the route
        const actions = estimate.route.map((routeStep: any, index: number) => {
          const isFirstHop = index === 0;
          const isLastHop = index === estimate.route!.length - 1;

          // For first hop, use full amount in
          // For subsequent hops, use min_amount_out from previous hop
          const amountIn = isFirstHop ? amountInSmallestUnit : '0'; // Will be set by previous action
          const minAmountOut = isLastHop ? minAmountOutSmallestUnit : '0'; // Only set for final hop

          return {
            pool_id: routeStep.pool_id,
            token_in: isFirstHop ? 'wrap.near' : routeStep.token_in,
            token_out: routeStep.token_out,
            amount_in: amountIn,
            min_amount_out: minAmountOut,
          };
        });

        return [{
          receiverId: 'wrap.near',
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: 'near_deposit',
                args: {},
                gas: '50000000000000', // 50 TGas
                deposit: amountInSmallestUnit, // Deposit the NEAR amount
              },
            },
            {
              type: "FunctionCall",
              params: {
                methodName: 'ft_transfer_call',
                args: {
                  receiver_id: 'v2.ref-finance.near',
                  amount: amountInSmallestUnit,
                  msg: JSON.stringify({
                    force: 0,
                    actions,
                    ...(swapData.tokenOut === 'wrap.near' ? { skip_unwrap_near: false } : {}),
                  }),
                },
                gas: '180000000000000', // 180 TGas
                deposit: '1', // 1 yoctoNEAR
              },
            },
          ],
        }];
      } else {
        // Single hop - use existing logic
        return [{
          receiverId: 'wrap.near',
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: 'near_deposit',
                args: {},
                gas: '50000000000000', // 50 TGas
                deposit: amountInSmallestUnit, // Deposit the NEAR amount
              },
            },
            {
              type: "FunctionCall",
              params: {
                methodName: 'ft_transfer_call',
                args: {
                  receiver_id: 'v2.ref-finance.near',
                  amount: amountInSmallestUnit,
                  msg: JSON.stringify({
                    force: 0,
                    actions: [{
                      pool_id: parseInt(swapData.poolId), // Use dynamic pool ID
                      token_in: 'wrap.near',
                      token_out: proposalTokenOut,
                      amount_in: amountInSmallestUnit,
                      min_amount_out: minAmountOutSmallestUnit,
                    }],
                    ...(swapData.tokenOut === 'wrap.near' ? { skip_unwrap_near: false } : {}),
                  }),
                },
                gas: '180000000000000', // 180 TGas
                deposit: '1', // 1 yoctoNEAR
              },
            },
          ],
        }];
      }
    } else {
      // Token input swaps - supports multi-hop routing
      // Special handling for USDC->NEAR using Rhea's dclv2.ref-labs.near contract
      if (swapData.tokenIn === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1' && swapData.tokenOut === 'wrap.near') {
        console.warn('[Proposal Swap] Using Rhea contract for USDC->NEAR');
        return [{
          receiverId: swapData.tokenIn,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: 'ft_transfer_call',
                args: {
                  receiver_id: 'dclv2.ref-labs.near',
                  amount: amountInSmallestUnit,
                  msg: JSON.stringify({
                    Swap: {
                      pool_ids: [`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100`],
                      output_token: swapData.tokenOut,
                      min_output_amount: minAmountOutSmallestUnit
                    }
                  }),
                },
                gas: '180000000000000',
                deposit: '1',
              },
            },
          ],
        }];
      }
      if (estimate?.route && estimate.route.length > 1) {
        console.warn('[Proposal Swap] Constructing multi-hop token transaction with route:', estimate.route);

        // Build actions array from the route
        const actions = estimate.route.map((routeStep: any, index: number) => {
          const isFirstHop = index === 0;
          const isLastHop = index === estimate.route!.length - 1;

          // For first hop, use full amount in
          // For subsequent hops, use min_amount_out from previous hop
          const amountIn = isFirstHop ? amountInSmallestUnit : '0'; // Will be set by previous action
          const minAmountOut = isLastHop ? minAmountOutSmallestUnit : '0'; // Only set for final hop

          return {
            pool_id: routeStep.pool_id,
            token_in: routeStep.token_in,
            token_out: routeStep.token_out,
            amount_in: amountIn,
            min_amount_out: minAmountOut,
          };
        });

        return [{
          receiverId: 'v2.ref-finance.near',
          actions: [{
            type: "FunctionCall",
            params: {
              methodName: 'swap',
              args: JSON.stringify({
                force: 0,
                actions,
                ...(swapData.tokenOut === 'wrap.near' ? { skip_unwrap_near: false } : {}),
              }),
              gas: '100000000000000', // 100 TGas
              deposit: '1', // 1 yoctoNEAR
            },
          }],
        }];
      } else {
        // Single hop - use existing logic
        return [{
          receiverId: 'v2.ref-finance.near',
          actions: [{
            type: "FunctionCall",
            params: {
              methodName: 'swap',
              args: JSON.stringify({
                force: 0,
                actions: [{
                  pool_id: parseInt(swapData.poolId), // Use dynamic pool ID
                  token_in: proposalTokenIn,
                  token_out: proposalTokenOut,
                  amount_in: amountInSmallestUnit,
                  min_amount_out: minAmountOutSmallestUnit,
                }],
                ...(swapData.tokenOut === 'wrap.near' ? { skip_unwrap_near: false } : {}),
              }),
              gas: '100000000000000', // 100 TGas
              deposit: '1', // 1 yoctoNEAR
            },
          }],
        }];
      }
    }
  }, []);

  const getTransactionPreview = useCallback((
    swapData: SwapData,
    availableTokens: TokenInfo[]
  ) => {
    const tokenInInfo = availableTokens.find(t => t.contractId === swapData.tokenIn);
    const tokenOutInfo = availableTokens.find(t => t.contractId === swapData.tokenOut);

    // Special case for NEAR<->USDC using Rhea
    const isNearUsdcSwap = (
      (swapData.tokenIn === 'wrap.near' && swapData.tokenOut === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1') ||
      (swapData.tokenIn === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1' && swapData.tokenOut === 'wrap.near')
    );

    if (isNearUsdcSwap) {
      const poolIds = [`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100`];

      if (swapData.tokenIn === 'wrap.near') {
        return `Receiver: wrap.near
Actions:
1. near_deposit (deposit: ${swapData.amountIn} NEAR)
2. ft_transfer_call to dclv2.ref-labs.near
   msg: ${JSON.stringify({
     Swap: {
       pool_ids: poolIds,
       output_token: swapData.tokenOut,
       min_output_amount: new Big(swapData.minAmountOut).times(new Big(10).pow(tokenOutInfo?.decimals ?? 6)).toString()
     }
   }, null, 2)}`;
      } else {
        return `Receiver: ${swapData.tokenIn}
Actions:
1. ft_transfer_call to dclv2.ref-labs.near
   msg: ${JSON.stringify({
     Swap: {
       pool_ids: poolIds,
       output_token: swapData.tokenOut,
       min_output_amount: new Big(swapData.minAmountOut).times(new Big(10).pow(tokenOutInfo?.decimals ?? 24)).toString()
     }
   }, null, 2)}`;
      }
    }

    const swapTokenIn = swapData.tokenIn === 'wrap.near' ? 'near' : swapData.tokenIn;
    const swapTokenOut = swapData.tokenOut === 'wrap.near' ? 'near' : swapData.tokenOut;

    if (swapData.tokenIn === 'wrap.near') {
      return `Receiver: wrap.near
Actions:
1. near_deposit (deposit: ${swapData.amountIn} NEAR)
2. ft_transfer_call to v2.ref-finance.near
   msg: ${JSON.stringify({
     force: 0,
     actions: [{
       pool_id: parseInt(swapData.poolId),
       token_in: 'wrap.near',
       token_out: swapTokenOut,
       amount_in: new Big(swapData.amountIn).times(new Big(10).pow(tokenInInfo?.decimals ?? 24)).toString(),
       min_amount_out: new Big(swapData.minAmountOut).times(new Big(10).pow(tokenOutInfo?.decimals ?? 24)).toString(),
     }],
     ...(swapData.tokenOut === 'wrap.near' ? { skip_unwrap_near: false } : {}),
   }, null, 2)}`;
    } else {
      return `Receiver: v2.ref-finance.near
Action: swap
args: ${JSON.stringify({
  force: 0,
  actions: [{
    pool_id: parseInt(swapData.poolId),
    token_in: swapTokenIn,
    token_out: swapTokenOut,
    amount_in: new Big(swapData.amountIn).times(new Big(10).pow(tokenInInfo?.decimals ?? 24)).toString(),
    min_amount_out: new Big(swapData.minAmountOut).times(new Big(10).pow(tokenOutInfo?.decimals ?? 24)).toString(),
  }],
  ...(swapData.tokenOut === 'wrap.near' ? { skip_unwrap_near: false } : {}),
}, null, 2)}`;
    }
  }, []);

  return {
    estimateSwapOutput,
    executeDirectSwap,
    constructProposalSwapTransactions,
    getTransactionPreview,
  };
}