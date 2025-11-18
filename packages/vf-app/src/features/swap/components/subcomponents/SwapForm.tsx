'use client';

import React from 'react';
import Big from 'big.js';
import { TokenSelect } from '../TokenSelect';
import { TokenInput } from '../TokenInput';
import type { TokenMetadata } from '@/types';
import { ArrowDownUp } from 'lucide-react';

interface SwapFormProps {
  // Tokens
  tokenIn: TokenMetadata | undefined;
  tokenOut: TokenMetadata | undefined;
  availableTokens: TokenMetadata[];
  onTokenInChange: (token: TokenMetadata | undefined) => void;
  onTokenOutChange: (token: TokenMetadata | undefined) => void;
  
  // Amounts
  amountIn: string;
  estimatedOutDisplay: string;
  onAmountInChange: (value: string) => void;
  
  // Balances
  accountId: string | null;
  balances: Record<string, string>;
  rawBalances: Record<string, string>;
  isLoadingBalances: boolean;
  
  // Token prices
  tokenPrices: Record<string, { price: string; symbol?: string; decimal?: number }>;
  
  // Actions
  onSwapTokens: () => void;
  onAmountFromBalance: (rawBalance: string, percent: number, decimals: number, isNear: boolean) => void;
  onMaxAmount: (rawBalance: string, decimals: number, isNear: boolean) => void;
  
  // Gas reserve
  onGasReserveCheck: (show: boolean) => void;
  onGasReserveMessageChange: (show: boolean) => void;
  
  // Validation
  isValidNumber: (value: string) => boolean;
  
  // Format helpers
  formatDollarAmount: (amount: number) => React.ReactNode;
}

export const SwapForm: React.FC<SwapFormProps> = ({
  tokenIn,
  tokenOut,
  availableTokens,
  onTokenInChange,
  onTokenOutChange,
  amountIn,
  estimatedOutDisplay,
  onAmountInChange,
  accountId,
  balances,
  rawBalances,
  isLoadingBalances,
  tokenPrices,
  onSwapTokens,
  onAmountFromBalance,
  onMaxAmount,
  onGasReserveCheck,
  onGasReserveMessageChange,
  isValidNumber,
  formatDollarAmount,
}) => {
  return (
    <div className="relative">
      {/* Token In */}
      <div className="w-full space-y-1">
        {!!(accountId && tokenIn && rawBalances[tokenIn.id] && rawBalances[tokenIn.id] !== '0') && (
          <div className="flex items-center justify-end gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {[25, 50, 75].map((percent) => (
              <button
                key={percent}
                onClick={() => {
                  const rawBalance = rawBalances[tokenIn.id];
                  if (rawBalance) {
                    const isNear = tokenIn.id === 'wrap.near' || tokenIn.id === 'near';
                    onAmountFromBalance(rawBalance, percent, tokenIn.decimals, isNear);
                  }
                }}
                className="px-1 py-0.5 text-xs bg-card hover:bg-muted rounded-full border border-border text-primary font-semibold opacity-70 hover:opacity-80 transition-all whitespace-nowrap"
              >
                {percent}%
              </button>
            ))}
            <button
              onClick={() => {
                const rawBalance = rawBalances[tokenIn.id];
                if (rawBalance) {
                  const isNear = tokenIn.id === 'wrap.near' || tokenIn.id === 'near';
                  onMaxAmount(rawBalance, tokenIn.decimals, isNear);
                }
              }}
              className="px-1 py-0.5 text-xs bg-card hover:bg-muted rounded-full border border-border text-primary font-semibold opacity-70 hover:opacity-80 transition-all whitespace-nowrap"
            >
              MAX
            </button>
          </div>
        )}
        <div className="flex items-center gap-0 p-4 border border-border rounded-full transition-all hover:border-primary/50 hover:shadow-lg">
          <div className="flex flex-col items-start w-[200px]">
            <TokenSelect
              selectedToken={tokenIn}
              onSelectToken={onTokenInChange}
              otherToken={tokenOut}
              label="Select"
              tokens={availableTokens}
            />
            {accountId && tokenIn && (
              <div className="flex flex-col items-start mt-1 ml-3">
                <span className="text-xs text-muted-foreground">
                  Balance: {isLoadingBalances ? '...' : balances[tokenIn.id] ?? '0'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <TokenInput
              value={amountIn}
              onChange={(value) => {
                onAmountInChange(value);
                onGasReserveMessageChange(false);
                
                // Check if we need to show gas reserve warning
                if (tokenIn && (tokenIn.id === 'wrap.near' || tokenIn.id === 'near') && value && isValidNumber(value) && rawBalances[tokenIn.id]) {
                  try {
                    const rawBalance = rawBalances[tokenIn.id];
                    const reserveAmount = new Big(0.25).mul(new Big(10).pow(24));
                    const requestedAmount = new Big(value).mul(new Big(10).pow(tokenIn.decimals));
                    const maxAvailable = new Big(rawBalance).minus(reserveAmount);
                    
                    if (requestedAmount.lte(new Big(rawBalance)) && requestedAmount.gt(maxAvailable) && maxAvailable.gt(0)) {
                      onGasReserveCheck(true);
                    } else {
                      onGasReserveCheck(false);
                    }
                  } catch {
                    onGasReserveCheck(false);
                  }
                } else {
                  onGasReserveCheck(false);
                }
              }}
              placeholder='0.0'
              disabled={!accountId}
              decimalLimit={tokenIn?.decimals ?? 18}
            />
            {!!(amountIn && tokenIn && tokenPrices[tokenIn.id]?.price) && (
              <div className="absolute top-8 right-4 text-xs text-muted-foreground">
                ≈ {formatDollarAmount(parseFloat(amountIn) * parseFloat(String(tokenPrices[tokenIn.id].price)))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Out */}
      <div className="w-full space-y-1 mt-2">
        <div className="flex items-center gap-0 p-4 border border-border rounded-full transition-all">
          <div className="flex flex-col items-start w-[200px]">
            <TokenSelect
              selectedToken={tokenOut}
              onSelectToken={onTokenOutChange}
              otherToken={tokenIn}
              label="Select"
              tokens={availableTokens}
            />
            {accountId && tokenOut && (
              <div className="flex flex-col items-start mt-1 ml-3">
                <span className="text-xs text-muted-foreground">
                  Balance: {isLoadingBalances ? '...' : balances[tokenOut.id] ?? '0'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={estimatedOutDisplay || '0.0'}
              readOnly
              className={`w-full text-xl font-semibold text-right bg-transparent border-none outline-none ${!estimatedOutDisplay || estimatedOutDisplay === '0.0' ? 'text-primary opacity-60' : 'text-foreground'}`}
              placeholder={
                tokenOut && tokenPrices[tokenOut.id]?.price
                  ? `≈ $${(parseFloat(String(tokenPrices[tokenOut.id].price)) * 1000).toFixed(2)} for 1000 ${tokenOut.symbol}`
                  : '0.0'
              }
            />
            {!!(estimatedOutDisplay && tokenOut && tokenPrices[tokenOut.id]?.price) && (
              <div className="absolute top-8 right-4 text-xs text-muted-foreground">
                ≈ {formatDollarAmount(parseFloat(estimatedOutDisplay) * parseFloat(String(tokenPrices[tokenOut.id].price)))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="absolute left-1/2 top-[calc(50%-0.5rem)] -translate-x-1/2 z-20">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-card border-t border-b border-border absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <button
            onClick={onSwapTokens}
            className="w-10 h-10 rounded-full border border-verified bg-gradient-to-br from-verified/20 via-verified/10 to-verified/5 text-primary flex items-center justify-center font-bold text-sm transition-all duration-500 hover:rotate-180 hover:border-verified/80 backdrop-blur-sm relative z-10"
          >
            <ArrowDownUp className="w-5 h-5 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
