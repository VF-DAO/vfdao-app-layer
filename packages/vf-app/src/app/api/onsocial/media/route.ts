import { NextResponse } from 'next/server';
import { getOnSocialConfig } from '@/features/tracking/api/onsocial/config';
import { onsocialCdnBase, toIpfsUri } from '@/features/onsocial/media';

export async function POST(request: Request) {
  const config = getOnSocialConfig();
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 });
  }

  if (config.apiKey) {
    try {
      const body = new FormData();
      body.append('file', file, 'upload');
      const response = await fetch(`${config.gatewayUrl}/storage/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body,
      });
      if (response.ok) {
        const payload = (await response.json()) as { cid?: string; Hash?: string; hash?: string };
        const cid = payload.cid ?? payload.Hash ?? payload.hash;
        if (cid) {
          return NextResponse.json({
            cid,
            uri: toIpfsUri(cid),
            url: `${onsocialCdnBase(config.network)}/${cid}`,
          });
        }
      }
    } catch (error) {
      console.warn('[onsocial] gateway media upload failed', error);
    }
  }

  return NextResponse.json(
    { error: 'OnSocial media upload is unavailable. Set ONSOCIAL_API_KEY to store images on core.' },
    { status: 503 }
  );
}
