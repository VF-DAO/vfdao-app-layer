import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import { assertVoiceSubjectType } from '@/features/tracking/lib/voice';
import type { ToggleSproutInput } from '@/features/tracking';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const subjectType = assertVoiceSubjectType(params.get('subjectType'));
    const subjectId = params.get('subjectId');
    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }
    return NextResponse.json(await getServerTracker().listSprouts(subjectType, subjectId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list sprouts' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ToggleSproutInput;
    return NextResponse.json(await getServerTracker().toggleSprout(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sprout' },
      { status: 400 }
    );
  }
}
