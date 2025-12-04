'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PortfolioDashboard } from '@/features/portfolio';
import { useWallet } from '@/features/wallet';
import { useProfile } from '@/hooks/use-profile';
import { ThemeToggle } from '@/components/theme-toggle';
import { FaXTwitter } from 'react-icons/fa6';
import { Coins, Github, Send, Vote } from 'lucide-react';
import Logo from '@/components/ui/logo';

export default function Home() {
  const { accountId, isConnected, isLoading: walletLoading } = useWallet();
  const { displayName, profile, loading: _profileLoading } = useProfile(accountId ?? undefined);
  
  // Extract and format username from accountId (remove .near extension, capitalize first letter, truncate if too long) - fallback
  const username = accountId ? accountId.split('.')[0] : null;
  const formattedUsernameFallback = username 
    ? (username.length > 15 ? username.substring(0, 15) + '...' : username.charAt(0).toUpperCase() + username.slice(1))
    : null;
  
  // Only use display name from social-db if profile exists and has a name, otherwise use formatted account ID
  const displayUsername = profile?.profile?.name ? displayName : formattedUsernameFallback;

  return (
    <div className={`flex flex-col min-h-screen bg-background ${isConnected ? 'pt-16 md:pt-0' : ''}`}>
      
      {/* Hero Section */}
      <div className={`relative flex-1 flex flex-col items-center px-4 ${isConnected ? 'pt-16 sm:pt-24 md:pt-32' : 'pt-32 sm:pt-48 md:pt-56'} pb-20 sm:pb-32`}>
        {/* Logo in top left corner - Only show when not connected */}
        {!isConnected && !walletLoading && (
          <div className="absolute top-4 left-4 z-10">
            <Logo className="w-16 h-12 sm:w-20 sm:h-15 md:w-24 md:h-18 lg:w-28 lg:h-21" />
          </div>
        )}

        <div className="text-center max-w-5xl mb-12 w-full">
          {/* Theme Toggle - Only show when not connected */}
          {!isConnected && !walletLoading && (
            <div className="absolute top-4 right-4 z-10">
              <ThemeToggle />
            </div>
          )}

          {/* Simplified Hero Content */}
          <div className="text-center mb-12">
            <motion.div 
              className="mb-12 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {walletLoading ? (
                /* Clean splash screen with logo only - no text to avoid jarring transitions */
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Logo className="w-24 h-18 sm:w-32 sm:h-24 md:w-40 md:h-30" />
                  </motion.div>
                </div>
              ) : isConnected ? (
                <div className="text-center">
                  <motion.h1 
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <span className="text-primary">Hello</span> <span className="text-verified">
                      {displayUsername ?? ''}
                    </span>
                  </motion.h1>
                  <motion.p 
                    className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                  >
                    Your space is ready to explore.
                  </motion.p>
                </div>
              ) : (
                <div className="text-center">
                  <motion.h1 
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <span className="text-foreground">Welcome to</span><br />
                    <span className="text-primary">Vegan</span><span className="text-verified">Friends</span>
                  </motion.h1>
                  <motion.div 
                    className="w-24 h-1 bg-verified mx-auto rounded-full mb-8"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                  />
                </div>
              )}
            </motion.div>

            {/* Portfolio Dashboard - appears with slight delay after hero content */}
            {!walletLoading && (
              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <PortfolioDashboard />
              </motion.div>
            )}
          </div>

          {/* Social Media Links - Only show when not connected */}
          {!isConnected && !walletLoading && (
            <motion.div 
              className="flex justify-center gap-8 mt-8 sm:mt-12 md:mt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            >
              <a
                href="https://t.me/veganfriendsdao"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110"
                aria-label="Join our Telegram community"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="w-6 h-6" />
              </a>
              <a
                href="https://x.com/VeganFriendsDAO"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110"
                aria-label="Follow us on X (Twitter)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaXTwitter size={22} />
              </a>
              <a
                href="https://github.com/VF-DAO/vfdao-eco-engine"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110"
                aria-label="View our code on GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-6 h-6" />
              </a>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Actions - Only show when connected */}
      {isConnected && (
        <section className="relative py-12 sm:py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              className="grid grid-cols-2 gap-4 sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {/* $VF Token Card */}
              <Link
                href="/vf"
                className="group p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">$VF Token</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Exchange & Pool</p>
                  </div>
                </div>
              </Link>

              {/* DAO Card */}
              <Link
                href="/dao"
                className="group p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-verified/50 hover:bg-gradient-to-br hover:from-verified/5 hover:to-transparent transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-verified/10 flex items-center justify-center group-hover:bg-verified/20 transition-colors">
                    <Vote className="w-6 h-6 sm:w-7 sm:h-7 text-verified" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-verified transition-colors">DAO</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Vote & Propose</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}