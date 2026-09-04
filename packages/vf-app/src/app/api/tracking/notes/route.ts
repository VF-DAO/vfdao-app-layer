import { NextResponse } from 'next/server';
import { getServerTracker } from '@/features/tracking';
import { assertVoiceSubjectType } from '@/features/tracking/lib/voice';
import type { AddNoteInput } from '@/features/tracking';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const subjectType = assertVoiceSubjectType(params.get('subjectType'));
    const subjectId = params.get('subjectId');
    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }
    return NextResponse.json(await getServerTracker().listNotes(subjectType, subjectId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list notes' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AddNoteInput;
    return NextResponse.json(await getServerTracker().addNote(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add note' },
      { status: 400 }
    );
  }
}
