'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { WalletSelectorTransactions } from '@ref-finance/ref-sdk';
import { providers } from 'near-api-js';
import { useWallet } from '@/contexts/wallet-context';
import { useSwap } from '@/hooks/useSwap';
import type { SwapEstimate } from '@/hooks/useSwap';
import { TokenSelect } from './TokenSelect';
import {
  AlertCircle,
  ArrowDownUp,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import {
  ensureStorageDeposit,
  formatTokenAmount,
  getTokenById,
  parseTokenAmount,
  SLIPPAGE_PRESETS,
} from '@/lib/swap-utils';

type SwapState = 'success' | 'fail' | 'waitingForConfirmation' | null;

interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

export const RheaSwapWidget: React.FC = () => {
  const { accountId, selector, modal } = useWallet();
  const {
    loading,
    error: swapError,
    tokenPrices,
    estimateSwapOutput,
    executeSwap,
    refreshPools,
  } = useSwap();

  // Token selection
  const [tokenIn, setTokenIn] = useState<Token | undefined>(getTokenById('wrap.near'));
  const [tokenOut, setTokenOut] = useState<Token | undefined>(
    getTokenById('usdt.tether-token.near')
  );

  // Amounts
  const [amountIn, setAmountIn] = useState('');
  const [estimatedOut, setEstimatedOut] = useState('');

  // Settings
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');

  // State
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapState, setSwapState] = useState<SwapState>(null);
  const [tx, setTx] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Balances
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Current estimate
  const [currentEstimate, setCurrentEstimate] = useState<SwapEstimate | undefined>(undefined);

  // Check for transaction results in URL
  useEffect(() => {
    const errorCode = new URLSearchParams(window.location.search).get('errorCode');
    const transactions = new URLSearchParams(window.location.search).get('transactionHashes');
    const errorMessage = new URLSearchParams(window.location.search).get('errorMessage');
    const lastTX = transactions?.split(',').pop();

    if (errorCode) {
      console.warn('[SwapWidget] Transaction error:', errorCode, errorMessage);
      setSwapState('fail');
      setError(errorMessage ?? 'Transaction failed');
    } else if (lastTX) {
      console.warn('[SwapWidget] Transaction success:', lastTX);
      setSwapState('success');
      setTx(lastTX);
    }

    // Clean up URL
    window.history.replaceState({}, '', window.location.origin + window.location.pathname);
  }, []);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (!accountId || !selector) {
      console.warn('[Balance] Skipping fetch - accountId:', accountId, 'selector:', !!selector);
      return;
    }

    console.warn('[Balance] Fetching balances for account:', accountId);
    setIsLoadingBalances(true);
    try {
      const newBalances: Record<string, string> = {};

      // Fetch NEAR balance
      console.warn('[Balance] Fetching NEAR balance...');
      const provider = new providers.JsonRpcProvider({ url: selector.options.network.nodeUrl });
      const account = (await provider.query({
        request_type: 'view_account',
        account_id: accountId,
        finality: 'final',
      })) as any;
      const nearBalance = account.amount; // This is in yoctoNEAR
      console.warn('[Balance] Raw NEAR balance:', nearBalance);
      newBalances['wrap.near'] = formatTokenAmount(nearBalance, 24, 6);
      console.warn('[Balance] Formatted NEAR balance:', newBalances['wrap.near']);

      // Fetch FT token balances
      const tokensToFetch = [tokenIn, tokenOut].filter(Boolean);
      console.warn(
        '[Balance] Tokens to fetch:',
        tokensToFetch.map((t) => t?.id)
      );
      for (const token of tokensToFetch) {
        if (token && token.id !== 'wrap.near') {
          try {
            console.warn(`[Balance] Fetching balance for ${token.id}...`);
            const provider = new providers.JsonRpcProvider({
              url: selector.options.network.nodeUrl,
            });
            const result = (await provider.query({
              request_type: 'call_function',
              account_id: token.id,
              method_name: 'ft_balance_of',
              args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString(
                'base64'
              ),
              finality: 'optimistic',
            })) as any;
            const balance = JSON.parse(Buffer.from(result.result).toString());
            console.warn(`[Balance] Raw balance for ${token.id}:`, balance);
            newBalances[token.id] = formatTokenAmount(balance, token.decimals, 6);
            console.warn(`[Balance] Formatted balance for ${token.id}:`, newBalances[token.id]);
          } catch (err) {
            console.warn(`Failed to fetch balance for ${token.id}:`, err);
            newBalances[token.id] = '0';
          }
        }
      }

      console.warn('[Balance] Final balances:', newBalances);
      setBalances(newBalances);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [accountId, selector, tokenIn, tokenOut]);

  // Fetch balances when account changes
  useEffect(() => {
    fetchBalances().catch(() => {});
  }, [fetchBalances]);

  // Estimate output amount
  const estimateOutput = useCallback(async () => {
    if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) <= 0) {
      setEstimatedOut('');
      return;
    }

    setIsEstimating(true);
    setError(null);

    try {
      const amountInParsed = parseTokenAmount(amountIn, tokenIn.decimals);
      const estimate = await estimateSwapOutput(tokenIn.id, tokenOut.id, amountInParsed);

      if (estimate) {
        const formattedOut = formatTokenAmount(estimate.outputAmount, tokenOut.decimals, 6);
        setEstimatedOut(formattedOut);
        setCurrentEstimate(estimate); // Store the estimate
      } else {
        setEstimatedOut('');
        setError('No route found for this pair');
        setCurrentEstimate(undefined);
      }
    } catch (err: any) {
      console.error('[SwapWidget] Estimate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to estimate swap');
      setEstimatedOut('');
      setCurrentEstimate(undefined);
    } finally {
      setIsEstimating(false);
    }
  }, [tokenIn, tokenOut, amountIn, estimateSwapOutput]);

  // Debounced estimate
  useEffect(() => {
    const timer = setTimeout(() => {
      void estimateOutput();
    }, 500);

    return () => clearTimeout(timer);
  }, [estimateOutput, amountIn, tokenIn, tokenOut]);

  // Auto-estimate when inputs change
  useEffect(() => {
    if (tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0) {
      void estimateOutput();
    }
  }, [estimateOutput, amountIn, tokenIn, tokenOut]);

  // Swap tokens (reverse)
  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn('');
    setEstimatedOut('');
  };

  // Execute swap
  const handleSwap = async () => {
    if (!accountId || !selector || !tokenIn || !tokenOut || !amountIn) {
      setError('Please connect wallet and enter amount');
      return;
    }

    if (parseFloat(amountIn) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSwapping(true);
    setError(null);

    try {
      console.warn('[SwapWidget] Starting swap...');

      // Step 1: Ensure storage deposits
      console.warn('[SwapWidget] Checking storage deposits...');
      await ensureStorageDeposit(tokenIn.id, accountId, selector);
      await ensureStorageDeposit(tokenOut.id, accountId, selector);

      // Step 2: Execute swap
      const amountInParsed = parseTokenAmount(amountIn, tokenIn.decimals);
      const transactions = await executeSwap(
        tokenIn.id,
        tokenOut.id,
        amountInParsed,
        slippage,
        currentEstimate
      );

      console.warn('[SwapWidget] Transactions prepared:', transactions.length);

      // Step 3: Sign and send using WalletSelectorTransactions helper
      const wallet = await selector.wallet();
      const walletTxs = WalletSelectorTransactions(transactions, accountId);

      await wallet.signAndSendTransactions(walletTxs);

      setSwapState('waitingForConfirmation');
    } catch (err: any) {
      console.error('[SwapWidget] Swap error:', err);
      setError(err instanceof Error ? err.message : 'Swap failed');
      setSwapState('fail');
    } finally {
      setIsSwapping(false);
    }
  };

  // Slippage setting
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setCustomSlippage('');
  };

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setSlippage(numValue);
    }
  };

  const canSwap =
    tokenIn &&
    tokenOut &&
    amountIn &&
    parseFloat(amountIn) > 0 &&
    estimatedOut &&
    !isSwapping &&
    accountId;

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Main Card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground">Swap Tokens</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Slippage Tolerance</p>
              <div className="flex gap-2 mb-2">
                {SLIPPAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleSlippageChange(preset.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      slippage === preset.value && !customSlippage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted-foreground/10'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customSlippage}
                  onChange={(e) => handleCustomSlippage(e.target.value)}
                  placeholder="Custom"
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm"
                  min="0"
                  max="50"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-primary/10 rounded">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your transaction will revert if the price changes unfavorably by more than this
                percentage.
              </p>
            </div>
          </div>
        )}

        {/* Pool Loading State */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <p className="text-sm text-blue-500">Loading liquidity pools...</p>
          </div>
        )}

        {/* Pool Error State */}
        {swapError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-500 flex-1">Failed to load pools: {swapError}</p>
            <button
              onClick={() => refreshPools().catch((e) => console.warn(e))}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
              title="Retry loading pools"
            >
              <RefreshCw className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Token In */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">From</label>
            {accountId && tokenIn && (
              <span className="text-xs text-muted-foreground">
                Balance: {isLoadingBalances ? '...' : balances[tokenIn.id] || '0'}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-semibold outline-none"
                  disabled={!accountId}
                />
              </div>
              <div className="flex flex-col items-end">
                <TokenSelect
                  selectedToken={tokenIn}
                  onSelectToken={setTokenIn}
                  otherToken={tokenOut}
                  label="Select"
                />
              </div>
            </div>
            {tokenIn && amountIn && tokenPrices[tokenIn.id]?.price && (
              <div className="px-1">
                <span className="text-xs text-muted-foreground">
                  ≈ $
                  {(
                    parseFloat(amountIn) * parseFloat(String(tokenPrices[tokenIn.id].price))
                  ).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="p-2 bg-card border-4 border-background hover:bg-muted rounded-lg transition-all hover:rotate-180 duration-300"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        {/* Token Out */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">To</label>
            {accountId && tokenOut && (
              <span className="text-xs text-muted-foreground">
                Balance: {isLoadingBalances ? '...' : balances[tokenOut.id] || '0'}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                {isEstimating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-muted-foreground">Finding best route...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-semibold">{estimatedOut || '0.0'}</div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <TokenSelect
                  selectedToken={tokenOut}
                  onSelectToken={setTokenOut}
                  otherToken={tokenIn}
                  label="Select"
                />
              </div>
            </div>
            {tokenOut && estimatedOut && tokenPrices[tokenOut.id]?.price && (
              <div className="px-1">
                <span className="text-xs text-muted-foreground">
                  ≈ $
                  {(
                    parseFloat(estimatedOut) * parseFloat(String(tokenPrices[tokenOut.id].price))
                  ).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Swap Info */}
        {estimatedOut && !error && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">
                {(() => {
                  if (!tokenIn || !tokenOut || !amountIn || !currentEstimate) return '0';

                  // Calculate rate using contract amounts (Ref Finance method)
                  const inputContract = parseTokenAmount(amountIn, tokenIn.decimals);
                  const outputContract = currentEstimate.outputAmount;

                  // Convert to display values for rate calculation
                  const inputDisplay = parseFloat(inputContract) / Math.pow(10, tokenIn.decimals);
                  const outputDisplay =
                    parseFloat(outputContract) / Math.pow(10, tokenOut.decimals);

                  const rate = outputDisplay / inputDisplay;
                  return `1 ${tokenIn.symbol} ≈ ${rate.toFixed(6)} ${tokenOut.symbol}`;
                })()}
              </span>
            </div>
            {tokenIn && tokenPrices[tokenIn.id]?.price && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tokenIn.symbol} Price</span>
                <span className="font-medium">
                  ${parseFloat(String(tokenPrices[tokenIn.id].price)).toFixed(4)}
                </span>
              </div>
            )}
            {tokenOut && tokenPrices[tokenOut.id]?.price && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tokenOut.symbol} Price</span>
                <span className="font-medium">
                  ${parseFloat(String(tokenPrices[tokenOut.id].price)).toFixed(4)}
                </span>
              </div>
            )}
            {(() => {
              const estimate = currentEstimate;
              if (!estimate?.priceImpact) return null;
              return (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span
                    className={`font-medium ${
                      estimate.priceImpact > 5
                        ? 'text-red-500'
                        : estimate.priceImpact > 2
                          ? 'text-yellow-500'
                          : 'text-green-500'
                    }`}
                  >
                    {estimate.priceImpact > 0.01
                      ? `${estimate.priceImpact.toFixed(2)}%`
                      : '< 0.01%'}
                  </span>
                </div>
              );
            })()}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">
                {(() => {
                  const route = currentEstimate?.route;
                  return route && route.length > 1
                    ? `Auto Router (${route.length} pools)`
                    : 'Direct';
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span className="font-medium">{slippage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Referral Fee</span>
              <span className="font-medium text-green-500">Earning to vfdao.near</span>
            </div>
          </div>
        )}

        {/* High Price Impact Warning */}
        {(() => {
          const estimate = currentEstimate;
          if (!estimate?.priceImpact || estimate.priceImpact <= 5) return null;
          return (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-500">High Price Impact</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This swap will significantly affect the token price. Consider splitting into
                  smaller trades.
                </p>
              </div>
            </div>
          );
        })()}

        {/* Swap Button */}
        {!accountId ? (
          <button
            onClick={() => {
              if (modal) {
                modal.show();
              } else {
                console.error('Wallet modal not available');
              }
            }}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={handleSwap}
            disabled={!canSwap || isSwapping}
            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSwapping && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSwapping ? 'Swapping...' : 'Swap'}
          </button>
        )}

        {/* Powered by Ref Finance */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a
              href="https://ref.finance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Ref Finance
            </a>
          </p>
        </div>
      </div>

      {/* Success/Fail Modal */}
      {swapState && swapState !== 'waitingForConfirmation' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="text-center space-y-4">
              {swapState === 'success' ? (
                <>
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold">Swap Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your swap has been completed successfully
                  </p>
                  {tx && (
                    <a
                      href={`https://nearblocks.io/txns/${tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                    >
                      View on Explorer <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold">Swap Failed</h3>
                  <p className="text-sm text-muted-foreground">
                    {error ?? 'Something went wrong with your swap'}
                  </p>
                </>
              )}
              <button
                onClick={() => {
                  setSwapState(null);
                  setTx(undefined);
                  setError(null);
                  setAmountIn('');
                  setEstimatedOut('');
                  void fetchBalances(); // Refresh balances after swap
                }}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
