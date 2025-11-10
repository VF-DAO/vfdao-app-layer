import { providers } from 'near-api-js';
import Big from 'big.js';

/**
 * Near RPC query response interface
 */
interface NearRpcQueryResponse {
  result: Uint8Array;
}

/**
 * Storage balance bounds interface
 */
interface StorageBalanceBounds {
  min: string;
  max?: string;
}

/**
 * Token metadata interface (NEP-141 standard)
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
 * Storage deposit configuration - Ref Finance pattern
 */
const STORAGE_CHECK_GAS = '30000000000000'; // 30 TGas

/**
 * Get minimum storage balance for a token contract - Ref Finance pattern
 */
export async function getMinStorageBalance(tokenId: string, rpcUrl: string): Promise<string> {
  try {
    const provider = new providers.JsonRpcProvider({ url: rpcUrl });
    const result = await provider.query({
      request_type: 'call_function',
      account_id: tokenId,
      method_name: 'storage_balance_bounds',
      args_base64: '',
      finality: 'optimistic',
    }) as unknown as NearRpcQueryResponse;
    const bounds = JSON.parse(Buffer.from(result.result).toString()) as StorageBalanceBounds;
    if (!bounds?.min) return '12500000000000000000000'; // 0.0125 NEAR as fallback
    return bounds.min;
  } catch (error) {
    console.warn('[Storage] Failed to get min storage balance:', error);
    return '12500000000000000000000'; // 0.0125 NEAR fallback
  }
}

/**
 * Check if token is registered via ftGetStorageBalance - Ref Finance Pattern
 * Returns: FTStorageBalance { total: string, available: string } | null
 * Returns null if not registered OR if method doesn't exist (assume registered)
 */
export async function ftGetStorageBalance(
  tokenId: string,
  accountId: string,
  rpcUrl: string
): Promise<{ total: string; available: string } | null> {
  try {
    const provider = new providers.JsonRpcProvider({ url: rpcUrl });

    // Standard FT tokens - check storage_balance_of
    const result = await provider.query({
      request_type: 'call_function',
      account_id: tokenId,
      method_name: 'storage_balance_of',
      args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
      finality: 'optimistic',
    }) as unknown as NearRpcQueryResponse;

    const balance = JSON.parse(Buffer.from(result.result).toString()) as { total: string; available: string } | null;
    console.warn('[Storage] Balance check result:', { tokenId, balance });
    
    // If balance is null/undefined, user is not registered
    // If balance has total/available, user is registered
    return balance;
  } catch (error) {
    console.warn('[Storage] Balance check failed:', { tokenId, error });
    
    // If method doesn't exist, assume the contract doesn't require registration
    // or the user is already registered by default
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('MethodNotFound') || errorMessage.includes('does not exist')) {
      console.warn('[Storage] Method not found, assuming no registration required for:', tokenId);
      return { total: '0', available: '0' }; // Fake balance to indicate "registered"
    }
    
    // For other errors, assume not registered
    return null;
  }
}

/**
 * Check storage deposit for token - matches Ref Finance checkStorageDeposit
 */
export async function checkStorageDeposit(
  tokenId: string,
  accountId: string,
  rpcUrl: string
): Promise<boolean> {
  try {
    const balance = await ftGetStorageBalance(tokenId, accountId, rpcUrl);
    const isRegistered = balance !== null;
    console.warn('[Storage] Check result:', { tokenId, isRegistered });
    return isRegistered;
  } catch (error) {
    console.warn('[Storage] Storage check failed:', error);
    return false;
  }
}

/**
 * Register storage deposit for a token - Ref Finance Pattern
 * Builds transaction to call storage_deposit on token contract
 */
export async function buildStorageDepositTransaction(
  tokenId: string,
  accountId: string,
  rpcUrl: string
): Promise<{
  receiverId: string;
  actions: {
    type: 'FunctionCall';
    params: {
      methodName: string;
      args: string;
      gas: string;
      deposit: string;
    };
  }[];
}> {
  // Get the minimum storage balance dynamically like Ref Finance does
  const minDeposit = await getMinStorageBalance(tokenId, rpcUrl);

  return {
    receiverId: tokenId,
    actions: [
      {
        type: 'FunctionCall',
        params: {
          methodName: 'storage_deposit',
          args: JSON.stringify({
            registration_only: true,
            account_id: accountId,
          }),
          gas: STORAGE_CHECK_GAS,
          deposit: minDeposit,
        },
      },
    ],
  };
}

/**
 * Check if token needs registration (inverse of check - for modal prompts)
 */
export async function needsTokenRegistration(
  tokenId: string,
  accountId: string,
  rpcUrl: string
): Promise<boolean> {
  const isRegistered = await checkStorageDeposit(tokenId, accountId, rpcUrl);
  return !isRegistered;
}

/**
 * Default token list for mainnet (static definitions)
 * Only includes tokens that should be directly selectable (NEAR auto-wraps)
 */
const STATIC_MAINNET_TOKENS = [
  {
    id: 'veganfriends.tkn.near',
    symbol: 'VEGANFRIENDS',
    name: 'Vegan Friends Token',
    decimals: 18,
    icon: undefined, // Will be fetched from contract
  },
];

/**
 * NEAR metadata (native NEAR token)
 */
const NEAR_METADATA = {
  id: 'NEAR',
  name: 'NEAR',
  symbol: 'NEAR',
  decimals: 24,
  icon: `data:image/svg+xml;base64,${Buffer.from(`<svg width="32" height="32" viewBox="2 2 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2.84211 3.21939V12.483L7.57895 8.94375L8.05263 9.35915L4.08047 14.954C2.6046 16.308 0 15.3919 0 13.5188V2.08119C0 0.143856 2.75709 -0.738591 4.18005 0.743292L15.1579 12.1757V3.29212L10.8947 6.4513L10.4211 6.03589L13.7996 0.813295C15.2097 -0.696027 18 0.178427 18 2.12967V13.3139C18 15.2512 15.2429 16.1336 13.8199 14.6518L2.84211 3.21939Z" fill="black" transform="translate(8,8) scale(0.9, 1)"/></svg>`).toString('base64')}`,
};

/**
 * wNEAR metadata
 */
const WNEAR_METADATA = {
  id: 'wrap.near',
  name: 'Wrapped NEAR',
  symbol: 'wNEAR',
  decimals: 24,
  icon: 'https://assets.ref.finance/images/wrap.near.png',
};

/**
 * Unwrapped NEAR token - Ref Finance's approach
 * Uses wNEAR contract but displays as NEAR
 */
export const unwrapedNear: TokenMetadata = {
  ...WNEAR_METADATA,
  id: 'near', // Use 'near' as ID to distinguish from wNEAR
  symbol: 'NEAR',
  name: 'Near',
  icon: NEAR_METADATA.icon,
};

/**
 * Get mainnet tokens with metadata fetched from contracts
 */
export async function getMainnetTokens(): Promise<TokenMetadata[]> {
  const tokens: TokenMetadata[] = [];

  // Add unwrapped NEAR first (Ref Finance's approach) - this handles automatic wrapping
  tokens.push(unwrapedNear);

  // Only add VEGANFRIENDS token, not wNEAR since we want only NEAR
  for (const staticToken of STATIC_MAINNET_TOKENS) {
    // Skip wNEAR since we only want NEAR (which auto-wraps)
    if (staticToken.id === 'wrap.near') continue;

    const metadata = await getTokenMetadata(staticToken.id);
    tokens.push(metadata);
  }

  return tokens;
}

/**
 * Legacy export for backward compatibility (static tokens)
 * @deprecated Use getMainnetTokens() for dynamic metadata
 */
export const MAINNET_TOKENS = STATIC_MAINNET_TOKENS;

/**
 * Slippage presets
 */
export const SLIPPAGE_PRESETS = [
  { label: '0.1%', value: 0.1 },
  { label: '0.5%', value: 0.5 },
  { label: '1%', value: 1 },
  { label: '3%', value: 3 },
];

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: string, decimals: number, maxDecimals = 6): string {
  try {
    // Use Big to avoid floating point precision issues
    const value = new Big(amount).div(new Big(10).pow(decimals));

    if (value.eq(0)) return '0';
    if (value.lt(0.000001)) return '< 0.000001';

    // Handle very large numbers with abbreviated notation
    if (value.gte(1000000000)) { // 1 billion
      const billions = value.div(1000000000);
      return `${billions.toFixed(2, Big.roundDown)}B`;
    } else if (value.gte(1000000)) { // 1 million
      const millions = value.div(1000000);
      return `${millions.toFixed(2, Big.roundDown)}M`;
    } else if (value.gte(1000)) { // 1 thousand
      const thousands = value.div(1000);
      return `${thousands.toFixed(2, Big.roundDown)}K`;
    }

    // For normal numbers, truncate to maxDecimals
    const truncated = value.toFixed(maxDecimals, Big.roundDown);

    // Remove trailing zeros
    return truncated.replace(/\.?0+$/, '');
  } catch (e) {
    console.warn('[formatTokenAmount] failed to format amount:', amount, e);
    return '0';
  }
}

/**
 * Format token amount for display without abbreviations (for main output field)
 */
export function formatTokenAmountNoAbbrev(amount: string, decimals: number, maxDecimals = 6): string {
  try {
    // Use Big to avoid floating point precision issues
    const value = new Big(amount).div(new Big(10).pow(decimals));

    if (value.eq(0)) return '0';

    // Determine decimal places based on magnitude
    let decimalPlaces = maxDecimals;

    if (value.lt(0.01)) {
      decimalPlaces = Math.max(8, maxDecimals); // Show at least 8 decimals for small amounts
    }

    if (value.lt(0.000001)) {
      decimalPlaces = 12; // Show 12 decimals for very small amounts
    }

    // For extremely small amounts that would show as 0, show scientific notation
    const result = value.toFixed(decimalPlaces, Big.roundDown);
    if (result === '0.' + '0'.repeat(decimalPlaces)) {
      // This means the number is so small it rounds to 0, show in scientific notation
      return value.toExponential(4);
    }

    // Remove trailing zeros
    return result.replace(/\.?0+$/, '');
  } catch (e) {
    console.warn('[formatTokenAmountNoAbbrev] failed to format amount:', amount, e);
    return '0';
  }
}

/**
 * Parse token amount from user input to contract format
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  console.warn('[parseTokenAmount] Input:', { amount: `"${amount}"`, decimals, amountType: typeof amount, decimalsType: typeof decimals });
  try {
    // Clean the input - remove commas, extra spaces, etc.
    const cleanedAmount = amount.replace(/,/g, '').trim();
    console.warn('[parseTokenAmount] Cleaned amount:', `"${cleanedAmount}"`);

    // Check for obviously invalid inputs that would cause Big.js to fail
    if (!cleanedAmount || cleanedAmount === '' || cleanedAmount.includes('/') || cleanedAmount.includes('\\') ||
        cleanedAmount.includes(' ') || isNaN(Number(cleanedAmount))) {
      console.warn('[parseTokenAmount] Invalid input detected, returning 0');
      return '0';
    }

    // Use Big to avoid scientific notation for large integers (e.g. 1e+24)
    const bigAmount = new Big(cleanedAmount);
    const bigDecimals = new Big(10).pow(decimals);
    const result = bigAmount.times(bigDecimals);
    const finalResult = result.toFixed(0);
    console.warn('[parseTokenAmount] Success:', { bigAmount: bigAmount.toString(), bigDecimals: bigDecimals.toString(), result: result.toString(), finalResult });
    // toFixed(0) produces an integer string without exponent
    return finalResult;
  } catch (e) {
    console.warn('[parseTokenAmount] Failed to parse amount:', amount, 'decimals:', decimals, 'error:', e);
    return '0';
  }
}

/**
 * Calculate minimum amount out with slippage
 */
export function calculateMinAmountOut(amount: string, slippagePercent: number): string {
  const value = parseFloat(amount);
  const minAmount = value * (1 - slippagePercent / 100);
  return Math.floor(minAmount).toString();
}

/**
 * Fetch token metadata from contract (like Ref Finance does)
 */
export async function fetchTokenMetadata(tokenId: string): Promise<TokenMetadata | null> {
  try {
    const provider = new providers.JsonRpcProvider({
      url: process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org'
    });

    const result = await provider.query({
      request_type: 'call_function',
      account_id: tokenId,
      method_name: 'ft_metadata',
      args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
      finality: 'final'
    }) as unknown as NearRpcQueryResponse;

    const metadata = JSON.parse(Buffer.from(result.result).toString()) as TokenMetadata;
    return metadata;
  } catch (error) {
    console.warn(`Failed to fetch metadata for ${tokenId}:`, error);
    return null;
  }
}

/**
 * Get token metadata with fallback to static data
 */
export async function getTokenMetadata(tokenId: string): Promise<TokenMetadata> {
  console.warn('[getTokenMetadata] Fetching metadata for:', tokenId);
  // First try to fetch from contract
  const contractMetadata = await fetchTokenMetadata(tokenId);
  console.warn('[getTokenMetadata] Contract metadata:', contractMetadata);

  if (contractMetadata) {
    const result = {
      id: tokenId,
      name: contractMetadata.name,
      symbol: contractMetadata.symbol,
      decimals: contractMetadata.decimals,
      icon: contractMetadata.icon,
    };
    console.warn('[getTokenMetadata] Using contract metadata:', result);
    return result;
  }

  // Fallback to static data
  const staticToken = MAINNET_TOKENS.find(t => t.id === tokenId);
  console.warn('[getTokenMetadata] Static token found:', staticToken);
  if (staticToken) {
    console.warn('[getTokenMetadata] Using static metadata:', staticToken);
    return staticToken;
  }

  // Ultimate fallback
  const fallback = {
    id: tokenId,
    name: tokenId,
    symbol: tokenId.split('.')[0].slice(0, 8),
    decimals: 6,
    icon: undefined,
  };
  console.warn('[getTokenMetadata] Using fallback:', fallback);
  return fallback;
}

/**
 * Validate token swap pair
 */
export function validateSwapPair(
  tokenIn?: string,
  tokenOut?: string
): { valid: boolean; error?: string } {
  if (!tokenIn || !tokenOut) {
    return { valid: false, error: 'Please select both tokens' };
  }

  if (tokenIn === tokenOut) {
    return { valid: false, error: 'Cannot swap same token' };
  }

  return { valid: true };
}
