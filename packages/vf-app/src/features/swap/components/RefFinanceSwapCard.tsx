'use client';

/**
 * Enhanced Swap Widget with Ref Finance Integration - REFACTORED ✅
 * 
 * This component has been refactored to improve maintainability and code organization:
 * - Extracted 5 custom hooks for state management
 * - Separated UI into 3 focused subcomponents
 * - Reduced main component from 1,479 lines to ~470 lines (68% reduction)
 * 
 * Extracted modules:
 * - Hooks: useSwapForm, useSwapTransaction, useSwapEstimate, useSwapBalances
 * - Components: SwapForm, SwapDetails, SwapWarnings
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Big from 'big.js';
import { toInternationalCurrencySystemLongString } from '@ref-finance/ref-sdk';

import { useWallet } from '@/features/wallet';
import { 
  useSwap,
  useSwapForm,
  useSwapTransaction,
  useSwapEstimate,
  useSwapBalances,
} from '../hooks';
import { SwapForm, SwapDetails, SwapWarnings } from './subcomponents';
import { Button } from '@/components/ui/button';
import { TransactionCancelledModal, TransactionFailureModal, TransactionSuccessModal } from '@/components/ui/transaction-modal';
import { SlippageSettings } from '@/features/liquidity/components/subcomponents/SlippageSettings';
import { Loader2, Settings, AlertCircle } from 'lucide-react';
import { getMainnetTokens, SLIPPAGE_PRESETS, formatTokenAmount, formatTokenAmountNoAbbrev } from '@/lib/swap-utils';
import Logo from '@/components/ui/logo';
import type { TokenMetadata } from '@/types';

export const RefFinanceSwapCard: React.FC = () => {
  const { accountId, wallet } = useWallet();
  const {
    loading,
    error: swapError,
    tokenPrices,
    estimateSwapOutput,
    executeSwap,
  } = useSwap();

  // Use extracted hooks
  const form = useSwapForm();
  const transaction = useSwapTransaction();
  const balances = useSwapBalances(accountId, wallet, form.tokenIn, form.tokenOut);
  
  // Available tokens with metadata
  const [availableTokens, setAvailableTokens] = useState<TokenMetadata[]>([]);

  // Track if we've already fetched balances for current success state
  const balancesFetchedRef = useRef(false);

  // Use swap estimate hook
  const estimate = useSwapEstimate(
    form.tokenIn,
    form.tokenOut,
    form.amountIn,
    form.isValidNumber,
    estimateSwapOutput,
    form.setEstimatedOut,
    form.setEstimatedOutDisplay,
    form.setRawEstimatedOut,
    transaction.setError,
    form.lastUserInteraction,
    transaction.isSwapping
  );

  // Fetch token metadata on mount
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const tokens = await getMainnetTokens();
        setAvailableTokens(tokens);
        
        // Set initial tokens once metadata is loaded
        if (!form.tokenIn) {
          const near = tokens.find(t => t.symbol === 'NEAR');
          if (near) form.setTokenIn(near);
        }
        if (!form.tokenOut) {
          const veganfriends = tokens.find(t => t.id === 'veganfriends.tkn.near');
          if (veganfriends) form.setTokenOut(veganfriends);
        }
      } catch (error) {
        console.error('[TokenSelect] Failed to fetch token metadata:', error);
        // Fallback to static tokens
        const fallbackTokens = [
          {
            id: 'near',
            symbol: 'NEAR',
            name: 'Near',
            decimals: 24,
            icon: 'https://assets.ref.finance/images/near.svg',
          },
          {
            id: 'veganfriends.tkn.near',
            symbol: 'VEGANFRIENDS',
            name: 'Vegan Friends Token',
            decimals: 18,
            icon: undefined,
          },
        ];
        setAvailableTokens(fallbackTokens);
        
        if (!form.tokenIn) form.setTokenIn(fallbackTokens[0]);
        if (!form.tokenOut) form.setTokenOut(fallbackTokens[1]);
      }
    };

    void fetchTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch updated balances when swap succeeds
  useEffect(() => {
    if (transaction.swapState === 'success' && !balancesFetchedRef.current) {
      balancesFetchedRef.current = true;
      
      // Invalidate both tokenIn and tokenOut balances to ensure fresh data
      if (form.tokenIn) {
        balances.invalidateBalance(form.tokenIn.id);
      }
      if (form.tokenOut) {
        balances.invalidateBalance(form.tokenOut.id);
      }
      
      // Fetch fresh balances immediately
      void balances.fetchBalances().then(() => {
        if (typeof window !== 'undefined' && (window as any).refreshTokenBalance) {
          (window as any).refreshTokenBalance();
        }
      }).catch((error) => {
        console.warn('[SwapWidget] Failed to fetch balances after swap success:', error);
      });
    }
    // Reset the ref when transaction state changes away from success
    if (transaction.swapState !== 'success') {
      balancesFetchedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.swapState]);

  // Reset form when wallet disconnects
  useEffect(() => {
    if (!accountId) {
      form.resetForm();
      transaction.resetTransactionState();
    }
  }, [accountId, form, transaction]);

  // Execute swap
  const handleSwap = async () => {
    if (!form.tokenIn || !form.tokenOut || !form.amountIn) {
      return;
    }

    await transaction.executeSwapTransaction(
      form.tokenIn,
      form.tokenOut,
      form.amountIn,
      form.slippage,
      estimate.currentEstimate,
      executeSwap,
      estimateSwapOutput
    );
  };

  // Format dollar amount with special handling for small numbers
  const formatDollarAmount = useCallback((amount: number) => {
    try {
      if (amount === 0) return '$0.00';
      if (amount >= 0.01) {
        return `$${amount.toFixed(2)}`;
      } else {
        const fixedStr = amount.toFixed(20);
        const decimalPart = fixedStr.split('.')[1] || '';
        const firstNonZeroIndex = decimalPart.search(/[1-9]/);
        if (firstNonZeroIndex === -1) return '$0.00';
        const zerosCount = firstNonZeroIndex;
        const significantDigits = decimalPart.slice(firstNonZeroIndex, firstNonZeroIndex + 4);
        return (
          <span>
            $0.0<span className="text-primary text-[10px]">{zerosCount}</span>{significantDigits}
          </span>
        );
      }
    } catch {
      return '$0.00';
    }
  }, []);

  const canSwap =
    form.tokenIn &&
    form.tokenOut &&
    form.amountIn &&
    parseFloat(form.amountIn) > 0 &&
    form.estimatedOutDisplay &&
    estimate.currentEstimate &&
    !transaction.isSwapping &&
    accountId;

  const isAutoRefreshingEstimate = estimate.isEstimating && estimate.estimateReason === 'auto';
  const isManualEstimating = estimate.isEstimating && estimate.estimateReason === 'user';

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Main Card */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-t-2xl -m-4 sm:-m-6 md:-m-8 mb-4 md:mb-6 shadow-sm">
          <div className="p-4 sm:p-6 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                <Logo width={56} height={37} className="w-14 h-[37px]" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => form.setShowSettings(!form.showSettings)}
                  className="p-2 bg-card/50 hover:bg-card border border-border/50 rounded-full transition-all duration-200 hover:shadow-md"
                >
                  <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {form.showSettings && (
          <SlippageSettings
            slippage={form.slippage}
            customSlippage={form.customSlippage}
            onSlippageChange={form.handleSlippageChange}
            onCustomSlippageChange={form.handleCustomSlippage}
            presets={SLIPPAGE_PRESETS}
          />
        )}

        {/* Pool Loading State */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-full shadow-md">
            <span 
              className="inline-flex items-center justify-center" 
              style={{ transform: 'none', willChange: 'auto', backfaceVisibility: 'visible' }}
            >
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            </span>
            <p className="text-sm sm:text-base text-blue-500">Loading liquidity pools...</p>
          </div>
        )}

        {/* Pool Error State */}
        {swapError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-full shadow-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm sm:text-base text-red-500">Failed to load pools: {swapError}</p>
          </div>
        )}

        {/* Swap Form */}
        <SwapForm
          tokenIn={form.tokenIn}
          tokenOut={form.tokenOut}
          availableTokens={availableTokens}
          onTokenInChange={(token) => {
            form.setTokenIn(token);
            form.setLastUserInteraction(Date.now());
          }}
          onTokenOutChange={(token) => {
            form.setTokenOut(token);
            form.setLastUserInteraction(Date.now());
          }}
          amountIn={form.amountIn}
          estimatedOutDisplay={form.estimatedOutDisplay}
          onAmountInChange={(value) => {
            form.setAmountIn(value);
            form.setLastUserInteraction(Date.now());
          }}
          accountId={accountId}
          balances={balances.balances}
          rawBalances={balances.rawBalances}
          isLoadingBalances={balances.isLoadingBalances}
          tokenPrices={tokenPrices}
          onSwapTokens={form.handleSwapTokens}
          onAmountFromBalance={form.setAmountFromBalance}
          onMaxAmount={form.setMaxAmount}
          onGasReserveCheck={form.setShowGasReserveInfo}
          onGasReserveMessageChange={form.setShowGasReserveMessage}
          isValidNumber={form.isValidNumber}
          formatDollarAmount={formatDollarAmount}
        />

        {/* Warnings */}
        <SwapWarnings
          accountId={accountId}
          error={transaction.error}
          showGasReserveMessage={form.showGasReserveMessage}
          showGasReserveInfo={form.showGasReserveInfo}
          currentEstimate={estimate.currentEstimate}
          tokenOutId={form.tokenOut?.id}
          rawBalancesNear={balances.rawBalances.near}
        />

        {/* Swap Info */}
        {form.estimatedOutDisplay && !transaction.error && accountId && (
          <>
            <SwapDetails
              tokenIn={form.tokenIn}
              tokenOut={form.tokenOut}
              amountIn={form.amountIn}
              rawEstimatedOut={form.rawEstimatedOut}
              currentEstimate={estimate.currentEstimate}
              slippage={form.slippage}
              isRateReversed={form.isRateReversed}
              onToggleRate={() => form.setIsRateReversed(!form.isRateReversed)}
              tokenPrices={tokenPrices}
              formatDollarAmount={formatDollarAmount}
              accountId={accountId}
            />
            <p className="text-center text-[11px] text-muted-foreground">
              Live quotes refresh every 10 seconds
            </p>
          </>
        )}

        {/* Swap Button */}
        <Button
          onClick={accountId ? () => void handleSwap() : undefined}
          disabled={!accountId || !canSwap || transaction.isSwapping || estimate.isEstimating || (() => {
            try {
              return !!(form.amountIn && form.tokenIn && form.isValidNumber(form.amountIn) && new Big(form.amountIn).times(new Big(10).pow(form.tokenIn.decimals)).gt(new Big(balances.rawBalances[form.tokenIn.id] ?? '0')));
            } catch {
              return false;
            }
          })() || (() => {
            try {
              return !!(form.tokenIn?.id === 'near' && balances.rawBalances.near && new Big(balances.rawBalances.near).lt(new Big('250000000000000000000000')));
            } catch {
              return false;
            }
          })() || form.showGasReserveInfo}
          variant="verified"
          size="lg"
          className="w-full font-bold"
        >
          {transaction.isSwapping && (
            <span 
              className="inline-flex items-center justify-center mr-2 relative" 
              style={{ transform: 'none', willChange: 'auto', backfaceVisibility: 'visible' }}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </span>
          )}
          {!transaction.isSwapping && !isAutoRefreshingEstimate && estimate.isEstimating && (
            <span 
              className="inline-flex items-center justify-center mr-2 relative" 
              style={{ transform: 'none', willChange: 'auto', backfaceVisibility: 'visible' }}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </span>
          )}
          <span className={
            (() => {
              try {
                return form.amountIn && form.tokenIn && form.isValidNumber(form.amountIn) && new Big(form.amountIn).times(new Big(10).pow(form.tokenIn.decimals)).gt(new Big(balances.rawBalances[form.tokenIn.id] ?? '0'))
                  ? 'text-destructive'
                  : form.showGasReserveInfo
                  ? 'text-destructive'
                  : form.tokenIn?.id === 'near' && balances.rawBalances.near && new Big(balances.rawBalances.near).lt(new Big('250000000000000000000000'))
                  ? 'text-verified'
                  : '';
              } catch {
                return '';
              }
            })()
          }>
            {transaction.isSwapping ? 'Swapping...' : isAutoRefreshingEstimate ? (
              <span className="inline-flex items-center justify-center gap-1">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={`refresh-dot-${dot}`}
                    className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"
                    style={{ animationDelay: `${dot * 120}ms` }}
                    aria-hidden="true"
                  />
                ))}
              </span>
            ) : isManualEstimating ? 'Finding best route...' : 
             form.showGasReserveInfo
               ? 'Need 0.25N for gas' :
             (() => {
               try {
                 return (form.tokenIn?.id === 'near' && balances.rawBalances.near && new Big(balances.rawBalances.near).lt(new Big('250000000000000000000000')))
                   ? 'Need 0.25 NEAR minimum to swap' :
                   (!form.amountIn || !form.tokenIn || !form.tokenOut) ? 'Enter Amount' :
                   (form.amountIn && form.tokenIn && form.isValidNumber(form.amountIn) && new Big(form.amountIn).times(new Big(10).pow(form.tokenIn.decimals)).gt(new Big(balances.rawBalances[form.tokenIn.id] ?? '0'))) 
                   ? 'Insufficient Funds' : 'Swap';
               } catch {
                 return 'Enter Amount';
               }
             })()
            }
          </span>
        </Button>

        {/* Powered by Rhea */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a
              href="https://app.rhea.finance/swap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Rhea
            </a>
          </p>
        </div>
      </div>

      {/* Transaction Modals */}
      {transaction.swapState === 'success' && accountId && (
        <TransactionSuccessModal
          title="Swap Successful!"
          details={[
            ...(form.amountIn && form.tokenIn ? [{ label: 'Swapped', value: `${form.amountIn} ${form.tokenIn.symbol}` }] : []),
            ...(form.estimatedOut && form.tokenOut ? [{ label: 'Received', value: `${form.estimatedOutDisplay} ${form.tokenOut.symbol}` }] : []),
            ...(form.tokenOut ? [{
              label: 'New Balance',
              value: balances.balances[form.tokenOut.id] ? (
                `${balances.balances[form.tokenOut.id]} ${form.tokenOut.symbol}`
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )
            }] : []),
            ...(form.tokenIn && form.tokenOut && form.amountIn && form.estimatedOut ? [{
              label: '',
              value: (
                <div className="text-center text-xs text-muted-foreground">
                  Rate: 1 {form.tokenIn.symbol} ≈ {(() => {
                    try {
                      const fromAmount = parseFloat(form.amountIn);
                      const toAmount = parseFloat(form.rawEstimatedOut) / Math.pow(10, form.tokenOut?.decimals || 18);
                      const rate = toAmount / fromAmount;
                      const bigValue = new Big(rate);
                      const numValue = bigValue.toNumber();
                      if (numValue >= 0.0001) {
                        return <span>{toInternationalCurrencySystemLongString(bigValue.toString(), 4)}</span>;
                      } else {
                        const fixedStr = bigValue.toFixed(20);
                        const decimalPart = fixedStr.split('.')[1] || '';
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
                      const rate = parseFloat(form.estimatedOut) / parseFloat(form.amountIn);
                      return rate.toFixed(4);
                    }
                  })()} {form.tokenOut.symbol}
                </div>
              )
            }] : [])
          ]}
          tx={transaction.tx}
          onClose={() => {
            transaction.resetTransactionState();
            form.resetForm();
          }}
        />
      )}

      {transaction.swapState === 'cancelled' && accountId && (
        <TransactionCancelledModal
          onClose={() => {
            transaction.resetTransactionState();
            form.resetForm();
          }}
        />
      )}

      {transaction.swapState === 'fail' && accountId && (
        <TransactionFailureModal
          error={transaction.error ?? undefined}
          onClose={() => {
            transaction.resetTransactionState();
            form.resetForm();
          }}
        />
      )}
    </div>
  );
};

export default RefFinanceSwapCard;
