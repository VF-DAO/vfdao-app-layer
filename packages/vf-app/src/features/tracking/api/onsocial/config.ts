import { DEFAULT_APP_ID, normalizeAppId } from './paths';

export interface OnSocialConfig {
  appId: string;
  network: 'mainnet' | 'testnet';
  gatewayUrl: string;
  coreContract: string;
  apiKey?: string;
  actorId?: string;
}

export function getOnSocialConfig(): OnSocialConfig {
  const network =
    process.env.NEXT_PUBLIC_ONSOCIAL_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
  const gatewayUrl =
    process.env.ONSOCIAL_GATEWAY_URL ??
    process.env.NEXT_PUBLIC_ONSOCIAL_GATEWAY_URL ??
    (network === 'testnet' ? 'https://testnet.onsocial.id' : 'https://api.onsocial.id');

  return {
    appId: normalizeAppId(process.env.NEXT_PUBLIC_ONSOCIAL_APP_ID ?? DEFAULT_APP_ID),
    network,
    gatewayUrl: gatewayUrl.replace(/\/$/, ''),
    coreContract:
      process.env.NEXT_PUBLIC_ONSOCIAL_CORE_CONTRACT ??
      (network === 'testnet' ? 'core.onsocial.testnet' : 'core.onsocial.near'),
    apiKey: process.env.ONSOCIAL_API_KEY,
    actorId: process.env.ONSOCIAL_ACTOR_ID,
  };
}

export function isOnSocialConfigured(): boolean {
  return Boolean(process.env.ONSOCIAL_API_KEY) || process.env.NEXT_PUBLIC_TRACKER_BACKEND === 'onsocial';
}

/**
 * Green Valley fixtures stay on for local demo.
 * When OnSocial is configured, missing rows stay missing so a shop scan
 * cannot resolve a carton QR to the fixture oat drink.
 * Override: TRACKER_ALLOW_FIXTURES=1 (on) or =0 (off).
 */
export function allowTrackerFixtures(): boolean {
  if (process.env.TRACKER_ALLOW_FIXTURES === '1') return true;
  if (process.env.TRACKER_ALLOW_FIXTURES === '0') return false;
  return !isOnSocialConfigured();
}

export function publicTrackerBackend(): 'local' | 'onsocial' {
  return process.env.NEXT_PUBLIC_TRACKER_BACKEND === 'onsocial' ? 'onsocial' : 'local';
}
