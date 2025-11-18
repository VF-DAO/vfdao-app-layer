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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Big from 'big.js';
import { toInternationalCurrencySystemLongString } from '@ref-finance/ref-sdk';

import { useWallet } from '@/features/wallet';
import { 
  useSwap,
  useSwapBalances,
  useSwapEstimate,
  useSwapForm,
  useSwapTransaction,
} from '../hooks';
import { SwapDetails, SwapForm, SwapWarnings } from './subcomponents';
import { Button } from '@/components/ui/button';
import { TransactionCancelledModal, TransactionFailureModal, TransactionSuccessModal } from '@/components/ui/transaction-modal';
import { SlippageSettings } from '@/features/liquidity/components/subcomponents/SlippageSettings';
import { Info, Settings } from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';
import { getMainnetTokens, SLIPPAGE_PRESETS } from '@/lib/swap-utils';
import Logo from '@/components/ui/logo';
import type { TokenMetadata } from '@/types';

export const RefFinanceSwapCard: React.FC = () => {
  const { accountId, wallet } = useWallet();
  const {
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
  
  // Snapshot of final values to show in success modal (prevents flickering)
  const [finalBalance, setFinalBalance] = useState<string | null>(null);
  const [finalReceivedAmount, setFinalReceivedAmount] = useState<string | null>(null);
  const [finalSwapRate, setFinalSwapRate] = useState<React.ReactNode | null>(null);

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
      
      // Set loading state immediately
      balances.setLoadingState(true);
      
      // Invalidate both tokenIn and tokenOut balances to ensure fresh data
      if (form.tokenIn) {
        balances.invalidateBalance(form.tokenIn.id);
      }
      if (form.tokenOut) {
        balances.invalidateBalance(form.tokenOut.id);
      }
      
      // Wait 1.5s for on-chain state to propagate, then fetch fresh balances
      setTimeout(() => {
        void balances.fetchBalances().then((freshBalances) => {
          // Capture final balance for the success modal (exactly like liquidity captures finalUserShares)
          if (form.tokenOut && freshBalances[form.tokenOut.id]) {
            setFinalBalance(freshBalances[form.tokenOut.id]);
          }
          
          // Refresh both TokenBalance and PortfolioDashboard components
          if (typeof window !== 'undefined') {
            if ((window as any).refreshTokenBalance) {
              (window as any).refreshTokenBalance();
            }
            if ((window as any).refreshPortfolioDashboard) {
              (window as any).refreshPortfolioDashboard();
            }
          }
        }).catch((error) => {
          console.warn('[SwapWidget] Failed to fetch balances after swap success:', error);
        });
      }, 1500);
    }
    // Reset the ref when transaction state changes away from success
    if (transaction.swapState !== 'success') {
      balancesFetchedRef.current = false;
      setFinalBalance(null);
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

    // Capture the received amount and rate before transaction to prevent them from changing in the modal
    if (form.estimatedOutDisplay) {
      setFinalReceivedAmount(form.estimatedOutDisplay);
    }

    // Capture the swap rate
    if (form.amountIn && form.rawEstimatedOut && form.tokenIn && form.tokenOut) {
      try {
        const fromAmount = parseFloat(form.amountIn);
        const toAmount = parseFloat(form.rawEstimatedOut) / Math.pow(10, form.tokenOut.decimals);
        const rate = toAmount / fromAmount;
        const bigValue = new Big(rate);
        const numValue = bigValue.toNumber();
        
        let rateDisplay: React.ReactNode;
        if (numValue >= 0.0001) {
          rateDisplay = <span>{toInternationalCurrencySystemLongString(bigValue.toString(), 4)}</span>;
        } else {
          const fixedStr = bigValue.toFixed(20);
          const decimalPart = fixedStr.split('.')[1] || '';
          const firstNonZeroIndex = decimalPart.search(/[1-9]/);
          if (firstNonZeroIndex === -1) {
            rateDisplay = <span>0.0000</span>;
          } else {
            const zerosCount = firstNonZeroIndex;
            const significantDigits = decimalPart.slice(firstNonZeroIndex, firstNonZeroIndex + 4);
            rateDisplay = (
              <span>
                0.0<span className="text-primary text-[10px]">{zerosCount}</span>{significantDigits}
              </span>
            );
          }
        }
        setFinalSwapRate(rateDisplay);
      } catch {
        const rate = parseFloat(form.estimatedOut || '0') / parseFloat(form.amountIn);
        setFinalSwapRate(<span>{rate.toFixed(4)}</span>);
      }
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
          currentEstimate={estimate.currentEstimate}
          tokenOutId={form.tokenOut?.id}
          rawBalancesNear={balances.rawBalances.near}
        />

        {/* Swap Info */}
        {!!(form.estimatedOutDisplay && !transaction.error && accountId) && (
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
          </>
        )}

        {/* Gas Reserve Info */}
        {!!(form.showGasReserveMessage && accountId) && (
          <div className="flex items-start gap-2 p-2 bg-primary/10 rounded-full animate-in fade-in slide-in-from-top-2 duration-300">
            <Info className="w-4 h-4 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Keeping 0.25 NEAR in your wallet for gas fees
            </p>
          </div>
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
          className="w-full font-bold min-h-[48px]"
        >
          <span className={
            `inline-flex items-center justify-center min-h-[24px] ${
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
            }`
          }>
            {transaction.isSwapping ? (
              <LoadingDots />
            ) : isAutoRefreshingEstimate ? (
              <LoadingDots />
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
            ...(form.tokenOut && finalReceivedAmount ? [{ label: 'Received', value: `${finalReceivedAmount} ${form.tokenOut.symbol}` }] : []),
            ...(form.tokenOut ? [{
              label: 'New Balance',
              value: finalBalance ? `${finalBalance} ${form.tokenOut.symbol}` : <LoadingDots />
            }] : []),
            ...(form.tokenIn && form.tokenOut && finalSwapRate ? [{
              label: '',
              value: (
                <div className="text-center text-xs text-muted-foreground">
                  Rate: 1 {form.tokenIn.symbol} ≈ {finalSwapRate} {form.tokenOut.symbol}
                </div>
              )
            }] : [])
          ]}
          tx={transaction.tx}
          onClose={() => {
            transaction.resetTransactionState();
            form.resetForm();
            setFinalBalance(null);
            setFinalReceivedAmount(null);
            setFinalSwapRate(null);
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
