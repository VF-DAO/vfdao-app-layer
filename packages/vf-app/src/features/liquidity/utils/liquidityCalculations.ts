import Big from 'big.js';
import type { PoolInfo } from '@/types';

/**
 * Parse token amount from display units to contract units
 * @param amount Display amount (e.g., "1.5")
 * @param decimals Token decimals
 * @returns Contract amount as string (e.g., "1500000000000000000")
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  if (!amount || amount === '0') return '0';
  try {
    return Big(amount).mul(Big(10).pow(decimals)).toFixed(0);
  } catch {
    return '0';
  }
}

/**
 * Format token amount from contract units to display units (no abbreviation)
 * @param amount Contract amount as string
 * @param decimals Token decimals
 * @param maxDecimals Maximum decimal places to show
 * @returns Display amount (e.g., "1.500000")
 */
export function formatTokenAmountNoAbbrev(
  amount: string,
  decimals: number,
  maxDecimals: number
): string {
  if (!amount || amount === '0') return '0';
  try {
    const displayAmount = Big(amount).div(Big(10).pow(decimals));
    return displayAmount.toFixed(maxDecimals, 0);
  } catch {
    return '0';
  }
}

/**
 * Calculate optimal token amounts for adding liquidity
 * Maintains exact ratio of current pool reserves
 * @param inputAmount Input amount in display units
 * @param inputTokenId ID of the token being input
 * @param poolInfo Pool information
 * @returns Optimal output amount in display units
 */
export function calculateOptimalAmount(
  inputAmount: string,
  inputTokenId: string,
  poolInfo: PoolInfo
): string {
  if (!poolInfo || !inputAmount) return '';

  // Convert input amount to contract units
  const inputToken = inputTokenId === poolInfo.token1.id ? poolInfo.token1 : poolInfo.token2;
  const inputAmountContract = parseTokenAmount(inputAmount, inputToken.decimals);

  const inputReserve = Big(poolInfo.reserves[inputTokenId]);
  const outputReserve = Big(
    poolInfo.reserves[inputTokenId === poolInfo.token1.id ? poolInfo.token2.id : poolInfo.token1.id]
  );

  // For liquidity provision, provide tokens in the exact ratio of current reserves
  // Formula: optimalAmount = (inputAmount * outputReserve) / inputReserve
  const optimalOutputContract = Big(inputAmountContract).mul(outputReserve).div(inputReserve);

  // Convert back to display units - use same formatting as swap widget
  const outputToken = inputTokenId === poolInfo.token1.id ? poolInfo.token2 : poolInfo.token1;
  const optimalOutputDisplay = formatTokenAmountNoAbbrev(
    optimalOutputContract.toFixed(0),
    outputToken.decimals,
    6
  );

  return optimalOutputDisplay;
}

/**
 * Calculate token amounts user will receive when removing liquidity
 * @param sharesAmount Shares to remove in display units (e.g., "1.5")
 * @param poolInfo Pool information
 * @returns Object with token1Amount and token2Amount in display units
 */
export function calculateRemoveLiquidityAmounts(
  sharesAmount: string,
  poolInfo: PoolInfo
): { token1Amount: string; token2Amount: string } {
  if (!poolInfo || !sharesAmount || sharesAmount === '0') {
    return { token1Amount: '0', token2Amount: '0' };
  }

  try {
    // Parse shares amount to contract units (24 decimals for LP tokens)
    const sharesContract = parseTokenAmount(sharesAmount, 24);

    // Ensure shareSupply is a string and handle potential formatting issues
    const shareSupplyStr = String(poolInfo.shareSupply ?? '0');

    if (shareSupplyStr === '0' || shareSupplyStr === '') {
      console.error('[calculateRemoveLiquidityAmounts] Pool has zero shareSupply!');
      return { token1Amount: '0', token2Amount: '0' };
    }

    const totalShares = Big(shareSupplyStr);

    // Calculate proportional share of each reserve
    // Formula: tokenAmount = (sharesAmount * tokenReserve) / totalShares
    const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id] ?? '0');
    const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id] ?? '0');

    const token1Contract = Big(sharesContract).mul(token1Reserve).div(totalShares);
    const token2Contract = Big(sharesContract).mul(token2Reserve).div(totalShares);

    // Convert to display units
    const token1Display = Big(token1Contract.toFixed(0))
      .div(Big(10).pow(poolInfo.token1.decimals))
      .toFixed(6, 0);
    const token2Display = Big(token2Contract.toFixed(0))
      .div(Big(10).pow(poolInfo.token2.decimals))
      .toFixed(6, 0);

    return {
      token1Amount: token1Display,
      token2Amount: token2Display,
    };
  } catch (error) {
    console.error('[calculateRemoveLiquidityAmounts] Error:', error);
    return { token1Amount: '0', token2Amount: '0' };
  }
}

/**
 * Calculate token amounts directly from contract units (for LP shares display)
 * @param sharesContractUnits Shares in contract units (yocto units)
 * @param poolInfo Pool information
 * @returns Object with token1Amount and token2Amount in display units
 */
export function calculateRemoveLiquidityAmountsFromContract(
  sharesContractUnits: string,
  poolInfo: PoolInfo
): { token1Amount: string; token2Amount: string } {
  if (!poolInfo || !sharesContractUnits || sharesContractUnits === '0') {
    return { token1Amount: '0', token2Amount: '0' };
  }

  try {
    const shareSupplyStr = String(poolInfo.shareSupply ?? '0');

    if (shareSupplyStr === '0' || shareSupplyStr === '') {
      console.error('[calculateRemoveLiquidityAmountsFromContract] Pool has zero shareSupply!');
      return { token1Amount: '0', token2Amount: '0' };
    }

    const totalShares = Big(shareSupplyStr);
    const userShares = Big(sharesContractUnits);

    // Calculate proportional share of each reserve
    // Formula: tokenAmount = (userShares * tokenReserve) / totalShares
    const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id] ?? '0');
    const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id] ?? '0');

    const token1Contract = userShares.mul(token1Reserve).div(totalShares);
    const token2Contract = userShares.mul(token2Reserve).div(totalShares);

    // Convert to display units
    const token1Display = Big(token1Contract.toFixed(0))
      .div(Big(10).pow(poolInfo.token1.decimals))
      .toFixed(6, 0);
    const token2Display = Big(token2Contract.toFixed(0))
      .div(Big(10).pow(poolInfo.token2.decimals))
      .toFixed(6, 0);

    return {
      token1Amount: token1Display,
      token2Amount: token2Display,
    };
  } catch (error) {
    console.error('[calculateRemoveLiquidityAmountsFromContract] Error:', error);
    return { token1Amount: '0', token2Amount: '0' };
  }
}

/**
 * Check if user needs gas reserve warning
 * @param poolInfo Pool information
 * @param amount Input amount in display units
 * @param rawBalances Raw wallet balances in contract units
 * @returns true if gas reserve warning should be shown
 */
export function shouldShowGasReserve(
  poolInfo: PoolInfo | null,
  amount: string,
  rawBalances: Record<string, string>
): boolean {
  if (!poolInfo || !amount) return false;

  const isNearToken = poolInfo.token1.id === 'wrap.near' || poolInfo.token1.id === 'near';
  if (!isNearToken) return false;

  const rawBalance = rawBalances[poolInfo.token1.id];
  if (!rawBalance) return false;

  const reserveAmount = Big(0.25).mul(Big(10).pow(24)); // 0.25 NEAR in yocto
  const requestedAmount = Big(amount).mul(Big(10).pow(poolInfo.token1.decimals)); // User input in yocto
  const maxAvailable = Big(rawBalance).minus(reserveAmount); // Max they can have

  // Only show gas reserve message if amount is within balance but exceeds (balance - 0.25)
  // If amount exceeds total balance, insufficient funds message will show instead
  return requestedAmount.lte(Big(rawBalance)) && requestedAmount.gt(maxAvailable) && maxAvailable.gt(0);
}
