'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Info, UserPlus, Users, Vote, Zap } from 'lucide-react';
import Big from 'big.js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingDots } from '@/components/ui/loading-dots';
import { Modal } from '@/components/ui/modal';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { dropdownStyles } from '@/components/ui/dropdown-menu';
import { TransactionCancelledModal, TransactionFailureModal, TransactionSuccessModal } from '@/components/ui/transaction-modal';
import { useProfile } from '@/hooks/use-profile';
import { useWallet } from '@/features/wallet';
import { dao } from '@/features/governance';

interface JoinDaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: any;
  accountId: string;
}

export function JoinDaoModal({ isOpen, onClose, policy, accountId }: JoinDaoModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);
  const { wallet } = useWallet();
  const { displayName, profileImageUrl } = useProfile(accountId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };

    if (roleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [roleDropdownOpen]);

  // Modal state for transaction results
  const [modal, setModal] = useState<{
    type: 'success' | 'failure' | 'cancelled' | null;
    txHash?: string;
    error?: string;
  }>({ type: null });

  const closeModal = useCallback(() => {
    setModal({ type: null });
    if (modal.type === 'success') {
      onClose();
    }
  }, [modal.type, onClose]);

  // Calculate proposal bond in NEAR (same as CreateProposal)
  const proposalBondNear = useMemo(() => {
    if (!policy?.proposal_bond) return '1';
    try {
      const bondInYocto = new Big(policy.proposal_bond);
      const bondInNear = bondInYocto.div(new Big(10).pow(24));
      return bondInNear.toFixed(2).replace(/\.?0+$/, '');
    } catch (err) {
      console.warn('Failed to calculate proposal bond:', err);
      return '1';
    }
  }, [policy]);

  // Calculate proposal period in days
  const proposalPeriodDays = useMemo(() => {
    if (!policy?.proposal_period) return 7;
    try {
      const periodNs = new Big(policy.proposal_period);
      const periodDays = periodNs.div(new Big(10).pow(9)).div(86400); // ns -> seconds -> days
      return Math.round(periodDays.toNumber());
    } catch {
      return 7;
    }
  }, [policy]);

  // Filter roles that have Group kind (excludes Everyone)
  const availableRoles = useMemo(() => {
    if (!policy?.roles) return [];
    return policy.roles.filter((role: any) => 
      role.kind !== 'Everyone' && typeof role.kind === 'object' && 'Group' in role.kind
    );
  }, [policy]);

  // Get voting info from policy - roles that can vote have permissions like *:* or *:VoteApprove
  const votingInfo = useMemo(() => {
    if (!policy?.roles) return null;
    
    // Find roles with voting permissions (council typically has *:*)
    const rolesWithVotingPower = policy.roles.filter((role: any) => {
      if (role.kind === 'Everyone') return false;
      if (!role.permissions) return false;
      
      // Check for voting permissions
      return role.permissions.some((p: string) => 
        p === '*:*' || 
        p.includes('VoteApprove') ||
        p.includes('AddMemberToRole')
      );
    });
    
    // Count total voters from these roles
    let totalVoters = 0;
    const roleNames: string[] = [];
    
    rolesWithVotingPower.forEach((role: any) => {
      if (typeof role.kind === 'object' && 'Group' in role.kind) {
        totalVoters += role.kind.Group.length;
        roleNames.push(role.name);
      }
    });
    
    // Get threshold from default vote policy
    const threshold = policy.default_vote_policy?.threshold ?? [1, 2];
    const [num, den] = threshold;
    // Show the actual policy threshold percentage
    const thresholdPercentage = Math.round((num / den) * 100);
    // Same calculation as VoteProgress: need MORE than threshold ratio (strict majority)
    const thresholdRatio = (totalVoters * num) / den;
    const requiredVotes = Math.floor(thresholdRatio) + 1;
    
    return {
      totalVoters,
      requiredVotes,
      percentage: thresholdPercentage,
      roleNames,
    };
  }, [policy]);

  const handleSubmit = async () => {
    if (!selectedRole || !accountId || !wallet) return;

    setIsSubmitting(true);

    try {
      const proposal = {
        description: `Request to join ${selectedRole} group`,
        kind: {
          AddMemberToRole: {
            member_id: accountId,
            role: selectedRole,
          },
        },
      };

      const result = await dao.createProposal(proposal, wallet, policy?.proposal_bond);
      
      setModal({
        type: 'success',
        txHash: result?.transactionHash,
      });
    } catch (err: any) {
      console.warn('Join DAO error:', err);
      const message = err?.message?.toLowerCase() ?? '';
      
      // Detect user cancellation (same logic as CreateProposal)
      if (err === null || err?.code === 4001 || err?.name === 'UserRejectedError' || 
          message.includes('cancel') || message.includes('rejected') || 
          message.includes('user') || message.includes('cancelled') || 
          message.includes('abort') || message.includes('dismiss') || 
          message.includes('reject') || message.includes('denied')) {
        setModal({ type: 'cancelled' });
      } else {
        setModal({
          type: 'failure',
          error: err?.message ?? 'Failed to submit join request',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Header icon with avatar and badge
  const headerIcon = (
    <div className="relative">
      <ProfileAvatar
        accountId={accountId}
        size="lg"
        profileImageUrl={profileImageUrl}
        className="w-10 h-10 sm:w-12 sm:h-12"
      />
      {/* Small UserPlus badge */}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center border-2 border-card">
        <UserPlus className="w-3 h-3 text-primary" />
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-md"
        disableClose={isSubmitting}
        closeOnBackdrop={!isSubmitting}
      >
        <Modal.Header
          icon={headerIcon}
          title="Join DAO"
          subtitle={displayName || accountId}
          onClose={onClose}
          disableClose={isSubmitting}
        />

        <Modal.Content className="space-y-4" minHeight="min-h-[200px]">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Group</Label>
            <div className="relative" ref={roleRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="w-full h-12 bg-transparent border border-border rounded-full text-sm focus:outline-none focus:border-muted-foreground/50 px-4 flex items-center justify-between hover:border-muted-foreground/50 transition-colors"
              >
                <span className={selectedRole ? 'text-foreground capitalize' : 'text-primary font-medium opacity-60'}>
                  {selectedRole || 'Select a group...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu with smooth expand animation */}
              <Modal.ExpandableSection isOpen={roleDropdownOpen} className="mt-1">
                <div className={`${dropdownStyles.container} max-h-64 overflow-y-auto p-2 space-y-0.5`}>
                  {availableRoles.map((role: any) => (
                    <button
                      key={role.name}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role.name);
                        setRoleDropdownOpen(false);
                      }}
                      className={`${dropdownStyles.item} capitalize`}
                    >
                      <span className={dropdownStyles.itemText}>{role.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({role.kind?.Group?.length ?? 0} members)
                      </span>
                      <Check className={dropdownStyles.check(selectedRole === role.name)} />
                    </button>
                  ))}
                </div>
              </Modal.ExpandableSection>
            </div>
          </div>

          {/* Voting Info Card - show when role is selected */}
          {selectedRole && votingInfo && votingInfo.totalVoters > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Vote className="w-4 h-4 text-verified" />
                How your request will be decided
              </div>
              
              <div className="space-y-2 text-sm">
                {/* Who votes */}
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-muted-foreground">Voted by: </span>
                    <span className="text-foreground">
                      {votingInfo.roleNames.map((name: string, i: number) => (
                        <span key={name}>
                          <span className="capitalize font-medium">{name}</span>
                          {i < votingInfo.roleNames.length - 1 && ', '}
                        </span>
                      ))}
                    </span>
                    <span className="text-muted-foreground"> ({votingInfo.totalVoters} members)</span>
                  </div>
                </div>
                
                {/* Approval threshold */}
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-muted-foreground">Approval: </span>
                    <span className="text-foreground font-medium">{votingInfo.requiredVotes} of {votingInfo.totalVoters}</span>
                    <span className="text-muted-foreground"> votes needed (&gt;{votingInfo.percentage}%)</span>
                  </div>
                </div>
                
                {/* Time limit */}
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-muted-foreground">Expires in: </span>
                    <span className="text-foreground font-medium">{proposalPeriodDays} days</span>
                    <span className="text-muted-foreground"> if not decided</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </Modal.Content>

        <Modal.Footer className="border-t border-border space-y-3">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="muted"
              onClick={onClose}
              className="flex-1 h-12"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="verified"
              onClick={() => void handleSubmit()}
              className="flex-1 font-bold h-12"
              disabled={!selectedRole || isSubmitting}
            >
              {isSubmitting ? (
                <LoadingDots />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Join ({proposalBondNear} NEAR)
                </>
              )}
            </Button>
          </div>

          {/* Bond Info */}
          <div className="text-center text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
            Joining requires a {proposalBondNear} NEAR bond. Refunded if approved, lost if rejected or removed.
          </div>
        </Modal.Footer>
      </Modal>

      {/* Transaction Modals */}
      {modal.type === 'success' && (
        <TransactionSuccessModal
          title="Join Request Submitted! 🎉"
          details={[
            { label: 'Group', value: selectedRole },
            { label: 'Member', value: accountId.slice(0, 20) + (accountId.length > 20 ? '...' : '') },
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
          title="Join Request Cancelled"
          message="You cancelled the join request. No changes were made."
          onClose={closeModal}
        />
      )}
    </>
  );
}
