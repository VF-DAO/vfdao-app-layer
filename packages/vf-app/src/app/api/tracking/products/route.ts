import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import type { RegisterProductInput } from '@/features/tracking';

export async function GET() {
  const tracker = getServerTracker();
  return NextResponse.json(await tracker.listProducts());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterProductInput;
    const tracker = getServerTracker();
    return NextResponse.json(await tracker.registerProduct(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register product' },
      { status: 400 }
    );
  }
}
