import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import type { RevokeCertificateInput } from '@/features/tracking';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RevokeCertificateInput;
    return NextResponse.json(await getServerTracker().revokeCertificate(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke certificate' },
      { status: 400 }
    );
  }
}
