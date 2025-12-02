import type { ProposalType as _ProposalType } from '../CreateProposal';

export type RoleKind = 
  | { Group: string[] }
  | 'Everyone';

export interface ProposalFormData {
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

export interface TreasuryToken {
  contractId: string;
  symbol: string;
  balance: string;
  decimals: number;
  icon?: string;
}

export interface ProposalComponentProps {
  formData: ProposalFormData;
  onFormDataChange: (data: Partial<ProposalFormData>) => void;
  validationErrors: Record<string, string>;
  availableTokens: {
    contractId: string;
    symbol: string;
    decimals: number;
    icon?: string;
    balance?: string; // Available balance in treasury
  }[];
  policy?: {
    roles: {
      name: string;
      kind: RoleKind;
      permissions: string[];
      vote_policy: Record<string, unknown>;
    }[];
  };
  isEstimatingSwap?: boolean;
  swapEstimate?: unknown;
  onTestSwap?: () => void;
  accountId?: string;
  onValidationChange?: (field: string, exists: boolean | null) => void;
  nearBalance?: string | null; // NEAR balance in treasury
}