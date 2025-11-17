/**
 * Liquidity Feature - Public API
 * 
 * This module provides liquidity management functionality for the VF DAO application.
 * Users can add/remove liquidity from NEAR-VEGANFRIENDS pools on Ref Finance.
 */

// Components
export { default as LiquidityCard } from './components/LiquidityCard';

// Sub-components (for advanced usage)
export { PoolStatsDisplay } from './components/subcomponents/PoolStatsDisplay';
export { UserLiquidityDisplay } from './components/subcomponents/UserLiquidityDisplay';

// Hooks
export { useLiquidityPool } from './hooks/useLiquidityPool';
export { useLiquidityStats } from './hooks/useLiquidityStats';
export { useWalletBalances } from './hooks/useWalletBalances';
export { useRefBalances } from './hooks/useRefBalances';
export { useUserShares } from './hooks/useUserShares';

// Types (re-export from global types)
export type {
  PoolInfo,
  PoolStats,
  PoolData,
} from '@/types';
