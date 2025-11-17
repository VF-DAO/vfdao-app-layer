/**
 * Token Type Definitions
 * 
 * Shared token-related interfaces used across the application.
 */

/**
 * NEP-141 Token Metadata Standard
 * Used for all token information across swap, liquidity, and wallet features
 */
export interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
  reference?: string;
  reference_hash?: string;
  spec?: string;
}

/**
 * Token with balance information
 * Extends TokenMetadata with user balance data
 */
export interface TokenWithBalance extends TokenMetadata {
  balance: string;
  balanceUSD?: string;
}

/**
 * Token price information
 */
export interface TokenPrice {
  price: string;
  symbol?: string;
  decimal?: number;
}
