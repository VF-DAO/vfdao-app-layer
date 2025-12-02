import { useEffect, useState } from 'react';
import Big from 'big.js';

interface TokenInfo {
  contractId: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

interface SwapEstimate {
  outputAmount?: string;
  minReceived?: string;
  priceImpact?: number;
  route?: any[];
  fee?: number;
  highImpact?: boolean;
}

interface UseSwapEstimationOptions {
  proposalType: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  availableTokens: TokenInfo[];
  estimateSwapOutput: (tokenIn: string, tokenOut: string, amountIn: string) => Promise<SwapEstimate | null>;
}

export function useSwapEstimation({
  proposalType,
  tokenIn,
  tokenOut,
  amountIn,
  availableTokens,
  estimateSwapOutput,
}: UseSwapEstimationOptions) {
  const [swapEstimate, setSwapEstimate] = useState<SwapEstimate | null>(null);
  const [isEstimatingSwap, setIsEstimatingSwap] = useState(false);

  // Proposal-specific swap estimation that matches Rhea's approach
  const estimateProposalSwap = async (
    tokenInId: string,
    tokenOutId: string,
    amountInSmallestUnit: string
  ): Promise<SwapEstimate | null> => {
    try {
      // For NEAR<->USDC bidirectional swaps, use Rhea's approach with dclv2.ref-labs.near
      const isNearUsdcSwap = (
        (tokenInId === 'wrap.near' && tokenOutId === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1') ||
        (tokenInId === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1' && tokenOutId === 'wrap.near')
      );

      if (isNearUsdcSwap) {
        const direction = tokenInId === 'wrap.near' ? 'NEAR->USDC' : 'USDC->NEAR';
        console.warn(`[Proposal Swap] Estimating ${direction} using Rhea approach`);

        // Query the dclv2.ref-labs.near contract for swap estimation
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
                  pool_ids: [`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100`], // Always USDC|NEAR|100 format
                  input_token: tokenInId,
                  output_token: tokenOutId,
                  input_amount: amountInSmallestUnit
                })).toString('base64'),
                finality: 'final'
              }
            })
          });

          if (!response.ok) {
            console.warn('[Rhea Swap] Estimation query failed');
            return null;
          }

          const data = await response.json();
          if (!data.result) {
            console.warn('[Rhea Swap] No result in estimation response');
            return null;
          }

          const result = JSON.parse(Buffer.from(data.result.result).toString());
          console.warn('[Rhea Swap] Quote result:', result);

          const estimatedOutput = result.amount;
          console.warn('[Rhea Swap] Estimated output:', estimatedOutput);

          if (!estimatedOutput || estimatedOutput === '0') {
            console.warn('[Rhea Swap] Invalid estimation result');
            return null;
          }

          // Apply 0.5% slippage for min output
          const minReceived = new Big(estimatedOutput).mul(new Big(0.995)).toFixed(0);

          // Calculate price impact by comparing actual output vs spot price output
          // Use a small reference amount to get the "spot" rate with minimal price impact
          let priceImpact = 0;
          
          try {
            // Use 1 NEAR or 1 USDC as reference for spot price (larger = more accurate rate)
            const spotRefAmount = tokenInId === 'wrap.near' 
              ? new Big(10).pow(24).toString()  // 1 NEAR
              : new Big(10).pow(6).toString();   // 1 USDC
            
            const spotResponse = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: '2',
                method: 'query',
                params: {
                  request_type: 'call_function',
                  account_id: 'dclv2.ref-labs.near',
                  method_name: 'quote',
                  args_base64: Buffer.from(JSON.stringify({
                    pool_ids: [`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100`],
                    input_token: tokenInId,
                    output_token: tokenOutId,
                    input_amount: spotRefAmount
                  })).toString('base64'),
                  finality: 'final'
                }
              })
            });

            if (spotResponse.ok) {
              const spotData = await spotResponse.json();
              if (spotData.result?.result) {
                const spotResult = JSON.parse(Buffer.from(spotData.result.result).toString());
                const spotOutput = spotResult.amount;
                
                if (spotOutput && spotOutput !== '0') {
                  // Calculate spot rate: output per input unit (use high precision)
                  const spotRefBig = new Big(spotRefAmount);
                  const spotOutBig = new Big(spotOutput);
                  const amountInBig = new Big(amountInSmallestUnit);
                  const actualOutBig = new Big(estimatedOutput);
                  
                  // Calculate what we'd get at spot rate for actual input
                  // idealOutput = (spotOutput / spotRefAmount) * amountIn
                  const idealOutput = spotOutBig.mul(amountInBig).div(spotRefBig);
                  
                  // Price impact = (ideal - actual) / ideal * 100
                  if (idealOutput.gt(0)) {
                    const impact = idealOutput.minus(actualOutBig).div(idealOutput).mul(100);
                    priceImpact = impact.toNumber();
                    // Clamp to reasonable range (can be slightly negative due to rounding)
                    priceImpact = Math.max(0, Math.min(priceImpact, 50));
                  }
                  
                  console.warn('[Rhea Swap] Spot ref:', spotRefAmount, '-> output:', spotOutput);
                  console.warn('[Rhea Swap] Ideal output:', idealOutput.toString(), 'Actual:', estimatedOutput);
                  console.warn('[Rhea Swap] Price impact calculated:', priceImpact.toFixed(4) + '%');
                }
              }
            }
          } catch (spotErr) {
            console.warn('[Rhea Swap] Spot price query failed, using 0 impact:', spotErr);
          }

          // Pool fee: The "100" in pool ID represents fee tier in basis points
          // 100 bps = 0.01% fee (100/10000 = 0.01)
          const poolFee = 0.01;

          const highImpact = priceImpact > 3;

          return {
            outputAmount: estimatedOutput,
            minReceived,
            priceImpact,
            highImpact,
            route: [{ pool_id: `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|100` }],
            fee: poolFee,
          };

        } catch (err) {
          console.warn('[Rhea Swap] Estimation failed:', err);
          return null;
        }
      }

      // For other pairs, use the existing estimation logic
      return await estimateSwapOutput(tokenInId, tokenOutId, amountInSmallestUnit);

    } catch (err) {
      console.error('[Proposal Swap] Estimation error:', err);
      return null;
    }
  };

  // Auto-estimate swap output
  useEffect(() => {
    const estimateSwap = async () => {
      if (proposalType !== 'TokenSwap' || !tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) <= 0) {
        setSwapEstimate(null);
        return;
      }

      setIsEstimatingSwap(true);
      try {
        const tokenInInfo = availableTokens.find(t => t.contractId === tokenIn);
        const amountInSmallestUnit = new Big(amountIn).times(new Big(10).pow(tokenInInfo?.decimals ?? 24)).toString();

        // Use proposal-specific estimation for NEAR->USDC and other pairs
        const estimate = await estimateProposalSwap(tokenIn, tokenOut, amountInSmallestUnit);
        setSwapEstimate(estimate);

      } catch (error) {
        console.error('Swap estimation failed:', error);
        setSwapEstimate(null);
      } finally {
        setIsEstimatingSwap(false);
      }
    };

    const timeoutId = setTimeout(() => void estimateSwap(), 500); // Debounce
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalType, tokenIn, tokenOut, amountIn, availableTokens]);

  return {
    swapEstimate,
    isEstimatingSwap,
  };
}