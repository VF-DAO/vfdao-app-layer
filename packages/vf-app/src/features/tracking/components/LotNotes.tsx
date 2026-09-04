'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotes } from '../hooks/use-voice';
import { NOTE_MAX_LENGTH, noteThread } from '../lib/voice';
import type { Note } from '../types';

export function LotNotes({ lotId }: { lotId: string }) {
  const { notes, loading, error, pending, canInteract, addNote } = useNotes('lot', lotId);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Note | null>(null);
  const threads = noteThread(notes);

  async function submit() {
    const saved = await addNote(draft, replyTo?.id);
    if (saved) {
      setDraft('');
      setReplyTo(null);
    }
  }

  return (
    <Card className="space-y-4 border border-border p-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Notes on this lot</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Taste notes on this carton. Not a company review.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading notes…</p>}
      {!loading && threads.length === 0 && (
        <p className="text-sm text-muted-foreground">No notes yet. Be the first on this carton.</p>
      )}

      <ul className="space-y-4">
        {threads.map(({ note, replies }) => (
          <li key={note.id} className="space-y-2">
            <NoteRow
              note={note}
              canReply={canInteract}
              onReply={() => {
                setReplyTo(note);
              }}
            />
            {replies.length > 0 && (
              <ul className="space-y-2 border-l border-border pl-4">
                {replies.map((reply) => (
                  <li key={reply.id}>
                    <NoteRow note={reply} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {replyTo && (
          <p className="text-xs text-muted-foreground">
            Replying to {replyTo.accountId}{' '}
            <button type="button" className="underline" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </p>
        )}
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={NOTE_MAX_LENGTH}
          rows={3}
          disabled={!canInteract || pending}
          aria-label={replyTo ? 'Reply to this note' : 'Note on this lot'}
          placeholder={canInteract ? 'How was this lot?' : 'Connect a wallet to leave a note'}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        {error && <p className="text-sm text-orange">{error}</p>}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {draft.length}/{NOTE_MAX_LENGTH}
          </p>
          <Button type="submit" size="sm" disabled={!canInteract || pending || !draft.trim()}>
            {pending ? 'Posting…' : replyTo ? 'Reply' : 'Post note'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function NoteRow({
  note,
  canReply = false,
  onReply,
}: {
  note: Note;
  canReply?: boolean;
  onReply?: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-foreground">{note.body}</p>
      <p className="text-xs text-muted-foreground">
        <Link href={`/profile/${encodeURIComponent(note.accountId)}`} className="hover:text-primary">
          {note.accountId}
        </Link>
        {' · '}
        {new Date(note.at).toLocaleDateString()}
        {canReply && onReply && (
          <>
            {' · '}
            <button type="button" className="underline" onClick={onReply}>
              Reply
            </button>
          </>
        )}
      </p>
    </div>
  );
}
