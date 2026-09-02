'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { AppDrawerAction, AppDrawerContextValue } from './drawer-types';

const AppDrawerContext = createContext<AppDrawerContextValue | null>(null);

export function AppDrawerProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<AppDrawerAction | null>(null);

  const openDrawer = useCallback((next: AppDrawerAction) => {
    setAction(next);
  }, []);

  const closeDrawer = useCallback(() => {
    setAction(null);
  }, []);

  const value = useMemo(
    () => ({ action, openDrawer, closeDrawer }),
    [action, closeDrawer, openDrawer]
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
