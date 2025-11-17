/**
 * Pool Type Definitions
 * 
 * Shared pool-related interfaces for Ref Finance liquidity pools.
 */

import type { TokenMetadata } from './token';

/**
 * Pool information for liquidity operations
 * Used across LiquidityCard and related components
 */
export interface PoolInfo {
  id: number;
  token1: TokenMetadata;
  token2: TokenMetadata;
  reserves: Record<string, string>;
  shareSupply: string;
}

/**
 * Pool statistics (APY, volume, fees)
 */
export interface PoolStats {
  volume24h: string;
  fee24h: string;
  apy: number;
}

/**
 * Raw pool data from Ref Finance RPC/indexer API
 */
export interface PoolDataRaw {
  id: number;
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
  tvl: string;
  token0_ref_price: string;
  pool_kind?: string;
}

/**
 * Processed pool data for database storage
 */
export interface PoolData {
  id: number;
  tokenIds: string[];
  supplies: Record<string, string>;
  fee: number;
  shareSupply: string;
  token0_ref_price: string;
  Dex: string;
}

/**
 * Pool view from indexer API
 */
export interface PoolView {
  id: number;
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
  tvl: string;
  token0_ref_price: string;
  pool_kind?: string;
}

/**
 * Processed pool data for application use
 */
export interface Pool {
  id: number;
  tokenIds: string[];
  supplies: Record<string, string>;
  fee: number;
  shareSupply: string;
  tvl: string;
  token0_ref_price: string;
  pool_kind?: string;
  Dex?: string;
}
