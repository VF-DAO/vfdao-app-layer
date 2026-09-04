import { VOICE_SUBJECT_TYPES, type Note, type VoiceSubjectType } from '../types';

export const NOTE_MAX_LENGTH = 500;

export function isVoiceSubjectType(value: unknown): value is VoiceSubjectType {
  return typeof value === 'string' && (VOICE_SUBJECT_TYPES as readonly string[]).includes(value);
}

export function assertVoiceSubjectType(value: unknown): VoiceSubjectType {
  if (!isVoiceSubjectType(value)) {
    throw new Error('Sprouts and notes are for a product or a lot. Stand with the org.');
  }
  return value;
}

export function sproutRecordId(
  subjectType: VoiceSubjectType,
  subjectId: string,
  accountId: string
): string {
  return `${subjectType}/${subjectId}/${accountId}`;
}

export function normalizeNoteBody(body: string): string {
  const text = body.trim();
  if (!text) {
    throw new Error('Write a note first.');
  }
  if (text.length > NOTE_MAX_LENGTH) {
    throw new Error(`Notes stay under ${NOTE_MAX_LENGTH} characters.`);
  }
  return text;
}

export function noteThread(notes: Note[]): { note: Note; replies: Note[] }[] {
  const replies = new Map<string, Note[]>();
  const roots: Note[] = [];
  for (const note of notes) {
    if (note.parentId) {
      const list = replies.get(note.parentId) ?? [];
      list.push(note);
      replies.set(note.parentId, list);
    } else {
      roots.push(note);
    }
  }
  roots.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return roots.map((note) => ({
    note,
    replies: (replies.get(note.id) ?? []).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
  }));
}
