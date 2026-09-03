import { NextResponse } from 'next/server';
import { getMultipleProfiles, getProfile } from '@/features/onsocial/profile-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId')?.trim();
  const accountIds = searchParams
    .get('accountIds')
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (accountIds?.length) {
    return NextResponse.json(await getMultipleProfiles(accountIds));
  }
  if (accountId) {
    return NextResponse.json(await getProfile(accountId));
  }
  return NextResponse.json({ error: 'accountId required' }, { status: 400 });
}
