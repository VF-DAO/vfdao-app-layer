'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Info, UserPlus, Users, Vote, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { dropdownStyles } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { LoadingDots } from '@/components/ui/loading-dots';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import {
  TransactionCancelledModal,
  TransactionFailureModal,
  TransactionSuccessModal,
} from '@/components/ui/transaction-modal';
import { dao } from '@/features/governance';
import { usePolicy } from '@/features/governance/hooks';
import { groupRoles, joinVotingInfo, proposalBondNear, proposalPeriodDays } from '@/features/governance/lib/join-policy';
import { useAppDrawer } from '@/features/shell/drawer-context';
import { useWallet } from '@/features/wallet';
import { useProfile } from '@/hooks/use-profile';

export function JoinDaoDrawerContent() {
  const { closeDrawer, setLocked } = useAppDrawer();
  const { wallet, accountId } = useWallet();
  const { data: policy, isLoading } = usePolicy();
  const { displayName, profileImageUrl } = useProfile(accountId ?? undefined);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<{
    type: 'success' | 'failure' | 'cancelled' | null;
    txHash?: string;
    error?: string;
  }>({ type: null });

  useEffect(() => {
    setLocked(isSubmitting);
    return () => setLocked(false);
  }, [isSubmitting, setLocked]);

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

  const bondNear = useMemo(() => proposalBondNear(policy), [policy]);
  const periodDays = useMemo(() => proposalPeriodDays(policy), [policy]);
  const availableRoles = useMemo(() => groupRoles(policy), [policy]);
  const votingInfo = useMemo(() => joinVotingInfo(policy), [policy]);

  const closeResult = useCallback(() => {
    const wasSuccess = modal.type === 'success';
    setModal({ type: null });
    if (wasSuccess) {
      closeDrawer();
    }
  }, [closeDrawer, modal.type]);

  const handleSubmit = async () => {
    if (!selectedRole || !accountId || !wallet) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dao.createProposal(
        {
          description: `Request to join ${selectedRole} group`,
          kind: {
            AddMemberToRole: {
              member_id: accountId,
              role: selectedRole,
            },
          },
        },
        wallet,
        policy?.proposal_bond
      );

      setModal({
        type: 'success',
        txHash: result?.transactionHash,
      });
    } catch (err: unknown) {
      console.warn('Join DAO error:', err);
      const error = err as { message?: string; code?: number; name?: string } | null;
      const message = error?.message?.toLowerCase() ?? '';

      if (
        err === null ||
        error?.code === 4001 ||
        error?.name === 'UserRejectedError' ||
        message.includes('cancel') ||
        message.includes('rejected') ||
        message.includes('user') ||
        message.includes('cancelled') ||
        message.includes('abort') ||
        message.includes('dismiss') ||
        message.includes('reject') ||
        message.includes('denied')
      ) {
        setModal({ type: 'cancelled' });
      } else {
        setModal({
          type: 'failure',
          error: error?.message ?? 'Failed to submit join request',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerIcon = (
    <div className="relative">
      <ProfileAvatar
        accountId={accountId ?? ''}
        size="lg"
        profileImageUrl={profileImageUrl}
        className="h-10 w-10 sm:h-12 sm:w-12"
      />
      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-muted/50">
        <UserPlus className="h-3 w-3 text-primary" />
      </div>
    </div>
  );

  return (
    <>
      <Drawer.Header
        icon={headerIcon}
        title="Join DAO"
        subtitle={displayName ?? accountId ?? 'Request a Sputnik role'}
        onClose={closeDrawer}
        disableClose={isSubmitting}
      />

      <Drawer.Content className="space-y-4">
        {isLoading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <LoadingDots />
          </div>
        ) : !accountId ? (
          <p className="text-sm text-muted-foreground">Connect a wallet to request a group role.</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Group</Label>
              <div className="relative" ref={roleRef}>
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex h-12 w-full items-center justify-between rounded-full border border-border bg-transparent px-4 text-sm transition-colors hover:border-muted-foreground/50 focus:border-muted-foreground/50 focus:outline-none"
                >
                  <span className={selectedRole ? 'capitalize text-foreground' : 'font-medium text-primary opacity-60'}>
                    {selectedRole || 'Select a group...'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <Drawer.ExpandableSection isOpen={roleDropdownOpen} className="mt-1">
                  <div className={`${dropdownStyles.container} max-h-64 space-y-0.5 overflow-y-auto p-2`}>
                    {availableRoles.map((role) => (
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
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          ({typeof role.kind === 'object' && 'Group' in role.kind ? role.kind.Group.length : 0} members)
                        </span>
                        <Check className={dropdownStyles.check(selectedRole === role.name)} />
                      </button>
                    ))}
                  </div>
                </Drawer.ExpandableSection>
              </div>
            </div>

            {selectedRole && votingInfo && votingInfo.totalVoters > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 rounded-xl border border-border/50 bg-muted/30 p-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Vote className="h-4 w-4 text-verified" />
                  How your request will be decided
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Voted by: </span>
                      <span className="text-foreground">
                        {votingInfo.roleNames.map((name, index) => (
                          <span key={name}>
                            <span className="font-medium capitalize">{name}</span>
                            {index < votingInfo.roleNames.length - 1 && ', '}
                          </span>
                        ))}
                      </span>
                      <span className="text-muted-foreground"> ({votingInfo.totalVoters} members)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Approval: </span>
                      <span className="font-medium text-foreground">
                        {votingInfo.requiredVotes} of {votingInfo.totalVoters}
                      </span>
                      <span className="text-muted-foreground"> votes needed (&gt;{votingInfo.percentage}%)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Expires in: </span>
                      <span className="font-medium text-foreground">{periodDays} days</span>
                      <span className="text-muted-foreground"> if not decided</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </Drawer.Content>

      <Drawer.Footer className="space-y-3">
        <div className="flex gap-3">
          <Button variant="muted" onClick={closeDrawer} className="h-12 flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="verified"
            onClick={() => void handleSubmit()}
            className="h-12 flex-1 font-bold"
            disabled={!selectedRole || isSubmitting || !accountId}
          >
            {isSubmitting ? (
              <LoadingDots />
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Join ({bondNear} NEAR)
              </>
            )}
          </Button>
        </div>
        <div className="rounded-lg bg-muted/20 p-2 text-center text-xs text-muted-foreground">
          Joining requires a {bondNear} NEAR bond. Refunded if approved, lost if rejected or removed.
        </div>
      </Drawer.Footer>

      {modal.type === 'success' && (
        <TransactionSuccessModal
          title="Join Request Submitted! 🎉"
          details={[
            { label: 'Group', value: selectedRole },
            { label: 'Member', value: accountId ? accountId.slice(0, 20) + (accountId.length > 20 ? '...' : '') : '' },
          ]}
          tx={modal.txHash}
          onClose={closeResult}
        />
      )}
      {modal.type === 'failure' && <TransactionFailureModal error={modal.error} onClose={closeResult} />}
      {modal.type === 'cancelled' && (
        <TransactionCancelledModal
          title="Join Request Cancelled"
          message="You cancelled the join request. No changes were made."
          onClose={closeResult}
        />
      )}
    </>
  );
}
