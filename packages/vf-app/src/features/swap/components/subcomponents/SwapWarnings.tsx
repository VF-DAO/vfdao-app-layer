'use client';

import React from 'react';
import Big from 'big.js';
import { AlertCircle, Info } from 'lucide-react';
import type { SwapEstimate } from '@/types';

interface SwapWarningsProps {
  accountId: string | null;
  error: string | null;
  showGasReserveMessage: boolean;
  currentEstimate: SwapEstimate | undefined;
  tokenOutId: string | undefined;
  rawBalancesNear: string | undefined;
}

export const SwapWarnings: React.FC<SwapWarningsProps> = ({
  accountId,
  error,
  showGasReserveMessage,
  currentEstimate,
  tokenOutId,
  rawBalancesNear,
}) => {
  if (!accountId) return null;

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-full shadow-md">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm sm:text-base text-red-500">{error}</p>
        </div>
      )}

      {/* Gas Reserve Info */}
      {showGasReserveMessage && (
        <div className="flex items-start gap-2 p-2 bg-primary/10 rounded-full">
          <Info className="w-4 h-4 text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Keeping 0.25 NEAR in your wallet for gas fees
          </p>
        </div>
      )}

      {/* High Price Impact Warning */}
      {currentEstimate?.priceImpact && currentEstimate.priceImpact > 5 && (
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl shadow-md">
          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-yellow-500">High Price Impact</p>
            <p className="text-xs text-muted-foreground mt-1">
              This swap will significantly affect the token price. Consider splitting into
              smaller trades.
            </p>
          </div>
        </div>
      )}

      {/* Low NEAR Balance Warning */}
      {(() => {
        const isSwappingFromVeganFriendsToNear = tokenOutId === 'near';
        const shouldShowWarning = !isSwappingFromVeganFriendsToNear && 
          (tokenOutId === 'near' || (rawBalancesNear && new Big(rawBalancesNear).lt(new Big('500000000000000000000000'))));
        
        if (!shouldShowWarning) return null;
        
        const isCritical = rawBalancesNear && new Big(rawBalancesNear).lt(new Big('250000000000000000000000'));
        const isSwappingToNear = tokenOutId === 'near';
        const showKeepToppedUp = isSwappingToNear || !isCritical;
        
        return (
          <div className={`flex items-start gap-2 p-3 rounded-2xl shadow-md ${
            isCritical && !isSwappingToNear
              ? 'bg-yellow-500/10 border border-yellow-500/20' 
              : 'bg-blue-500/10 border border-blue-500/20'
          }`}>
            <AlertCircle className={`w-4 h-4 mt-0.5 ${isCritical && !isSwappingToNear ? 'text-yellow-500' : 'text-blue-500'}`} />
            <div className="flex-1">
              <p className={`text-xs font-medium ${
                isCritical && !isSwappingToNear ? 'text-yellow-500' : 'text-blue-500'
              }`}>
                {showKeepToppedUp ? 'Keep your wallet topped up' : 'Almost ready to swap'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {showKeepToppedUp
                  ? isSwappingToNear
                    ? 'Keep some NEAR in your wallet for gas fees on future transactions.'
                    : 'A little more NEAR ensures smooth transactions and covers all fees.'
                  : (() => {
                      const currentNearBalance = rawBalancesNear ? new Big(rawBalancesNear).div(new Big('1000000000000000000000000')) : new Big('0');
                      const neededNear = new Big('0.25');
                      const additionalNeeded = neededNear.minus(currentNearBalance);
                      const additionalNeededStr = additionalNeeded.gt(new Big('0')) 
                        ? additionalNeeded.toFixed(4, Big.roundUp)
                        : '0.2500';
                      return `Add just ${additionalNeededStr} NEAR to cover fees and start swapping your tokens`;
                    })()
                }
              </p>
            </div>
          </div>
        );
      })()}
    </>
  );
};
