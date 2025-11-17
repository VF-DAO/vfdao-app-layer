import { useCallback } from 'react';
import Big from 'big.js';
import { formatTokenAmountNoAbbrev, parseTokenAmount } from '@/lib/swap-utils';
import type { PoolInfo } from '@/types';

export interface UseLiquidityCalculationsReturn {
  calculateOptimalAmount: (inputAmount: string, inputTokenId: string) => string;
  calculateRemoveLiquidityAmounts: (sharesAmount: string) => { token1Amount: string; token2Amount: string };
  formatDollarAmount: (amount: number) => string;
}

export function useLiquidityCalculations(poolInfo: PoolInfo | null): UseLiquidityCalculationsReturn {
  const calculateOptimalAmount = useCallback((inputAmount: string, inputTokenId: string) => {
    if (!poolInfo || !inputAmount) return '';

    // Convert input amount to contract units
    const inputToken = inputTokenId === poolInfo.token1.id ? poolInfo.token1 : poolInfo.token2;
    const inputAmountContract = parseTokenAmount(inputAmount, inputToken.decimals);

    const inputReserve = Big(poolInfo.reserves[inputTokenId]);
    const outputReserve = Big(poolInfo.reserves[inputTokenId === poolInfo.token1.id ? poolInfo.token2.id : poolInfo.token1.id]);

    // For liquidity provision, provide tokens in the exact ratio of current reserves
    // Formula: optimalAmount = (inputAmount * outputReserve) / inputReserve
    const optimalOutputContract = Big(inputAmountContract).mul(outputReserve).div(inputReserve);

    // Convert back to display units
    const outputToken = inputTokenId === poolInfo.token1.id ? poolInfo.token2 : poolInfo.token1;
    const optimalOutputDisplay = formatTokenAmountNoAbbrev(
      optimalOutputContract.toFixed(0), 
      outputToken.decimals, 
      6
    );

    return optimalOutputDisplay;
  }, [poolInfo]);

  const calculateRemoveLiquidityAmounts = useCallback((sharesAmount: string) => {
    if (!poolInfo || !sharesAmount || sharesAmount === '0') {
      return { token1Amount: '0', token2Amount: '0' };
    }

    try {
      // Parse shares amount to contract units (24 decimals for LP tokens)
      const sharesContract = parseTokenAmount(sharesAmount, 24);
      
      const shareSupplyStr = String(poolInfo.shareSupply ?? '0');
      
      if (shareSupplyStr === '0' || shareSupplyStr === '') {
        console.error('[calculateRemoveLiquidityAmounts] Pool has zero shareSupply!');
        return { token1Amount: '0', token2Amount: '0' };
      }
      
      const totalShares = Big(shareSupplyStr);

      // Calculate proportional share of each reserve
      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id] ?? '0');
      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id] ?? '0');

      const token1Contract = Big(sharesContract).mul(token1Reserve).div(totalShares);
      const token2Contract = Big(sharesContract).mul(token2Reserve).div(totalShares);

      // Convert to display units
      const token1Display = Big(token1Contract.toFixed(0)).div(Big(10).pow(poolInfo.token1.decimals)).toFixed(6, 0);
      const token2Display = Big(token2Contract.toFixed(0)).div(Big(10).pow(poolInfo.token2.decimals)).toFixed(6, 0);

      return {
        token1Amount: token1Display,
        token2Amount: token2Display,
      };
    } catch (error) {
      console.error('[LiquidityCalculations] Error calculating remove amounts:', error);
      return { token1Amount: '0', token2Amount: '0' };
    }
  }, [poolInfo]);

  const formatDollarAmount = useCallback((amount: number): string => {
    try {
      if (amount === 0) return '$0.00';
      if (amount >= 0.01) {
        return `$${amount.toFixed(2)}`;
      } else {
        // For very small amounts, return simplified format
        return `$${amount.toFixed(8)}`;
      }
    } catch {
      return '$0.00';
    }
  }, []);

  return {
    calculateOptimalAmount,
    calculateRemoveLiquidityAmounts,
    formatDollarAmount,
  };
}
