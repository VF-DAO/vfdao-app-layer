import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const bundle = await getServerTracker().resolveScan(decodeURIComponent(code));
  if (!bundle) {
    return NextResponse.json({ error: 'Lot not found for that code' }, { status: 404 });
  }
  return NextResponse.json(bundle);
}
