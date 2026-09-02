import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const { lotId } = await params;
  const bundle = await getServerTracker().getLotBundle(lotId);
  if (!bundle) {
    return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
  }
  return NextResponse.json(bundle);
}
