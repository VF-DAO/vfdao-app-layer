import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';

export async function GET() {
  return NextResponse.json(await getServerTracker().listListed());
}
