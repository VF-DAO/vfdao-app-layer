'use client';

import React from 'react';
import Image from 'next/image';
import Big from 'big.js';
import { ChevronLeft } from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';
import { toInternationalCurrencySystemLongString } from '@ref-finance/ref-sdk';
import { TokenInput } from '@/features/swap/components/TokenInput';
import { Button } from '@/components/ui/button';
import { formatTokenAmount } from '@/lib/swap-utils';
import type { PoolInfo } from '@/types';

interface RemoveLiquidityFormProps {
  poolInfo: PoolInfo;
  accountId: string | null;
  token1Amount: string;
  userShares: string;
  transactionState: 'success' | 'fail' | 'cancelled' | 'waitingForConfirmation' | null;
  tokenPrices: Record<string, number>;
  onToken1AmountChange: (amount: string) => void;
  onSharesPercentClick: (percent: number) => void;
  onSharesMaxClick: () => void;
  onCancel: () => void;
  onRemoveLiquidity: () => void;
  calculateRemoveLiquidityAmounts: (sharesAmount: string) => { token1Amount: string; token2Amount: string };
  formatDollarAmount: (amount: number) => string | React.ReactElement;
}

export const RemoveLiquidityForm: React.FC<RemoveLiquidityFormProps> = ({
  poolInfo,
  accountId,
  token1Amount,
  userShares,
  transactionState,
  tokenPrices,
  onToken1AmountChange,
  onSharesPercentClick,
  onSharesMaxClick,
  onCancel,
  onRemoveLiquidity,
  calculateRemoveLiquidityAmounts,
  formatDollarAmount,
}) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-lg mt-4">
      <div className="space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group p-2 rounded-md"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </button>
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-bold text-primary">Remove Liquidity</h4>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>

        {/* Share Amount Input */}
        <div className="space-y-2">
          {!!(accountId && userShares && userShares !== '0') && (
            <div className="flex gap-2 justify-end animate-in fade-in slide-in-from-top-1 duration-200">
              {[25, 50, 75].map((percent) => (
                <Button
                  key={percent}
                  onClick={() => onSharesPercentClick(percent)}
                  variant="percentage"
                  size="xs"
                >
                  {percent}%
                </Button>
              ))}
              <Button
                onClick={onSharesMaxClick}
                variant="percentage"
                size="xs"
              >
                MAX
              </Button>
            </div>
          )}
          <div className="flex items-center gap-0 p-4 border border-border rounded-full transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="flex flex-col items-start w-[200px]">
              <span className="font-semibold text-foreground text-sm">LP Shares</span>
              {accountId && (
                <div className="flex flex-col items-start mt-1">
                  <span className="text-xs text-muted-foreground">
                    Balance: {formatTokenAmount(userShares, 24, 6)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <TokenInput
                value={token1Amount}
                onChange={onToken1AmountChange}
                placeholder="0.0"
                disabled={!accountId}
                decimalLimit={24}
              />
              {token1Amount && poolInfo && (() => {
                const token1Price = tokenPrices[poolInfo.token1.id] ?? tokenPrices.near ?? tokenPrices['wrap.near'] ?? 0;
                const token2Price = tokenPrices[poolInfo.token2.id] ?? 0;
                
                if (token1Price > 0 || token2Price > 0) {
                  const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id]).div(Big(10).pow(poolInfo.token1.decimals));
                  const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id]).div(Big(10).pow(poolInfo.token2.decimals));
                  const token1TVL = token1Reserve.mul(token1Price);
                  const token2TVL = token2Reserve.mul(token2Price);
                  const totalTVL = token1TVL.plus(token2TVL);
                  
                  // Calculate LP shares value: (lpAmount / totalShares) * TVL
                  const lpAmountNum = Big(token1Amount).mul(Big(10).pow(24));
                  const totalSharesNum = Big(poolInfo.shareSupply);
                  const lpValue = totalSharesNum.gt(0) ? lpAmountNum.mul(totalTVL).div(totalSharesNum) : Big(0);
                  
                  return (
                    <div className="absolute top-8 right-4 text-xs text-muted-foreground">
                      ≈ {formatDollarAmount(lpValue.toNumber())}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* Show token amounts user will receive */}
        {!!(token1Amount && parseFloat(token1Amount) > 0) && (() => {
          const amounts = calculateRemoveLiquidityAmounts(token1Amount);
          return (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-lg space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm font-medium text-foreground mb-2">You will receive:</p>
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
                    {(() => {
                      const num = parseFloat(amounts.token1Amount);
                      return num >= 1000 
                        ? toInternationalCurrencySystemLongString(amounts.token1Amount, 2)
                        : amounts.token1Amount;
                    })()}
                    {tokenPrices[poolInfo.token1.id] && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatDollarAmount(parseFloat(amounts.token1Amount) * (tokenPrices[poolInfo.token1.id] ?? tokenPrices.near ?? tokenPrices['wrap.near'] ?? 0))})
                      </span>
                    )}
                  </span>
                </div>
              </div>
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
                    {(() => {
                      const num = parseFloat(amounts.token2Amount);
                      return num >= 1000 
                        ? toInternationalCurrencySystemLongString(amounts.token2Amount, 2)
                        : amounts.token2Amount;
                    })()}
                    {tokenPrices[poolInfo.token2.id] && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatDollarAmount(parseFloat(amounts.token2Amount) * tokenPrices[poolInfo.token2.id])})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onCancel}
            disabled={transactionState === 'waitingForConfirmation'}
            variant="outline"
            className="flex-1 py-2 min-h-[40px]"
          >
            <span className="inline-flex items-center justify-center min-h-[20px]">
              {transactionState === 'waitingForConfirmation' ? (
                <LoadingDots />
              ) : (
                'Cancel'
              )}
            </span>
          </Button>
          <Button
            onClick={onRemoveLiquidity}
            disabled={
              !accountId || 
              !token1Amount || 
              transactionState === 'waitingForConfirmation' ||
              // Check if user has enough shares
              !!(userShares && token1Amount && Big(token1Amount).gt(Big(userShares)))
            }
            variant="secondary"
            className="flex-1 min-h-[40px]"
          >
            <span className="inline-flex items-center justify-center min-h-[20px]">
              {transactionState === 'waitingForConfirmation' ? (
                <LoadingDots />
              ) : (userShares && token1Amount && Big(token1Amount).gt(Big(userShares))) ? (
                'Insufficient Shares'
              ) : (
                'Remove Liquidity'
              )}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
