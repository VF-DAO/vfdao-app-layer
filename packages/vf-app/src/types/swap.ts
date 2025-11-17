/**
 * Swap Type Definitions
 * 
 * Shared swap-related interfaces for token exchange operations.
 */

/**
 * Swap estimate result
 * Contains output amount, price impact, and routing information
 */
export interface SwapEstimate {
  outputAmount: string;
  priceImpact: number;
  route: { pool_id: number }[];
  fee: number;
  minReceived?: string;
  highImpact?: boolean;
}

/**
 * NEAR RPC query response structure
 */
export interface NearRpcQueryResponse {
  result: Uint8Array;
}

/**
 * RPC response wrapper
 */
export interface RpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: { result: Uint8Array };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * NEAR function call structure
 */
export interface FunctionCall {
  methodName: string;
  args: Record<string, unknown>;
  gas: string;
  amount: string;
}

/**
 * NEAR transaction structure
 */
export interface NearTransaction {
  receiverId: string;
  functionCalls: FunctionCall[];
}

/**
 * Storage balance bounds (NEP-141)
 */
export interface StorageBalanceBounds {
  min: string;
  max?: string;
}
