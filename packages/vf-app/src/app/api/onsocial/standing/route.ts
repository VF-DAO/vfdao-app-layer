import { NextResponse } from 'next/server';
import {
  getStandingIncoming,
  getStandingOutgoing,
  getStandingStats,
} from '@/features/onsocial/standing-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId')?.trim();
  const viewerAccountId = searchParams.get('viewer')?.trim() ?? null;
  const list = searchParams.get('list');

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 });
  }

  if (list === 'incoming') {
    return NextResponse.json(await getStandingIncoming(accountId));
  }

  if (list === 'outgoing') {
    return NextResponse.json(await getStandingOutgoing(accountId));
  }

  return NextResponse.json(await getStandingStats(accountId, viewerAccountId));
}
