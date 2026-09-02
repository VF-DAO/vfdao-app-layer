import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const { lotId } = await params;
  return NextResponse.json(await getServerTracker().getEvents(lotId));
}
