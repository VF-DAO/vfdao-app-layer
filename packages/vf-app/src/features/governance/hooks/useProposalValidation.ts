import { useMemo } from 'react';
import type { ProposalType } from '../CreateProposal';
import Big from 'big.js';

interface FormData {
  tokenId?: string;
  receiverId?: string;
  amount?: string;
  memberId?: string;
  role?: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  minAmountOut?: string;
  poolId?: string;
}

interface TreasuryToken {
  contractId: string;
  symbol: string;
  balance: string;
  decimals: number;
}

interface TreasuryData {
  balance: string | null; // NEAR balance in readable format
  tokens: TreasuryToken[];
}

export function useProposalValidation(
  description: string,
  proposalType: ProposalType,
  formData: FormData,
  addressValidation: Record<string, boolean | null>,
  swapEstimate?: any,
  isEstimatingSwap?: boolean,
  treasuryData?: TreasuryData
) {
  return useMemo(() => {
    const errors: Record<string, string> = {};

    if (!description.trim() || description.trim().length < 10) {
      errors.description = 'Description is required (min 10 characters)';
    }

    // Helper function to get available balance for a token
    const getAvailableBalance = (tokenId: string): { balance: Big; symbol: string } | null => {
      if (!treasuryData) return null;
      
      // NEAR balance (wrap.near maps to native NEAR)
      if (tokenId === 'wrap.near' || tokenId === '') {
        if (!treasuryData.balance) return null;
        // Parse NEAR balance (remove commas, handle format like "1,234.56")
        const cleanBalance = treasuryData.balance.replace(/,/g, '');
        try {
          return { balance: new Big(cleanBalance), symbol: 'NEAR' };
        } catch {
          return null;
        }
      }
      
      // Token balance
      const token = treasuryData.tokens.find(t => t.contractId === tokenId);
      if (!token) return null;
      
      // Parse token balance (remove commas)
      const cleanBalance = token.balance.replace(/,/g, '');
      try {
        return { balance: new Big(cleanBalance), symbol: token.symbol };
      } catch {
        return null;
      }
    };

    // Transfer proposal validation
    if (proposalType === 'Transfer') {
      if (!formData.tokenId) {
        errors.tokenId = 'Token is required';
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        errors.amount = 'Amount must be greater than 0';
      } else if (formData.tokenId) {
        // Validate against treasury balance
        const available = getAvailableBalance(formData.tokenId);
        if (available) {
          try {
            const requestedAmount = new Big(formData.amount);
            if (requestedAmount.gt(available.balance)) {
              errors.amount = `Insufficient treasury balance. Available: ${available.balance.toFixed(4)} ${available.symbol}`;
            }
          } catch {
            // Invalid amount format, will be caught by other validation
          }
        }
      }
      // Address validation - show message only when empty, visual feedback handles the rest
      if (!formData.receiverId) {
        errors.receiverId = 'Recipient address is required';
      } else if (addressValidation.receiverId !== true) {
        errors.receiverId = ''; // Empty string blocks submission but shows no message
      }
    }

    // Token swap proposal validation
    if (proposalType === 'TokenSwap') {
      if (!formData.tokenIn) {
        errors.tokenIn = 'Input token is required';
      }
      if (!formData.tokenOut) {
        errors.tokenOut = 'Output token is required';
      }
      if (formData.tokenIn && formData.tokenOut && formData.tokenIn === formData.tokenOut) {
        errors.tokenOut = 'Input and output tokens must be different';
      }
      if (!formData.amountIn || parseFloat(formData.amountIn) <= 0) {
        errors.amountIn = 'Amount must be greater than 0';
      } else if (formData.tokenIn) {
        // Validate against treasury balance
        const available = getAvailableBalance(formData.tokenIn);
        if (available) {
          try {
            const requestedAmount = new Big(formData.amountIn);
            if (requestedAmount.gt(available.balance)) {
              errors.amountIn = `Insufficient treasury balance. Available: ${available.balance.toFixed(4)} ${available.symbol}`;
            }
          } catch {
            // Invalid amount format, will be caught by other validation
          }
        }
      }
      if (!formData.minAmountOut || parseFloat(formData.minAmountOut) <= 0) {
        if (isEstimatingSwap) {
          errors.minAmountOut = 'Estimating swap output...';
        } else if (!swapEstimate) {
          errors.minAmountOut = 'Invalid pool or token combination - please check your inputs';
        } else {
          errors.minAmountOut = 'Minimum output amount is required';
        }
      }
      if (!formData.poolId) {
        errors.poolId = 'Pool ID is required';
      }
    }

    // Member role proposal validation
    if (proposalType === 'AddMemberToRole' || proposalType === 'RemoveMemberFromRole') {
      // Address validation - show message only when empty, visual feedback handles the rest
      if (!formData.memberId) {
        errors.memberId = 'Member address is required';
      } else if (addressValidation.memberId !== true) {
        errors.memberId = ''; // Empty string blocks submission but shows no message
      }
      if (!formData.role) {
        errors.role = 'Role is required';
      }
    }

    return errors;
  }, [description, proposalType, formData, addressValidation, swapEstimate, isEstimatingSwap, treasuryData]);
}