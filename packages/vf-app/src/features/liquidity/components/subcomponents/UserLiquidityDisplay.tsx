import React from 'react';
import Big from 'big.js';
import Image from 'next/image';
import { calculateRemoveLiquidityAmountsFromContract, formatDollarAmount } from '../../utils';
import { formatTokenAmount, parseTokenAmount } from '@/lib/swap-utils';
import type { PoolInfo } from '@/types';

interface UserLiquidityDisplayProps {
  poolInfo: PoolInfo;
  userShares: string;
  tokenPrices: Record<string, number>;
}

export function UserLiquidityDisplay({ poolInfo, userShares, tokenPrices }: UserLiquidityDisplayProps) {
  // Calculate percentage of pool owned
  const poolPercentage = (() => {
    const userSharesBig = Big(userShares);
    const totalSharesBig = Big(poolInfo.shareSupply ?? '0');

    if (totalSharesBig.gt(0)) {
      const percentage = userSharesBig.div(totalSharesBig).mul(100);
      const percentageValue = percentage.toNumber();

      if (percentageValue < 0.01) {
        return '(< 0.01%)';
      } else {
        return `(${percentageValue.toFixed(2)}%)`;
      }
    }

    return '';
  })();

  // Calculate USD value of LP tokens
  const usdValue = (() => {
    let usdDisplay = '$0.00';
    let token1Price = tokenPrices[poolInfo.token1.id] ?? tokenPrices.near ?? 0;
    let token2Price = tokenPrices[poolInfo.token2.id] ?? 0;

    // If one token price is missing, derive it from pool ratio (AMM formula)
    if (token1Price > 0 && token2Price === 0) {
      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id]).div(Big(10).pow(poolInfo.token1.decimals));
      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id]).div(Big(10).pow(poolInfo.token2.decimals));
      token2Price = token1Reserve.div(token2Reserve).mul(token1Price).toNumber();
    } else if (token2Price > 0 && token1Price === 0) {
      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id]).div(Big(10).pow(poolInfo.token1.decimals));
      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id]).div(Big(10).pow(poolInfo.token2.decimals));
      token1Price = token2Reserve.div(token1Reserve).mul(token2Price).toNumber();
    }

    // Show USD value if at least one token has a price
    if (token1Price > 0 || token2Price > 0) {
      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id]).div(Big(10).pow(poolInfo.token1.decimals));
      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id]).div(Big(10).pow(poolInfo.token2.decimals));

      const token1TVL = token1Reserve.mul(token1Price);
      const token2TVL = token2Reserve.mul(token2Price);
      const poolTVL = token1TVL.plus(token2TVL);

      const readableShares = Big(userShares).div(Big(10).pow(24));
      const totalShares = Big(poolInfo.shareSupply).div(Big(10).pow(24));
      const singleLpValue = poolTVL.div(totalShares);
      const totalUsdValue = singleLpValue.mul(readableShares).toNumber();

      if (totalUsdValue < 0.01 && totalUsdValue > 0) {
        usdDisplay = '< $0.01';
      } else if (totalUsdValue > 0) {
        usdDisplay = `$${totalUsdValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
    }

    return usdDisplay;
  })();

  // Calculate token amounts
  const amounts = calculateRemoveLiquidityAmountsFromContract(userShares, poolInfo);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-lg space-y-3 text-xs">
      {/* Header with total shares and percentage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">Your Liquidity</p>
          <span className="text-sm text-muted-foreground">{poolPercentage}</span>
        </div>
        <div className="text-sm font-medium text-foreground">
          {formatTokenAmount(userShares, 24, 6)}
          <span className="text-muted-foreground ml-1">({usdValue})</span>
        </div>
      </div>

      {/* Token breakdown */}
      <div className="space-y-2">
        {/* Token 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {poolInfo.token1.icon ? (
              <Image
                src={poolInfo.token1.icon}
                alt={poolInfo.token1.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 bg-gradient-to-br from-verified/20 to-verified/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-verified">N</span>
              </div>
            )}
            <span className="text-muted-foreground text-xs">{poolInfo.token1.symbol}</span>
          </div>
          <div className="text-right">
            <span className="font-medium text-xs">
              {amounts.token1Amount}
              {tokenPrices[poolInfo.token1.id] && (
                <span className="text-xs text-muted-foreground ml-1">
                  (
                  {formatDollarAmount(
                    parseFloat(amounts.token1Amount) *
                      (tokenPrices[poolInfo.token1.id] ?? tokenPrices.near ?? tokenPrices['wrap.near'] ?? 0)
                  )}
                  )
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Token 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {poolInfo.token2.icon ? (
              <Image
                src={poolInfo.token2.icon}
                alt={poolInfo.token2.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">V</span>
              </div>
            )}
            <span className="text-muted-foreground text-xs">{poolInfo.token2.symbol}</span>
          </div>
          <div className="text-right">
            <span className="font-medium text-xs">
              {formatTokenAmount(parseTokenAmount(amounts.token2Amount, poolInfo.token2.decimals), poolInfo.token2.decimals, 2)}
              {tokenPrices[poolInfo.token2.id] && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({formatDollarAmount(parseFloat(amounts.token2Amount) * tokenPrices[poolInfo.token2.id])})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
