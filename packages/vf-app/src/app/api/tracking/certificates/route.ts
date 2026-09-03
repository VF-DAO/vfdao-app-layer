import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import type { IssueCertificateInput } from '@/features/tracking';

export async function GET(request: Request) {
  const issuerAccountId = new URL(request.url).searchParams.get('issuerAccountId')?.trim();
  if (!issuerAccountId) {
    return NextResponse.json({ error: 'issuerAccountId required' }, { status: 400 });
  }
  return NextResponse.json(await getServerTracker().listCertificatesForAccount(issuerAccountId));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IssueCertificateInput;
    return NextResponse.json(await getServerTracker().issueCertificate(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue certificate' },
      { status: 400 }
    );
  }
}
