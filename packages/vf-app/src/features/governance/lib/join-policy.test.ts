import { describe, expect, it } from 'vitest';
import type { Policy } from '../types';
import { groupRoles, joinVotingInfo, proposalBondNear, proposalPeriodDays } from './join-policy';

const policy: Policy = {
  roles: [
    {
      name: 'Everyone',
      kind: 'Everyone',
      permissions: [],
      vote_policy: {},
    },
    {
      name: 'council',
      kind: { Group: ['alice.near', 'bob.near', 'carol.near'] },
      permissions: ['*:*'],
      vote_policy: {},
    },
    {
      name: 'community',
      kind: { Group: ['dave.near'] },
      permissions: ['*:AddProposal'],
      vote_policy: {},
    },
  ],
  default_vote_policy: {
    weight_kind: 'RoleWeight',
    quorum: '0',
    threshold: [1, 2],
  },
  proposal_bond: '1000000000000000000000000',
  proposal_period: '604800000000000',
  bounty_bond: '1000000000000000000000000',
  bounty_forgiveness_period: '86400000000000',
};

describe('join policy helpers', () => {
  it('formats the proposal bond in NEAR', () => {
    expect(proposalBondNear(policy)).toBe('1');
    expect(proposalBondNear(null)).toBe('1');
  });

  it('converts the proposal period to days', () => {
    expect(proposalPeriodDays(policy)).toBe(7);
    expect(proposalPeriodDays(null)).toBe(7);
  });

  it('lists only group roles', () => {
    expect(groupRoles(policy).map((role) => role.name)).toEqual(['council', 'community']);
  });

  it('computes a strict-majority vote threshold', () => {
    expect(joinVotingInfo(policy)).toEqual({
      totalVoters: 3,
      requiredVotes: 2,
      percentage: 50,
      roleNames: ['council'],
    });
  });
});
