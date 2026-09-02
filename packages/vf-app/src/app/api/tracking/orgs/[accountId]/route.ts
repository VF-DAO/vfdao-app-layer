import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;
  const org = await getServerTracker().getOrg(decodeURIComponent(accountId));
  if (!org) {
    return NextResponse.json(null);
  }
  return NextResponse.json(org);
}
