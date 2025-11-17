/**
 * Portfolio Feature - Public API
 * 
 * This module provides portfolio management and token balance display
 * for the VF DAO application.
 */

// Components
export { default as PortfolioDashboard } from './components/PortfolioDashboard';
export { TokenBalance } from './components/TokenBalance';

// Types (re-export from global types)
export type {
  TokenMetadata,
  TokenWithBalance,
  TokenPrice,
} from '@/types';
