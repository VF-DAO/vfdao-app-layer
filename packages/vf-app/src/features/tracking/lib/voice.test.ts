import { describe, expect, it } from 'vitest';
import {
  assertVoiceSubjectType,
  NOTE_MAX_LENGTH,
  normalizeNoteBody,
  noteThread,
  sproutRecordId,
} from './voice';
import type { Note } from '../types';

function note(partial: Partial<Note> & Pick<Note, 'id' | 'body' | 'at'>): Note {
  return {
    subjectType: 'lot',
    subjectId: 'lot-1',
    accountId: 'cafe.near',
    ...partial,
  };
}

describe('voice helpers', () => {
  it('keeps sprouts and notes off orgs', () => {
    expect(assertVoiceSubjectType('product')).toBe('product');
    expect(assertVoiceSubjectType('lot')).toBe('lot');
    expect(() => assertVoiceSubjectType('org')).toThrow(/Stand with the org/);
  });

  it('namespaces a sprout per writer and subject', () => {
    expect(sproutRecordId('product', 'prd-1', 'cafe.near')).toBe('product/prd-1/cafe.near');
  });

  it('threads one-level replies under the original note', () => {
    const threads = noteThread([
      note({ id: 'n1', body: 'Steams well', at: '2026-09-01T00:00:00.000Z' }),
      note({ id: 'n2', body: 'Too sweet', at: '2026-09-03T00:00:00.000Z' }),
      note({
        id: 'n1r',
        parentId: 'n1',
        body: 'Agreed',
        at: '2026-09-02T00:00:00.000Z',
        accountId: 'mill.near',
      }),
    ]);
    expect(threads.map((item) => item.note.id)).toEqual(['n2', 'n1']);
    expect(threads[1]?.replies.map((item) => item.id)).toEqual(['n1r']);
  });

  it('rejects empty and oversized notes', () => {
    expect(() => normalizeNoteBody('   ')).toThrow(/Write a note/);
    expect(() => normalizeNoteBody('x'.repeat(NOTE_MAX_LENGTH + 1))).toThrow(/500/);
    expect(normalizeNoteBody('  Good  ')).toBe('Good');
  });
});
