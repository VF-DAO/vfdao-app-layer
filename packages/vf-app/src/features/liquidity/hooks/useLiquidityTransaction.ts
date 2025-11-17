import { useCallback, useEffect, useRef, useState } from 'react';
import type { TransactionState } from '@/types';

export interface UseLiquidityTransactionReturn {
  transactionState: TransactionState;
  tx: string | undefined;
  error: string | null;
  setError: (error: string | null) => void;
  setTransactionState: (state: TransactionState) => void;
  setTx: (tx: string | undefined) => void;
  resetTransactionState: () => void;
}

export function useLiquidityTransaction(): UseLiquidityTransactionReturn {
  const [transactionState, setTransactionState] = useState<TransactionState>(null);
  const [tx, setTx] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Store timeout ID for cleanup
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset transaction state
  const resetTransactionState = useCallback(() => {
    // Clean up any pending timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    setTransactionState(null);
    setTx(undefined);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  return {
    transactionState,
    tx,
    error,
    setError,
    setTransactionState,
    setTx,
    resetTransactionState,
  };
}
