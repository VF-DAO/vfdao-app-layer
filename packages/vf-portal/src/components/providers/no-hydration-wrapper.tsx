'use client';

import { type ReactNode, useEffect, useState } from 'react';

/**
 * Prevents hydration mismatch by ensuring content only renders after client-side mount
 */
export function NoHydrationWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
