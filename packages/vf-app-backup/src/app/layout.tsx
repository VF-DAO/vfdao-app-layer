'use client'

import { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="vf-app-theme"
        >
          <main className="min-h-screen" suppressHydrationWarning>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
