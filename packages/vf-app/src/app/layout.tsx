'use client'

import { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { WalletProviderWrapper } from '@/components/providers/wallet-provider-wrapper'
import { Navigation } from '@/components/navigation/navigation'

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
          <WalletProviderWrapper contractId="vfdao.testnet" network="testnet">
            <Navigation />
            <main className="min-h-screen" suppressHydrationWarning>{children}</main>
          </WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
