'use client';

import { type ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { WalletProviderWrapper } from '@/features/wallet';
import { Navigation } from '@/components/navigation/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="vf-app-theme"
        >
          <WalletProviderWrapper network="mainnet">
            <Navigation />
            <main className="min-h-screen pb-16 md:pb-0" suppressHydrationWarning>
              {children}
            </main>
          </WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
