'use client';

import React from 'react';
import { LoadingDots } from '@/components/ui/loading-dots';
import { toInternationalCurrencySystemLongString } from '@ref-finance/ref-sdk';
import { TransactionCancelledModal, TransactionFailureModal, TransactionSuccessModal } from '@/components/ui/transaction-modal';
import { formatTokenAmount } from '@/lib/swap-utils';
import type { PoolInfo } from '@/types';

interface LiquidityModalsProps {
  transactionState: 'success' | 'fail' | 'cancelled' | 'waitingForConfirmation' | null;
  liquidityState: 'add' | 'remove' | null;
  error: string | null;
  tx: string | undefined;
  token1Amount: string;
  token2Amount: string;
  poolInfo: PoolInfo | null;
  userShares: string;
  isLoadingShares: boolean;
  isLoadingBalances: boolean;
  finalToken1Amount: string | null;
  finalToken2Amount: string | null;
  finalUserShares: string | null;
  onSuccessClose: () => void;
  onFailClose: () => void;
  onCancelledClose: () => void;
}

export const LiquidityModals: React.FC<LiquidityModalsProps> = ({
  transactionState,
  liquidityState,
  error,
  tx,
  poolInfo,
  userShares,
  isLoadingShares,
  finalToken1Amount,
  finalToken2Amount,
  finalUserShares,
  onSuccessClose,
  onFailClose,
  onCancelledClose,
}) => {
  return (
    <div className="mt-4">
      {/* Success Modal */}
      {transactionState === 'success' && (
        <TransactionSuccessModal
          title={liquidityState === 'add' ? 'Liquidity Added!' : 'Liquidity Removed!'}
          details={[
            ...(liquidityState === 'add' && finalToken1Amount && poolInfo
              ? [
                  {
                    label: `Added ${poolInfo.token1.symbol}`,
                    value: `${(() => {
                      const num = parseFloat(finalToken1Amount);
                      return num >= 1000
                        ? toInternationalCurrencySystemLongString(finalToken1Amount, 2)
                        : finalToken1Amount;
                    })()} ${poolInfo.token1.symbol}`,
                  },
                ]
              : []),
            ...(liquidityState === 'add' && finalToken2Amount && poolInfo
              ? [
                  {
                    label: `Added ${poolInfo.token2.symbol}`,
                    value: `${(() => {
                      const num = parseFloat(finalToken2Amount);
                      return num >= 1000
                        ? toInternationalCurrencySystemLongString(finalToken2Amount, 2)
                        : finalToken2Amount;
                    })()} ${poolInfo.token2.symbol}`,
                  },
                ]
              : []),
            ...(liquidityState === 'remove' && finalToken1Amount
              ? [
                  {
                    label: 'LP Shares Removed',
                    value: finalToken1Amount,
                  },
                ]
              : []),
            {
              label: liquidityState === 'remove' ? 'Remaining LP Shares' : 'LP Shares',
              value: finalUserShares !== null ? (
                formatTokenAmount(finalUserShares, 24, 6)
              ) : (
                isLoadingShares ? <LoadingDots /> : (
                  userShares 
                    ? formatTokenAmount(userShares, 24, 6)
                    : <LoadingDots />
                )
              ),
            },
          ]}
          tx={tx}
          onClose={onSuccessClose}
        />
      )}

      {/* Fail Modal */}
      {transactionState === 'fail' && (
        <TransactionFailureModal
          error={error ?? undefined}
          onClose={onFailClose}
        />
      )}

      {/* Cancelled Modal */}
      {transactionState === 'cancelled' && (
        <TransactionCancelledModal
          onClose={onCancelledClose}
        />
      )}
    </div>
  );
};
