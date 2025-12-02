/**
 * Governance Hooks
 * 
 * React hooks for DAO data fetching and mutations
 */

import { useCallback, useEffect, useState } from 'react';
import { dao } from './index';
import type { Policy, Proposal, Role } from './types';

/**
 * Fetch all proposals
 */
export function useProposals(page = 0, limit = 20) {
  const [data, setData] = useState<Proposal[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const fromIndex = page * limit;
      const proposals = await dao.getProposals(fromIndex, limit);
      setData(proposals);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch proposals'));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);
  
  useEffect(() => {
    void refetch();
  }, [refetch]);
  
  return { data, isLoading, error, refetch };
}

/**
 * Get total number of proposals
 */
export function useTotalProposals() {
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTotal = async () => {
      try {
        setIsLoading(true);
        const lastId = await dao.getLastProposalId();
        setTotal(lastId);
      } catch (err) {
        console.error('Failed to fetch total proposals:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchTotal();
  }, []);
  
  return { total, isLoading };
}

/**
 * Fetch single proposal by ID
 */
export function useProposal(id: number) {
  const [data, setData] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!id || id <= 0) return;
    
    const fetchProposal = async () => {
      try {
        setIsLoading(true);
        const proposal = await dao.getProposal(id);
        setData(proposal ?? null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch proposal'));
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchProposal();
  }, [id]);
  
  return { data, isLoading, error };
}

/**
 * Fetch DAO policy (roles, permissions, voting rules)
 */
export function usePolicy() {
  const [data, setData] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setIsLoading(true);
        const policy = await dao.getPolicy();
        setData(policy);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch policy'));
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchPolicy();
  }, []);
  
  return { data, isLoading, error };
}

/**
 * Get current user's role in the DAO
 */
export function useUserRole(accountId?: string) {
  const { data: policy } = usePolicy();
  
  if (!accountId || !policy) {
    return { role: null, isCouncil: false, canVote: false };
  }
  
  // Get ALL roles that match the user (Everyone + Group memberships)
  // Following Sputnik DAO contract logic: get_user_roles() collects ALL matching roles
  const userRoles = policy.roles.filter((r: Role) => {
    if (r.kind === 'Everyone') return true;
    if ('Group' in r.kind) {
      return r.kind.Group.includes(accountId);
    }
    // Member role: user.amount >= required_amount (not implemented yet in our UI)
    return false;
  });
  
  const isCouncil = userRoles.some(r => r.name === 'council');
  
  // Function to check if user has specific permission for a proposal
  // Must check across ALL user's roles (like contract's can_execute_action)
  const hasPermission = (proposalType: string, action: 'VoteApprove' | 'VoteReject' | 'VoteRemove') => {
    if (userRoles.length === 0) return false;
    
    const permissionKey = `${proposalType}:${action}`;
    const wildcardAction = `${proposalType}:*`;
    const wildcardType = `*:${action}`;
    const wildcardAll = '*:*';
    
    // Check if ANY of the user's roles has the required permission
    return userRoles.some((role: Role) => 
      role.permissions.includes(permissionKey) || 
      role.permissions.includes(wildcardAction) ||
      role.permissions.includes(wildcardType) ||
      role.permissions.includes(wildcardAll)
    );
  };
  
  return { role: userRoles[0] || null, isCouncil, hasPermission };
}

/**
 * Mapping from UI proposal types to Sputnik DAO policy labels
 * Based on ProposalKind::to_policy_label() in the contract
 */
const PROPOSAL_TYPE_TO_POLICY_LABEL: Record<string, string> = {
  Transfer: 'transfer',
  Vote: 'vote',
  AddMemberToRole: 'add_member_to_role',
  RemoveMemberFromRole: 'remove_member_from_role',
  TokenSwap: 'call', // FunctionCall proposals use 'call' label
  FunctionCall: 'call',
  ChangePolicy: 'policy',
  ChangeConfig: 'config',
  UpgradeSelf: 'upgrade_self',
  UpgradeRemote: 'upgrade_remote',
  SetStakingContract: 'set_vote_token',
  AddBounty: 'add_bounty',
  BountyDone: 'bounty_done',
  FactoryInfoUpdate: 'factory_info_update',
  ChangePolicyAddOrUpdateRole: 'policy_add_or_update_role',
  ChangePolicyRemoveRole: 'policy_remove_role',
  ChangePolicyUpdateDefaultVotePolicy: 'policy_update_default_vote_policy',
  ChangePolicyUpdateParameters: 'policy_update_parameters',
};

/**
 * Check which proposal types the user is allowed to create
 * Based on the DAO policy permissions for AddProposal action
 */
export function useAllowedProposalTypes(accountId?: string) {
  const { data: policy } = usePolicy();
  
  if (!accountId || !policy) {
    return { allowedTypes: [], isLoading: !policy, canCreateProposal: (_type: string) => false };
  }
  
  // Get ALL roles that match the user (Everyone + Group memberships)
  const userRoles = policy.roles.filter((r: Role) => {
    if (r.kind === 'Everyone') return true;
    if ('Group' in r.kind) {
      return r.kind.Group.includes(accountId);
    }
    return false;
  });
  
  // Check if user can create a specific proposal type
  const canCreateProposal = (proposalType: string): boolean => {
    if (userRoles.length === 0) return false;
    
    const policyLabel = PROPOSAL_TYPE_TO_POLICY_LABEL[proposalType] || proposalType.toLowerCase();
    
    // Check permission patterns: exact, wildcard type, wildcard action, or full wildcard
    const permissionKey = `${policyLabel}:AddProposal`;
    const wildcardAction = `${policyLabel}:*`;
    const wildcardType = `*:AddProposal`;
    const wildcardAll = '*:*';
    
    // Check if ANY of the user's roles has the required permission
    return userRoles.some((role: Role) => 
      role.permissions.includes(permissionKey) || 
      role.permissions.includes(wildcardAction) ||
      role.permissions.includes(wildcardType) ||
      role.permissions.includes(wildcardAll)
    );
  };
  
  // Get list of all allowed proposal types (for UI filtering)
  const allowedTypes = Object.keys(PROPOSAL_TYPE_TO_POLICY_LABEL).filter(canCreateProposal);
  
  return { allowedTypes, isLoading: false, canCreateProposal };
}

/**
 * Vote on a proposal
 */
export function useVote(wallet: any) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mutate = useCallback(async ({ id, action }: { id: number; action: 'VoteApprove' | 'VoteReject' | 'VoteRemove' }) => {
    try {
      setIsPending(true);
      setError(null);
      const result = await dao.vote(id, action, wallet);
      // Trigger refetch in components that need it
      window.dispatchEvent(new CustomEvent('dao:proposal:updated'));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to vote'));
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [wallet]);
  
  return { mutate, isPending, error };
}

/**
 * Create a new proposal
 */
export function useCreateProposal(wallet: any) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mutate = useCallback(async ({ description, kind, deposit }: { description: string; kind: any; deposit?: string }) => {
    try {
      setIsPending(true);
      setError(null);
      const result = await dao.createProposal({ description, kind }, wallet, deposit);
      // Trigger refetch
      window.dispatchEvent(new CustomEvent('dao:proposal:created'));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create proposal'));
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [wallet]);
  
  return { mutate, isPending, error };
}

/**
 * Fetch DAO treasury balance (NEAR + tokens)
 */
export function useTreasuryBalance() {
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceUsd, setBalanceUsd] = useState<string>('0');
  const [tokens, setTokens] = useState<{ symbol: string; balance: string; balanceUsd: string; contractId: string; decimals: number; icon?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsd, setTotalUsd] = useState<string>('0');
  
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const treasuryData = await dao.getTreasuryBalance();
        setBalance(treasuryData.balance);
        setBalanceUsd(treasuryData.balanceUsd);
        
        // Fetch token balances
        const tokenBalances = await dao.getTokenBalances();
        setTokens(tokenBalances);
        
        // Calculate total USD value
        const nearUsd = parseFloat(treasuryData.balanceUsd.replace(/[^0-9.-]/g, '')) || 0;
        const tokensUsd = tokenBalances.reduce((sum, token) => {
          const value = parseFloat(token.balanceUsd.replace(/[^0-9.-]/g, '')) || 0;
          return sum + value;
        }, 0);
        const total = nearUsd + tokensUsd;
        setTotalUsd(total > 0 ? `$${total.toFixed(2)}` : '$0.00');
      } catch (err) {
        console.error('[useTreasuryBalance] Failed to fetch treasury balance:', err);
        setBalance(null);
        setTokens([]);
        setTotalUsd('$0.00');
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchBalance();
  }, []);
  
  return { balance, balanceUsd, tokens, isLoading, totalUsd };
}

/**
 * Get governance statistics
 */
export function useGovernanceStats() {
  const [stats, setStats] = useState<{
    activeProposals: number;
    approved: number;
    rejected: number;
    expired: number;
    removed: number;
    totalVoters: number;
  }>({
    activeProposals: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    removed: 0,
    totalVoters: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total number of proposals
        const totalProposals = await dao.getLastProposalId();
        
        // Fetch all proposals in batches to ensure accurate stats
        const batchSize = 100;
        const allProposals = [];
        
        for (let fromIndex = 0; fromIndex < totalProposals; fromIndex += batchSize) {
          const limit = Math.min(batchSize, totalProposals - fromIndex);
          const proposals = await dao.getProposals(fromIndex, limit);
          allProposals.push(...proposals);
        }
        
        // Count truly active proposals (InProgress AND not time-expired)
        const active = allProposals.filter(p => {
          if (p.status !== 'InProgress') return false;
          
          // Check if time-expired
          const submissionTimeMs = parseInt(p.submission_time) / 1_000_000;
          const proposalPeriodMs = 7 * 24 * 60 * 60 * 1000;
          const expirationTimeMs = submissionTimeMs + proposalPeriodMs;
          const timeRemainingMs = expirationTimeMs - Date.now();
          
          return timeRemainingMs > 0; // Only count if not expired
        }).length;
        
        // Count approved, rejected, removed, expired, and failed proposals
        const approved = allProposals.filter(p => p.status === 'Approved').length;
        const rejected = allProposals.filter(p => p.status === 'Rejected').length;
        const removed = allProposals.filter(p => p.status === 'Removed').length;
        
        // Count expired proposals (Expired status OR InProgress but time-expired)
        const expired = allProposals.filter(p => {
          if (p.status === 'Expired') return true;
          if (p.status !== 'InProgress') return false;
          
          const submissionTimeMs = parseInt(p.submission_time) / 1_000_000;
          const proposalPeriodMs = 7 * 24 * 60 * 60 * 1000;
          const expirationTimeMs = submissionTimeMs + proposalPeriodMs;
          const timeRemainingMs = expirationTimeMs - Date.now();
          
          return timeRemainingMs <= 0; // Count if expired
        }).length;
        
        // Count unique voters from all proposals
        const uniqueVoters = new Set<string>();
        allProposals.forEach(p => {
          Object.keys(p.votes).forEach(voter => uniqueVoters.add(voter));
        });
        
        setStats({
          activeProposals: active,
          approved,
          rejected,
          expired,
          removed,
          totalVoters: uniqueVoters.size
        });
      } catch (err) {
        console.error('[useGovernanceStats] Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchStats();
  }, []);
  
  return { stats, isLoading };
}

/**
 * Get personal voting statistics for a user
 */
export function usePersonalVotingStats(accountId?: string) {
  const [stats, setStats] = useState<{
    totalVotes: number;
    approvedVotes: number;
    rejectedVotes: number;
    abstainVotes: number;
    proposalsParticipated: number;
    votingPower: string;
  }>({
    totalVotes: 0,
    approvedVotes: 0,
    rejectedVotes: 0,
    abstainVotes: 0,
    proposalsParticipated: 0,
    votingPower: 'None'
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }
    
    const fetchPersonalStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total number of proposals
        const totalProposals = await dao.getLastProposalId();
        
        // Fetch all proposals in batches
        const batchSize = 100;
        const allProposals = [];
        
        for (let fromIndex = 0; fromIndex < totalProposals; fromIndex += batchSize) {
          const limit = Math.min(batchSize, totalProposals - fromIndex);
          const proposals = await dao.getProposals(fromIndex, limit);
          allProposals.push(...proposals);
        }
        
        let totalVotes = 0;
        let approvedVotes = 0;
        let rejectedVotes = 0;
        let abstainVotes = 0;
        const proposalsParticipated = new Set<number>();
        
        // Count user's votes across all proposals
        allProposals.forEach(proposal => {
          const userVote = proposal.votes[accountId];
          if (userVote) {
            totalVotes++;
            proposalsParticipated.add(proposal.id);
            
            if (userVote === 'Approve') approvedVotes++;
            else if (userVote === 'Reject') rejectedVotes++;
            else if (userVote === 'Void') abstainVotes++; // Void votes count as "removed/abstain"
          }
        });
        
        // Determine voting power based on user's role
        const policy = await dao.getPolicy();
        let votingPower = 'None';
        
        if (policy) {
          const userRoles = policy.roles.filter((r: Role) => {
            if (r.kind === 'Everyone') return true;
            if ('Group' in r.kind) {
              return r.kind.Group.includes(accountId);
            }
            return false;
          });
          
          if (userRoles.length > 0) {
            // Check if user has roles beyond the default "Everyone" role
            const hasSpecificRoles = userRoles.some((r: Role) => r.name !== 'all');
            
            if (hasSpecificRoles) {
              if (userRoles.some((r: Role) => r.name === 'council')) {
                votingPower = 'Council';
              } else {
                votingPower = userRoles.find((r: Role) => r.name !== 'all')?.name ?? 'Community';
              }
            }
            // If only has "all" role (Everyone), they are not considered a specific DAO member
          }
        }
        
        setStats({
          totalVotes,
          approvedVotes,
          rejectedVotes,
          abstainVotes,
          proposalsParticipated: proposalsParticipated.size,
          votingPower
        });
      } catch (err) {
        console.error('[usePersonalVotingStats] Failed to fetch personal stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchPersonalStats();
  }, [accountId]);
  
  return { stats, isLoading };
}

