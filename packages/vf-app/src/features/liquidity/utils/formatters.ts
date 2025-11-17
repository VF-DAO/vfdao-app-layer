import React, { type ReactElement } from 'react';

/**
 * Format dollar amount with special handling for small numbers (matches swap widget)
 * @param amount Dollar amount to format
 * @returns Formatted string or JSX element with green zeros count for small numbers
 */
export function formatDollarAmount(amount: number): string | ReactElement {
  try {
    if (amount === 0) {
      return '$0.00';
    }
    if (amount >= 0.01) {
      return `$${amount.toFixed(2)}`;
    } else {
      // Format small numbers: $0.0 followed by green zeros count and significant digits
      const fixedStr = amount.toFixed(20);
      const decimalPart = fixedStr.split('.')[1] ?? '';
      const firstNonZeroIndex = decimalPart.search(/[1-9]/);
      if (firstNonZeroIndex === -1) {
        return '$0.00';
      }
      const zerosCount = firstNonZeroIndex;
      const significantDigits = decimalPart.slice(firstNonZeroIndex, firstNonZeroIndex + 4);
      return React.createElement(
        'span',
        null,
        '$0.0',
        React.createElement('span', { className: 'text-primary text-[10px]' }, zerosCount),
        significantDigits
      );
    }
  } catch {
    return '$0.00';
  }
}

/**
 * Abbreviate large numbers with K, M, B suffixes
 * @param num Number to abbreviate
 * @param decimals Number of decimal places
 * @returns Abbreviated string (e.g., "1.5K", "2.3M")
 */
export function abbreviateNumber(num: number, decimals = 1): string {
  if (num === 0) return '0';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e9) {
    return sign + (absNum / 1e9).toFixed(decimals) + 'B';
  } else if (absNum >= 1e6) {
    return sign + (absNum / 1e6).toFixed(decimals) + 'M';
  } else if (absNum >= 1e3) {
    return sign + (absNum / 1e3).toFixed(decimals) + 'K';
  } else {
    return sign + absNum.toFixed(decimals);
  }
}

/**
 * Format percentage with specified decimal places
 * @param value Percentage value (e.g., 12.5 for 12.5%)
 * @param decimals Number of decimal places (default 2)
 * @returns Formatted percentage string (e.g., "12.50%")
 */
export function formatPercentage(value: number, decimals = 2): string {
  return value.toFixed(decimals) + '%';
}

/**
 * Format APY with appropriate precision
 * Shows more decimals for small APYs, fewer for large ones
 * @param apy APY value as percentage
 * @returns Formatted APY string
 */
export function formatAPY(apy: number): string {
  if (apy === 0) return '0.00%';
  if (apy < 0.01) return '<0.01%';
  if (apy < 1) return apy.toFixed(2) + '%';
  if (apy < 10) return apy.toFixed(2) + '%';
  return apy.toFixed(1) + '%';
}
