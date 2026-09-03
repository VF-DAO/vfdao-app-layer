const ONSOCIAL_CDN = {
  mainnet: 'https://cdn.onsocial.id/ipfs',
  testnet: 'https://cdn.testnet.onsocial.id/ipfs',
} as const;

export function onsocialCdnBase(network: 'mainnet' | 'testnet' = 'mainnet'): string {
  return ONSOCIAL_CDN[network];
}

export function cidFromMediaRef(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { cid?: string; ipfs_cid?: string };
      const cid = parsed.cid ?? parsed.ipfs_cid;
      return cid?.trim() ?? null;
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith('ipfs://')) {
    return trimmed.slice('ipfs://'.length).replace(/^ipfs\//, '') || null;
  }

  const ipfsPath = /\/ipfs\/([^/?#]+)/i.exec(trimmed);
  if (ipfsPath?.[1]) return ipfsPath[1];

  if (/^[a-zA-Z0-9]{46,}$/.test(trimmed) || trimmed.startsWith('bafy') || trimmed.startsWith('Qm')) {
    return trimmed;
  }

  return null;
}

export function resolveOnSocialMediaUrl(
  value?: string | null,
  network: 'mainnet' | 'testnet' = 'mainnet'
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) && !/\/ipfs\//i.test(trimmed)) {
    return trimmed;
  }
  const cid = cidFromMediaRef(trimmed);
  if (cid) return `${onsocialCdnBase(network)}/${cid}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

export function toIpfsUri(cidOrUrl: string): string {
  const cid = cidFromMediaRef(cidOrUrl);
  return cid ? `ipfs://${cid}` : cidOrUrl.trim();
}
