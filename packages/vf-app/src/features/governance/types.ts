/**
 * Governance Types
 * 
 * Type definitions for Sputnik DAO contract interactions
 */

export type ProposalStatus = 
  | 'InProgress' 
  | 'Approved' 
  | 'Rejected' 
  | 'Removed' 
  | 'Expired' 
  | 'Moved'
  | 'Failed';

export type ProposalKind = 
  | { Transfer: { token_id: string; receiver_id: string; amount: string } }
  | { Vote: null }
  | { AddMemberToRole: { member_id: string; role: string } }
  | { RemoveMemberFromRole: { member_id: string; role: string } }
  | { FunctionCall: { receiver_id: string; actions: FunctionCallAction[] } }
  | { UpgradeSelf: { hash: string } }
  | { UpgradeRemote: { receiver_id: string; method_name: string; hash: string } }
  | { SetStakingContract: { staking_id: string } }
  | { AddBounty: { bounty: Bounty } }
  | { BountyDone: { bounty_id: number; receiver_id: string } }
  | { ChangePolicy: { policy: Policy } }
  | { ChangeConfig: { config: Config } }
  | { FactoryInfoUpdate: { factory_info: any } }
  | { ChangePolicyAddOrUpdateRole: { role: Role } }
  | { ChangePolicyRemoveRole: { role: string } }
  | { ChangePolicyUpdateDefaultVotePolicy: { vote_policy: VotePolicy } }
  | { ChangePolicyUpdateParameters: { parameters: any } };

export type Vote = 'Approve' | 'Reject' | 'Remove';

export interface ProposalLog {
  block_height: string;
}

export interface Proposal {
  id: number;
  proposer: string;
  description: string;
  kind: ProposalKind;
  status: ProposalStatus;
  vote_counts: Record<string, [number, number, number]>; // role -> [approve, reject, remove]
  votes: Record<string, Vote>; // accountId -> vote
  submission_time: string;
  last_actions_log: ProposalLog[];
  transaction_hash?: string; // Hash of the transaction that created this proposal
  vote_transaction_hashes?: Record<string, string>; // accountId -> transaction hash of their vote
}

export interface Policy {
  roles: Role[];
  default_vote_policy: VotePolicy;
  proposal_bond: string;
  proposal_period: string;
  bounty_bond: string;
  bounty_forgiveness_period: string;
}

export interface Role {
  name: string;
  kind: RoleKind;
  permissions: string[];
  vote_policy: Record<string, VotePolicy>;
}

export type RoleKind = 
  | { Group: string[] }
  | 'Everyone';

export interface VotePolicy {
  weight_kind: WeightKind;
  quorum: string;
  threshold: [number, number]; // ratio [numerator, denominator]
}

export type WeightKind = 
  | 'RoleWeight'
  | 'TokenWeight';

export interface Bounty {
  description: string;
  token: string;
  amount: string;
  times: number;
  max_deadline: string;
}

export interface FunctionCallAction {
  method_name: string;
  args: string;
  deposit: string;
  gas: string;
}

export interface Config {
  name: string;
  purpose: string;
  metadata: string;
}

export interface ProposalInput {
  description: string;
  kind: ProposalKind;
}
