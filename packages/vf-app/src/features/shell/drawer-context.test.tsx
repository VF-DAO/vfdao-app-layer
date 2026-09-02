import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { AppDrawerProvider, useAppDrawer } from './drawer-context';

function wrapper({ children }: { children: ReactNode }) {
  return <AppDrawerProvider>{children}</AppDrawerProvider>;
}

describe('app drawer host', () => {
  it('opens only one action at a time', () => {
    const { result } = renderHook(() => useAppDrawer(), { wrapper });

    act(() => {
      result.current.openDrawer({ id: 'scan' });
    });
    expect(result.current.action?.id).toBe('scan');

    act(() => {
      result.current.openDrawer({ id: 'studio' });
    });
    expect(result.current.action?.id).toBe('studio');

    act(() => {
      result.current.closeDrawer();
    });
    expect(result.current.action).toBeNull();
  });

  it('throws outside the provider', () => {
    expect(() => renderHook(() => useAppDrawer())).toThrow(/AppDrawerProvider/);
  });
});
