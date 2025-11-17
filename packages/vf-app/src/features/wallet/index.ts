/**
 * Wallet Feature - Public API
 * 
 * This module provides wallet connection and management functionality
 * for the VF DAO application using NEAR wallet selector.
 */

// Components
export { WalletButton } from './components/WalletButton';
export { WalletProviderWrapper } from './components/WalletProviderWrapper';

// Context & Hooks
export { WalletProvider, useWallet } from './contexts/wallet-context';

// Types
export type { WalletContextType } from './contexts/wallet-context';
