'use client';

import React from 'react';
import Big from 'big.js';
import { AlertCircle } from 'lucide-react';
import type { SwapEstimate } from '@/types';

interface SwapWarningsProps {
  accountId: string | null;
  error: string | null;
  currentEstimate: SwapEstimate | undefined;
  tokenOutId: string | undefined;
  rawBalancesNear: string | undefined;
}

export const SwapWarnings: React.FC<SwapWarningsProps> = ({
  accountId,
  error,
  currentEstimate,
  tokenOutId,
  rawBalancesNear,
}) => {
  if (!accountId) return null;

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-full shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm sm:text-base text-red-500">{error}</p>
        </div>
      )}

      {/* High Price Impact Warning */}
      {currentEstimate?.priceImpact && currentEstimate.priceImpact > 5 && (
        <div className="flex items-start gap-2 p-3 border border-orange/30 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4 h-4 text-orange mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-orange">High Price Impact</p>
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
          <div className="flex items-start gap-2 p-3 border border-orange/30 rounded-2xl text-orange animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4 mt-0.5 text-orange" />
            <div className="flex-1">
              <p className="text-xs font-medium text-orange">
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
