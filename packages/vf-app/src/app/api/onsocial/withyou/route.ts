import { NextResponse } from 'next/server';
import { getOnSocialConfig, isOnSocialConfigured } from '@/features/tracking/api/onsocial/config';
import { queryAppRowsById } from '@/features/tracking/api/onsocial/gateway';
import {
  getLocalWhoIsWithThem,
  getLocalWhoTheyreWith,
  getLocalWithYouStats,
  WITHYOU_APP_ID,
  withYouStatsFromRows,
} from '@/features/onsocial/withyou';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId')?.trim();
  const viewerAccountId = searchParams.get('viewer')?.trim() ?? null;
  const list = searchParams.get('list');

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 });
  }

  if (list === 'with-them') {
    if (isOnSocialConfigured()) {
      try {
        const rows = await queryAppRowsById(getOnSocialConfig(), WITHYOU_APP_ID);
        const ids = new Set<string>();
        for (const row of rows) {
          const to = row.path.split('/').pop();
          const from = row.accountId ?? row.path.split('/')[0];
          if (to === accountId && from && from !== to) ids.add(from);
        }
        return NextResponse.json([...ids]);
      } catch (error) {
        console.warn('[onsocial] withyou list failed', error);
      }
    }
    return NextResponse.json(getLocalWhoIsWithThem(accountId));
  }

  if (list === 'theyre-with') {
    if (isOnSocialConfigured()) {
      try {
        const rows = await queryAppRowsById(getOnSocialConfig(), WITHYOU_APP_ID);
        const ids = new Set<string>();
        for (const row of rows) {
          const from = row.accountId ?? row.path.split('/')[0];
          const to = row.path.split('/').pop();
          if (from === accountId && to) ids.add(to);
        }
        return NextResponse.json([...ids]);
      } catch (error) {
        console.warn('[onsocial] withyou outgoing list failed', error);
      }
    }
    return NextResponse.json(getLocalWhoTheyreWith(accountId));
  }

  if (isOnSocialConfigured()) {
    try {
      const rows = await queryAppRowsById(getOnSocialConfig(), WITHYOU_APP_ID);
      return NextResponse.json(withYouStatsFromRows(accountId, viewerAccountId, rows));
    } catch (error) {
      console.warn('[onsocial] withyou stats failed', error);
    }
  }

  return NextResponse.json(getLocalWithYouStats(accountId, viewerAccountId));
}
