import React from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { Button } from './button';
import type {
  TransactionCancelledModalProps,
  TransactionFailureModalProps,
  TransactionSuccessModalProps,
} from '@/types';

/**
 * Base modal wrapper for all transaction modals
 */
function TransactionModalWrapper({ children, onClose: _onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-xl">
        <div className="text-center space-y-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * Success modal for completed transactions
 */
export function TransactionSuccessModal({ title, details, tx, onClose, children }: TransactionSuccessModalProps) {
  return (
    <TransactionModalWrapper onClose={onClose}>
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
      </div>
      
      <h3 className="text-base sm:text-lg font-bold">{title}</h3>

      {details && details.length > 0 && (
        <div className="space-y-2 text-xs sm:text-sm">
          {details.map((detail, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 px-3 border border-border rounded-full"
            >
              <span className="text-muted-foreground">{detail.label}</span>
              <span className="font-semibold">{detail.value}</span>
            </div>
          ))}
        </div>
      )}

      {children}

      {tx && (
        <a
          href={`https://nearblocks.io/txns/${tx}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline text-xs sm:text-sm"
        >
          View Transaction <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
        </a>
      )}

      <Button onClick={onClose} variant="verified" className="w-full py-2 sm:py-3 font-bold">
        Close
      </Button>
    </TransactionModalWrapper>
  );
}

/**
 * Failure modal for failed transactions
 */
export function TransactionFailureModal({ error, onClose }: TransactionFailureModalProps) {
  return (
    <TransactionModalWrapper onClose={onClose}>
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
      </div>
      
      <h3 className="text-base sm:text-lg font-bold">Transaction Failed</h3>
      
      {error && <p className="text-xs sm:text-sm text-muted-foreground">{error}</p>}

      <Button onClick={onClose} variant="destructive" className="w-full py-2 sm:py-3">
        Close
      </Button>
    </TransactionModalWrapper>
  );
}

/**
 * Cancelled modal for user-cancelled transactions
 */
export function TransactionCancelledModal({
  title = 'Transaction Cancelled',
  message = 'You cancelled the transaction. No changes were made.',
  onClose,
}: TransactionCancelledModalProps) {
  return (
    <TransactionModalWrapper onClose={onClose}>
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
        <Info className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
      </div>
      
      <h3 className="text-base sm:text-lg font-bold">{title}</h3>
      
      <p className="text-xs sm:text-sm text-muted-foreground">{message}</p>

      <Button onClick={onClose} variant="verified" className="w-full py-2 sm:py-3 font-bold">
        Close
      </Button>
    </TransactionModalWrapper>
  );
}
