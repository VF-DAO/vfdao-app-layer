import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import type { CreateLotInput } from '@/features/tracking';

export async function GET(request: Request) {
  const producerAccountId = new URL(request.url).searchParams.get('producerAccountId')?.trim();
  if (!producerAccountId) {
    return NextResponse.json({ error: 'producerAccountId required' }, { status: 400 });
  }
  return NextResponse.json(await getServerTracker().listLotsForAccount(producerAccountId));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateLotInput;
    return NextResponse.json(await getServerTracker().createLot(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create lot' },
      { status: 400 }
    );
  }
}
