'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUserRole } from '../hooks';
import { dao } from '../index';
import { ProposalCard } from './ProposalCard';
import { Skeleton } from '@/components/loading-states';
import { FileText, FileX } from 'lucide-react';
import type { Proposal } from '../types';

interface ProposalListProps {
  accountId?: string;
  page?: number;
  limit?: number;
  statusFilter?: 'All' | 'InProgress' | 'Approved' | 'Rejected' | 'Expired' | 'Removed' | 'Moved' | 'Failed';
  searchQuery?: string;
  onFilteredCountChange?: (count: number) => void;
}

export function ProposalList({ accountId, page = 0, limit = 20, statusFilter = 'All', searchQuery = '', onFilteredCountChange }: ProposalListProps) {
  const { hasPermission } = useUserRole(accountId);
  const [allProposals, setAllProposals] = useState<Proposal[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch all proposals when filtering, otherwise use pagination
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (statusFilter !== 'All' || searchQuery) {
          // When filtering, fetch all proposals to ensure complete results
          const totalProposals = await dao.getLastProposalId();
          const batchSize = 100;
          const allFetchedProposals = [];
          
          for (let fromIndex = 0; fromIndex < totalProposals; fromIndex += batchSize) {
            const batchLimit = Math.min(batchSize, totalProposals - fromIndex);
            const proposals = await dao.getProposals(fromIndex, batchLimit);
            allFetchedProposals.push(...proposals);
          }
          
          setAllProposals(allFetchedProposals);
        } else {
          // When not filtering, use pagination
          const proposals = await dao.getProposals(page * limit, limit);
          setAllProposals(proposals);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch proposals'));
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchProposals();
  }, [page, limit, statusFilter, searchQuery]);
  
  // Helper function to get effective status (includes time-based expiration check)
  const getEffectiveStatus = (proposal: Proposal) => {
    const submissionTimeMs = parseInt(proposal.submission_time) / 1_000_000;
    const proposalPeriodMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const expirationTimeMs = submissionTimeMs + proposalPeriodMs;
    const timeRemainingMs = expirationTimeMs - Date.now();
    const isExpired = timeRemainingMs <= 0 && proposal.status === 'InProgress';
    
    return isExpired ? 'Expired' : proposal.status;
  };
  
  // Apply filters and search, then paginate if not already filtered
  const filteredProposals = useMemo(() => {
    if (!allProposals) return null;
    
    const filtered = allProposals.filter(proposal => {
      // Get effective status (respects time-based expiration)
      const effectiveStatus = getEffectiveStatus(proposal);
      
      // Status filter - use effective status instead of raw contract status
      if (statusFilter !== 'All' && effectiveStatus !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDescription = proposal.description.toLowerCase().includes(query);
        const matchesProposer = proposal.proposer.toLowerCase().includes(query);
        const matchesId = proposal.id.toString().includes(query);
        
        return matchesDescription || matchesProposer || matchesId;
      }
      
      return true;
    });
    
    // Apply client-side pagination only when not filtering
    if (statusFilter === 'All' && !searchQuery) {
      return filtered;
    } else {
      // When filtering, return all matching results (no pagination)
      return filtered;
    }
  }, [allProposals, statusFilter, searchQuery]);
  
  // Notify parent of filtered count for pagination
  useEffect(() => {
    if (onFilteredCountChange && filteredProposals) {
      onFilteredCountChange(filteredProposals.length);
    }
  }, [filteredProposals, onFilteredCountChange]);
  
  // Apply pagination for display when not filtering
  const paginatedProposals = useMemo(() => {
    if (!filteredProposals) return null;
    
    if (statusFilter === 'All' && !searchQuery) {
      // Already paginated from API
      return filteredProposals;
    } else {
      // Apply client-side pagination for filtered results
      const startIndex = page * limit;
      return filteredProposals.slice(startIndex, startIndex + limit);
    }
  }, [filteredProposals, page, limit, statusFilter, searchQuery]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <ProposalCardSkeleton />
        <ProposalCardSkeleton />
        <ProposalCardSkeleton />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
        <p className="text-destructive font-semibold">Failed to load proposals</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }
  
  if (!allProposals || allProposals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-semibold">No proposals yet</p>
        <p className="text-sm text-muted-foreground mt-2">Be the first to create one!</p>
      </div>
    );
  }
  
  // Show empty state for filtered results
  if (paginatedProposals?.length === 0) {
    const getEmptyMessage = () => {
      if (searchQuery) {
        return 'Try using different search terms';
      }
      switch (statusFilter) {
        case 'InProgress':
          return 'There are currently no active proposals';
        case 'Approved':
          return 'No proposals have been approved yet';
        case 'Rejected':
          return 'No proposals have been rejected yet';
        case 'Removed':
          return 'No proposals have been removed yet';
        case 'Expired':
          return 'No proposals have expired yet';
        default:
          return 'Try selecting a different status filter';
      }
    };

    return (
      <div className="rounded-lg bg-muted/30 p-6 text-center">
        <FileX className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">{getEmptyMessage()}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {paginatedProposals?.map((proposal: Proposal) => (
        <ProposalCard 
          key={proposal.id} 
          id={`proposal-${proposal.id}`}
          proposal={proposal}
          hasPermission={hasPermission}
        />
      ))}
    </div>
  );
}

function ProposalCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <div className="bg-muted/50 rounded-md p-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
