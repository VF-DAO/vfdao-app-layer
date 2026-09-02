import Big from 'big.js';
import type { Policy, Role } from '../types';

export interface JoinVotingInfo {
  totalVoters: number;
  requiredVotes: number;
  percentage: number;
  roleNames: string[];
}

function isGroupRole(role: Role): role is Role & { kind: { Group: string[] } } {
  return typeof role.kind === 'object' && 'Group' in role.kind;
}

export function proposalBondNear(policy: Policy | null | undefined): string {
  if (!policy?.proposal_bond) {
    return '1';
  }
  try {
    const bondInNear = new Big(policy.proposal_bond).div(new Big(10).pow(24));
    return bondInNear.toFixed(2).replace(/\.?0+$/, '');
  } catch {
    return '1';
  }
}

export function proposalPeriodDays(policy: Policy | null | undefined): number {
  if (!policy?.proposal_period) {
    return 7;
  }
  try {
    const periodDays = new Big(policy.proposal_period).div(new Big(10).pow(9)).div(86400);
    return Math.round(periodDays.toNumber());
  } catch {
    return 7;
  }
}

export function groupRoles(policy: Policy | null | undefined): Role[] {
  if (!policy?.roles) {
    return [];
  }
  return policy.roles.filter((role) => isGroupRole(role));
}

export function joinVotingInfo(policy: Policy | null | undefined): JoinVotingInfo | null {
  if (!policy?.roles) {
    return null;
  }

  const rolesWithVotingPower = policy.roles.filter((role) => {
    if (role.kind === 'Everyone' || !role.permissions) {
      return false;
    }
    return role.permissions.some(
      (permission) =>
        permission === '*:*' || permission.includes('VoteApprove') || permission.includes('AddMemberToRole')
    );
  });

  let totalVoters = 0;
  const roleNames: string[] = [];

  rolesWithVotingPower.forEach((role) => {
    if (isGroupRole(role)) {
      totalVoters += role.kind.Group.length;
      roleNames.push(role.name);
    }
  });

  const threshold = policy.default_vote_policy?.threshold ?? [1, 2];
  const [num, den] = threshold;
  const thresholdPercentage = Math.round((num / den) * 100);
  const thresholdRatio = (totalVoters * num) / den;
  const requiredVotes = Math.floor(thresholdRatio) + 1;

  return {
    totalVoters,
    requiredVotes,
    percentage: thresholdPercentage,
    roleNames,
  };
}
