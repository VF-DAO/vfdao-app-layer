'use client';

/**
 * Liquidity Management Component - REFACTORED ✅
 *
 * This component provides functionality to add and remove liquidity from the NEAR-VEGANFRIENDS pool.
 * It integrates with Ref Finance's liquidity pool operations.
 * 
 * REFACTORING COMPLETE:
 * - Phase 1: ✅ Extracted 5 hooks, 7 UI components
 * - Phase 2: ✅ Integrated all hooks and components 
 * - Phase 3: ✅ Fixed all lint warnings and removed duplicate code
 * 
 * Original: 2,744 lines → Current: 1,941 lines (803 lines removed, 29.3% reduction)
 * 
 * Integrated modules:
 * - Hooks: useLiquidityPool, useLiquidityStats, useWalletBalances, useRefBalances, useUserShares
 * - Components: PoolStatsDisplay, UserLiquidityDisplay, SlippageSettings, ActionButtons, 
 *               EmptyLiquidityState, LoadingOverlay
 * 
 * Note: Calculation utilities (calculations.calculateOptimalAmount, calculations.formatDollarAmount, etc.) remain as
 * local useCallback implementations. This is intentional - they need component state access
 * and are optimized for React's rendering cycle. The extracted utility versions are available
 * for reuse in other components.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Big from 'big.js';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from '@/features/wallet';
import { getMainnetTokens } from '@/lib/swap-utils';
import { expandVariants, transitions } from '@/lib/animations';
import type { TokenMetadata } from '@/types';

// === REFACTORED IMPORTS: Our modular hooks, utilities, and components ===
import {
  useLiquidityActions,
  useLiquidityCalculations,
  useLiquidityForm,
  useLiquidityPool,
  useLiquidityStats,
  useLiquidityTransaction,
  useRefBalances,
  useTokenPrices,
  useUserShares,
  useWalletBalances,
} from '../hooks';

import {
  ActionButtons,
  AddLiquidityForm,
  EmptyLiquidityState,
  LiquidityModals,
  LoadingOverlay,
  PoolStatsDisplay,
  RemoveLiquidityForm,
  SlippageSettings,
  UserLiquidityDisplay,
} from './subcomponents';

export const LiquidityCard: React.FC = () => {
  const { accountId } = useWallet();

  // Constants (must be before hooks that use them)
  const POOL_ID = 5094; // NEAR-VEGANFRIENDS pool
  const VF_TOKEN = 'veganfriends.tkn.near';

  // Form state hook - manages liquidity form state, form.slippage, and token amounts
  const form = useLiquidityForm();

  // Transaction state hook - manages transaction execution state
  const transaction = useLiquidityTransaction();
  
  // Ref to prevent duplicate balance fetches
  const balancesFetchedRef = useRef(false);
  
  // Refs for scroll-into-view when forms open
  const addFormRef = useRef<HTMLDivElement>(null);
  const removeFormRef = useRef<HTMLDivElement>(null);
  
  // Snapshot state to prevent modal values from flickering
  const [finalToken1Amount, setFinalToken1Amount] = useState<string | null>(null);
  const [finalToken2Amount, setFinalToken2Amount] = useState<string | null>(null);
  const [finalUserShares, setFinalUserShares] = useState<string | null>(null);
  
  // Available tokens (needed by useLiquidityPool hook)
  const [availableTokens, setAvailableTokens] = useState<TokenMetadata[]>([]);

  // Pool Data - using hook instead of manual state/fetch
  const { poolInfo, isLoadingPool, error: poolError, refetchPool } = useLiquidityPool(POOL_ID, availableTokens);

  // User shares - using hook instead of manual state/fetch
  const { userShares, isLoadingShares, refetchShares, setLoadingState: setIsLoadingShares } = useUserShares(POOL_ID, accountId);

  // Balances - using hook instead of manual state/fetch
  const { rawBalances, isLoadingBalances, refetchBalances, setLoadingState: setIsLoadingBalances } = useWalletBalances(accountId);

  // Ref Finance internal balances - using hook instead of manual function
  const { refBalances: _refBalances, isLoadingRefBalances: _isLoadingRefBalances, refetchRefBalances: _refetchRefBalances, getRefDepositedBalances } = useRefBalances(
    accountId,
    VF_TOKEN
  );

  // Token Prices - using hook for clean price fetching
  // isLoading: initial load (dots), isRefreshing: subsequent refreshes (fade)
  const { tokenPrices, isLoading: isLoadingPrices, isRefreshing: isRefreshingPrices } = useTokenPrices(poolInfo);

  // Pool Stats (Volume, Fee, APY) - using hook instead of manual state/fetch
  const { poolStats, hasLoadedPoolStats } = useLiquidityStats(
    POOL_ID,
    poolInfo,
    tokenPrices,
    transaction.transactionState
  );

  // Calculation utilities hook
  const calculations = useLiquidityCalculations(poolInfo);

  // Transaction actions hook - handles add/remove liquidity operations
  const actions = useLiquidityActions({
    poolId: POOL_ID,
    poolInfo,
    token1Amount: form.token1Amount,
    token2Amount: form.token2Amount,
    slippage: form.slippage,
    userShares,
    getRefDepositedBalances,
    onTransactionStart: () => {
      transaction.setTransactionState('waitingForConfirmation');
      transaction.setError(null);
    },
    onTransactionSuccess: (txHash: string) => {
      // Capture snapshots at transaction time to prevent modal values from flickering
      setFinalToken1Amount(form.token1Amount);
      setFinalToken2Amount(form.token2Amount);
      
      transaction.setTx(txHash);
      transaction.setTransactionState('success');
    },
    onTransactionError: (error: string) => {
      transaction.setError(error);
      transaction.setTransactionState('fail');
    },
    onTransactionCancelled: () => {
      transaction.setTransactionState('cancelled');
      transaction.setError(null);
    },
    onTransactionWaiting: () => {
      transaction.setTransactionState('waitingForConfirmation');
    },
    refetchBalances: () => void refetchBalances(),
    refetchShares: () => void refetchShares(),
    refetchPool: () => void refetchPool(),
  });

  // Fetch token metadata
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const tokens = await getMainnetTokens();
        setAvailableTokens(tokens);
      } catch (error) {
        console.error('[LiquidityCard] Failed to fetch token metadata:', error);
      }
    };
    void fetchTokens();
  }, []);

  // Note: Token prices now fetched by useTokenPrices hook
  // Note: fetchPoolStats removed - using useLiquidityStats hook instead
  // Note: fetchPoolInfo removed - using useLiquidityPool hook instead
  // Note: fetchBalances removed - using useWalletBalances hook instead
  // Note: fetchUserShares removed - using useUserShares hook instead
  // Note: fetchRefInternalBalances and getRefDepositedBalances removed - using useRefBalances hook instead

  // Load data on mount and when account changes
  useEffect(() => {
    // Note: Pool info now fetched automatically by useLiquidityPool hook
    // Note: Wallet balances now fetched automatically by useWalletBalances hook
    // Note: Ref balances now fetched automatically by useRefBalances hook
    // Note: User shares now fetched automatically by useUserShares hook
    if (!accountId) {
      // Reset UI-only state when wallet disconnects
      // Note: Data fetching hooks handle their own state reset
      form.resetForm();
      transaction.resetTransactionState();
    }
  }, [accountId, form, transaction]);

  // Fetch updated balances when transaction succeeds (like swap does)
  useEffect(() => {
    if (transaction.transactionState === 'success' && !balancesFetchedRef.current) {
      balancesFetchedRef.current = true;
      
      // Set loading state immediately
      setIsLoadingBalances(true);
      setIsLoadingShares(true);
      
      // Wait 1.5s for on-chain state to propagate, then fetch fresh balances
      setTimeout(() => {
        void refetchBalances();
        void refetchShares().then((freshShares) => {
          // Capture final shares for the success modal (exactly like swap captures finalBalance)
          setFinalUserShares(freshShares);
          
          // Refresh TokenBalance and PortfolioDashboard components
          if (typeof window !== 'undefined') {
            if ((window as any).refreshTokenBalance) {
              (window as any).refreshTokenBalance();
            }
            if ((window as any).refreshPortfolioDashboard) {
              (window as any).refreshPortfolioDashboard();
            }
          }
        }).catch((error) => {
          console.warn('[LiquidityWidget] Failed to fetch shares after transaction success:', error);
        });
      }, 1500);
    }
    // Reset the ref when transaction state changes away from success
    if (transaction.transactionState !== 'success') {
      balancesFetchedRef.current = false;
    }
  }, [transaction.transactionState, refetchBalances, refetchShares, setIsLoadingBalances, setIsLoadingShares]);


  // Handle token amount changes
  const handleToken1AmountChange = (amount: string) => {
    form.setToken1Amount(amount);
    
    // Clear the message when user manually types
    form.setShowGasReserveMessage(false);
    
    // Check if we need to show gas reserve warning
    if (poolInfo && (poolInfo.token1.id === 'wrap.near' || poolInfo.token1.id === 'near') && amount && rawBalances[poolInfo.token1.id]) {
      const rawBalance = rawBalances[poolInfo.token1.id];
      const reserveAmount = Big(0.25).mul(Big(10).pow(24)); // 0.25 NEAR in yocto
      const requestedAmount = Big(amount).mul(Big(10).pow(poolInfo.token1.decimals)); // User input in yocto
      const maxAvailable = Big(rawBalance).minus(reserveAmount); // Max they can have
      
      // Only show gas reserve message if amount is within balance but exceeds (balance - 0.25)
      // If amount exceeds total balance, insufficient funds message will show instead
      if (requestedAmount.lte(Big(rawBalance)) && requestedAmount.gt(maxAvailable) && maxAvailable.gt(0)) {
        form.setShowGasReserveInfo(true);
      } else {
        form.setShowGasReserveInfo(false);
      }
    } else {
      form.setShowGasReserveInfo(false);
    }
    
    if (form.liquidityState === 'add') {
      if (amount && amount !== '0') {
        const optimalAmount = calculations.calculateOptimalAmount(amount, poolInfo?.token1.id ?? '');
        form.setToken2Amount(optimalAmount);
      } else {
        // Clear the other field when this field is empty or 0
        form.setToken2Amount('');
      }
    }
  };

  const handleToken2AmountChange = (amount: string) => {
    form.setToken2Amount(amount);
    if (form.liquidityState === 'add') {
      if (amount && amount !== '0') {
        const optimalAmount = calculations.calculateOptimalAmount(amount, poolInfo?.token2.id ?? '');
        form.setToken1Amount(optimalAmount);
      } else {
        // Clear the other field when this field is empty or 0
        form.setToken1Amount('');
      }
    }
  };

  // Slippage handlers
  const handleSlippageChange = (value: number) => {
    form.setSlippage(value);
    form.setCustomSlippage('');
  };

  const handleCustomSlippage = (value: string) => {
    form.setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      form.setSlippage(numValue);
    }
  };

  // REMOVED: handleAddLiquidity and handleRemoveLiquidity - now in useLiquidityActions hook
  // The hook provides: actions.handleAddLiquidity and actions.handleRemoveLiquidity

  // Handler functions for AddLiquidityForm component
  const handleToken1PercentClick = (percent: number) => {
    const rawBalance = rawBalances[poolInfo?.token1.id ?? ''];
    if (!poolInfo || !rawBalance) return;
    
    let availableBalance = Big(rawBalance);
    let reserveApplied = false;
    
    if (poolInfo.token1.id === 'wrap.near' || poolInfo.token1.id === 'near') {
      const reserveAmount = Big(0.25).mul(Big(10).pow(24));
      const requestedAmount = Big(rawBalance).mul(percent).div(100);
      const maxAvailable = Big(rawBalance).minus(reserveAmount);
      
      if (requestedAmount.gt(maxAvailable) && maxAvailable.gt(0)) {
        reserveApplied = true;
      }
      availableBalance = maxAvailable.lt(0) ? Big(0) : maxAvailable;
    }
    
    const percentBalance = availableBalance.mul(percent).div(100);
    const displayValue = percentBalance.div(Big(10).pow(poolInfo.token1.decimals)).toFixed(poolInfo.token1.decimals, Big.roundDown);
    
    form.setShowGasReserveInfo(false);
    form.setShowGasReserveMessage(reserveApplied);
    form.setToken1Amount(displayValue);
    
    if (form.liquidityState === 'add' && displayValue && displayValue !== '0') {
      const optimalAmount = calculations.calculateOptimalAmount(displayValue, poolInfo.token1.id);
      form.setToken2Amount(optimalAmount);
    }
  };

  const handleToken1MaxClick = () => {
    const rawBalance = rawBalances[poolInfo?.token1.id ?? ''];
    if (!poolInfo || !rawBalance) return;
    
    let availableBalance = Big(rawBalance);
    let reserveApplied = false;
    
    if (poolInfo.token1.id === 'wrap.near' || poolInfo.token1.id === 'near') {
      const reserveAmount = Big(0.25).mul(Big(10).pow(24));
      const maxAvailable = Big(rawBalance).minus(reserveAmount);
      
      if (Big(rawBalance).gt(reserveAmount)) {
        reserveApplied = true;
      }
      availableBalance = maxAvailable.lt(0) ? Big(0) : maxAvailable;
    }
    
    const displayValue = availableBalance.div(Big(10).pow(poolInfo.token1.decimals)).toFixed(poolInfo.token1.decimals, Big.roundDown);
    
    form.setShowGasReserveInfo(false);
    form.setShowGasReserveMessage(reserveApplied);
    form.setToken1Amount(displayValue);
    
    if (form.liquidityState === 'add' && displayValue && displayValue !== '0') {
      const optimalAmount = calculations.calculateOptimalAmount(displayValue, poolInfo.token1.id);
      form.setToken2Amount(optimalAmount);
    }
  };

  const handleToken2PercentClick = (percent: number) => {
    const rawBalance = rawBalances[poolInfo?.token2.id ?? ''];
    if (!poolInfo || !rawBalance) return;
    
    const percentBalance = Big(rawBalance).mul(percent).div(100);
    const displayValue = percentBalance.div(Big(10).pow(poolInfo.token2.decimals)).toFixed(poolInfo.token2.decimals, Big.roundDown);
    form.setToken2Amount(displayValue);
    
    if (form.liquidityState === 'add' && displayValue && displayValue !== '0') {
      const optimalAmount = calculations.calculateOptimalAmount(displayValue, poolInfo.token2.id);
      form.setToken1Amount(optimalAmount);
    }
  };

  const handleToken2MaxClick = () => {
    const rawBalance = rawBalances[poolInfo?.token2.id ?? ''];
    if (!poolInfo || !rawBalance) return;
    
    const displayValue = Big(rawBalance).div(Big(10).pow(poolInfo.token2.decimals)).toFixed(poolInfo.token2.decimals, Big.roundDown);
    form.setToken2Amount(displayValue);
    
    if (form.liquidityState === 'add' && displayValue && displayValue !== '0') {
      const optimalAmount = calculations.calculateOptimalAmount(displayValue, poolInfo.token2.id);
      form.setToken1Amount(optimalAmount);
    }
  };

  const handleAddLiquidityCancel = () => {
    form.setLiquidityState(null);
    form.setToken1Amount('');
    form.setToken2Amount('');
    form.setShowGasReserveInfo(false);
    form.setShowGasReserveMessage(false);
  };

  // Handler functions for RemoveLiquidityForm component
  const handleSharesPercentClick = (percent: number) => {
    if (!userShares) return;
    const percentShares = Big(userShares).mul(percent).div(100);
    const displayValue = percentShares.div(Big(10).pow(24)).toFixed(24, Big.roundDown);
    form.setToken1Amount(displayValue);
  };

  const handleSharesMaxClick = () => {
    if (!userShares) return;
    const displayValue = Big(userShares).div(Big(10).pow(24)).toFixed(24, Big.roundDown);
    form.setToken1Amount(displayValue);
  };

  const handleRemoveLiquidityCancel = () => {
    form.setLiquidityState(null);
    form.setToken1Amount('');
    form.setToken2Amount('');
    form.setShowGasReserveInfo(false);
    form.setShowGasReserveMessage(false);
  };

  // Scroll form into view when it opens
  const scrollFormIntoView = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    // Wait for animation to start, then scroll
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  // Effect to scroll when liquidity state changes to add/remove
  useEffect(() => {
    if (form.liquidityState === 'add') {
      scrollFormIntoView(addFormRef);
    } else if (form.liquidityState === 'remove') {
      scrollFormIntoView(removeFormRef);
    }
  }, [form.liquidityState, scrollFormIntoView]);

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Main Card */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-main-card relative">
        {/* Loading Overlay */}
        {isLoadingPool && <LoadingOverlay />}
        
        {/* Pool Stats Display */}
        <PoolStatsDisplay
          poolId={POOL_ID}
          poolInfo={poolInfo}
          poolStats={poolStats}
          tokenPrices={tokenPrices}
          hasLoadedPoolStats={hasLoadedPoolStats}
          isLoadingPrices={isLoadingPrices}
          isRefreshingPrices={isRefreshingPrices}
          onSettingsToggle={() => form.setShowSettings(!form.showSettings)}
        />

        {/* Settings Panel */}
        <AnimatePresence>
          {form.showSettings && (
            <motion.div
              variants={expandVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transitions.slow}
              className="overflow-hidden"
            >
              <SlippageSettings
                slippage={form.slippage}
                customSlippage={form.customSlippage}
                onSlippageChange={handleSlippageChange}
                onCustomSlippageChange={handleCustomSlippage}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Liquidity Display */}
        {poolInfo && userShares && Number(userShares) > 0 && (
          <UserLiquidityDisplay poolInfo={poolInfo} userShares={userShares} tokenPrices={tokenPrices} />
        )}

        {/* Empty State - No Liquidity */}
        {poolInfo && accountId && (!userShares || Number(userShares) === 0) && <EmptyLiquidityState />}

        {/* Action Buttons */}
        {!form.liquidityState && (
          <ActionButtons
            isWalletConnected={!!accountId}
            onAddLiquidity={() => form.setLiquidityState('add')}
            onRemoveLiquidity={() => form.setLiquidityState('remove')}
          />
        )}

      </div>

      {/* Add Liquidity Form - Separate Card */}
      <AnimatePresence mode="wait">
        {form.liquidityState === 'add' && poolInfo && (
          <motion.div
            ref={addFormRef}
            key="add-liquidity"
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitions.expand}
            className="overflow-hidden"
          >
            <AddLiquidityForm
              poolInfo={poolInfo}
              accountId={accountId}
              token1Amount={form.token1Amount}
              token2Amount={form.token2Amount}
              slippage={form.slippage}
              showGasReserveInfo={form.showGasReserveInfo}
              showGasReserveMessage={form.showGasReserveMessage}
              transactionState={transaction.transactionState}
              rawBalances={rawBalances}
              isLoadingBalances={isLoadingBalances}
              isLoadingPool={isLoadingPool}
              tokenPrices={tokenPrices}
              onToken1AmountChange={handleToken1AmountChange}
              onToken2AmountChange={handleToken2AmountChange}
              onToken1PercentClick={handleToken1PercentClick}
              onToken1MaxClick={handleToken1MaxClick}
              onToken2PercentClick={handleToken2PercentClick}
              onToken2MaxClick={handleToken2MaxClick}
              onCancel={handleAddLiquidityCancel}
              onAddLiquidity={() => void actions.handleAddLiquidity()}
              formatDollarAmount={calculations.formatDollarAmount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Liquidity Form - Separate Card */}
      <AnimatePresence mode="wait">
        {form.liquidityState === 'remove' && poolInfo && (
          <motion.div
            ref={removeFormRef}
            key="remove-liquidity"
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitions.expand}
            className="overflow-hidden"
          >
            <RemoveLiquidityForm
              poolInfo={poolInfo}
              accountId={accountId}
              token1Amount={form.token1Amount}
              userShares={userShares}
              transactionState={transaction.transactionState}
              tokenPrices={tokenPrices}
              onToken1AmountChange={form.setToken1Amount}
              onSharesPercentClick={handleSharesPercentClick}
              onSharesMaxClick={handleSharesMaxClick}
              onCancel={handleRemoveLiquidityCancel}
              onRemoveLiquidity={() => void actions.handleRemoveLiquidity()}
              calculateRemoveLiquidityAmounts={calculations.calculateRemoveLiquidityAmounts}
              formatDollarAmount={calculations.formatDollarAmount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Modals */}
      <LiquidityModals
        transactionState={transaction.transactionState}
        liquidityState={form.liquidityState}
        error={transaction.error ?? poolError}
        tx={transaction.tx}
        token1Amount={form.token1Amount}
        token2Amount={form.token2Amount}
        poolInfo={poolInfo}
        userShares={userShares}
        isLoadingShares={isLoadingShares}
        isLoadingBalances={isLoadingBalances}
        finalToken1Amount={finalToken1Amount}
        finalToken2Amount={finalToken2Amount}
        finalUserShares={finalUserShares}
        onSuccessClose={() => {
          // Reset snapshots when closing success modal
          setFinalToken1Amount(null);
          setFinalToken2Amount(null);
          setFinalUserShares(null);
          
          transaction.setTransactionState(null);
          form.setLiquidityState(null);
          form.setToken1Amount('');
          form.setToken2Amount('');
          transaction.setTx(undefined);
        }}
        onFailClose={() => {
          transaction.setTransactionState(null);
          transaction.setError(null);
        }}
        onCancelledClose={() => {
          transaction.setTransactionState(null);
          transaction.setError(null);
        }}
      />
    </div>
  );
};

export default LiquidityCard;