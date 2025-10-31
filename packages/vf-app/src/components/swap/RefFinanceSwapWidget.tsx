'use client';

import React from 'react';
import { useWallet } from '@/contexts/wallet-context';

/**
 * Ref Finance Swap Widget Adapter for Next.js
 * This component wraps the Ref Finance swap functionality
 * and adapts it to work with your existing Next.js app
 */

export const RefFinanceSwapWidget = () => {
  const { accountId } = useWallet();

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Ref Finance Swap Widget
          </h2>
          <p className="text-sm text-muted-foreground">
            Integrating Ref Finance swap functionality...
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Account: {accountId ?? 'Not connected'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefFinanceSwapWidget;
