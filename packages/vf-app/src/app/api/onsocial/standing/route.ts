import { NextResponse } from 'next/server';
import {
  getStandingIncoming,
  getStandingOutgoing,
  getStandingStats,
} from '@/features/onsocial/standing-service';
import { isOnSocialConfigured } from '@/features/tracking/api/onsocial/config';

function standingHeaders(): HeadersInit {
  return {
    'x-onsocial-source': isOnSocialConfigured() ? 'gateway' : 'local',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId')?.trim();
  const viewerAccountId = searchParams.get('viewer')?.trim() ?? null;
  const list = searchParams.get('list');
  const headers = standingHeaders();

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400, headers });
  }

  if (list === 'incoming') {
    return NextResponse.json(await getStandingIncoming(accountId), { headers });
  }

  if (list === 'outgoing') {
    return NextResponse.json(await getStandingOutgoing(accountId), { headers });
  }

  return NextResponse.json(await getStandingStats(accountId, viewerAccountId), { headers });
}
