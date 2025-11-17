import React from 'react';
import { Check, ExternalLink, X, XCircle } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-300">
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
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto animate-scale-in">
        <Check className="w-6 h-6 sm:w-8 sm:h-8 text-secondary animate-check-in" />
      </div>
      
      <h3 className="text-base sm:text-lg font-bold animate-fade-in">{title}</h3>

      {details && details.length > 0 && (
        <div className="space-y-2 text-xs sm:text-sm animate-fade-in">
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
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange/20 rounded-full flex items-center justify-center mx-auto animate-shake">
        <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange" />
      </div>
      
      <h3 className="text-base sm:text-lg font-bold animate-fade-in">Transaction Failed</h3>
      
      {error && <p className="text-xs sm:text-sm text-muted-foreground animate-fade-in">{error}</p>}

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
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-verified/20 rounded-full flex items-center justify-center mx-auto animate-scale-in">
        <X className="w-6 h-6 sm:w-8 sm:h-8 text-verified" />
      </div>
      
      <h3 className="text-base sm:text-lg font-bold animate-fade-in">{title}</h3>
      
      <p className="text-xs sm:text-sm text-muted-foreground animate-fade-in">{message}</p>

      <Button onClick={onClose} variant="verified" className="w-full py-2 sm:py-3 font-bold">
        Close
      </Button>
    </TransactionModalWrapper>
  );
}
