'use client'

import { ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { LogOut, Wallet, BarChart3, Sparkles, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                🌿
              </div>
              <span>VF App</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-foreground transition-colors">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/scanner" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-foreground transition-colors">
              <Sparkles className="w-4 h-4" />
              <span>Scan Product</span>
            </Link>
            <Link href="/dashboard/history" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-foreground transition-colors">
              <BarChart3 className="w-4 h-4" />
              <span>History</span>
            </Link>
            <Link href="/marketplace" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-foreground transition-colors">
              <Wallet className="w-4 h-4" />
              <span>Marketplace</span>
            </Link>
          </nav>

          {/* Footer */}
          <div className="space-y-3 pt-6 border-t border-border">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors text-sm font-medium"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
