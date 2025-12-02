'use client';

import { motion } from 'framer-motion';
import { RheaSwapWidget } from '@/features/swap/components/SwapWidget';
import { PortfolioDashboard } from '@/features/portfolio';
import { LiquidityCard } from '@/features/liquidity';
import { useWallet } from '@/features/wallet';
import { useProfile } from '@/hooks/use-profile';
import { ThemeToggle } from '@/components/theme-toggle';
import { FaXTwitter } from 'react-icons/fa6';
import { Github, Send } from 'lucide-react';
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

      {/* Token Acquisition Section - Only show when connected */}
      {isConnected && (
        <section id="tokens" className="relative py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                <span className="text-primary">V</span><span className="text-verified">F</span> Token Swap
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                VeganFriends tokens enable full ecosystem participation.
              </p>
            </motion.div>
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <RheaSwapWidget />
            </motion.div>
          </div>
        </section>
      )}

      {/* Liquidity Section - Only show when connected */}
      {isConnected && (
        <section id="liquidity" className="relative py-16 sm:py-24 px-4 border-t border-border bg-background">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                <span className="text-primary">V</span><span className="text-verified">F</span> Pool
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Liquidity providers strengthen the ecosystem and earn rewards.
              </p>
            </motion.div>
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <LiquidityCard />
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}