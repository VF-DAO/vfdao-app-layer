'use client';

import { type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { BarChart3, LogOut, Sparkles, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xl font-bold text-primary"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                VF
              </div>
              <span>VF App</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <Link
              href="/dashboard/history"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>History</span>
            </Link>
            <Link
              href="/dashboard/scanner"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              <span>Scanner</span>
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm">Wallet</span>
            </div>
            <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-accent transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
