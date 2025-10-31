import { getPrioritizedEndpoints } from './rpc-config';
import { init_env } from '@ref-finance/ref-sdk';

// Initialize Ref SDK with custom RPC endpoint
if (typeof window !== 'undefined') {
  // Use NEXT_PUBLIC_NEAR_ENV if set, otherwise default to mainnet
  const env = process.env.NEXT_PUBLIC_NEAR_ENV ?? 'mainnet';

  // Get prioritized RPC endpoints from centralized config
  const rpcEndpoints = getPrioritizedEndpoints(env === 'testnet' ? 'testnet' : 'mainnet');

  console.warn(
    '[Ref SDK] Initializing with env:',
    env,
    'RPC chain:',
    rpcEndpoints.slice(0, 3).join(', '),
    '...'
  );

  // Try RPC endpoints in sequence until one works
  let initialized = false;
  let lastError = null;

  for (const rpcUrl of rpcEndpoints) {
    if (!rpcUrl) continue;

    try {
      console.warn(`[Ref SDK] Trying RPC: ${rpcUrl}`);
      init_env(env, '', rpcUrl);
      console.warn(`[Ref SDK] Successfully initialized with ${rpcUrl}`);

      // Test if pools can be fetched
      setTimeout(
        () =>
          void (async () => {
            try {
              console.warn('[Ref SDK] Testing pool fetch...');
              const { fetchAllPools } = await import('@ref-finance/ref-sdk');
              const pools = await fetchAllPools(5) as { simplePools: unknown; ratedPools: unknown; unRatedPools: unknown; };
              console.warn('[Ref SDK] Test pools fetch result:', {
                simplePools: Array.isArray(pools.simplePools) ? pools.simplePools.length : 0,
                ratedPools: Array.isArray(pools.ratedPools) ? pools.ratedPools.length : 0,
                unRatedPools: Array.isArray(pools.unRatedPools) ? pools.unRatedPools.length : 0,
              });
            } catch (error) {
              console.error('[Ref SDK] Test pools fetch failed:', error);
            }
          })(),
        2000
      );

      initialized = true;
      break;
    } catch (error) {
      console.warn(`[Ref SDK] Failed to initialize with ${rpcUrl}:`, error);
      lastError = error;
    }
  }

  if (!initialized) {
    console.error('[Ref SDK] All RPC endpoints failed. Last error:', lastError);
    throw new Error(
      `Failed to initialize Ref SDK with any RPC endpoint. Last error: ${String(lastError)}`
    );
  }
}

export {};
