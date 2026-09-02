import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import type { CreateLotInput } from '@/features/tracking';

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
