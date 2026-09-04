import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 md:py-12">{children}</div>;
}
