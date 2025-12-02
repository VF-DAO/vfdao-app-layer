'use client';

import { AlertCircle, AlertTriangle, Check, Clock, X } from 'lucide-react';
import { usePolicy } from '../hooks';
import type { Policy, Proposal } from '../types';

interface VoteProgressProps {
  proposal: Proposal;
  effectiveStatus: string;
}

export function VoteProgress({ proposal, effectiveStatus }: VoteProgressProps) {
  const { data: policy } = usePolicy();

  // Get vote counts for all roles (typically just 'council')
  const roleEntries = Object.entries(proposal.vote_counts);

  if (!policy || roleEntries.length === 0) {
    return (
      <div className="pt-3 border-t border-border text-xs text-muted-foreground text-center">
        <div className="w-4 h-4 mx-auto mb-1 opacity-50 rounded-full border-2 border-current" />
        No votes yet — be the first to vote!
      </div>
    );
  }

  // Calculate threshold for the proposal
  const proposalType = Object.keys(proposal.kind)[0];
  const role = policy.roles.find(r => r.name === 'council') ?? policy.roles[0];

  // Get vote policy for this proposal type or use default
  const votePolicy = role.vote_policy[proposalType] || policy.default_vote_policy;

  // Calculate total weight (council size for RoleWeight)
  let totalWeight = 1;
  if (typeof role.kind === 'object' && role.kind !== null && 'Group' in role.kind) {
    totalWeight = role.kind.Group.length;
  }

  // Calculate threshold from ratio
  // Threshold is the minimum votes needed for approval (as a ratio of total weight)
  // For approval, we need MORE than the threshold ratio (strict majority)
  const [numerator, denominator] = votePolicy.threshold;
  const thresholdRatio = (totalWeight * numerator) / denominator;
  const thresholdVotes = Math.floor(thresholdRatio) + 1; // More than threshold, not equal

  // Quorum is the minimum total votes that must be cast (any type)
  const quorumVotes = parseInt(votePolicy.quorum) || 0;

  // Get vote counts for council
  const council = proposal.vote_counts.council || [0, 0, 0];
  const [approve, reject, voidVotes] = council;

  const totalVotes = approve + reject + voidVotes;

  // For a proposal to pass, it needs:
  // 1. Approval votes >= threshold
  // 2. Total votes >= quorum (if quorum > 0)
  const quorumMet = quorumVotes === 0 || totalVotes >= quorumVotes;
  const approveReached = approve >= thresholdVotes && quorumMet;
  const rejectReached = reject >= thresholdVotes && quorumMet;
  const voidReached = voidVotes >= thresholdVotes && quorumMet;

  return (
    <div className="space-y-3 pt-3">
      {/* Compact vote counts - horizontal layout */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${approveReached ? 'bg-primary' : 'bg-primary/50'}`}></div>
            <span className="text-primary font-medium">{approve}</span>
            <span className="text-muted-foreground">Approve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${rejectReached ? 'bg-orange' : 'bg-orange/50'}`}></div>
            <span className="text-orange font-medium">{reject}</span>
            <span className="text-muted-foreground">Reject</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${voidReached ? 'bg-verified' : 'bg-verified/50'}`}></div>
            <span className="text-verified font-medium">{voidVotes}</span>
            <span className="text-muted-foreground">Remove</span>
          </div>
        </div>
        <div className="text-muted-foreground">
          {thresholdVotes} needed
        </div>
      </div>

      {/* Progress bar with better height */}
      <div className="relative h-2 bg-muted/40 rounded-full overflow-hidden">
        <div className="flex h-full">
          {totalVotes > 0 && (
            <>
              <div
                className="bg-primary transition-all duration-500"
                style={{ width: `${(approve / totalVotes) * 100}%` }}
              />
              <div
                className="bg-orange transition-all duration-500"
                style={{ width: `${(reject / totalVotes) * 100}%` }}
              />
              <div
                className="bg-verified transition-all duration-500"
                style={{ width: `${(voidVotes / totalVotes) * 100}%` }}
              />
            </>
          )}
        </div>
      </div>

      {/* Status message - live progress */}
      <div className="text-xs text-center">
        {effectiveStatus === 'Approved' ? (
          <span className="text-primary font-medium"><Check className="w-3 h-3 inline mr-1" />Approved with {approve} vote{approve !== 1 ? 's' : ''}</span>
        ) : effectiveStatus === 'Rejected' ? (
          <span className="text-orange font-medium"><X className="w-3 h-3 inline mr-1" />Rejected with {reject} vote{reject !== 1 ? 's' : ''}</span>
        ) : effectiveStatus === 'Removed' ? (
          <span className="text-verified font-medium"><AlertCircle className="w-3 h-3 inline mr-1" />Removed with {voidVotes} vote{voidVotes !== 1 ? 's' : ''}</span>
        ) : effectiveStatus === 'Expired' ? (
          <span className="text-muted-foreground">
            {approveReached ? (
              <><Check className="w-3 h-3 inline mr-1" />Threshold reached with {approve} vote{approve !== 1 ? 's' : ''} before expiry</>
            ) : (
              <><Clock className="w-3 h-3 inline mr-1" />Expired without reaching threshold</>
            )}
          </span>
        ) : effectiveStatus === 'Failed' ? (
          <span className="text-orange"><AlertTriangle className="w-3 h-3 inline mr-1" />Failed to execute after approval</span>
        ) : effectiveStatus === 'Moved' ? (
          <span className="text-muted-foreground">→ Moved to different DAO</span>
        ) : approveReached ? (
          <span className="text-primary font-medium"><Check className="w-3 h-3 inline mr-1" />Approval threshold reached with {approve} vote{approve !== 1 ? 's' : ''}</span>
        ) : rejectReached ? (
          <span className="text-orange font-medium"><X className="w-3 h-3 inline mr-1" />Rejection threshold reached with {reject} vote{reject !== 1 ? 's' : ''}</span>
        ) : voidReached ? (
          <span className="text-verified font-medium"><AlertCircle className="w-3 h-3 inline mr-1" />Remove threshold reached with {voidVotes} vote{voidVotes !== 1 ? 's' : ''}</span>
        ) : totalVotes === 0 ? (
          <span className="text-muted-foreground">Waiting for first vote</span>
        ) : !quorumMet ? (
          <span className="text-muted-foreground">
            {quorumVotes - totalVotes} more vote{(quorumVotes - totalVotes) !== 1 ? 's' : ''} needed to meet quorum
          </span>
        ) : approve > reject && approve > voidVotes ? (
          <span className="text-primary">
            Leading with {approve} approve vote{approve !== 1 ? 's' : ''} • {thresholdVotes - approve} more needed
          </span>
        ) : reject > approve && reject > voidVotes ? (
          <span className="text-orange">
            Leading with {reject} reject vote{reject !== 1 ? 's' : ''} • {thresholdVotes - reject} more needed
          </span>
        ) : voidVotes > approve && voidVotes > reject ? (
          <span className="text-verified">
            <AlertCircle className="w-3 h-3 inline mr-1" />Leading with {voidVotes} remove vote{voidVotes !== 1 ? 's' : ''} • {thresholdVotes - voidVotes} more needed
          </span>
        ) : (
          <span className="text-muted-foreground">
            {Math.max(approve, reject, voidVotes)} vote{Math.max(approve, reject, voidVotes) !== 1 ? 's' : ''} in • {thresholdVotes - Math.max(approve, reject, voidVotes)} more needed
          </span>
        )}
      </div>

      {/* Individual votes - compact */}
      <VotesList proposal={proposal} policy={policy} />
    </div>
  );
}

function VotesList({ proposal, policy }: { proposal: Proposal; policy: Policy }) {
  const votes = Object.entries(proposal.votes);

  if (votes.length === 0) {
    return null;
  }

  // Get council members (current)
  const councilRole = policy.roles.find(r => r.name === 'council');
  const councilMembers = councilRole && typeof councilRole.kind === 'object' && councilRole.kind !== null && 'Group' in councilRole.kind ? councilRole.kind.Group : [];

  // Get total votes from vote_counts to know how many members could vote
  const council = proposal.vote_counts.council || [0, 0, 0];
  const [approve, reject, remove] = council;
  const totalVotesCast = approve + reject + remove;

  // Create union of all council-related accounts (voted + current members who haven't)
  const voted = votes.map(([accountId]) => accountId);
  const allRelevantMembers = Array.from(new Set([...voted, ...councilMembers]));
  const notVoted = allRelevantMembers.filter(member => !voted.includes(member));

  // Sort votes by likely voting order (earliest first)
  // Since we don't have exact timestamps, we'll sort by account name for consistency
  const sortedVotes = votes.sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-1.5 pt-1.5">
      <div className="text-xs font-medium text-muted-foreground">
        Council Votes ({totalVotesCast}/{allRelevantMembers.length})
      </div>

      <div className="flex flex-wrap gap-1">
        {sortedVotes.map(([accountId, vote], index) => (
          <VoteBadge
            key={accountId}
            accountId={accountId}
            vote={vote}
            voteOrder={index + 1}
            proposal={proposal}
          />
        ))}

        {notVoted.length > 0 && (
          <>
            {notVoted.slice(0, 3).map(accountId => (
              <VoteBadge key={accountId} accountId={accountId} vote={null} />
            ))}
            {notVoted.length > 3 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{notVoted.length - 3} more
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VoteBadge({ accountId, vote, voteOrder, proposal }: {
  accountId: string;
  vote: 'Approve' | 'Reject' | 'Remove' | null;
  voteOrder?: number;
  proposal?: Proposal;
}) {
  const shortName = accountId.length > 20 ? `${accountId.slice(0, 8)}...${accountId.slice(-6)}` : accountId;

  const voteConfig = {
    Approve: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      icon: Check,
      size: 'w-3 h-3'
    },
    Reject: {
      bg: 'bg-orange/10',
      text: 'text-orange',
      icon: X,
      size: 'w-3 h-3'
    },
    Remove: {
      bg: 'bg-verified/10',
      text: 'text-verified',
      icon: AlertCircle,
      size: 'w-3 h-3'
    },
    null: { 
      bg: 'bg-muted', 
      text: 'text-muted-foreground', 
      icon: 'circle',
      size: 'w-2 h-2'
    },
  };

  const config = voteConfig[vote ?? 'null'];
  const Icon = config.icon;

  // Calculate relative timing info
  const getTimingInfo = () => {
    if (!vote || !proposal) return '';

    const submissionTimeMs = parseInt(proposal.submission_time) / 1_000_000;
    const now = Date.now();
    const proposalAgeMs = now - submissionTimeMs;

    // Estimate when this vote likely occurred
    // Since we don't have exact timestamps, we'll provide context based on vote order
    if (voteOrder && proposal.last_actions_log && proposal.last_actions_log.length > 0) {
      const totalVotesCast = Object.keys(proposal.votes).length;
      const estimatedProgress = voteOrder / Math.max(totalVotesCast, 1);
      const estimatedVoteTime = submissionTimeMs + (proposalAgeMs * estimatedProgress);
      const timeSinceVote = now - estimatedVoteTime;
      if (timeSinceVote < 60000) return 'Just voted';
      if (timeSinceVote < 3600000) return `${Math.floor(timeSinceVote / 60000)}m ago`;
      if (timeSinceVote < 86400000) return `${Math.floor(timeSinceVote / 3600000)}h ago`;
      return `${Math.floor(timeSinceVote / 86400000)}d ago`;
    }

    return '';
  };

  const timingInfo = getTimingInfo();
  const tooltipText = vote
    ? `${accountId}\nVoted: ${vote}${timingInfo ? `\n${timingInfo}` : ''}${voteOrder ? `\n${voteOrder}${voteOrder === 1 ? 'st' : voteOrder === 2 ? 'nd' : voteOrder === 3 ? 'rd' : 'th'} to vote` : ''}`
    : `${accountId}\nHas not voted yet`;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} cursor-help transition-colors hover:opacity-80`}
      title={tooltipText}
    >
      {config.icon === 'circle' ? (
        <div className="w-2 h-2 rounded-full border-2 border-current opacity-50" />
      ) : (
        <Icon className={config.size} />
      )}
      <span className="font-mono text-[10px]">{shortName}</span>
      {voteOrder && voteOrder <= 5 && (
        <span className="text-[8px] opacity-60 ml-0.5">
          {voteOrder === 1 ? '¹' : voteOrder === 2 ? '²' : voteOrder === 3 ? '³' : voteOrder === 4 ? '⁴' : '⁵'}
        </span>
      )}
    </span>
  );
}