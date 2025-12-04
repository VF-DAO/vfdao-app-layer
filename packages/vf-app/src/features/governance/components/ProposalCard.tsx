'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, ArrowRight, ArrowUp, Check, Circle, Factory, FileText, Gift, Settings, Target, UserMinus, UserPlus, Users, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingDots } from '@/components/ui/loading-dots';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { TransactionCancelledModal, TransactionFailureModal, TransactionSuccessModal } from '@/components/ui/transaction-modal';
import { usePolicy, useUserRole, useVote } from '../hooks';
import { useWallet } from '@/features/wallet';
import { useProfile } from '@/hooks/use-profile';
import { ProposalDetails } from './ProposalDetails';
import { VoteProgress } from './VoteProgress';
import { ActionLog } from './ActionLog';
import { QuickActions } from './QuickActions';
import type { Proposal, Role } from '../types';

interface ProposalCardProps {
  proposal: Proposal;
  hasPermission?: (proposalType: string, action: 'VoteApprove' | 'VoteReject' | 'VoteRemove') => boolean;
  id?: string;
}

export function ProposalCard({ proposal, hasPermission, id }: ProposalCardProps) {
  const { wallet, accountId } = useWallet();
  const vote = useVote(wallet);
  const { data: policy } = usePolicy();
  const { displayName: proposerDisplayName, profileImageUrl: proposerProfileImageUrl, loading: proposerProfileLoading } = useProfile(proposal.proposer);
  const { role: _proposerRole, isCouncil: proposerIsCouncil } = useUserRole(proposal.proposer);
  
  // Check if proposer has any specific group memberships (not just "Everyone")
  const proposerGroups = useMemo(() => {
    if (!policy) return [];
    return policy.roles.filter((r: Role) => 
      r.name !== 'all' && typeof r.kind === 'object' && 'Group' in r.kind && r.kind.Group.includes(proposal.proposer)
    );
  }, [policy, proposal.proposer]);
  
  // Vote modal state
  const [voteModal, setVoteModal] = useState<{
    type: 'success' | 'failure' | 'cancelled' | null;
    action?: 'VoteApprove' | 'VoteReject' | 'VoteRemove';
    txHash?: string;
    error?: string;
  }>({ type: null });
  
  // Handle vote with modal feedback
  const handleVote = async (action: 'VoteApprove' | 'VoteReject' | 'VoteRemove') => {
    try {
      const result = await vote.mutate({ id: proposal.id, action });
      setVoteModal({ 
        type: 'success', 
        action,
        txHash: result?.transactionHash ?? result?.transaction?.hash
      });
    } catch (err: any) {
      // Check if user cancelled
      if (err?.message?.includes('cancel') || err?.message?.includes('rejected') || err?.message?.includes('User')) {
        setVoteModal({ type: 'cancelled', action });
      } else {
        setVoteModal({ type: 'failure', action, error: err?.message ?? 'Vote failed' });
      }
    }
  };
  
  const closeVoteModal = () => setVoteModal({ type: null });
  
  // Vote action labels for modals
  const voteActionLabels = {
    VoteApprove: 'Approved',
    VoteReject: 'Rejected',
    VoteRemove: 'Removed',
  };
  
  // VF brand color mapping
  const statusVariantMap = {
    InProgress: 'verified',         // Verified gold - active, needs attention
    Approved: 'secondary',    // Sage green - approved/success (matches Remove Liquidity button)
    Rejected: 'orange',             // Orange - rejected
    Expired: 'muted',               // Muted gray - inactive/expired
    Removed: 'muted',               // Muted gray - archived
    Moved: 'muted',                 // Muted gray - archived
    Failed: 'orange',               // Orange - execution failed
  } as const;
  
  // Get the proposal type key for permission checking
  const proposalType = Object.keys(proposal.kind)[0];
  
  // Check if user has already voted on this proposal
  const userVote = accountId ? proposal.votes[accountId] : null;
  const hasAlreadyVoted = userVote !== null && userVote !== undefined;
  
  // Check specific permissions for each action
  const canApprove = hasPermission ? hasPermission(proposalType, 'VoteApprove') : false;
  const canReject = hasPermission ? hasPermission(proposalType, 'VoteReject') : false;
  const canRemove = hasPermission ? hasPermission(proposalType, 'VoteRemove') : false;
  const canVote = (canApprove || canReject || canRemove) && !hasAlreadyVoted;
  
  // Parse description into title and description
  // Title: First line or up to 100 chars before first period/newline
  // Description: Everything after the title
  const parseDescription = (text: string): { title: string; description: string | null } => {
    // Helper to capitalize first letter
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    
    if (!text || text.trim() === '') {
      return { title: 'Untitled Proposal', description: null };
    }
    
    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    const remainingLines = lines.slice(1).join('\n').trim();
    
    // If first line is short enough, use it as title
    if (firstLine.length <= 100) {
      return {
        title: capitalize(firstLine),
        description: remainingLines || null
      };
    }
    
    // If first line is long, try to split at first period within 100 chars
    const periodIndex = firstLine.indexOf('.');
    if (periodIndex > 0 && periodIndex <= 100) {
      const afterPeriod = firstLine.slice(periodIndex + 1).trim();
      const fullDescription = afterPeriod && remainingLines 
        ? `${afterPeriod}\n${remainingLines}`
        : afterPeriod || remainingLines || null;
      
      return {
        title: capitalize(firstLine.slice(0, periodIndex)),
        description: fullDescription
      };
    }
    
    // Otherwise, truncate at word boundary around 80 chars
    // Find the last space before 80 chars to avoid cutting words
    const maxLength = 80;
    let truncateAt = maxLength;
    
    // Look for the last space before maxLength
    const lastSpaceIndex = firstLine.lastIndexOf(' ', maxLength);
    if (lastSpaceIndex > 40) {
      // Only use word boundary if it's not too short (at least 40 chars)
      truncateAt = lastSpaceIndex;
    }
    
    const titleText = firstLine.slice(0, truncateAt).trim();
    const afterTitle = firstLine.slice(truncateAt).trim();
    const fullDescription = afterTitle && remainingLines
      ? `${afterTitle}\n${remainingLines}`
      : afterTitle || remainingLines || null;
    
    return {
      title: capitalize(titleText) + '...',
      description: fullDescription
    };
  };
  
  const { title, description } = parseDescription(proposal.description);
  
  // Calculate time remaining (proposal_period is 7 days = 604800000000000 nanoseconds)
  const submissionTimeMs = parseInt(proposal.submission_time) / 1_000_000;
  const proposalPeriodMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const expirationTimeMs = submissionTimeMs + proposalPeriodMs;
  const timeRemainingMs = expirationTimeMs - Date.now();
  const daysRemaining = Math.floor(timeRemainingMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.floor((timeRemainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  const timeRemainingText = timeRemainingMs > 0 
    ? daysRemaining > 0 
      ? `${daysRemaining}d ${hoursRemaining}h remaining`
      : hoursRemaining > 0
        ? `${hoursRemaining}h remaining`
        : 'Expires soon'
    : 'Expired';
  
  // Client-side check: if voting period expired but contract status is still InProgress,
  // treat it as expired for UI purposes (contract status only changes when Finalize is called)
  const isExpired = timeRemainingMs <= 0 && proposal.status === 'InProgress';
  const effectiveStatus = isExpired ? 'Expired' : proposal.status;
  
  // Calculate effective status variant based on effectiveStatus (not proposal.status)
  const effectiveStatusVariant = (statusVariantMap[effectiveStatus] || 'muted');

  // Calculate proposal age for prioritization
  const calculateAge = (submissionTimeMs: number) => {
    const now = Date.now();
    const diffMs = now - submissionTimeMs;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else {
      const days = Math.floor(diffDays);
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
  };

  const proposalAge = calculateAge(submissionTimeMs);

  // Status border color
  const statusBorderColor = {
    InProgress: 'border-l-verified',
    Approved: 'border-l-primary',
    Rejected: 'border-l-orange',
    Expired: 'border-l-muted-foreground',
    Removed: 'border-l-verified',
    Moved: 'border-l-muted-foreground',
    Failed: 'border-l-orange',
  }[effectiveStatus] || 'border-l-muted-foreground';

  return (
    <div id={id} className={`bg-card border border-border rounded-2xl transition-all hover:shadow-interactive border-l-4 ${statusBorderColor} shadow-main-card`}>
      <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-t-2xl mb-4 md:mb-6 shadow-sm">
        <div className="p-2 sm:p-3 md:p-4">
          {/* Header Row - ID, Type, Status */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">#{proposal.id}</span>
              <ProposalTypeBadge type={proposalType} />
              {effectiveStatus === 'InProgress' && (
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  daysRemaining < 2 ? 'bg-orange/10 text-orange' : 'bg-muted text-muted-foreground'
                }`}>
                  {timeRemainingText}
                </span>
              )}
            </div>
            <Badge variant={effectiveStatusVariant} className="text-xs shrink-0">{effectiveStatus}</Badge>
          </div>

          {/* Proposer and Timing Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>By</span>
              <div className="flex items-center gap-2">
                <ProfileAvatar
                  accountId={proposal.proposer}
                  size="sm"
                  profileImageUrl={proposerProfileImageUrl}
                  isLoading={proposerProfileLoading}
                  className="w-7 h-7"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                      title={`Proposer: ${proposal.proposer}\nClick to copy`}
                      onClick={() => void navigator.clipboard.writeText(proposal.proposer)}
                    >
                      {proposerProfileLoading ? <LoadingDots size="xs" /> : (proposerDisplayName ?? proposal.proposer)}
                    </span>
                    {proposerGroups.length > 0 && (
                      <Badge variant="primary" className="text-[10px] px-1 py-0 capitalize shrink-0">
                        {proposerIsCouncil ? 'Council' : 'Member'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {proposal.proposer}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-primary font-medium">
                {proposalAge}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Submitted {new Date(submissionTimeMs).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {effectiveStatus === 'InProgress' ? 'Expires' : 'Expired'} {new Date(expirationTimeMs).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
        {/* Title - allow wrap to 2 lines for better readability */}
        <h3 className="text-base leading-snug font-semibold text-foreground line-clamp-2">{title}</h3>
        
        {/* Visual separator for content sections */}
        <div className="border-t border-border/50" />
        
        <ProposalDetails proposal={proposal} description={description} />
        <VoteProgress proposal={proposal} effectiveStatus={effectiveStatus} />
        
        {/* Show user's vote if they already voted */}
        {hasAlreadyVoted && effectiveStatus === 'InProgress' && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">You voted:</span>
              <Badge 
                variant={userVote === 'Approve' ? 'secondary' : userVote === 'Reject' ? 'orange' : 'verified'}
                className="font-medium"
              >
                {userVote === 'Approve' && <Check className="w-3 h-3 mr-1" />}
                {userVote === 'Reject' && <X className="w-3 h-3 mr-1" />}
                {userVote === 'Remove' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {userVote}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Voting buttons - compact layout */}
        {canVote && effectiveStatus === 'InProgress' && (
          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-1.5">
              {canApprove && (
                <Button
                  variant="verified"
                  size="sm"
                  onClick={() => void handleVote('VoteApprove')}
                  disabled={vote.isPending || !wallet}
                >
                  {vote.isPending ? <LoadingDots size="xs" /> : (
                    <><Check className="w-4 h-4 mr-1" /> Approve</>
                  )}
                </Button>
              )}
              {canReject && (
                <Button
                  variant="orange"
                  size="sm"
                  onClick={() => void handleVote('VoteReject')}
                  disabled={vote.isPending || !wallet}
                >
                  {vote.isPending ? <LoadingDots size="xs" /> : (
                    <><X className="w-4 h-4 mr-1" /> Reject</>
                  )}
                </Button>
              )}
              {canRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleVote('VoteRemove')}
                  disabled={vote.isPending || !wallet}
                  className="border-verified/50 hover:border-verified hover:bg-verified/10 text-verified"
                >
                  {vote.isPending ? <LoadingDots size="xs" /> : (
                    <><AlertTriangle className="w-4 h-4 mr-1" /> Remove</>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Vote Transaction Modals */}
        {voteModal.type === 'success' && (
          <TransactionSuccessModal
            title={`Vote ${voteActionLabels[voteModal.action!]} ✓`}
            details={[
              { label: 'Proposal', value: `#${proposal.id}` },
              { label: 'Action', value: voteActionLabels[voteModal.action!] },
            ]}
            tx={voteModal.txHash}
            onClose={closeVoteModal}
          />
        )}
        
        {voteModal.type === 'failure' && (
          <TransactionFailureModal
            error={voteModal.error}
            onClose={closeVoteModal}
          />
        )}
        
        {voteModal.type === 'cancelled' && (
          <TransactionCancelledModal
            title="Vote Cancelled"
            message="You cancelled the vote. No changes were made to the proposal."
            onClose={closeVoteModal}
          />
        )}
        
        {/* Action log - collapsed by default for compactness */}
        <ActionLog proposal={proposal} />
        
        {/* Quick actions */}
        <QuickActions proposal={proposal} />
      </div>
    </div>
  );
}

function ProposalTypeBadge({ type }: { type: string }) {
  const icons: Record<string, LucideIcon> = {
    Transfer: ArrowRight,
    Vote: Circle,
    AddMemberToRole: UserPlus,
    RemoveMemberFromRole: UserMinus,
    FunctionCall: Zap,
    UpgradeSelf: ArrowUp,
    UpgradeRemote: ArrowLeftRight,
    SetStakingContract: Target,
    AddBounty: Gift,
    BountyDone: Check,
    ChangePolicy: Settings,
    ChangeConfig: Settings,
    FactoryInfoUpdate: Factory,
    ChangePolicyAddOrUpdateRole: Users,
    ChangePolicyRemoveRole: UserMinus,
    ChangePolicyUpdateDefaultVotePolicy: Circle,
    ChangePolicyUpdateParameters: Settings,
  };
  
  const Icon = icons[type] || FileText;
  
  // Log unknown proposal types to console
  if (!icons[type]) {
    console.warn('[ProposalCard] Unknown proposal type:', type);
  }
  
  return (
    <Badge variant="secondary" className="font-mono text-xs border-none">
      <Icon className="w-3 h-3 mr-1" /> {type}
    </Badge>
  );
}
