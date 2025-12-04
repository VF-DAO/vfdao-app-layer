'use client';

import React from 'react';
import Image from 'next/image';
import Big from 'big.js';
import { ChevronLeft, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { expandVariants, transitions } from '@/lib/animations';
import { LoadingDots } from '@/components/ui/loading-dots';
import { toInternationalCurrencySystemLongString } from '@ref-finance/ref-sdk';
import { TokenInput } from '@/features/swap/components/TokenInput';
import { Button } from '@/components/ui/button';
import { formatTokenAmount } from '@/lib/swap-utils';
import type { PoolInfo } from '@/types';

interface AddLiquidityFormProps {
  poolInfo: PoolInfo;
  accountId: string | null;
  token1Amount: string;
  token2Amount: string;
  slippage: number;
  showGasReserveInfo: boolean;
  showGasReserveMessage: boolean;
  transactionState: 'success' | 'fail' | 'cancelled' | 'waitingForConfirmation' | null;
  rawBalances: Record<string, string>;
  isLoadingBalances: boolean;
  isLoadingPool: boolean;
  tokenPrices: Record<string, number>;
  onToken1AmountChange: (amount: string) => void;
  onToken2AmountChange: (amount: string) => void;
  onToken1PercentClick: (percent: number) => void;
  onToken1MaxClick: () => void;
  onToken2PercentClick: (percent: number) => void;
  onToken2MaxClick: () => void;
  onCancel: () => void;
  onAddLiquidity: () => void;
  formatDollarAmount: (amount: number) => string | React.ReactElement;
}

export const AddLiquidityForm: React.FC<AddLiquidityFormProps> = ({
  poolInfo,
  accountId,
  token1Amount,
  token2Amount,
  slippage,
  showGasReserveInfo,
  showGasReserveMessage,
  transactionState,
  rawBalances,
  isLoadingBalances,
  isLoadingPool,
  tokenPrices,
  onToken1AmountChange,
  onToken2AmountChange,
  onToken1PercentClick,
  onToken1MaxClick,
  onToken2PercentClick,
  onToken2MaxClick,
  onCancel,
  onAddLiquidity,
  formatDollarAmount,
}) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-main-card mt-4">
      <div className="space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group p-2 rounded-md"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </button>
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-bold text-primary">Add Liquidity</h4>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>

        {/* Token 1 Input */}
        <div className="space-y-2">
          <AnimatePresence>
            {!!(accountId && rawBalances[poolInfo.token1.id] && rawBalances[poolInfo.token1.id] !== '0') && (
              <motion.div
                variants={expandVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={transitions.slow}
                className="overflow-hidden"
              >
                <div className="flex gap-2 justify-end">
                  {[25, 50, 75].map((percent) => (
                    <Button
                      key={percent}
                      onClick={() => onToken1PercentClick(percent)}
                      variant="percentage"
                      size="xs"
                    >
                      {percent}%
                    </Button>
                  ))}
                  <Button
                    onClick={onToken1MaxClick}
                    variant="percentage"
                    size="xs"
                  >
                    MAX
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-0 p-4 border border-border rounded-full transition-all hover:border-muted-foreground/50 hover:shadow-interactive">
            <div className="flex flex-col items-start w-[200px]">
              <div className="flex items-center gap-2">
                {poolInfo.token1.icon ? (
                  <Image 
                    src={poolInfo.token1.icon} 
                    alt={poolInfo.token1.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-verified/20 to-verified/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-verified">N</span>
                  </div>
                )}
                <span className="font-semibold text-foreground text-sm">{poolInfo.token1.symbol}</span>
              </div>
              {accountId && (
                <div className="flex flex-col items-start mt-1 ml-8">
                  <span className="text-xs text-muted-foreground">
                    Balance: {isLoadingBalances ? <LoadingDots size="xs" /> : (() => {
                      const rawBalance = rawBalances[poolInfo.token1.id];
                      if (!rawBalance || rawBalance === '0') return '0';
                      return formatTokenAmount(rawBalance, poolInfo.token1.decimals, 6);
                    })()}
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
                decimalLimit={poolInfo.token1.decimals}
              />
              {!!(token1Amount) && (() => {
                const price = tokenPrices[poolInfo.token1.id] ?? tokenPrices.near ?? tokenPrices['wrap.near'];
                if (!price) return null;
                const usdValue = parseFloat(token1Amount) * price;
                return (
                  <div className="absolute top-8 right-4 text-xs text-muted-foreground">
                    ≈ {formatDollarAmount(usdValue)}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Token 2 Input */}
        <div className="space-y-2">
          <AnimatePresence>
            {!!(accountId && rawBalances[poolInfo.token2.id] && rawBalances[poolInfo.token2.id] !== '0') && (
              <motion.div
                variants={expandVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={transitions.slow}
                className="overflow-hidden"
              >
                <div className="flex gap-2 justify-end">
                  {[25, 50, 75].map((percent) => (
                    <Button
                      key={percent}
                      onClick={() => onToken2PercentClick(percent)}
                      variant="percentage"
                      size="xs"
                    >
                      {percent}%
                    </Button>
                  ))}
                  <Button
                    onClick={onToken2MaxClick}
                    variant="percentage"
                    size="xs"
                  >
                    MAX
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-0 p-4 border border-border rounded-full transition-all hover:border-muted-foreground/50 hover:shadow-interactive">
            <div className="flex flex-col items-start w-[200px]">
              <div className="flex items-center gap-2">
                {poolInfo.token2.icon ? (
                  <Image 
                    src={poolInfo.token2.icon} 
                    alt={poolInfo.token2.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">V</span>
                  </div>
                )}
                <span className="font-semibold text-foreground text-sm">{poolInfo.token2.symbol}</span>
              </div>
              {accountId && (
                <div className="flex flex-col items-start mt-1 ml-8">
                  <span className="text-xs text-muted-foreground">
                    Balance: {isLoadingBalances ? <LoadingDots size="xs" /> : (() => {
                      const rawBalance = rawBalances[poolInfo.token2.id];
                      if (!rawBalance || rawBalance === '0') return '0';
                      return formatTokenAmount(rawBalance, poolInfo.token2.decimals, 6);
                    })()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <TokenInput
                value={token2Amount}
                onChange={onToken2AmountChange}
                placeholder="0.0"
                disabled={!accountId}
                decimalLimit={poolInfo.token2.decimals}
              />
              {!!(token2Amount && tokenPrices[poolInfo.token2.id]) && (() => {
                const price = tokenPrices[poolInfo.token2.id];
                return (
                  <div className="absolute top-8 right-4 text-xs text-muted-foreground">
                    ≈ {formatDollarAmount(parseFloat(token2Amount) * price)}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Preview: You will add */}
        <AnimatePresence>
          {!!(token1Amount && token2Amount && parseFloat(token1Amount) > 0 && parseFloat(token2Amount) > 0) && (
            <motion.div
              variants={expandVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transitions.slow}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2 text-xs">
                <p className="text-sm font-medium text-foreground mb-2">You will add:</p>
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
                        const num = parseFloat(token1Amount);
                        return num >= 1000 
                          ? toInternationalCurrencySystemLongString(token1Amount, 2)
                          : token1Amount;
                      })()}
                      {tokenPrices[poolInfo.token1.id] && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatDollarAmount(parseFloat(token1Amount) * (tokenPrices[poolInfo.token1.id] ?? tokenPrices.near ?? tokenPrices['wrap.near'] ?? 0))})
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
                        const num = parseFloat(token2Amount);
                        return num >= 1000 
                          ? toInternationalCurrencySystemLongString(token2Amount, 2)
                          : token2Amount;
                      })()}
                      {tokenPrices[poolInfo.token2.id] && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatDollarAmount(parseFloat(token2Amount) * tokenPrices[poolInfo.token2.id])})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {/* Minimum LP Shares */}
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Min LP Received</span>
                    <span className="font-medium text-xs">
                      {(() => {
                        try {
                          // Calculate expected LP shares
                          const amount1Raw = Big(token1Amount).mul(Big(10).pow(poolInfo.token1.decimals));
                          const amount2Raw = Big(token2Amount).mul(Big(10).pow(poolInfo.token2.decimals));
                          const reserve1 = Big(poolInfo.reserves[poolInfo.token1.id] || '0');
                          const reserve2 = Big(poolInfo.reserves[poolInfo.token2.id] || '0');
                          const totalShares = Big(poolInfo.shareSupply || '0');
                          
                          let expectedShares: Big;
                          
                          // If pool is empty (first liquidity provider)
                          if (totalShares.eq(0) || reserve1.eq(0) || reserve2.eq(0)) {
                            // shares = sqrt(amount1 * amount2)
                            expectedShares = amount1Raw.mul(amount2Raw).sqrt();
                          } else {
                            // shares = min(amount1/reserve1, amount2/reserve2) * totalShares
                            const shares1 = amount1Raw.mul(totalShares).div(reserve1);
                            const shares2 = amount2Raw.mul(totalShares).div(reserve2);
                            expectedShares = shares1.lt(shares2) ? shares1 : shares2;
                          }
                          
                          // Apply slippage tolerance (default 0.5%)
                          const minShares = expectedShares.mul(1 - slippage / 100);
                          
                          // Convert to readable format
                          const minSharesDisplay = minShares.div(Big(10).pow(24)).toFixed(6, Big.roundDown);
                          
                          // Calculate USD value based on pool TVL
                          let usdValue = null;
                          const token1Price = tokenPrices[poolInfo.token1.id] ?? tokenPrices.near ?? tokenPrices['wrap.near'] ?? 0;
                          const token2Price = tokenPrices[poolInfo.token2.id] ?? 0;
                          
                          if (token1Price > 0 || token2Price > 0) {
                            const token1Reserve = Big(reserve1).div(Big(10).pow(poolInfo.token1.decimals));
                            const token2Reserve = Big(reserve2).div(Big(10).pow(poolInfo.token2.decimals));
                            
                            const token1TVL = token1Reserve.mul(token1Price);
                            const token2TVL = token2Reserve.mul(token2Price);
                            const poolTVL = token1TVL.plus(token2TVL);
                            
                            const readableShares = minShares.div(Big(10).pow(24));
                            const readableTotalShares = totalShares.div(Big(10).pow(24));
                            
                            if (readableTotalShares.gt(0)) {
                              const singleLpValue = poolTVL.div(readableTotalShares);
                              const totalUsdValue = singleLpValue.mul(readableShares).toNumber();
                              usdValue = formatDollarAmount(totalUsdValue);
                            }
                          }
                          
                          return (
                            <>
                              {minSharesDisplay}
                              {usdValue && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({usdValue})
                                </span>
                              )}
                            </>
                          );
                        } catch (error) {
                          console.error('Error calculating min LP shares:', error);
                          return '0';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gas Reserve Info */}
        <AnimatePresence>
          {!!(showGasReserveMessage && accountId) && (
            <motion.div
              variants={expandVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transitions.slow}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 p-2 bg-primary/10 rounded-full">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Keeping 0.25 NEAR in your wallet for gas fees
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onCancel}
            disabled={transactionState === 'waitingForConfirmation'}
            variant="muted"
            className="flex-1 h-12"
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
            onClick={onAddLiquidity}
            disabled={
              !accountId || 
              !token1Amount || 
              !token2Amount || 
              transactionState === 'waitingForConfirmation' || 
              isLoadingPool || 
              !!showGasReserveInfo ||
              // Check if token1 amount exceeds balance
              !!(poolInfo && token1Amount && rawBalances[poolInfo.token1.id] && 
                Big(token1Amount).times(Big(10).pow(poolInfo.token1.decimals)).gt(Big(rawBalances[poolInfo.token1.id]))) ||
              // Check if token2 amount exceeds balance
              !!(poolInfo && token2Amount && rawBalances[poolInfo.token2.id] && 
                Big(token2Amount).times(Big(10).pow(poolInfo.token2.decimals)).gt(Big(rawBalances[poolInfo.token2.id]))) ||
              // Check minimum NEAR balance
              !!(poolInfo && (poolInfo.token1.id === 'near' || poolInfo.token1.id === 'wrap.near') && 
                rawBalances.near && Big(rawBalances.near).lt(Big('250000000000000000000000')))
            }
            variant="verified"
            className="flex-1 h-12"
          >
            <span className="inline-flex items-center justify-center min-h-[20px]">
              {transactionState === 'waitingForConfirmation' ? (
                <LoadingDots />
              ) : showGasReserveInfo ? (
                'Need 0.25N for gas'
              ) : (poolInfo && token1Amount && rawBalances[poolInfo.token1.id] && 
                  Big(token1Amount).times(Big(10).pow(poolInfo.token1.decimals)).gt(Big(rawBalances[poolInfo.token1.id]))) ? (
                'Insufficient Funds'
              ) : (poolInfo && token2Amount && rawBalances[poolInfo.token2.id] && 
                  Big(token2Amount).times(Big(10).pow(poolInfo.token2.decimals)).gt(Big(rawBalances[poolInfo.token2.id]))) ? (
                'Insufficient Funds'
              ) : (
                'Add Liquidity'
              )}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
