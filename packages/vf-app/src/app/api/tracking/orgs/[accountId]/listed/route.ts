import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;
  return NextResponse.json(await getServerTracker().isListed(decodeURIComponent(accountId)));
}
