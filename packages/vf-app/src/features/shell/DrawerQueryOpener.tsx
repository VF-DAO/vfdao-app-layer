'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppDrawer } from './drawer-context';
import type { AppDrawerAction } from './drawer-types';

const QUERY_ACTIONS = new Set<AppDrawerAction['id']>([
  'scan',
  'studio',
  'join-dao',
  'edit-profile',
]);

export function DrawerQueryOpener() {
  const searchParams = useSearchParams();
  const { openDrawer } = useAppDrawer();
  const openedKey = useRef<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('drawer');
    if (!id || openedKey.current === id || !QUERY_ACTIONS.has(id as AppDrawerAction['id'])) {
      return;
    }
    openedKey.current = id;
    openDrawer({ id } as AppDrawerAction);
  }, [openDrawer, searchParams]);

  return null;
}
