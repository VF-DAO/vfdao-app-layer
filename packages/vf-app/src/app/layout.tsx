'use client';

import { type ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import '@near-wallet-selector/modal-ui/styles.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { WalletProviderWrapper } from '@/components/providers/wallet-provider-wrapper';
import { Navigation } from '@/components/navigation/navigation';
import '@/lib/ref-sdk-init';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
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
          <WalletProviderWrapper contractId="vfdao.near" network="mainnet">
            <Navigation />
            <main className="min-h-screen" suppressHydrationWarning>
              {children}
            </main>
          </WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
