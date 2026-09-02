'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { AppDrawerAction, AppDrawerContextValue } from './drawer-types';

const AppDrawerContext = createContext<AppDrawerContextValue | null>(null);

export function AppDrawerProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<AppDrawerAction | null>(null);
  const [isLocked, setLocked] = useState(false);

  const openDrawer = useCallback((next: AppDrawerAction) => {
    setLocked(false);
    setAction(next);
  }, []);

  const closeDrawer = useCallback(() => {
    setAction((current) => {
      if (isLocked) {
        return current;
      }
      return null;
    });
  }, [isLocked]);

  const value = useMemo(
    () => ({ action, isLocked, openDrawer, closeDrawer, setLocked }),
    [action, closeDrawer, isLocked, openDrawer]
  );

  return <AppDrawerContext.Provider value={value}>{children}</AppDrawerContext.Provider>;
}

export function useAppDrawer(): AppDrawerContextValue {
  const context = useContext(AppDrawerContext);
  if (!context) {
    throw new Error('useAppDrawer must be used inside AppDrawerProvider');
  }
  return context;
}
