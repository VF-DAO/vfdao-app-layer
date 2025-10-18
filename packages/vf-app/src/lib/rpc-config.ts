// Centralized RPC Configuration
// Single source of truth for all RPC endpoints used in the application

export const RPC_CONFIG = {
  mainnet: {
    // Primary: Private Lava (fastest and most reliable)
    primary: process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET,
    // Secondary: FastNEAR (highly reliable, good performance)
    secondary: 'https://free.rpc.fastnear.com',
    // Tertiary: Private dRPC (faster than public dRPC)
    tertiary: process.env.NEXT_PUBLIC_NEAR_DRPC_PRIVATE,
    // Last resort: Official NEAR (deprecated but functional)
    fallback: 'https://rpc.mainnet.near.org',
  },
  testnet: {
    // Primary: Private Lava (fastest and most reliable)
    primary: process.env.NEXT_PUBLIC_NEAR_RPC_TESTNET,
    // Secondary: FastNEAR (highly reliable, good performance)
    secondary: 'https://test.rpc.fastnear.com',
    // Tertiary: Public dRPC (free for testnet)
    tertiary: 'https://near-testnet.drpc.org',
    // Last resort: Official NEAR (deprecated but functional)
    fallback: 'https://rpc.testnet.near.org',
  },
} as const;

// Get prioritized endpoint list for failover
export function getPrioritizedEndpoints(network: 'mainnet' | 'testnet'): string[] {
  const config = RPC_CONFIG[network];
  return [config.primary, config.secondary, config.tertiary, config.fallback].filter(
    (url): url is string => Boolean(url)
  );
}

// Get primary endpoint (for wallet selector, etc.)
export function getPrimaryEndpoint(network: 'mainnet' | 'testnet'): string {
  return RPC_CONFIG[network].primary ?? RPC_CONFIG[network].fallback;
}

// Get all endpoints for health monitoring
export function getAllEndpoints(network: 'mainnet' | 'testnet'): string[] {
  const config = RPC_CONFIG[network];
  return Object.values(config).filter((url): url is string => Boolean(url));
}
