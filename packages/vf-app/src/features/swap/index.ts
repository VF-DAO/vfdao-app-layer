/**
 * Swap Feature - Public API
 * 
 * This module provides token swap functionality for the VF DAO application.
 * It integrates with Ref Finance for optimal swap routing and execution.
 */

// Components
export { default as RefFinanceSwapCard } from './components/RefFinanceSwapCard';
export { TokenInput } from './components/TokenInput';
export { TokenSelect } from './components/TokenSelect';
export { default as SwapWidget } from './components/SwapWidget';

// Hooks
export { useSwap } from './hooks/useSwap';

// Types (re-export from global types for convenience)
export type { 
  SwapEstimate, 
  NearTransaction,
  FunctionCall 
} from '@/types';
