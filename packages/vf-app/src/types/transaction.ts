/**
 * Transaction Type Definitions
 * 
 * Shared transaction-related interfaces for UI state and modals.
 */

import type { ReactNode } from 'react';

/**
 * Transaction detail for display in modals
 */
export interface TransactionDetail {
  label: string;
  value: string | ReactNode;
}

/**
 * Transaction state type
 */
export type TransactionState = 'success' | 'fail' | 'cancelled' | 'waitingForConfirmation' | null;

/**
 * Base transaction modal props
 */
export interface BaseTransactionModalProps {
  onClose: () => void;
}

/**
 * Success modal props
 */
export interface TransactionSuccessModalProps extends BaseTransactionModalProps {
  title?: string;
  details?: TransactionDetail[];
  tx?: string;
  children?: ReactNode;
}

/**
 * Failure modal props
 */
export interface TransactionFailureModalProps extends BaseTransactionModalProps {
  title?: string;
  message?: string;
  error?: string;
}

/**
 * Cancelled modal props
 */
export interface TransactionCancelledModalProps extends BaseTransactionModalProps {
  title?: string;
  message?: string;
}
