'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@/features/wallet';
import { useAsyncValue } from './use-async';
import { useTracker } from './use-tracker';
import type { Note, SproutStats, VoiceSubjectType } from '../types';

const EMPTY_STATS: SproutStats = {
  subjectType: 'product',
  subjectId: '',
  count: 0,
  viewerSprouted: false,
};

export function useSprout(subjectType: VoiceSubjectType, subjectId: string) {
  const { accountId } = useWallet();
  const tracker = useTracker();
  const query = useAsyncValue(
    () => tracker.getSproutStats(subjectType, subjectId, accountId ?? undefined),
    [tracker, subjectType, subjectId, accountId]
  );
  const [isToggling, setIsToggling] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  const toggle = useCallback(async () => {
    if (!accountId) return;
    setIsToggling(true);
    setWriteError(null);
    try {
      await tracker.toggleSprout({ subjectType, subjectId, accountId });
      await query.reload();
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : 'Could not sprout');
    } finally {
      setIsToggling(false);
    }
  }, [accountId, query, subjectId, subjectType, tracker]);

  return {
    stats: query.data ?? { ...EMPTY_STATS, subjectType, subjectId },
    loading: query.loading,
    error: writeError ?? query.error,
    isToggling,
    canInteract: Boolean(accountId),
    toggle,
    reload: query.reload,
  };
}

export function useNotes(subjectType: VoiceSubjectType, subjectId: string) {
  const { accountId } = useWallet();
  const tracker = useTracker();
  const query = useAsyncValue(
    () => tracker.listNotes(subjectType, subjectId),
    [tracker, subjectType, subjectId]
  );
  const [pending, setPending] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  const addNote = useCallback(
    async (body: string, parentId?: string): Promise<Note | null> => {
      if (!accountId) return null;
      setPending(true);
      setWriteError(null);
      try {
        const note = await tracker.addNote({
          subjectType,
          subjectId,
          accountId,
          body,
          parentId,
        });
        await query.reload();
        return note;
      } catch (error) {
        setWriteError(error instanceof Error ? error.message : 'Could not post note');
        return null;
      } finally {
        setPending(false);
      }
    },
    [accountId, query, subjectId, subjectType, tracker]
  );

  return {
    notes: query.data ?? [],
    loading: query.loading,
    error: writeError ?? query.error,
    pending,
    canInteract: Boolean(accountId),
    addNote,
    reload: query.reload,
  };
}
