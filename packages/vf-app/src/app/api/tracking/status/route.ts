import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';

export async function GET() {
  const tracker = getServerTracker();
  return NextResponse.json(await tracker.status());
}
