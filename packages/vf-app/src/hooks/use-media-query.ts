'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** Tailwind `md` — desktop chrome for the shared overlay. */
export const DESKTOP_OVERLAY_QUERY = '(min-width: 768px)';

export function useDesktopOverlay(): boolean {
  return useMediaQuery(DESKTOP_OVERLAY_QUERY);
}
