import React from 'react';
import Big from 'big.js';
import Image from 'next/image';
import { Settings } from 'lucide-react';
import { formatDollarAmount } from '../../utils';
import { formatTokenAmount } from '@/lib/swap-utils';
import type { PoolInfo, PoolStats } from '@/types';

interface PoolStatsDisplayProps {
  poolId: number;
  poolInfo: PoolInfo | null;
  poolStats: PoolStats;
  tokenPrices: Record<string, number>;
  hasLoadedPoolStats: boolean;
  onSettingsToggle: () => void;
}

export function PoolStatsDisplay({
  poolId,
  poolInfo,
  poolStats,
  tokenPrices,
  hasLoadedPoolStats,
  onSettingsToggle,
}: PoolStatsDisplayProps) {
  console.warn('[PoolStatsDisplay] Rendering:', { 
    hasLoadedPoolStats, 
    volume24h: poolStats.volume24h,
    fee24h: poolStats.fee24h,
    apy: poolStats.apy
  });
  
  return (
    <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-t-2xl -m-4 sm:-m-6 md:-m-8 mb-4 md:mb-6 shadow-sm">
      <div className="p-4 sm:p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center">
              {poolInfo?.token1.icon ? (
                <Image
                  src={poolInfo.token1.icon}
                  alt={poolInfo.token1.symbol}
                  width={32}
                  height={32}
                  className="rounded-full relative z-10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center relative z-10">
                  <span className="text-primary font-bold text-sm">N</span>
                </div>
              )}
              {poolInfo?.token2.icon ? (
                <Image
                  src={poolInfo.token2.icon}
                  alt={poolInfo.token2.symbol}
                  width={32}
                  height={32}
                  className="rounded-full -ml-1"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-verified/20 flex items-center justify-center -ml-1">
                  <span className="text-verified font-bold text-sm">V</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {poolInfo ? `${poolInfo.token1.symbol} / ${poolInfo.token2.symbol}` : 'NEAR / VEGANFRIENDS'}
              </h3>
              <p className="text-muted-foreground text-xs">Pool #{poolId}</p>
            </div>
          </div>
          <button
            onClick={onSettingsToggle}
            className="p-2 bg-card/50 hover:bg-card border border-border/50 rounded-full transition-all duration-200 hover:shadow-md"
          >
            <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </div>

        {/* Pool Reserves and Stats */}
        {poolInfo && (
          <div className="space-y-2 pt-3 border-t border-border/30">
            {/* Token Reserves */}
            <div className="flex items-center justify-center gap-4 text-sm pb-3 border-b border-border/30">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">NEAR:</span>
                <span
                  className={`font-semibold text-primary transition-opacity ${
                    hasLoadedPoolStats ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  {hasLoadedPoolStats
                    ? formatTokenAmount(poolInfo.reserves[poolInfo.token1.id], poolInfo.token1.decimals, 2)
                    : '-'}
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">VF:</span>
                <span
                  className={`font-semibold text-primary transition-opacity ${
                    hasLoadedPoolStats ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  {hasLoadedPoolStats
                    ? formatTokenAmount(poolInfo.reserves[poolInfo.token2.id], poolInfo.token2.decimals, 2)
                    : '-'}
                </span>
              </div>
            </div>

            {/* TVL, Volume, Fee, APY Grid */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              {/* TVL */}
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">TVL</p>
                <p
                  className={`font-semibold text-primary transition-opacity ${
                    hasLoadedPoolStats ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  {hasLoadedPoolStats
                    ? (() => {
                        const token1Price =
                          tokenPrices[poolInfo.token1.id] ?? tokenPrices.near ?? tokenPrices['wrap.near'] ?? 0;
                        const token2Price = tokenPrices[poolInfo.token2.id] ?? 0;

                        if (token1Price > 0 || token2Price > 0) {
                          const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id]).div(
                            Big(10).pow(poolInfo.token1.decimals)
                          );
                          const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id]).div(
                            Big(10).pow(poolInfo.token2.decimals)
                          );
                          const token1TVL = token1Reserve.mul(token1Price);
                          const token2TVL = token2Reserve.mul(token2Price);
                          const totalTVL = token1TVL.plus(token2TVL).toNumber();

                          return formatDollarAmount(totalTVL);
                        }
                        return '-';
                      })()
                    : '-'}
                </p>
              </div>

              {/* Volume (24h) */}
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Volume</p>
                <p
                  className={`font-semibold text-primary transition-opacity ${
                    hasLoadedPoolStats ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  {hasLoadedPoolStats
                    ? (() => {
                        const vol = Number(poolStats.volume24h);
                        if (vol === 0) return '$0';
                        if (vol < 0.01) return '<$0.01';
                        return formatDollarAmount(vol);
                      })()
                    : '-'}
                </p>
              </div>

              {/* Fee (24h) */}
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Fee(24h)</p>
                <p
                  className={`font-semibold text-primary transition-opacity ${
                    hasLoadedPoolStats ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  {hasLoadedPoolStats
                    ? (() => {
                        const fee = Number(poolStats.fee24h);
                        if (fee === 0) return '$0';
                        if (fee < 0.01) return '<$0.01';
                        return formatDollarAmount(fee);
                      })()
                    : '-'}
                </p>
              </div>

              {/* APY */}
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">APY</p>
                <p
                  className={`font-semibold text-primary transition-opacity ${
                    hasLoadedPoolStats ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  {hasLoadedPoolStats
                    ? (() => {
                        if (poolStats.apy === 0) return '0%';
                        if (poolStats.apy < 0.01) return '<0.01%';
                        return `${poolStats.apy.toFixed(2)}%`;
                      })()
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
