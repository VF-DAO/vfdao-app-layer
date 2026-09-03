import { describe, expect, it } from 'vitest';
import { FIXTURE_CERTIFIER_ID, FIXTURE_PRODUCER_ID, fixtureOrgs } from '../api/fixtures';
import { resolveStudioActor } from './studio-actor';

const producer = fixtureOrgs.find((org) => org.accountId === FIXTURE_PRODUCER_ID)!;
const certifier = fixtureOrgs.find((org) => org.accountId === FIXTURE_CERTIFIER_ID)!;

describe('studio actor', () => {
  it('uses the fixture producer when there is no wallet on the local backend', () => {
    const actor = resolveStudioActor({ backend: 'local' });
    expect(actor.usingDemoProducer).toBe(true);
    expect(actor.accountId).toBe(FIXTURE_PRODUCER_ID);
    expect(actor.role).toBe('producer');
    expect(actor.allowed).toBe(true);
  });

  it('denies a signed-in wallet with no org', () => {
    const actor = resolveStudioActor({
      accountId: 'stranger.near',
      org: null,
      orgLoading: false,
      backend: 'local',
    });
    expect(actor.allowed).toBe(false);
    expect(actor.usingDemoProducer).toBe(false);
    expect(actor.reason).toMatch(/not linked to a tracking org/);
  });

  it('uses the linked org role when the wallet matches', () => {
    const actor = resolveStudioActor({
      accountId: certifier.accountId,
      org: certifier,
      backend: 'onsocial',
    });
    expect(actor.role).toBe('certifier');
    expect(actor.allowed).toBe(true);
    expect(actor.usingDemoProducer).toBe(false);
  });

  it('does not demo-fall-back on the live backend', () => {
    const actor = resolveStudioActor({ backend: 'onsocial' });
    expect(actor.allowed).toBe(false);
    expect(actor.usingDemoProducer).toBe(false);
    expect(actor.reason).toMatch(/Sign in/);
  });

  it('stays pending while an org lookup is in flight', () => {
    const actor = resolveStudioActor({
      accountId: producer.accountId,
      org: null,
      orgLoading: true,
      backend: 'local',
    });
    expect(actor.pending).toBe(true);
    expect(actor.allowed).toBe(false);
  });
});
