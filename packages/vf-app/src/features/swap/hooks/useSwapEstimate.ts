import { useCallback, useEffect, useState } from 'react';
import type { SwapEstimate, TokenMetadata } from '@/types';
import {
  formatTokenAmount,
  formatTokenAmountNoAbbrev,
  parseTokenAmount,
} from '@/lib/swap-utils';

type EstimateReason = 'user' | 'auto';

const AUTO_REFRESH_INTERVAL_MS = 10_000;

export interface UseSwapEstimateReturn {
  isEstimating: boolean;
  currentEstimate: SwapEstimate | undefined;
  estimateReason: EstimateReason | null;
  estimateOutput: (reason?: EstimateReason) => Promise<void>;
  clearEstimate: () => void;
}

export function useSwapEstimate(
  tokenIn: TokenMetadata | undefined,
  tokenOut: TokenMetadata | undefined,
  amountIn: string,
  isValidNumber: (value: string) => boolean,
  estimateSwapOutput: (
    tokenInId: string,
    tokenOutId: string,
    amountIn: string
  ) => Promise<SwapEstimate | null>,
  setEstimatedOut: (value: string) => void,
  setEstimatedOutDisplay: (value: string) => void,
  setRawEstimatedOut: (value: string) => void,
  setError: (error: string | null) => void,
  lastUserInteraction: number,
  isSwapping: boolean
): UseSwapEstimateReturn {
  const [isEstimating, setIsEstimating] = useState(false);
  const [currentEstimate, setCurrentEstimate] = useState<SwapEstimate | undefined>(undefined);
  const [estimateReason, setEstimateReason] = useState<EstimateReason | null>(null);

  // Estimate output amount
  const estimateOutput = useCallback(
    async (reason: EstimateReason = 'user') => {
      if (!tokenIn || !tokenOut || !amountIn || !isValidNumber(amountIn) || parseFloat(amountIn) <= 0) {
        setEstimatedOut('');
        setEstimatedOutDisplay('');
        setRawEstimatedOut('');
        setCurrentEstimate(undefined);
        setEstimateReason(null);
        return;
      }

      setEstimateReason(reason);
      setIsEstimating(true);
      setError(null);

      try {
        const amountInParsed = parseTokenAmount(amountIn, tokenIn.decimals);
        const estimate = await estimateSwapOutput(tokenIn.id, tokenOut.id, amountInParsed);

        if (estimate) {
          const formattedOut = formatTokenAmount(estimate.outputAmount, tokenOut.decimals, 4);
          const formattedOutDisplay = formatTokenAmountNoAbbrev(estimate.outputAmount, tokenOut.decimals, 4);
          setEstimatedOut(formattedOut);
          setEstimatedOutDisplay(formattedOutDisplay);
          setRawEstimatedOut(String(estimate.outputAmount ?? '0'));
          setCurrentEstimate(estimate);
        } else {
          setEstimatedOut('');
          setEstimatedOutDisplay('');
          setRawEstimatedOut('');
          setError('No route found for this pair');
          setCurrentEstimate(undefined);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to estimate swap');
        setEstimatedOut('');
        setEstimatedOutDisplay('');
        setCurrentEstimate(undefined);
      } finally {
        setIsEstimating(false);
        setEstimateReason(null);
      }
    },
    [tokenIn, tokenOut, amountIn, isValidNumber, estimateSwapOutput, setEstimatedOut, setEstimatedOutDisplay, setRawEstimatedOut, setError]
  );

  // Clear estimate
  const clearEstimate = useCallback(() => {
    setEstimatedOut('');
    setEstimatedOutDisplay('');
    setRawEstimatedOut('');
    setCurrentEstimate(undefined);
    setEstimateReason(null);
  }, [setEstimatedOut, setEstimatedOutDisplay, setRawEstimatedOut]);

  // Debounced estimate on user input
  useEffect(() => {
    const timer = setTimeout(() => {
      void estimateOutput('user');
    }, 500);

    return () => clearTimeout(timer);
  }, [estimateOutput]);

  // Periodically refresh estimates to keep prices up to date
  useEffect(() => {
    if (!tokenIn || !tokenOut || !amountIn || !isValidNumber(amountIn)) {
      return;
    }

    const intervalId = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastUserInteraction;
      const INACTIVITY_THRESHOLD = 30_000; // 30 seconds

      // Only auto-refresh if user has been active recently and not in a transaction
      if (
        timeSinceInteraction < INACTIVITY_THRESHOLD &&
        !isEstimating &&
        !isSwapping
      ) {
        void estimateOutput('auto');
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [tokenIn, tokenOut, amountIn, isValidNumber, estimateOutput, lastUserInteraction, isSwapping, isEstimating]);

  return {
    isEstimating,
    currentEstimate,
    estimateReason,
    estimateOutput,
    clearEstimate,
  };
}
