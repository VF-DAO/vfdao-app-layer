'use client';

import { type ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { WalletProviderWrapper } from '@/components/providers/wallet-provider-wrapper';
import { Navigation } from '@/components/navigation/navigation';
import { BookOpen, Code, Github, Heart, Mail, Send } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import Logo from '@/components/ui/logo';

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
            <main className="min-h-screen pt-16 md:pt-0" suppressHydrationWarning>
              {children}
            </main>
            <footer className="border-t py-12 px-4 bg-card/30">
              <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                  {/* About */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Logo width={80} height={54} className="w-20 h-14" />
                      <ul className="flex gap-4 text-muted-foreground">
                        <li>
                          <a
                            href="https://t.me/veganfriendsdao"
                            className="hover:text-primary transition-colors"
                            aria-label="Telegram"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Send className="w-5 h-5" />
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://x.com/VeganFriendsDAO"
                            className="hover:text-primary transition-colors"
                            aria-label="Twitter/X"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaXTwitter className="w-5 h-5" />
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://github.com/VF-DAO/vfdao-eco-engine"
                            className="hover:text-primary transition-colors"
                            aria-label="GitHub"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Github className="w-5 h-5" />
                          </a>
                        </li>
                        <li>
                          <a
                            href="#docs"
                            className="hover:text-primary transition-colors"
                            aria-label="Documentation"
                          >
                            <BookOpen className="w-5 h-5" />
                          </a>
                        </li>
                        <li>
                          <a
                            href="mailto:veganfriendsdao@gmail.com"
                            className="hover:text-primary transition-colors"
                            aria-label="Contact Us"
                          >
                            <Mail className="w-5 h-5" />
                          </a>
                        </li>
                      </ul>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Making transparency the standard.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Code className="w-4 h-4" /> 2025 VeganFriends DAO
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    Built with <Heart className="w-4 h-4 text-primary fill-current" /> by VFDAO Builders.
                  </p>
                </div>
              </div>
            </footer>
          </WalletProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
