import React, { useEffect } from 'react';
import { Check, ExternalLink, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './button';
import { backdropVariants, modalVariants, scaleVariants, fadeVariants, transitions } from '@/lib/animations';
import type {
  TransactionCancelledModalProps,
  TransactionFailureModalProps,
  TransactionSuccessModalProps,
} from '@/types';

/**
 * Base modal wrapper for all transaction modals
 */
function TransactionModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={transitions.normal}
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div 
          className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-xl"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={transitions.spring}
        >
          <div className="text-center space-y-4">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Success modal for completed transactions
 */
export function TransactionSuccessModal({ title, details, tx, onClose, children }: TransactionSuccessModalProps) {
  return (
    <TransactionModalWrapper onClose={onClose}>
      <motion.div 
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto"
        variants={scaleVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.springBouncy}
      >
        <Check className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
      </motion.div>
      
      <motion.h3 
        className="text-base sm:text-lg font-bold"
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.normal, delay: 0.1 }}
      >{title}</motion.h3>

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
      <motion.div 
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto"
        variants={scaleVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.springBouncy}
      >
        <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-orange" />
      </motion.div>
      
      <motion.h3 
        className="text-base sm:text-lg font-bold"
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.normal, delay: 0.1 }}
      >Transaction Failed</motion.h3>
      
      {error && (
        <motion.p 
          className="text-xs sm:text-sm text-muted-foreground"
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          transition={{ ...transitions.normal, delay: 0.15 }}
        >{error}</motion.p>
      )}

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
      <motion.div 
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto"
        variants={scaleVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.springBouncy}
      >
        <X className="w-8 h-8 sm:w-10 sm:h-10 text-verified" />
      </motion.div>
      
      <motion.h3 
        className="text-base sm:text-lg font-bold"
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.normal, delay: 0.1 }}
      >{title}</motion.h3>
      
      <motion.p 
        className="text-xs sm:text-sm text-muted-foreground"
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.normal, delay: 0.15 }}
      >{message}</motion.p>

      <Button onClick={onClose} variant="verified" className="w-full py-2 sm:py-3 font-bold">
        Close
      </Button>
    </TransactionModalWrapper>
  );
}
