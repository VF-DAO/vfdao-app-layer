import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import type { RecordScanInput } from '@/features/tracking';

export async function GET(request: Request) {
  const accountId = new URL(request.url).searchParams.get('accountId') ?? undefined;
  return NextResponse.json(await getServerTracker().listScans(accountId));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecordScanInput;
    return NextResponse.json(await getServerTracker().recordScan(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record scan' },
      { status: 400 }
    );
  }
}
