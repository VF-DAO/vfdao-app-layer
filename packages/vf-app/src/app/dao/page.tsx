'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ProposalList } from '@/features/governance/components/ProposalList';
import { JoinDaoModal } from '@/features/governance/components/JoinDaoModal';
import { useGovernanceStats, usePersonalVotingStats, usePolicy, useTotalProposals, useTreasuryBalance } from '@/features/governance/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { ChevronLeft, ChevronRight, Leaf, Plus, UserPlus, Users, Vault, Vote } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { LoadingDots } from '@/components/ui/loading-dots';
import { useMultipleProfiles, useProfile } from '@/hooks/use-profile';
import { useWallet } from '@/features/wallet';
import type { ProposalStatus } from '@/features/governance/types';
import { unwrapedNear } from '@/lib/swap-utils';

const PROPOSALS_PER_PAGE = 20;

export default function GovernancePage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [treasuryExpanded, setTreasuryExpanded] = useState(false);
  const [groupsExpanded, setGroupsExpanded] = useState(false);
  const [treasuryHovered, setTreasuryHovered] = useState(false);
  const [groupsHovered, setGroupsHovered] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const treasuryHoverRotationRef = useRef<number>(0);
  const groupsHoverRotationRef = useRef<number>(0);
  const proposalsSectionRef = useRef<HTMLDivElement>(null);
  const { total: totalProposals, isLoading: isLoadingProposals } = useTotalProposals();
  const { accountId, isConnected, isLoading, signIn, isConnecting } = useWallet();
  const { stats, isLoading: isLoadingStats } = useGovernanceStats();
  const { totalUsd, isLoading: isLoadingTreasury } = useTreasuryBalance();
  const { data: policy, isLoading: isLoadingPolicy } = usePolicy();
  const treasuryData = useTreasuryBalance();
  const { balance: treasuryBalance, balanceUsd: treasuryBalanceUsd, tokens, isLoading: isLoadingBalance } = treasuryData;
  const { stats: personalStats, isLoading: isLoadingPersonalStats } = usePersonalVotingStats(accountId ?? undefined);
  const { displayName, profileImageUrl, loading: profileLoading } = useProfile(accountId);
  const { displayName: daoDisplayName, profileImageUrl: daoProfileImageUrl, description: daoDescription, loading: daoProfileLoading } = useProfile('vegan-friends.sputnik-dao.near');
  
  // Scroll to proposals section (with small delay to ensure DOM is updated)
  const scrollToProposals = () => {
    setTimeout(() => {
      proposalsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Use filtered count for pagination when filtering, otherwise use total proposals
  const effectiveTotal = (statusFilter !== 'All' || searchQuery) && filteredCount !== null ? filteredCount : totalProposals;
  const totalPages = Math.ceil(effectiveTotal / PROPOSALS_PER_PAGE);
  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  // Handle proposal URL parameter
  useEffect(() => {
    const proposalParam = searchParams.get('proposal');
    if (proposalParam) {
      const proposalId = parseInt(proposalParam);
      if (!isNaN(proposalId)) {
        // Calculate which page this proposal is on
        const proposalPage = Math.floor((totalProposals - proposalId) / PROPOSALS_PER_PAGE);
        setCurrentPage(proposalPage);
        
        // Scroll to the proposal after a short delay to allow rendering
        setTimeout(() => {
          const proposalElement = document.getElementById(`proposal-${proposalId}`);
          if (proposalElement) {
            proposalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a temporary highlight effect
            proposalElement.classList.add('ring-2', 'ring-verified', 'ring-opacity-50');
            setTimeout(() => {
              proposalElement.classList.remove('ring-2', 'ring-verified', 'ring-opacity-50');
            }, 3000);
          }
        }, 1000);
      }
    }
  }, [searchParams, totalProposals]);

  // Calculate group roles at the top level
  const groupRoles = useMemo(() => {
    if (!policy) return [];
    return policy.roles.filter((r: any) =>
      typeof r.kind === 'object' && r.kind !== null && 'Group' in r.kind
    );
  }, [policy]);

  // Check if user is in any group
  const userGroups = accountId ? groupRoles.filter((r: any) =>
    r.kind.Group.includes(accountId)
  ).map((r: any) => r.name) : [];

  // Check if user can create proposals (has AddProposal permission in a group, not Everyone)
  const canAddProposal = useMemo(() => {
    if (!accountId || !policy?.roles) return false;
    
    return policy.roles.some((role: any) => {
      // Skip "Everyone" role - only group members can create proposals
      if (role.kind === 'Everyone') return false;
      
      // Check if user is in this group
      const isInRole = typeof role.kind === 'object' && 'Group' in role.kind && role.kind.Group.includes(accountId);
      
      if (!isInRole) return false;
      
      // Check if role has AddProposal permission
      return role.permissions?.some((p: string) => 
        p === '*:*' || 
        p === '*:AddProposal' || 
        p.includes(':AddProposal')
      );
    });
  }, [accountId, policy]);

  // Calculate total members across all groups (unique)
  const allMembers = new Set<string>();
  groupRoles.forEach((r: any) => {
    r.kind.Group.forEach((member: string) => allMembers.add(member));
  });
  const allMemberIds = Array.from(allMembers);

  const { getDisplayName: getMemberDisplayName, getProfileImageUrl: getMemberProfileImageUrl, loading: _membersProfileLoading } = useMultipleProfiles(allMemberIds);

  return (
    <div className="md:container md:mx-auto px-4 py-24 pt-20 md:pt-24 space-y-4 sm:space-y-8">
      {/* Redesigned Compact Institutional Header */}
      <div className="bg-card border border-border rounded-2xl shadow-main-card overflow-hidden">
        {/* Consistent Gradient Background like Liquidity Widget */}
        <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-t-2xl">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            {/* Header Row - Icon, Title, Settings */}
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-muted/50 text-muted-foreground overflow-hidden">
                  {daoProfileLoading ? (
                    <Vote className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                  ) : daoProfileImageUrl ? (
                    <ProfileAvatar
                      accountId="vegan-friends.sputnik-dao.near"
                      size="xl"
                      profileImageUrl={daoProfileImageUrl}
                      showFallback={false}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                    />
                  ) : (
                    <Vote className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-foreground">
                    {daoProfileLoading ? <LoadingDots size="sm" /> : (daoDisplayName ?? 'VF DAO Governance')}
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base font-medium">vegan-friends.sputnik-dao.near</p>
                </div>
              </div>
              {/* Optional settings or actions can go here */}
            </div>

            {/* Description - Inspiring, Natural, High-Level */}
            <div className="py-4 md:py-6">
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl text-center mx-auto">
                {daoDescription ?? "A community of advocates working together to protect animals and our planet through collaborative decision-making and positive impact initiatives."}
              </p>
            </div>

            {/* Compact Stats Grid - Similar to Liquidity Widget */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 md:gap-4 pt-2 md:pt-3 border-t border-border/30">
              <button 
                onClick={() => { setStatusFilter('All'); setCurrentPage(0); scrollToProposals(); }}
                className={`text-center cursor-pointer rounded-lg transition-colors p-1 -m-1 ${
                  statusFilter === 'All' ? 'bg-muted/50' : 'hover:bg-muted/50'
                }`}
              >
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                  {isLoadingProposals ? <LoadingDots size="xs" /> : totalProposals}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Proposals</div>
              </button>
              <button 
                onClick={() => { setStatusFilter('InProgress'); setCurrentPage(0); scrollToProposals(); }}
                className={`text-center cursor-pointer rounded-lg transition-colors p-1 -m-1 ${
                  statusFilter === 'InProgress' ? 'bg-muted/50' : 'hover:bg-muted/50'
                }`}
              >
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-verified">
                  {isLoadingStats ? <LoadingDots size="xs" /> : stats.activeProposals}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Active</div>
              </button>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                  {isLoadingPolicy ? <LoadingDots size="xs" /> : allMembers.size}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Members</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                  {isLoadingStats ? <LoadingDots size="xs" /> : stats.totalVoters}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Voters</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                  {isLoadingTreasury ? <LoadingDots size="xs" /> : (totalUsd || '$0.00')}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Treasury</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Details Section */}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          
          {/* SECTION 1: Your Status (most prominent for connected users) */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingDots size="sm" />
            </div>
          ) : !isConnected ? (
            /* Non-Connected User CTA */
            <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-xl p-4 md:p-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <h3 className="text-sm md:text-base font-medium text-muted-foreground">Connect to participate in governance</h3>
                <Button
                  onClick={() => void signIn()}
                  disabled={isConnecting}
                  variant="verified"
                  size="lg"
                  className="px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] sm:min-h-[56px]"
                >
                  <Leaf className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <span className="inline-flex items-center justify-center min-h-[20px] sm:min-h-[24px]">
                    {isConnecting ? <LoadingDots /> : "Let's Connect"}
                  </span>
                </Button>
              </div>
            </div>
          ) : (
            /* Connected User Status - Prominent Card */
            <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-xl p-4 md:p-5">
              <div className={`flex ${userGroups.length > 0 ? 'flex-col sm:flex-row sm:items-center sm:justify-between' : 'flex-row items-center justify-between'} gap-3`}>
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    accountId={accountId}
                    size="lg"
                    profileImageUrl={profileImageUrl}
                    className="w-10 h-10 md:w-12 md:h-12 border border-border shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-base md:text-lg font-semibold text-foreground truncate">
                      {profileLoading ? <LoadingDots size="xs" /> : displayName}
                    </div>
                    {userGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {userGroups.map((group: string) => (
                          <Badge key={group} variant="primary" className="text-[10px] md:text-xs px-1.5 py-0.5 capitalize">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
                        Not a member yet
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right side: Stats + Action button */}
                <div className={`flex items-center ${userGroups.length > 0 ? 'justify-between sm:justify-end' : 'justify-end'} gap-3 sm:gap-4`}>
                  {isLoadingPersonalStats ? (
                    <LoadingDots size="xs" />
                  ) : userGroups.length > 0 ? (
                    <>
                      {personalStats.totalVotes > 0 && (
                        <div className="text-left sm:text-right">
                          <div className="text-lg md:text-xl font-bold text-verified">{personalStats.totalVotes}</div>
                          <div className="text-xs text-muted-foreground">Votes Cast</div>
                        </div>
                      )}
                      {canAddProposal && (
                        <Button
                          onClick={() => router.push('/dao/create')}
                          variant="verified"
                          size="default"
                          className="h-10 px-3 sm:px-4 flex-shrink-0"
                        >
                          <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
                          Create Proposal
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="verified"
                      size="default"
                      onClick={() => setJoinModalOpen(true)}
                      className="h-10 px-3 sm:px-4 flex-shrink-0"
                    >
                      <UserPlus className="w-4 h-4 mr-1.5 sm:mr-2" />
                      Request to Join
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DAO Details (collapsible sections) */}
          <div className="space-y-1">
            {/* Proposal Outcomes - Clickable to filter */}
            <div className="py-3 px-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-muted-foreground">Proposal Outcomes</div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {/* Approved */}
                <button
                  onClick={() => { setStatusFilter('Approved'); setCurrentPage(0); scrollToProposals(); }}
                  className={`text-center p-2 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'Approved' ? 'bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm sm:text-base md:text-lg font-bold text-primary">{isLoadingStats ? <LoadingDots size="xs" /> : stats.approved}</div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground truncate">Approved</div>
                </button>
                {/* Rejected */}
                <button
                  onClick={() => { setStatusFilter('Rejected'); setCurrentPage(0); scrollToProposals(); }}
                  className={`text-center p-2 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'Rejected' ? 'bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm sm:text-base md:text-lg font-bold text-orange">{isLoadingStats ? <LoadingDots size="xs" /> : stats.rejected}</div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground truncate">Rejected</div>
                </button>
                {/* Removed */}
                <button
                  onClick={() => { setStatusFilter('Removed'); setCurrentPage(0); scrollToProposals(); }}
                  className={`text-center p-2 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'Removed' ? 'bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm sm:text-base md:text-lg font-bold text-muted-foreground">{isLoadingStats ? <LoadingDots size="xs" /> : stats.removed}</div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground truncate">Removed</div>
                </button>
                {/* Expired */}
                <button
                  onClick={() => { setStatusFilter('Expired'); setCurrentPage(0); scrollToProposals(); }}
                  className={`text-center p-2 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'Expired' ? 'bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm sm:text-base md:text-lg font-bold text-muted-foreground">{isLoadingStats ? <LoadingDots size="xs" /> : stats.expired}</div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground truncate">Expired</div>
                </button>
              </div>
            </div>
          </div>

          {/* Treasury Holdings - Collapsible */}
          <div className="border-t border-border/30" />
          <motion.div
            onClick={() => setTreasuryExpanded(!treasuryExpanded)}
            className="flex items-center justify-between py-2 cursor-pointer transition-colors rounded-md px-2 -mx-2"
            onMouseEnter={() => {
              setTreasuryHovered(true);
              treasuryHoverRotationRef.current = treasuryExpanded ? 0 : 90;
            }}
            onMouseLeave={() => setTreasuryHovered(false)}
            whileHover="hover"
            initial="initial"
          >
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border border-verified bg-verified/10 text-primary shadow-sm shadow-verified/20">
                <Vault className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <motion.div
                className="text-sm md:text-base font-medium"
                variants={{
                  initial: { color: "hsl(var(--muted-foreground))" },
                  hover: { color: "hsl(var(--primary))" }
                }}
                transition={{ duration: 0.2 }}
              >
                Treasury Holdings
              </motion.div>
              <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 py-0 mt-0.5 border border-border/50 min-h-[18px] items-center">
                {isLoadingBalance ? <LoadingDots size="xs" /> : `${(tokens?.length || 0) + 1} assets`}
              </Badge>
            </div>
            <motion.div
              animate={{
                rotate: treasuryHovered 
                  ? treasuryHoverRotationRef.current
                  : (treasuryExpanded ? 90 : 0)
              }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ willChange: 'transform' }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
          <div className="border-b border-border/30" />
          <AnimatePresence>
            {treasuryExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 md:mt-3 space-y-1.5 md:space-y-2 pl-3 md:pl-4 border-l-2 border-primary/20">
                    {/* NEAR Balance */}
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Image
                          src={unwrapedNear.icon ?? 'https://assets.ref.finance/images/near.svg'}
                          alt="NEAR"
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span className="font-medium text-sm md:text-base">NEAR</span>
                      </div>
                      <div className="text-right">
                        {isLoadingBalance ? (
                          <LoadingDots size="xs" />
                        ) : (
                          <>
                            <p className="font-semibold text-sm md:text-base">{treasuryBalance}</p>
                            {treasuryBalanceUsd && treasuryBalanceUsd !== '0' && (
                              <p className="text-xs md:text-sm text-muted-foreground">{treasuryBalanceUsd}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Token Holdings */}
                    {!isLoadingBalance && tokens?.length === 0 && (
                      <div className="py-3 text-center text-sm text-muted-foreground">
                        No additional token holdings
                      </div>
                    )}
                    {!isLoadingBalance && tokens?.map((token, index) => (
                      <div key={token.contractId} className={`flex items-center justify-between py-2 ${index < tokens.length - 1 ? 'border-b border-border/30' : ''}`}>
                        <div className="flex items-center gap-2 md:gap-3">
                          {token.icon ? (
                            <Image
                              src={token.icon}
                              alt={token.symbol}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-[10px] font-bold">{token.symbol.slice(0, 2)}</span>
                            </div>
                          )}
                          <span className="font-medium text-sm md:text-base">{token.symbol}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm md:text-base">{token.balance}</p>
                          {token.balanceUsd && token.balanceUsd !== '0' && (
                            <p className="text-xs md:text-sm text-muted-foreground">{token.balanceUsd}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          {/* Groups & Members - Collapsible */}
          {groupRoles.length > 0 && (
            <>
              <div className="border-t border-border/30" />
              <motion.div
                onClick={() => setGroupsExpanded(!groupsExpanded)}
                className="flex items-center justify-between py-2 cursor-pointer transition-colors rounded-md px-2 -mx-2"
                onMouseEnter={() => {
                  setGroupsHovered(true);
                  groupsHoverRotationRef.current = groupsExpanded ? 0 : 90;
                }}
                onMouseLeave={() => setGroupsHovered(false)}
                whileHover="hover"
                initial="initial"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border border-verified bg-verified/10 text-primary shadow-sm shadow-verified/20">
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <motion.div 
                    className="text-sm md:text-base font-medium"
                    variants={{
                      initial: { color: "hsl(var(--muted-foreground))" },
                      hover: { color: "hsl(var(--primary))" }
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    Groups & Members
                  </motion.div>
                  <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 py-0 mt-0.5 border border-border/50 min-h-[18px] items-center">
                    {groupRoles.length} {groupRoles.length === 1 ? 'group' : 'groups'}
                  </Badge>
                </div>
                <motion.div
                  animate={{
                    rotate: groupsHovered 
                      ? groupsHoverRotationRef.current
                      : (groupsExpanded ? 90 : 0)
                  }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
              <div className="border-b border-border/30" />
              <AnimatePresence>
                {groupsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 md:mt-3 space-y-2 md:space-y-3 pl-3 md:pl-4 border-l-2 border-primary/20">
                      {groupRoles.map((role: any, index: number) => (
                        <div key={role.name} className="space-y-2">
                          <div className="text-sm md:text-base font-medium capitalize text-muted-foreground">
                            {role.name} ({role.kind.Group.length})
                          </div>
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            {role.kind.Group.map((member: string) => {
                              const memberProfileImageUrl = getMemberProfileImageUrl(member);
                              const memberDisplayName = getMemberDisplayName(member);
                              // Format account ID as fallback (remove .near, capitalize first letter)
                              const shortAccountId = member.replace(/\.near$/, '');
                              const formattedFallback = shortAccountId.length > 12 
                                ? shortAccountId.slice(0, 10) + '...' 
                                : shortAccountId;
                              
                              return (
                                <Badge key={member} variant="secondary" className="font-mono text-[10px] md:text-xs px-1 md:px-1.5 py-1 flex items-center gap-1.5 border-0">
                                  <ProfileAvatar
                                    accountId={member}
                                    size="sm"
                                    profileImageUrl={memberProfileImageUrl}
                                  />
                                  {/* Show display name if loaded, otherwise show formatted account ID */}
                                  <span className="truncate">{memberDisplayName || formattedFallback}</span>
                                </Badge>
                              );
                            })}
                          </div>
                          {index < groupRoles.length - 1 && (
                            <div className="h-px bg-border/30 my-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
      
      {/* Proposals */}
      <div ref={proposalsSectionRef} className="space-y-4 scroll-mt-20">
        {/* Filter and Search */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {statusFilter !== 'All' ? `${statusFilter} Proposals` : 
               searchQuery ? `Search Results` :
               currentPage === 0 ? 'Latest Proposals' : `Proposals (Page ${currentPage + 1})`}
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search proposals..."
                className="w-full md:w-64"
              />
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(['All', 'InProgress', 'Approved', 'Rejected', 'Removed', 'Expired'] as const).map((status) => {
              // Semantic color mapping for active filter states
              const getActiveVariant = () => {
                switch (status) {
                  case 'Approved': return 'filterSecondary';  // Sage green = success
                  case 'Rejected': return 'filterOrange';     // Orange = warning
                  case 'Removed': return 'filterMuted';       // Muted = removed
                  case 'Expired': return 'filterMuted';       // Muted = inactive
                  default: return 'filterActive';             // Gold = default/attention
                }
              };
              
              return (
                <Button
                  key={status}
                  variant={statusFilter === status ? getActiveVariant() : 'filter'}
                  size="filter"
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(0); // Reset to first page when filtering
                  }}
                >
                  {status === 'InProgress' ? 'Active' : status}
                </Button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          
          {/* Pagination Controls */}
          {effectiveTotal > PROPOSALS_PER_PAGE && (
            <div className="flex items-center gap-2">
              <Button
                variant="nav"
                size="filter"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="nav"
                size="filter"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        <ProposalList 
          accountId={accountId ?? undefined} 
          page={currentPage} 
          limit={PROPOSALS_PER_PAGE}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onFilteredCountChange={setFilteredCount}
        />
        
        {/* Bottom Pagination */}
        {effectiveTotal > PROPOSALS_PER_PAGE && (
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="nav"
                size="filter"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="nav"
                size="filter"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Join DAO Modal */}
      <JoinDaoModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        policy={policy}
        accountId={accountId ?? ''}
      />
    </div>
  );
}
