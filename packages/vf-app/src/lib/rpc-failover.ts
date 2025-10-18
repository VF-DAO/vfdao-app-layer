import { getPrioritizedEndpoints } from './rpc-config';

// Enhanced RPC Failover using NEAR's official FailoverRpcProvider
// This provides better integration with NEAR ecosystem

// Note: @near-js/providers is not installed, so we'll use our custom implementation
// To use official FailoverRpcProvider, install: npm install @near-js/providers

// For now, we'll use our custom implementation since @near-js/providers isn't installed
// To use official FailoverRpcProvider in the future:
/*
// npm install @near-js/providers
import { JsonRpcProvider, FailoverRpcProvider } from '@near-js/providers'

export const createFailoverProvider = (network: 'mainnet' | 'testnet' = 'mainnet') => {
  const endpoints = getPrioritizedEndpoints(network)

  const providers = endpoints.map(url => new JsonRpcProvider({
    url,
    retries: 3,        // Number of retries before giving up
    backoff: 2,        // Backoff factor for retry delay
    wait: 500,         // Wait time between retries in milliseconds
  }))

  return new FailoverRpcProvider(providers)
}
*/

export class RpcFailover {
  private network: 'mainnet' | 'testnet';
  private endpoints: string[];
  private currentIndex = 0;
  private failures = new Map<string, number>();

  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
    this.network = network;
    this.endpoints = getPrioritizedEndpoints(network);
  }

  getCurrentEndpoint(): string {
    return this.endpoints[this.currentIndex] ?? this.endpoints[0];
  }

  async makeRequest(method: string, params: any[] = []): Promise<any> {
    const maxRetries = this.endpoints.length;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const endpoint = this.endpoints[(this.currentIndex + attempt) % this.endpoints.length];

      try {
        const response = await this.tryEndpoint(endpoint, method, params);

        // Reset failure count on success
        this.failures.delete(endpoint);

        // If we used a fallback, log it
        if (attempt > 0) {
          console.warn(`[RPC Failover] Successfully used fallback ${attempt + 1}: ${endpoint}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        const failureCount = (this.failures.get(endpoint) ?? 0) + 1;
        this.failures.set(endpoint, failureCount);

        console.warn(`[RPC Failover] Attempt ${attempt + 1} failed for ${endpoint}:`, error);

        // If this endpoint has failed multiple times, temporarily disable it
        if (failureCount >= 3) {
          console.warn(`[RPC Failover] Disabling ${endpoint} temporarily due to repeated failures`);
          // Move to next endpoint permanently for this session
          this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
        }
      }
    }

    throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message}`);
  }

  private async tryEndpoint(endpoint: string, method: string, params: any[]): Promise<any> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result;
  }

  // Get health status of all endpoints
  async getHealthStatus(): Promise<
    { endpoint: string; healthy: boolean; responseTime?: number }[]
  > {
    const results = await Promise.allSettled(
      this.endpoints.map(async (endpoint) => {
        const startTime = Date.now();
        try {
          await this.tryEndpoint(endpoint, 'status', []);
          return { endpoint, healthy: true, responseTime: Date.now() - startTime };
        } catch {
          return { endpoint, healthy: false, responseTime: Date.now() - startTime };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return { endpoint: this.endpoints[index], healthy: false };
      }
    });
  }
}

// Export singleton instances
export const mainnetRpcFailover = new RpcFailover('mainnet');
export const testnetRpcFailover = new RpcFailover('testnet');

// Helper function to get appropriate failover instance
export function getRpcFailover(network: 'mainnet' | 'testnet' = 'mainnet'): RpcFailover {
  return network === 'mainnet' ? mainnetRpcFailover : testnetRpcFailover;
}
