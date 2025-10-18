import { utils } from 'near-api-js';
import type { WalletSelector } from '@near-wallet-selector/core';

/**
 * Storage deposit configuration
 */
const STORAGE_DEPOSIT_AMOUNT = '0.00125'; // 0.00125 NEAR for FT storage
const STORAGE_CHECK_GAS = 30000000000000; // 30 TGas

/**
 * Check if an account has storage deposit for a token
 */
export async function checkStorageDeposit(
  tokenId: string,
  accountId: string,
  selector: WalletSelector
): Promise<boolean> {
  try {
    const wallet = await selector.wallet();
    const provider = wallet as any;

    // Call storage_balance_of on the token contract
    const result = await provider.account().viewFunction({
      contractId: tokenId,
      methodName: 'storage_balance_of',
      args: { account_id: accountId },
    });

    return result !== null;
  } catch (error) {
    console.error('[Storage] Check failed:', error);
    return false;
  }
}

/**
 * Register storage deposit for a token
 * Note: This is a simplified version. For production, use proper NEAR API
 */
export async function registerStorageDeposit(
  tokenId: string,
  accountId: string,
  selector: WalletSelector
): Promise<void> {
  try {
    const wallet = await selector.wallet();

    // Use the wallet's signAndSendTransaction method
    await (wallet as any).signAndSendTransaction({
      receiverId: tokenId,
      actions: [
        {
          methodName: 'storage_deposit',
          args: {
            account_id: accountId,
            registration_only: true,
          },
          gas: STORAGE_CHECK_GAS,
          deposit: utils.format.parseNearAmount(STORAGE_DEPOSIT_AMOUNT) ?? '0',
        },
      ],
    });

    console.warn('[Storage] Registered for token:', tokenId);
  } catch (error) {
    console.error('[Storage] Registration failed:', error);
    throw new Error(`Failed to register storage for ${tokenId}`);
  }
}

/**
 * Ensure storage deposit exists, register if needed
 */
export async function ensureStorageDeposit(
  tokenId: string,
  accountId: string,
  selector: WalletSelector
): Promise<void> {
  const hasStorage = await checkStorageDeposit(tokenId, accountId, selector);

  if (!hasStorage) {
    console.warn('[Storage] Registering storage for:', tokenId);
    await registerStorageDeposit(tokenId, accountId, selector);
  } else {
    console.warn('[Storage] Already registered for:', tokenId);
  }
}

/**
 * Default token list for mainnet
 */
export const MAINNET_TOKENS = [
  {
    id: 'wrap.near',
    symbol: 'wNEAR',
    name: 'Wrapped NEAR',
    decimals: 24,
    icon: 'https://assets.ref.finance/images/wrap.near.png',
  },
  {
    id: 'usdt.tether-token.near',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: 'https://assets.ref.finance/images/usdt.tether-token.near.png',
  },
  {
    id: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    symbol: 'USDC',
    name: 'USD Coin (Circle)',
    decimals: 6,
    icon: 'https://assets.ref.finance/images/17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1.png',
  },
  {
    id: 'veganfriends.tkn.near',
    symbol: 'VEGANFRIENDS',
    name: 'Vegan Friends Token',
    decimals: 18,
    icon: undefined, // Will use default icon
  },
];

/**
 * Slippage presets
 */
export const SLIPPAGE_PRESETS = [
  { label: '0.1%', value: 0.1 },
  { label: '0.5%', value: 0.5 },
  { label: '1%', value: 1 },
  { label: '3%', value: 3 },
];

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: string, decimals: number, maxDecimals = 6): string {
  const value = parseFloat(amount) / Math.pow(10, decimals);

  if (value === 0) return '0';
  if (value < 0.000001) return '< 0.000001';

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Parse token amount from user input to contract format
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (isNaN(value)) return '0';

  const multiplier = Math.pow(10, decimals);
  return Math.floor(value * multiplier).toString();
}

/**
 * Calculate minimum amount out with slippage
 */
export function calculateMinAmountOut(amount: string, slippagePercent: number): string {
  const value = parseFloat(amount);
  const minAmount = value * (1 - slippagePercent / 100);
  return Math.floor(minAmount).toString();
}

/**
 * Get token by ID from default list
 */
export function getTokenById(tokenId: string) {
  return MAINNET_TOKENS.find((token) => token.id === tokenId);
}

/**
 * Validate token swap pair
 */
export function validateSwapPair(
  tokenIn?: string,
  tokenOut?: string
): { valid: boolean; error?: string } {
  if (!tokenIn || !tokenOut) {
    return { valid: false, error: 'Please select both tokens' };
  }

  if (tokenIn === tokenOut) {
    return { valid: false, error: 'Cannot swap same token' };
  }

  return { valid: true };
}
