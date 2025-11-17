import { useCallback, useState } from 'react';
import Big from 'big.js';
import type { TokenMetadata } from '@/types';

export interface UseSwapFormReturn {
  // Token selection
  tokenIn: TokenMetadata | undefined;
  tokenOut: TokenMetadata | undefined;
  setTokenIn: (token: TokenMetadata | undefined) => void;
  setTokenOut: (token: TokenMetadata | undefined) => void;
  
  // Amount inputs
  amountIn: string;
  setAmountIn: (amount: string) => void;
  estimatedOut: string;
  setEstimatedOut: (amount: string) => void;
  estimatedOutDisplay: string;
  setEstimatedOutDisplay: (amount: string) => void;
  rawEstimatedOut: string;
  setRawEstimatedOut: (amount: string) => void;
  
  // Settings
  slippage: number;
  setSlippage: (value: number) => void;
  customSlippage: string;
  setCustomSlippage: (value: string) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  
  // Rate display
  isRateReversed: boolean;
  setIsRateReversed: (reversed: boolean) => void;
  
  // Gas reserve
  showGasReserveInfo: boolean;
  setShowGasReserveInfo: (show: boolean) => void;
  showGasReserveMessage: boolean;
  setShowGasReserveMessage: (show: boolean) => void;
  
  // User interaction tracking
  lastUserInteraction: number;
  setLastUserInteraction: (timestamp: number) => void;
  
  // Actions
  handleSwapTokens: () => void;
  handleSlippageChange: (value: number) => void;
  handleCustomSlippage: (value: string) => void;
  isValidNumber: (value: string) => boolean;
  resetForm: () => void;
  
  // Amount helpers
  setAmountFromBalance: (rawBalance: string, percent: number, decimals: number, isNear: boolean) => void;
  setMaxAmount: (rawBalance: string, decimals: number, isNear: boolean) => void;
}

export function useSwapForm(): UseSwapFormReturn {
  // Token selection
  const [tokenIn, setTokenIn] = useState<TokenMetadata | undefined>(undefined);
  const [tokenOut, setTokenOut] = useState<TokenMetadata | undefined>(undefined);

  // Amounts
  const [amountIn, setAmountIn] = useState('');
  const [estimatedOut, setEstimatedOut] = useState('');
  const [estimatedOutDisplay, setEstimatedOutDisplay] = useState('');
  const [rawEstimatedOut, setRawEstimatedOut] = useState('');

  // Settings
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');

  // Rate display
  const [isRateReversed, setIsRateReversed] = useState(false);
  
  // Gas reserve
  const [showGasReserveInfo, setShowGasReserveInfo] = useState(false);
  const [showGasReserveMessage, setShowGasReserveMessage] = useState(false);
  
  // User interaction tracking
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(Date.now());

  // Helper function to check if a string is a valid number
  const isValidNumber = useCallback((value: string): boolean => {
    if (!value || value.trim() === '') return false;
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= 0;
  }, []);

  // Swap tokens (reverse)
  const handleSwapTokens = useCallback(() => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn('');
    setEstimatedOut('');
    setEstimatedOutDisplay('');
    setRawEstimatedOut('');
    setIsRateReversed(false);
    setLastUserInteraction(Date.now());
  }, [tokenIn, tokenOut]);

  // Slippage setting
  const handleSlippageChange = useCallback((value: number) => {
    setSlippage(value);
    setCustomSlippage('');
  }, []);

  const handleCustomSlippage = useCallback((value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setSlippage(numValue);
    }
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setAmountIn('');
    setEstimatedOut('');
    setEstimatedOutDisplay('');
    setRawEstimatedOut('');
    setShowGasReserveInfo(false);
    setShowGasReserveMessage(false);
  }, []);

  // Set amount from balance percentage
  const setAmountFromBalance = useCallback((rawBalance: string, percent: number, decimals: number, isNear: boolean) => {
    let finalAmount = new Big(0);
    let reserveApplied = false;
    
    // Calculate percentage of FULL balance first
    const requestedAmount = new Big(rawBalance).mul(percent).div(100);
    
    // Check if this would leave enough for gas reserve (NEAR only)
    if (isNear) {
      const reserveAmount = new Big(0.25).mul(new Big(10).pow(24)); // 0.25 NEAR in yocto
      const remainingAfterSwap = new Big(rawBalance).minus(requestedAmount);
      
      // If remaining balance would be less than reserve, cap the swap amount
      if (remainingAfterSwap.lt(reserveAmount)) {
        finalAmount = new Big(rawBalance).minus(reserveAmount);
        reserveApplied = true;
        
        // If that results in negative or zero, don't allow it
        if (finalAmount.lte(0)) {
          finalAmount = new Big(0);
        }
      } else {
        // Safe to use the requested percentage
        finalAmount = requestedAmount;
      }
    } else {
      finalAmount = requestedAmount;
    }
    
    // Convert to display format
    const displayValue = finalAmount.div(new Big(10).pow(decimals)).toFixed(decimals, Big.roundDown);
    
    // Update states
    setShowGasReserveInfo(false);
    setShowGasReserveMessage(reserveApplied);
    setLastUserInteraction(Date.now());
    setAmountIn(displayValue);
  }, []);

  // Set maximum amount
  const setMaxAmount = useCallback((rawBalance: string, decimals: number, isNear: boolean) => {
    let availableBalance = new Big(rawBalance);
    let reserveApplied = false;
    
    // Check if user is trying to use more than available (need to reduce for gas reserve)
    if (isNear) {
      const reserveAmount = new Big(0.25).mul(new Big(10).pow(24)); // 0.25 NEAR in yocto
      const maxAvailable = new Big(rawBalance).minus(reserveAmount);
      
      // MAX button always reduces amount to keep 0.25 NEAR
      if (new Big(rawBalance).gt(reserveAmount)) {
        reserveApplied = true;
      }
      availableBalance = maxAvailable.lt(0) ? new Big(0) : maxAvailable;
    }
    
    // Convert raw contract balance to display format
    const displayValue = availableBalance.div(new Big(10).pow(decimals)).toFixed(decimals, Big.roundDown);
    
    // Update states
    setShowGasReserveInfo(false);
    setShowGasReserveMessage(reserveApplied);
    setLastUserInteraction(Date.now());
    setAmountIn(displayValue);
  }, []);

  return {
    // Token selection
    tokenIn,
    tokenOut,
    setTokenIn,
    setTokenOut,
    
    // Amount inputs
    amountIn,
    setAmountIn,
    estimatedOut,
    setEstimatedOut,
    estimatedOutDisplay,
    setEstimatedOutDisplay,
    rawEstimatedOut,
    setRawEstimatedOut,
    
    // Settings
    slippage,
    setSlippage,
    customSlippage,
    setCustomSlippage,
    showSettings,
    setShowSettings,
    
    // Rate display
    isRateReversed,
    setIsRateReversed,
    
    // Gas reserve
    showGasReserveInfo,
    setShowGasReserveInfo,
    showGasReserveMessage,
    setShowGasReserveMessage,
    
    // User interaction tracking
    lastUserInteraction,
    setLastUserInteraction,
    
    // Actions
    handleSwapTokens,
    handleSlippageChange,
    handleCustomSlippage,
    isValidNumber,
    resetForm,
    
    // Amount helpers
    setAmountFromBalance,
    setMaxAmount,
  };
}
