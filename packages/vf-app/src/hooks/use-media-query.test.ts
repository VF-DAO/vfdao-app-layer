import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { DESKTOP_OVERLAY_QUERY, useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
  it('tracks matchMedia and updates on change', () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const media = {
      matches: false,
      media: DESKTOP_OVERLAY_QUERY,
      addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    };

    vi.spyOn(window, 'matchMedia').mockImplementation(() => media as unknown as MediaQueryList);

    const { result } = renderHook(() => useMediaQuery(DESKTOP_OVERLAY_QUERY));
    expect(result.current).toBe(false);

    act(() => {
      media.matches = true;
      listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });
    expect(result.current).toBe(true);
  });
});
