'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Coins } from 'lucide-react';
import { getTokenMetadata } from '@/lib/swap-utils';
import type { TokenMetadata } from '@/types';

interface TokenAmountProps {
  amount: string;
  tokenId?: string;
  className?: string;
  showIcon?: boolean;
  decimals?: number;
  showBadge?: boolean;
}

export function TokenAmount({
  amount,
  tokenId,
  className = '',
  showIcon = true,
  decimals,
  showBadge = true
}: TokenAmountProps) {
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  // Determine if this is NEAR (empty token_id or 'near')
  const isNear = !tokenId || tokenId === '' || tokenId.toLowerCase() === 'near';

  useEffect(() => {
    if (!isNear && tokenId) {
      setLoading(true);
      getTokenMetadata(tokenId)
        .then(setTokenMetadata)
        .catch(() => setTokenMetadata(null))
        .finally(() => setLoading(false));
    }
  }, [tokenId, isNear]);

  // Format the amount
  const formatAmount = (rawAmount: string, _tokenDecimals = 24) => {
    const numAmount = parseInt(rawAmount);
    if (isNaN(numAmount)) return '0';

    // Use provided decimals or default to 24 for NEAR, 6 for tokens
    const actualDecimals = decimals ?? (isNear ? 24 : 6);
    const formatted = (numAmount / Math.pow(10, actualDecimals)).toFixed(2);

    // Remove trailing zeros
    return formatted.replace(/\.?0+$/, '');
  };

  const displayAmount = formatAmount(amount, tokenMetadata?.decimals ?? (isNear ? 24 : 6));
  const symbol = tokenMetadata?.symbol ?? (isNear ? 'NEAR' : tokenId?.split('.')[0]?.toUpperCase() ?? 'TOKEN');

  if (loading) {
    return (
      <span className={`text-primary text-sm font-medium ${className}`}>
        <span className="opacity-50">{displayAmount} {symbol}</span>
      </span>
    );
  }

  if (!showBadge) {
    return (
      <span className={`text-primary text-sm font-medium ${className}`}>
        {displayAmount} {symbol}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-verified bg-verified/10 text-primary text-xs font-medium font-mono ${className}`}>
      {showIcon && (
        <div className="w-4 h-4 rounded-full bg-verified/20 flex items-center justify-center">
          {isNear ? (
            <Coins className="w-2.5 h-2.5" />
          ) : tokenMetadata?.icon ? (
            <Image
              src={tokenMetadata.icon}
              alt={symbol}
              width={10}
              height={10}
              className="rounded-full"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                // Fallback to Coins icon if image fails
                e.currentTarget.style.display = 'none';
                const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallbackIcon) fallbackIcon.style.display = 'inline';
              }}
            />
          ) : null}
          {/* Fallback Coins icon (hidden by default, shown on image error) */}
          {!isNear && !tokenMetadata?.icon && <Coins className="w-2.5 h-2.5" style={{ display: 'none' }} />}
        </div>
      )}
      <span>{displayAmount} {symbol}</span>
    </div>
  );
}