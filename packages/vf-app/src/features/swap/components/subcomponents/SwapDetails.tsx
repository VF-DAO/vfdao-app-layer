'use client';

import React, { useMemo } from 'react';
import Big from 'big.js';
import { toInternationalCurrencySystemLongString } from '@ref-finance/ref-sdk';
import type { SwapEstimate, TokenMetadata } from '@/types';
import { formatTokenAmount } from '@/lib/swap-utils';

interface SwapDetailsProps {
  tokenIn: TokenMetadata | undefined;
  tokenOut: TokenMetadata | undefined;
  amountIn: string;
  rawEstimatedOut: string;
  currentEstimate: SwapEstimate | undefined;
  slippage: number;
  isRateReversed: boolean;
  onToggleRate: () => void;
  tokenPrices: Record<string, { price: string; symbol?: string; decimal?: number }>;
  formatDollarAmount: (amount: number) => React.ReactNode;
  accountId: string | null;
}

export const SwapDetails: React.FC<SwapDetailsProps> = ({
  tokenIn,
  tokenOut,
  amountIn,
  rawEstimatedOut,
  currentEstimate,
  slippage,
  isRateReversed,
  onToggleRate,
  tokenPrices,
  formatDollarAmount,
  accountId,
}) => {
  const exchangeRate = useMemo(() => {
    try {
      const fromAmount = parseFloat(amountIn);
      const toAmount = parseFloat(rawEstimatedOut) / Math.pow(10, tokenOut?.decimals ?? 18);

      let rate = toAmount / fromAmount;

      if (isRateReversed) {
        rate = 1 / rate;
      }

      return new Big(rate).toString();
    } catch {
      return '-';
    }
  }, [amountIn, rawEstimatedOut, isRateReversed, tokenOut]);

  const formattedExchangeRate = useMemo(() => {
    if (exchangeRate === '-') {
      return <span>{exchangeRate}</span>;
    }
    try {
      const bigValue = new Big(exchangeRate);
      const numValue = bigValue.toNumber();
      if (numValue >= 0.0001) {
        return <span>{toInternationalCurrencySystemLongString(bigValue.toString(), 4)}</span>;
      } else {
        const fixedStr = bigValue.toFixed(20);
        const decimalPart = fixedStr.split('.')[1] ?? '';
        const firstNonZeroIndex = decimalPart.search(/[1-9]/);
        if (firstNonZeroIndex === -1) {
          return <span>0.0000</span>;
        }
        const zerosCount = firstNonZeroIndex;
        const significantDigits = decimalPart.slice(firstNonZeroIndex, firstNonZeroIndex + 4);
        return (
          <span>
            0.0<span className="text-primary text-[10px]">{zerosCount}</span>{significantDigits}
          </span>
        );
      }
    } catch {
      return <span>-</span>;
    }
  }, [exchangeRate]);

  if (!accountId || !currentEstimate) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg space-y-3 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex justify-between">
        <span className="text-muted-foreground text-xs">Rate</span>
        <button
          onClick={onToggleRate}
          className={`text-right cursor-pointer transition-colors ${
            !tokenIn || !tokenOut || exchangeRate === '-' || exchangeRate === '0'
              ? 'text-primary opacity-60 font-medium'
              : 'font-medium hover:text-primary'
          }`}
        >
          {(() => {
            if (!tokenIn || !tokenOut) return null;
            const fromToken = isRateReversed ? tokenOut : tokenIn;
            const toToken = isRateReversed ? tokenIn : tokenOut;
            const fromPrice = tokenPrices[fromToken.id]?.price;

            return (
              <>
                <span>1 {fromToken.symbol}</span>
                {fromPrice && <span className="text-muted-foreground"> ({formatDollarAmount(parseFloat(String(fromPrice)))})</span>}
                <span> ≈ </span>
                {formattedExchangeRate}
                <span> {toToken.symbol}</span>
              </>
            );
          })()}
        </button>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-xs">Price Impact</span>
        <span
          className={`font-medium text-xs ${
            !currentEstimate?.priceImpact
              ? 'text-primary opacity-60'
              : currentEstimate.priceImpact > 5
                ? 'text-destructive'
                : currentEstimate.priceImpact > 2
                  ? 'text-verified'
                  : 'text-primary'
          }`}
        >
          {!currentEstimate?.priceImpact
            ? '0.00%'
            : currentEstimate.priceImpact > 0.01
              ? `${currentEstimate.priceImpact.toFixed(2)}%`
              : '< 0.01%'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-xs">Slippage Tolerance</span>
        <span className="font-medium text-xs">{slippage}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-xs">Minimum Received</span>
        <span className={`font-medium text-xs ${
          !currentEstimate?.minReceived ? 'text-primary opacity-60' : ''
        }`}>
          {(!currentEstimate?.minReceived
            ? '0.0'
            : `${formatTokenAmount(currentEstimate?.minReceived ?? '0', tokenOut?.decimals ?? 18, 4)} ${tokenOut?.symbol ?? ''}`
          )}
        </span>
      </div>
    </div>
  );
};
