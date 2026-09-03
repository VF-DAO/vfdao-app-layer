import { FIXTURE_PRODUCER_ID, fixtureOrgs } from '../api/fixtures';
import type { Org, OrgRole, TrackerBackend } from '../types';

export interface StudioActorInput {
  accountId?: string | null;
  org?: Org | null;
  orgLoading?: boolean;
  backend: TrackerBackend;
}

export interface StudioActor {
  accountId: string | null;
  org: Org | null;
  role: OrgRole | null;
  allowed: boolean;
  pending: boolean;
  usingDemoProducer: boolean;
  reason: string | null;
}

const demoProducer = fixtureOrgs.find((org) => org.accountId === FIXTURE_PRODUCER_ID);

export function resolveStudioActor(input: StudioActorInput): StudioActor {
  if (input.accountId) {
    if (input.org) {
      return {
        accountId: input.org.accountId,
        org: input.org,
        role: input.org.role,
        allowed: true,
        pending: false,
        usingDemoProducer: false,
        reason: null,
      };
    }
    if (input.orgLoading) {
      return {
        accountId: input.accountId,
        org: null,
        role: null,
        allowed: false,
        pending: true,
        usingDemoProducer: false,
        reason: null,
      };
    }
    return {
      accountId: input.accountId,
      org: null,
      role: null,
      allowed: false,
      pending: false,
      usingDemoProducer: false,
      reason: 'This wallet is not linked to a tracking org.',
    };
  }

  if (input.backend === 'local' && demoProducer) {
    return {
      accountId: demoProducer.accountId,
      org: demoProducer,
      role: demoProducer.role,
      allowed: true,
      pending: false,
      usingDemoProducer: true,
      reason: null,
    };
  }

  return {
    accountId: null,
    org: null,
    role: null,
    allowed: false,
    pending: false,
    usingDemoProducer: false,
    reason: 'Sign in with an org wallet to use studio.',
  };
}
