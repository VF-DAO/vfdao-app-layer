'use client';

import { type ReactNode, Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { WalletProviderWrapper } from '@/features/wallet';
import { Navigation } from '@/components/navigation/navigation';
import { AppDrawerHost, AppDrawerProvider } from '@/features/shell';
import { DrawerQueryOpener } from '@/features/shell/DrawerQueryOpener';

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
            <AppDrawerProvider>
              <Suspense fallback={null}>
                <DrawerQueryOpener />
              </Suspense>
              <Navigation />
              <main className="min-h-screen pb-16 md:pb-0" suppressHydrationWarning>
                {children}
              </main>
              <AppDrawerHost />
            </AppDrawerProvider>
          </WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
