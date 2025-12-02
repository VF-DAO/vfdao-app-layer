'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { usePolicy, useTreasuryBalance } from '@/features/governance/hooks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/loading-states';
import { LoadingDots } from '@/components/ui/loading-dots';
import { DaoIcon } from '@/components/ui/dao-icon';
import { ChevronRight, Users, Wallet } from 'lucide-react';

interface DAOInfoProps {
  totalProposals: number;
  accountId: string | null;
  stats: { activeProposals: number; approved: number; rejected: number; expired: number; removed: number; totalVoters: number };
  isLoadingStats: boolean;
  totalUsd: string;
}

export function DAOInfo({ totalProposals, accountId, stats, isLoadingStats, totalUsd: treasuryTotalUsd }: DAOInfoProps) {
  const { data: policy, isLoading } = usePolicy();
  const treasuryData = useTreasuryBalance();
  const { balance: treasuryBalance, balanceUsd: treasuryBalanceUsd, tokens, isLoading: isLoadingBalance } = treasuryData;

  const [treasuryExpanded, setTreasuryExpanded] = useState(false);
  const [groupsExpanded, setGroupsExpanded] = useState(false);

  // Calculate group roles at the top level
  const groupRoles = useMemo(() => {
    if (!policy) return [];
    return policy.roles.filter((r: any) =>
      typeof r.kind === 'object' && r.kind !== null && 'Group' in r.kind
    );
  }, [policy]);

  // Initialize groups expanded state based on group count
  useEffect(() => {
    if (groupRoles.length === 1) {
      setGroupsExpanded(true);
    }
  }, [groupRoles.length]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!policy) return null;

  // Check if user is in any group
  const userGroups = accountId ? groupRoles.filter((r: any) =>
    r.kind.Group.includes(accountId)
  ).map((r: any) => r.name) : [];

  // Calculate total members across all groups (unique)
  const allMembers = new Set<string>();
  groupRoles.forEach((r: any) => {
    r.kind.Group.forEach((member: string) => allMembers.add(member));
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-6 shadow-main-card">
      {/* Header with Gradient Background - Inspired by Liquidity Widget */}
      <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-t-2xl -m-4 sm:-m-6 md:-m-8 mb-4 md:mb-6 shadow-sm">
        <div className="p-4 sm:p-5 md:p-6">
          {/* DAO Title and Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <DaoIcon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold">DAO Overview</h3>
                <p className="text-muted-foreground text-sm font-mono truncate">vegan-friends.sputnik-dao.near</p>
              </div>
            </div>
            {accountId && (
              <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                <Badge variant="verified" className="font-mono text-xs truncate max-w-[120px]">
                  {accountId}
                </Badge>
                {userGroups.length > 0 && userGroups.map((group: string) => (
                  <Badge key={group} variant="primary" className="text-xs capitalize">
                    {group}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Organized Stats Layout */}
          <div className="space-y-4 pt-3 border-t border-border/30">
            {/* Overview Stats - Compact horizontal layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalProposals}</div>
                <div className="text-xs text-muted-foreground font-medium">Proposals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{allMembers.size}</div>
                <div className="text-xs text-muted-foreground font-medium">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{treasuryTotalUsd || '$0.00'}</div>
                <div className="text-xs text-muted-foreground font-medium">Treasury</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-verified">
                  {isLoadingStats ? <LoadingDots size="sm" /> : stats.activeProposals}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Active</div>
              </div>
            </div>

            {/* Proposal Outcomes - Organized grid */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Proposal Outcomes</div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                <div className="text-center p-2 rounded-md bg-muted/30">
                  <div className="text-lg font-semibold text-primary">
                    {isLoadingStats ? <LoadingDots size="xs" /> : stats.approved}
                  </div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/30">
                  <div className="text-lg font-semibold text-orange">
                    {isLoadingStats ? <LoadingDots size="xs" /> : stats.rejected}
                  </div>
                  <div className="text-xs text-muted-foreground">Rejected</div>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/30">
                  <div className="text-lg font-semibold text-muted-foreground">
                    {isLoadingStats ? <LoadingDots size="xs" /> : stats.expired}
                  </div>
                  <div className="text-xs text-muted-foreground">Expired</div>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/30">
                  <div className="text-lg font-semibold text-muted-foreground/60">
                    {isLoadingStats ? <LoadingDots size="xs" /> : stats.removed}
                  </div>
                  <div className="text-xs text-muted-foreground">Removed</div>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/30 md:col-span-1 col-span-3">
                  <div className="text-lg font-semibold text-verified">
                    {isLoadingStats ? <LoadingDots size="xs" /> : stats.totalVoters}
                  </div>
                  <div className="text-xs text-muted-foreground">Voters</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Treasury Holdings - Collapsible */}
      <div className="group">
        <button
          onClick={() => setTreasuryExpanded(!treasuryExpanded)}
          className="flex items-center justify-between cursor-pointer w-full text-left py-2 hover:text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Treasury Holdings</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {(tokens?.length || 0) + 1} assets
            </Badge>
          </div>
          <motion.div
            animate={{ rotate: treasuryExpanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </button>
        <AnimatePresence>
          {treasuryExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 pl-1">
                {/* NEAR Balance */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjIgMiAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IndoaXRlIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjg0MjExIDMuMjE5MzlWMTIuNDgzTDcuNTc4OTUgOC45NDM3NUw4LjA1MjYzIDkuMzU5MTVMNC4wODA0NyAxNC45NTRDMS42MDQ2IDE2LjMwOCAwIDE1LjM5MTkgMCAxMy41MTg4VjIuMDgxMTlDMCAwLjE0Mzg1NiAyLjc1NzA5IC0wLjczODU5MSA0LjE4MDA1IDAuNzQzMjkyTDE1LjE1NzkgMTIuMTc1N1YzLjI5MjEyTDEwLjg5NDcgNi40NTEzTDEwLjQyMTEgNi4wMzU4OUwxMy43OTk2IDAuODEzMjk1QzE1LjIwOTcgLTAuNjk2MDI3IDE4IDAuMTc4NDI3IDE4IDIuMTI5NjdWMTMuMzEzOUMxOCAxNS4yNTEyIDE1LjI0MjkgMTYuMTMzNiAxMy44MTk5IDE0LjY1MThMMi44NDIxMSAzLjIxOTM5WiIgZmlsbD0iYmxhY2siIHRyYW5zZm9ybT0idHJhbnNsYXRlKDgsOCkgc2NhbGUoMC45LCAxKSIvPjwvc3ZnPg=="
                      alt="NEAR"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="font-medium text-sm">NEAR</span>
                  </div>
                  {isLoadingBalance ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <div className="text-right">
                      <p className="font-semibold text-sm">{treasuryBalance}</p>
                      {treasuryBalanceUsd && treasuryBalanceUsd !== '0' && (
                        <p className="text-xs text-muted-foreground">{treasuryBalanceUsd}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Token Holdings */}
                {!isLoadingBalance && tokens?.map((token) => (
                  <div key={token.contractId} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
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
                      <span className="font-medium text-sm">{token.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{token.balance}</p>
                      {token.balanceUsd && token.balanceUsd !== '0' && (
                        <p className="text-xs text-muted-foreground">{token.balanceUsd}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Separator */}
      {groupRoles.length > 0 && <div className="border-t border-border" />}

      {/* Groups - Collapsible */}
      {groupRoles.length > 0 && (
        <div className="group">
          <button
            onClick={() => setGroupsExpanded(!groupsExpanded)}
            className="flex items-center justify-between cursor-pointer w-full text-left py-2 hover:text-primary transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Groups & Members</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {groupRoles.length}
              </Badge>
            </div>
            <motion.div
              animate={{ rotate: groupsExpanded ? 90 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </button>
          <AnimatePresence>
            {groupsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 pl-1">
                  {groupRoles.map((role: any) => (
                    <div key={role.name} className="space-y-2">
                      <p className="text-xs font-medium capitalize text-muted-foreground">
                        {role.name} ({role.kind.Group.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {role.kind.Group.map((member: string) => (
                          <Badge key={member} variant="secondary" className="font-mono text-[10px] px-1 py-0.5 border-0">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
