import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const { lotId } = await params;
  const lot = await getServerTracker().getLot(lotId);
  if (!lot) {
    return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
  }
  return NextResponse.json(lot);
}
