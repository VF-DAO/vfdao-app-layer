'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Check, ChevronDown, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { dropdownStyles } from '@/components/ui/dropdown-menu';
import { TokenInput } from '@/features/swap/components/TokenInput';
import { useSwapPairs } from '../../hooks/useSwapPairs';
import Big from 'big.js';
import type { ProposalComponentProps } from '../shared/types';

const formatWithSpaces = (value: string): string => {
  if (!value || value === '0.0') return value;
  const [integer, decimal] = value.split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
};

export function TokenSwapProposal({
  formData,
  onFormDataChange,
  validationErrors,
  availableTokens,
  isEstimatingSwap: _isEstimatingSwap,
  swapEstimate,
  onTestSwap,
  accountId,
  nearBalance,
}: ProposalComponentProps) {
  const [tokenInDropdownOpen, setTokenInDropdownOpen] = useState(false);
  const [tokenOutDropdownOpen, setTokenOutDropdownOpen] = useState(false);
  const tokenInRef = useRef<HTMLDivElement>(null);
  const tokenOutRef = useRef<HTMLDivElement>(null);

  // Get available swap pairs
  const { 
    getAvailableOutputTokens, 
    tokensWithPairs, 
    isLoading: isLoadingPairs,
    isPairValid 
  } = useSwapPairs(availableTokens);

  const selectedTokenIn = availableTokens.find(t => t.contractId === formData.tokenIn);
  const selectedTokenOut = availableTokens.find(t => t.contractId === formData.tokenOut);

  // Get available balance for the selected input token
  const availableBalance = useMemo(() => {
    if (!formData.tokenIn) return null;
    
    // NEAR balance
    if (formData.tokenIn === 'wrap.near') {
      return nearBalance ? { amount: nearBalance, symbol: 'NEAR' } : null;
    }
    
    // Token balance
    const token = availableTokens.find(t => t.contractId === formData.tokenIn);
    if (token?.balance) {
      return { amount: token.balance, symbol: token.symbol };
    }
    
    return null;
  }, [formData.tokenIn, nearBalance, availableTokens]);



  // Filter available output tokens based on selected input token
  const availableOutputTokens = useMemo(() => {
    if (!formData.tokenIn) return [];
    return getAvailableOutputTokens(formData.tokenIn);
  }, [formData.tokenIn, getAvailableOutputTokens]);

  // Clear tokenOut if it's no longer valid for the selected tokenIn
  useEffect(() => {
    if (formData.tokenIn && formData.tokenOut && !isLoadingPairs) {
      if (!isPairValid(formData.tokenIn, formData.tokenOut)) {
        onFormDataChange({ tokenOut: '', minAmountOut: '', poolId: '' });
      }
    }
  }, [formData.tokenIn, formData.tokenOut, isPairValid, isLoadingPairs, onFormDataChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tokenInRef.current && !tokenInRef.current.contains(event.target as Node)) {
        setTokenInDropdownOpen(false);
      }
      if (tokenOutRef.current && !tokenOutRef.current.contains(event.target as Node)) {
        setTokenOutDropdownOpen(false);
      }
    };

    if (tokenInDropdownOpen || tokenOutDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [tokenInDropdownOpen, tokenOutDropdownOpen]);

  // Handle percentage button clicks
  const handlePercentageClick = (percent: number) => {
    if (!availableBalance?.amount || !selectedTokenIn) return;
    
    try {
      // Remove commas/spaces from formatted balance before parsing
      const cleanBalance = availableBalance.amount.replace(/[,\s]/g, '');
      const balance = new Big(cleanBalance);
      let amount: Big;
      
      if (percent === 100) {
        // For MAX on NEAR, reserve 0.25 for gas
        const isNear = formData.tokenIn === 'wrap.near';
        if (isNear) {
          const reserve = new Big(0.25);
          amount = balance.minus(reserve);
          if (amount.lt(0)) amount = new Big(0);
        } else {
          amount = balance;
        }
      } else {
        amount = balance.mul(percent).div(100);
      }
      
      // Format to reasonable decimals
      const decimals = selectedTokenIn.decimals || 24;
      const formatted = amount.toFixed(Math.min(decimals, 8)).replace(/\.?0+$/, '');
      onFormDataChange({ amountIn: formatted || '0' });
    } catch (err) {
      console.error('Failed to calculate percentage amount:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">Swap Details</div>

      {/* Token In - Swap Widget Style */}
      <div className="relative">
        <div className="space-y-1">
          {/* Percentage Buttons */}
          {!!(availableBalance && formData.tokenIn) && (
            <div className="flex items-center justify-end gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {[25, 50, 75].map((percent) => (
                <Button
                  key={percent}
                  type="button"
                  onClick={() => handlePercentageClick(percent)}
                  variant="percentage"
                  size="xs"
                >
                  {percent}%
                </Button>
              ))}
              <Button
                type="button"
                onClick={() => handlePercentageClick(100)}
                variant="percentage"
                size="xs"
              >
                MAX
              </Button>
            </div>
          )}

          {/* Combined Token + Amount Container */}
          <div className="flex items-center gap-0 p-4 border border-border rounded-full transition-all hover:border-muted-foreground/50 focus-within:border-muted-foreground/50">
            {/* Token Selector */}
            <div className="flex flex-col items-start min-w-[140px]" ref={tokenInRef}>
              <button
                type="button"
                onClick={() => setTokenInDropdownOpen(!tokenInDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1 bg-transparent rounded-full transition-all hover:bg-muted/50 min-w-[120px]"
              >
                {selectedTokenIn?.icon ? (
                  <Image
                    src={selectedTokenIn.icon}
                    alt={selectedTokenIn.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : selectedTokenIn ? (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] font-bold">{selectedTokenIn.symbol.slice(0, 2)}</span>
                  </div>
                ) : null}
                <span className="font-semibold text-foreground text-sm">
                  {selectedTokenIn?.symbol ?? <span className="text-primary opacity-60">Select</span>}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Balance under token */}
              {availableBalance && (
                <div className="flex flex-col items-start mt-1 ml-3">
                  <span className="text-xs text-muted-foreground">
                    Balance: {formatWithSpaces(availableBalance.amount)}
                  </span>
                </div>
              )}

              {/* Dropdown */}
              {tokenInDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 ${dropdownStyles.base} min-w-[200px] max-h-48 overflow-y-auto p-2 space-y-0.5`}>
                  {isLoadingPairs ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading pairs...</span>
                    </div>
                  ) : tokensWithPairs.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No swappable tokens found
                    </div>
                  ) : (
                    tokensWithPairs.map((token) => (
                      <button
                        key={token.contractId}
                        type="button"
                        onClick={() => {
                          onFormDataChange({ tokenIn: token.contractId });
                          setTokenInDropdownOpen(false);
                        }}
                        className={dropdownStyles.item}
                      >
                        {token.icon ? (
                          <Image
                            src={token.icon}
                            alt={token.symbol}
                            width={20}
                            height={20}
                            className="rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold">{token.symbol.slice(0, 2)}</span>
                          </div>
                        )}
                        <span className={dropdownStyles.itemText}>{token.symbol}</span>
                        <Check className={dropdownStyles.check(formData.tokenIn === token.contractId)} />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="flex-1 relative">
              <TokenInput
                value={formData.amountIn ?? ''}
                onChange={(value) => onFormDataChange({ amountIn: value })}
                placeholder="0.0"
                decimalLimit={selectedTokenIn?.decimals ?? 24}
              />
            </div>
          </div>
          {(validationErrors.tokenIn || validationErrors.amountIn) && (
            <p className="text-xs text-orange ml-4">{validationErrors.tokenIn || validationErrors.amountIn}</p>
          )}
        </div>
      </div>

      {/* Token Out - Swap Widget Style */}
      <div className="relative">
        <div className="space-y-1">
          {/* Combined Token + Amount Container */}
          <div className="flex items-center gap-0 p-4 border border-border rounded-full transition-all hover:border-muted-foreground/50 focus-within:border-muted-foreground/50">
            {/* Token Selector */}
            <div className="flex flex-col items-start min-w-[140px]" ref={tokenOutRef}>
              <button
                type="button"
                onClick={() => formData.tokenIn && setTokenOutDropdownOpen(!tokenOutDropdownOpen)}
                disabled={!formData.tokenIn || isLoadingPairs}
                className="flex items-center gap-2 px-2 py-1 bg-transparent rounded-full transition-all hover:bg-muted/50 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPairs ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : selectedTokenOut?.icon ? (
                  <Image
                    src={selectedTokenOut.icon}
                    alt={selectedTokenOut.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : selectedTokenOut ? (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] font-bold">{selectedTokenOut.symbol.slice(0, 2)}</span>
                  </div>
                ) : null}
                <span className="font-semibold text-foreground text-sm">
                  {isLoadingPairs ? 'Loading...' : selectedTokenOut?.symbol ?? (formData.tokenIn ? <span className="text-primary opacity-60">Select</span> : <span className="text-muted-foreground text-xs">Select input first</span>)}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Dropdown */}
              {tokenOutDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 ${dropdownStyles.base} min-w-[200px] max-h-48 overflow-y-auto p-2 space-y-0.5`}>
                  {availableOutputTokens.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No pairs available for {selectedTokenIn?.symbol ?? 'selected token'}
                    </div>
                  ) : (
                    availableOutputTokens.map((token) => (
                      <button
                        key={token.contractId}
                        type="button"
                        onClick={() => {
                          onFormDataChange({ tokenOut: token.contractId });
                          setTokenOutDropdownOpen(false);
                        }}
                        className={dropdownStyles.item}
                      >
                        {token.icon ? (
                          <Image
                            src={token.icon}
                            alt={token.symbol}
                            width={20}
                            height={20}
                            className="rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold">{token.symbol.slice(0, 2)}</span>
                          </div>
                        )}
                        <span className={dropdownStyles.itemText}>{token.symbol}</span>
                        <Check className={dropdownStyles.check(formData.tokenOut === token.contractId)} />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Estimated Output (read-only) */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={(() => {
                  if (!swapEstimate?.outputAmount) return '';
                  const estimatedOut = new Big(swapEstimate.outputAmount).div(new Big(10).pow(selectedTokenOut?.decimals ?? 24)).toFixed(Math.min(selectedTokenOut?.decimals ?? 6, 8));
                  return formatWithSpaces(estimatedOut);
                })()}
                readOnly
                className={`w-full text-xl font-semibold text-right bg-transparent border-none outline-none ${!swapEstimate?.outputAmount ? 'text-primary opacity-60' : 'text-foreground'}`}
                placeholder="0.0"
              />
            </div>
          </div>
          {validationErrors.tokenOut && (
            <p className="text-xs text-orange ml-4">{validationErrors.tokenOut}</p>
          )}
        </div>
      </div>

      {/* Price Impact & Swap Details */}
      {swapEstimate && (
        <div className="space-y-2 px-2">
          {/* Price Impact */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price Impact</span>
            <span className={`font-medium ${
              swapEstimate.highImpact 
                ? 'text-orange' 
                : Math.abs(swapEstimate.priceImpact) > 1 
                  ? 'text-yellow-500' 
                  : 'text-primary'
            }`}>
              {swapEstimate.priceImpact > 0 ? '-' : ''}{Math.abs(swapEstimate.priceImpact).toFixed(2)}%
            </span>
          </div>
          
          {/* Pool Fee */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pool Fee</span>
            <span className="text-foreground">{swapEstimate.fee}%</span>
          </div>

          {/* High Impact Warning */}
          {swapEstimate.highImpact && (
            <div className="flex items-center gap-2 p-3 bg-orange/10 border border-orange/30 rounded-2xl mt-2">
              <AlertTriangle className="w-5 h-5 text-orange flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-orange">High Price Impact Warning</span>
                <p className="text-muted-foreground text-xs mt-0.5">
                  This swap has a price impact of {Math.abs(swapEstimate.priceImpact).toFixed(2)}%. 
                  Consider reducing the amount or splitting into smaller swaps.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Min Amount Out */}
      <div className="space-y-1">
        <Label htmlFor="minAmountOut" className="text-xs text-muted-foreground">Min Amount Out (with slippage)</Label>
        <div className="relative flex items-center">
          <input
            id="minAmountOut"
            value={formData.minAmountOut ?? ''}
            readOnly
            className="w-full h-12 bg-transparent border border-border rounded-full text-sm px-4 text-muted-foreground cursor-default outline-none focus:outline-none"
            placeholder="0.0"
          />
        </div>
        {validationErrors.minAmountOut && (
          <p className="text-xs text-orange">{validationErrors.minAmountOut}</p>
        )}
      </div>

      {/* Test Swap Button - Only visible to greenghost.near for testing */}
      {accountId === 'greenghost.near' && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onTestSwap}
            disabled={!formData.amountIn || !swapEstimate}
            className="w-full h-12"
          >
            <Zap className="w-4 h-4 mr-2" />
            Test Swap (Execute from Your Account)
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Test the exact same transaction logic before creating a DAO proposal
          </p>
        </div>
      )}

      {/* Pool ID */}
      <div className="space-y-1">
        <Label htmlFor="poolId" className="text-xs text-muted-foreground">Pool ID</Label>
        <input
          id="poolId"
          value={formData.poolId ?? ''}
          readOnly
          className="w-full h-12 bg-transparent border border-border rounded-full text-sm px-4 text-muted-foreground cursor-default outline-none focus:outline-none"
          placeholder="Auto-detected from estimate"
        />
      </div>
    </div>
  );
}
