'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingDots } from '@/components/ui/loading-dots';
import { TransactionCancelledModal, TransactionFailureModal, TransactionSuccessModal } from '@/components/ui/transaction-modal';
import { useAllowedProposalTypes, useCreateProposal, usePolicy } from '../hooks';
import { useWallet } from '@/features/wallet';
import { useTreasuryBalance } from '../hooks';
import { useSwapEstimation } from '../hooks/useSwapEstimation';
import { useProposalValidation } from '../hooks/useProposalValidation';
import { unwrapedNear } from '@/lib/swap-utils';
import { useSwapExecutor } from '@/hooks/useSwapExecutor';
import Big from 'big.js';
import type { ProposalKind } from '../types';
import { MemberRoleProposal, TokenSwapProposal, TransferProposal, VoteProposal } from './proposals';
import { TestSwapModal } from './TestSwapModal';

export type ProposalType = 'Transfer' | 'Vote' | 'AddMemberToRole' | 'RemoveMemberFromRole' | 'TokenSwap';

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

export function CreateProposal() {
  const router = useRouter();
  const proposalTypeRef = useRef<HTMLDivElement>(null);
  const { wallet, accountId } = useWallet();
  const createProposal = useCreateProposal(wallet);
  const { tokens, balance: nearBalance } = useTreasuryBalance();
  const { data: policy } = usePolicy();
  const { allowedTypes: _allowedTypes, canCreateProposal } = useAllowedProposalTypes(accountId ?? undefined);
  const { estimateSwapOutput, constructProposalSwapTransactions } = useSwapExecutor();

  // Filter to only show proposal types the user is allowed to create
  const availableProposalTypes = useMemo(() => {
    // Define all possible proposal types with their display names
    const allProposalTypes: { type: ProposalType; label: string }[] = [
      { type: 'Transfer', label: 'Transfer Funds' },
      { type: 'TokenSwap', label: 'Token Swap' },
      { type: 'AddMemberToRole', label: 'Add Member to Role' },
      { type: 'RemoveMemberFromRole', label: 'Remove Member from Role' },
      { type: 'Vote', label: 'Community Poll' },
    ];
    return allProposalTypes.filter(pt => canCreateProposal(pt.type));
  }, [canCreateProposal]);

  // Form state - default to first allowed type
  const [proposalType, setProposalType] = useState<ProposalType>('Transfer');
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState<FormData>({
    tokenId: 'wrap.near', // Default to NEAR
    receiverId: '',
    amount: '',
    memberId: '',
    role: '',
    tokenIn: 'wrap.near', // Default to NEAR
    tokenOut: '',
    amountIn: '',
    minAmountOut: '',
    poolId: '5094', // Default to NEAR-VEGANFRIENDS pool
  });

  // Set initial proposal type to first allowed type when permissions are loaded
  useEffect(() => {
    if (availableProposalTypes.length > 0 && !canCreateProposal(proposalType)) {
      setProposalType(availableProposalTypes[0].type);
    }
  }, [availableProposalTypes, proposalType, canCreateProposal]);

  // Dropdown state
  const [proposalTypeDropdownOpen, setProposalTypeDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (proposalTypeRef.current && !proposalTypeRef.current.contains(event.target as Node)) {
        setProposalTypeDropdownOpen(false);
      }
    };

    if (proposalTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [proposalTypeDropdownOpen]);

  // Available tokens for transfer (NEAR + treasury tokens)
  const availableTokens = useMemo(() => [
    { contractId: 'wrap.near', symbol: 'NEAR', decimals: 24, icon: unwrapedNear.icon },
    ...tokens.map(t => ({
      contractId: t.contractId,
      symbol: t.symbol,
      decimals: t.decimals,
      icon: t.icon,
      balance: t.balance, // Include balance for validation display
    })),
  ], [tokens]);

  // Swap estimation hook
  const { swapEstimate, isEstimatingSwap } = useSwapEstimation({
    proposalType,
    tokenIn: formData.tokenIn,
    tokenOut: formData.tokenOut,
    amountIn: formData.amountIn,
    availableTokens,
    estimateSwapOutput,
  });

  // Auto-update minAmountOut and poolId when swap estimate changes
  useEffect(() => {
    if (swapEstimate && proposalType === 'TokenSwap') {
      // Use the minReceived from the estimate (already includes proper slippage)
      const tokenOutInfo = availableTokens.find(t => t.contractId === formData.tokenOut);
      const minAmountOutDisplay = new Big(swapEstimate.minReceived!).div(new Big(10).pow(tokenOutInfo?.decimals ?? 24)).toString();

      setFormData(prev => ({ 
        ...prev, 
        minAmountOut: minAmountOutDisplay,
        poolId: String(swapEstimate.route?.[0]?.pool_id ?? prev.poolId)
      }));
    } else if (proposalType === 'TokenSwap' && !isEstimatingSwap && !swapEstimate) {
      // Clear minAmountOut if estimation failed (invalid pool/token combination)
      setFormData(prev => ({ ...prev, minAmountOut: '' }));
    }
  }, [swapEstimate, proposalType, formData.tokenOut, availableTokens, isEstimatingSwap]);

  // Calculate proposal bond in NEAR
  const proposalBondNear = useMemo(() => {
    if (!policy?.proposal_bond) return '1';
    try {
      const bondInYocto = new Big(policy.proposal_bond);
      const bondInNear = bondInYocto.div(new Big(10).pow(24));
      // Show up to 2 decimal places for fractional NEAR amounts
      return bondInNear.toFixed(2).replace(/\.?0+$/, '');
    } catch (err) {
      console.warn('Failed to calculate proposal bond:', err);
      return '1';
    }
  }, [policy]);

  // Modal state
  const [modal, setModal] = useState<{
    type: 'success' | 'failure' | 'cancelled' | null;
    txHash?: string;
    error?: string;
  }>({ type: null });

  // Test swap modal state
  const [showTestSwapModal, setShowTestSwapModal] = useState(false);

  // Address validation state
  const [addressValidation, setAddressValidation] = useState<Record<string, boolean | null>>({});

  // Modal close handlers
  const closeModal = useCallback(() => setModal({ type: null }), []);
  const closeTestSwapModal = useCallback(() => setShowTestSwapModal(false), []);

  // Treasury data for validation
  const treasuryData = useMemo(() => ({
    balance: nearBalance,
    tokens: tokens.map(t => ({
      contractId: t.contractId,
      symbol: t.symbol,
      balance: t.balance,
      decimals: t.decimals,
    })),
  }), [nearBalance, tokens]);

  // Validation
  const validationErrors = useProposalValidation(description, proposalType, formData, addressValidation, swapEstimate, isEstimatingSwap, treasuryData);
  const isFormValid = Object.keys(validationErrors).length === 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || !wallet) return;

    try {
      let kind: ProposalKind;

      if (proposalType === 'Transfer') {
        const selectedToken = tokens.find(t => t.contractId === formData.tokenId);
        const decimals = selectedToken?.decimals ?? 24; // Default to NEAR (24 decimals)
        const amountInSmallestUnit = new Big(formData.amount!).times(new Big(10).pow(decimals)).toString();

        // Sputnik DAO expects empty string "" for native NEAR transfers (OLD_BASE_TOKEN)
        // Other tokens use their contract ID
        const tokenId = formData.tokenId === 'wrap.near' ? '' : formData.tokenId!;

        kind = {
          Transfer: {
            token_id: tokenId,
            receiver_id: formData.receiverId!,
            amount: amountInSmallestUnit,
          },
        };
      } else if (proposalType === 'AddMemberToRole') {
        kind = {
          AddMemberToRole: {
            member_id: formData.memberId!,
            role: formData.role!,
          },
        };
      } else if (proposalType === 'RemoveMemberFromRole') {
        kind = {
          RemoveMemberFromRole: {
            member_id: formData.memberId!,
            role: formData.role!,
          },
        };
      } else if (proposalType === 'TokenSwap') {
        // Use the shared swap executor for consistent transaction construction
        // formData.minAmountOut is already in readable units from the hook
        const transactions = constructProposalSwapTransactions({
          tokenIn: formData.tokenIn!,
          tokenOut: formData.tokenOut!,
          amountIn: formData.amountIn!,
          minAmountOut: formData.minAmountOut!,
          poolId: formData.poolId!,
        }, availableTokens, swapEstimate);

        kind = {
          FunctionCall: {
            receiver_id: transactions[0].receiverId,
            actions: transactions[0].actions.map(action => {
              // Sputnik DAO expects args as Base64-encoded JSON (Base64VecU8)
              const argsJson = typeof action.params.args === 'string' 
                ? action.params.args 
                : JSON.stringify(action.params.args);
              const argsBase64 = btoa(argsJson);
              
              return {
                method_name: action.params.methodName,
                args: argsBase64,
                deposit: action.params.deposit,
                gas: action.params.gas,
              };
            }),
          },
        };
      } else {
        // Vote proposal
        kind = { Vote: null };
      }

      const result = await createProposal.mutate({
        description: description.trim(),
        kind,
        deposit: policy?.proposal_bond,
      });

      setModal({
        type: 'success',
        txHash: result?.transactionHash,
      });

      // Redirect to proposals page after success
      setTimeout(() => {
        router.push('/dao');
      }, 2000);

    } catch (err: any) {
      console.warn('Proposal creation error:', err);
      const message = err?.message?.toLowerCase() ?? '';
      if (err === null || err?.code === 4001 || err?.name === 'UserRejectedError' || message.includes('cancel') || message.includes('rejected') || message.includes('user') || message.includes('cancelled') || message.includes('abort') || message.includes('dismiss') || message.includes('reject') || message.includes('denied')) {
        setModal({ type: 'cancelled' });
      } else {
        setModal({
          type: 'failure',
          error: err?.message ?? 'Failed to create proposal',
        });
      }
    }
  };

  // Handle address validation changes
  const handleValidationChange = useCallback((field: string, exists: boolean | null) => {
    setAddressValidation(prev => ({ ...prev, [field]: exists }));
  }, []);

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Main Card */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-main-card">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-t-2xl -m-4 sm:-m-6 md:-m-8 mb-4 md:mb-6 shadow-sm">
          <div className="p-4 sm:p-6 md:p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/50 text-muted-foreground">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  Create Proposal
                </h1>
                <p className="text-muted-foreground text-sm">
                  Submit a proposal for the VF DAO to vote on. Requires {proposalBondNear} NEAR bond.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Proposal Type */}
          <div className="space-y-2">
            <Label htmlFor="proposal-type" className="text-sm font-medium">Proposal Type</Label>
            <div className="relative flex items-center" ref={proposalTypeRef}>
              <button
                type="button"
                onClick={() => setProposalTypeDropdownOpen(!proposalTypeDropdownOpen)}
                disabled={availableProposalTypes.length === 0}
                className="w-full h-12 bg-transparent border border-border rounded-full text-sm focus:outline-none focus:border-muted-foreground/50 px-4 flex items-center justify-between hover:border-muted-foreground/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-foreground">
                  {availableProposalTypes.find(pt => pt.type === proposalType)?.label ?? 
                   (availableProposalTypes.length === 0 ? 'No proposal types available' : 'Select proposal type')}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Dropdown Menu */}
              {proposalTypeDropdownOpen && availableProposalTypes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-dropdown p-3 z-10 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="space-y-1">
                    {availableProposalTypes.map((pt) => (
                      <Button
                        key={pt.type}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProposalType(pt.type);
                          setProposalTypeDropdownOpen(false);
                        }}
                        className="w-full justify-start text-sm h-10 px-4 hover:text-primary transition-colors"
                      >
                        {pt.label}
                        {proposalType === pt.type && <Check className="w-4 h-4 ml-auto text-verified" />}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {availableProposalTypes.length === 0 && policy && (
              <p className="text-sm text-orange">
                Your role doesn&apos;t have permission to create proposals. Contact a council member to request access.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                const value = e.target.value;
                // Auto-capitalize first letter
                if (value.length === 1) {
                  setDescription(value.toUpperCase());
                } else if (value.length > 0 && description.length === 0) {
                  setDescription(value.charAt(0).toUpperCase() + value.slice(1));
                } else {
                  setDescription(value);
                }
              }}
              rows={3}
              className="w-full px-4 py-2 bg-transparent border border-border rounded-2xl text-sm focus:outline-none focus:border-muted-foreground/50 resize-none placeholder:text-primary placeholder:font-medium placeholder:opacity-60 hover:border-muted-foreground/50"
              placeholder="Enter proposal description..."
            />
            {validationErrors.description && (
              <p className="text-sm text-orange">{validationErrors.description}</p>
            )}
          </div>

          {/* Proposal-specific fields */}
          {proposalType === 'Transfer' && (
            <TransferProposal
              formData={formData}
              onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              validationErrors={validationErrors}
              availableTokens={availableTokens}
              onValidationChange={handleValidationChange}
              nearBalance={nearBalance}
            />
          )}

          {proposalType === 'TokenSwap' && (
            <TokenSwapProposal
              formData={formData}
              onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              validationErrors={validationErrors}
              availableTokens={availableTokens}
              isEstimatingSwap={isEstimatingSwap}
              swapEstimate={swapEstimate}
              onTestSwap={() => setShowTestSwapModal(true)}
              accountId={accountId ?? undefined}
              nearBalance={nearBalance}
            />
          )}

          {(proposalType === 'AddMemberToRole' || proposalType === 'RemoveMemberFromRole') && (
            <MemberRoleProposal
              actionType={proposalType}
              formData={formData}
              onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              validationErrors={validationErrors}
              availableTokens={availableTokens}
              policy={policy ? { 
                roles: policy.roles.map(role => ({
                  name: role.name,
                  kind: role.kind, // Pass the full kind object to get Group members
                  permissions: role.permissions,
                  vote_policy: role.vote_policy,
                }))
              } : undefined}
              onValidationChange={handleValidationChange}
            />
          )}

          {proposalType === 'Vote' && <VoteProposal />}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="muted"
              onClick={() => router.back()}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="verified"
              disabled={!isFormValid || createProposal.isPending || !wallet || !policy || availableProposalTypes.length === 0}
              className="flex-1 font-bold h-12"
            >
              {createProposal.isPending ? (
                <LoadingDots />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Create Proposal ({proposalBondNear} NEAR)
                </>
              )}
            </Button>
          </div>
          {/* Bond Info */}
          <div className="text-center text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
            Proposal creation requires a {proposalBondNear} NEAR bond. Refunded if approved, lost if rejected or removed.
          </div>
        </form>
      </div>

      {/* Click outside to close dropdowns */}
      {proposalTypeDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setProposalTypeDropdownOpen(false);
          }}
        />
      )}

      {/* Transaction Modals */}
      {modal.type === 'success' && (
        <TransactionSuccessModal
          title="Proposal Created! 🎉"
          details={[
            { label: 'Type', value: proposalType },
            { label: 'Description', value: description.slice(0, 50) + (description.length > 50 ? '...' : '') },
          ]}
          tx={modal.txHash}
          onClose={closeModal}
        />
      )}

      {modal.type === 'failure' && (
        <TransactionFailureModal
          error={modal.error}
          onClose={closeModal}
        />
      )}

      {modal.type === 'cancelled' && (
        <TransactionCancelledModal
          title="Proposal Creation Cancelled"
          message="You cancelled the proposal creation. No changes were made."
          onClose={closeModal}
        />
      )}

      {/* Test Swap Modal */}
      <TestSwapModal
        isOpen={showTestSwapModal}
        onClose={closeTestSwapModal}
        swapData={{
          tokenIn: formData.tokenIn!,
          tokenOut: formData.tokenOut!,
          amountIn: formData.amountIn!,
          minAmountOut: formData.minAmountOut!,
          poolId: formData.poolId!,
        }}
        availableTokens={availableTokens}
      />
    </div>
  );
}