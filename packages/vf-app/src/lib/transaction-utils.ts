/**
 * Transaction Utilities
 * 
 * Shared utilities for handling blockchain transactions across the application.
 */

/**
 * Detects if an error represents a user cancellation of a transaction.
 * 
 * This handles various ways wallets signal cancellation:
 * - Null/undefined errors
 * - Empty objects
 * - Error messages containing rejection keywords
 * 
 * @param err - The error to check
 * @returns true if the error represents user cancellation
 * 
 * @example
 * ```typescript
 * try {
 *   await wallet.signAndSendTransaction(...);
 * } catch (err) {
 *   if (isUserCancellation(err)) {
 *     // Show cancellation modal
 *   } else {
 *     // Show error modal
 *   }
 * }
 * ```
 */
export function isUserCancellation(err: unknown): boolean {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const isNullError = err === null || err === undefined;
  const isEmptyObject = Boolean(
    err && 
    typeof err === 'object' && 
    !Array.isArray(err) && 
    Object.keys(err).length === 0
  );
  
  // Common cancellation keywords across different wallet implementations
  const rejectionKeywords = [
    'User rejected',
    'User closed the window',
    'Request was cancelled',
    'User denied',
    'cancelled',
    'Transaction was cancelled',
    'User cancelled',
    'Wallet closed'
  ];
  
  const hasRejectionKeywords = rejectionKeywords.some(keyword => 
    errorMessage.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return isNullError || isEmptyObject || hasRejectionKeywords;
}

/**
 * Extracts a user-friendly error message from various error types.
 * 
 * @param err - The error to extract a message from
 * @param fallback - Fallback message if extraction fails
 * @returns User-friendly error message
 */
export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (!err) return fallback;
  
  if (err instanceof Error) {
    return err.message;
  }
  
  if (typeof err === 'string') {
    return err;
  }
  
  if (typeof err === 'object') {
    return JSON.stringify(err);
  }
  
  return fallback;
}
