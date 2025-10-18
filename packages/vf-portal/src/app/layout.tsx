import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Navigation } from '@/components/navigation/navigation';
import Logo from '@/components/logo';
import { BookOpen, Code, Github, Heart, Mail, Send, Users } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VF DAO - The Green Heart of Vegan Web3',
  description:
    'Decentralized infrastructure for the vegan community. Built on NEAR Protocol by VFDAO Builders.',
  keywords: ['vegan', 'dao', 'web3', 'near', 'blockchain', 'sustainability', 'eco'],
  authors: [{ name: 'VFDAO Builders' }],
  openGraph: {
    title: 'VF DAO',
    description: 'The Green Heart of Vegan Web3',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="vf-theme"
        >
          <Navigation />
          <main className="min-h-screen" suppressHydrationWarning>
            {children}
          </main>
          <footer className="border-t py-12 px-4 bg-card/30">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                {/* About */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Logo width={80} height={54} className="w-20 h-14" />
                    <span className="text-base sm:text-lg font-bold text-foreground">
                      Vegan Friends
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Making transparency the standard.
                  </p>
                </div>

                {/* Community */}
                <div className="space-y-3">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground">Community</h4>
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
                  </ul>
                </div>

                {/* Resources */}
                <div className="space-y-3">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground">Resources</h4>
                  <ul className="flex gap-4 text-muted-foreground">
                    <li>
                      <a
                        href="#docs"
                        className="hover:text-primary transition-colors"
                        aria-label="Documentation"
                      >
                        <BookOpen className="w-5 h-5" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Get Involved */}
                <div className="space-y-3">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground">Get Involved</h4>
                  <ul className="flex gap-4 text-muted-foreground">
                    <li>
                      <a
                        href="#partners"
                        className="hover:text-primary transition-colors"
                        aria-label="Become a Partner"
                      >
                        <Users className="w-5 h-5" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://github.com/VF-DAO/vfdao-eco-engine/issues"
                        className="hover:text-primary transition-colors"
                        aria-label="Contribute"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="w-5 h-5" />
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
              </div>

              <div className="border-t pt-8 flex justify-center items-center">
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  2025 VeganFriends DAO <Code className="w-4 h-4" /> Built with{' '}
                  <Heart className="w-4 h-4 text-primary fill-current inline" /> by VFDAO Builders.
                </p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
