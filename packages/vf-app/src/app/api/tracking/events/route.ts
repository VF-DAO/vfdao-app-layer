import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import type { AddEventInput } from '@/features/tracking';

export async function GET(request: Request) {
  const orgAccountId = new URL(request.url).searchParams.get('orgAccountId')?.trim();
  if (!orgAccountId) {
    return NextResponse.json({ error: 'orgAccountId required' }, { status: 400 });
  }
  return NextResponse.json(await getServerTracker().listEventsForAccount(orgAccountId));
}

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
