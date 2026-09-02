import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import type { AddEventInput } from '@/features/tracking';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AddEventInput;
    return NextResponse.json(await getServerTracker().addEvent(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add event' },
      { status: 400 }
    );
  }
}
