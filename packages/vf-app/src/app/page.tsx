'use client';

import { Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { RheaSwapWidget } from '@/components/swap/SwapWidget';
import { PortfolioDashboard } from '@/components/portfolio-dashboard';
import { LiquidityCard } from '@/components/liquidity/LiquidityCard';
import { useWallet } from '@/contexts/wallet-context';

export default function Home() {
  const { accountId, isConnected, isLoading } = useWallet();
  
  // Extract and format username from accountId (remove .near extension, capitalize first letter, truncate if too long)
  const username = accountId ? accountId.split('.')[0] : null;
  const formattedUsername = username 
    ? (username.length > 15 ? username.substring(0, 15) + '...' : username.charAt(0).toUpperCase() + username.slice(1))
    : null;
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center px-4 pt-12 sm:pt-40 pb-20 sm:pb-32">
        <div className="text-center max-w-5xl mb-12 w-full">
          {/* Simplified Hero Content */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-2"
              key={isConnected ? formattedUsername : 'greeting'} // Key changes trigger re-animation
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {isLoading ? (
                <>Welcome to</>
              ) : isConnected && formattedUsername ? (
                <><span className="text-primary">Hello</span> <span className="text-verified">{formattedUsername}</span></>
              ) : (
                <>Welcome to</>
              )}
            </motion.h1>
            
            {!isConnected && (
              <motion.h2 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              >
                <span className="text-primary">Vegan</span><span className="text-verified">Friends</span>
              </motion.h2>
            )}

            <motion.p 
              className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              {isConnected && formattedUsername ? (
                <>Your space is ready to explore.</>
              ) : (
                <>VF DAO creates clear standards for verifying vegan products. With VF tokens, you can trade, provide liquidity, verify products, and help certify details — all working together to build trust in the vegan community.</>
              )}
            </motion.p>

            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            >
              <PortfolioDashboard />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Token Acquisition Section */}
      <section id="tokens" className="py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              {isConnected ? <><span className="text-primary">V</span><span className="text-verified">F</span> Token Swap</> : <>Get <span className="text-primary">V</span><span className="text-verified">F</span> Tokens</>}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {isConnected 
                ? "VeganFriends tokens enable full ecosystem participation."
                : "Unlock ecosystem participation with VF tokens."
              }
            </p>
          </div>
          <div className="flex justify-center">
            <RheaSwapWidget />
          </div>
        </div>
      </section>

      {/* Liquidity Section - Conditional content based on connection */}
      <section id="liquidity" className="py-16 sm:py-24 px-4 border-t border-border bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground"><span className="text-primary">V</span><span className="text-verified">F</span> Pool</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {isConnected 
                ? "Liquidity providers strengthen the ecosystem and earn rewards."
                : "Connect your wallet to provide liquidity and earn rewards from ecosystem growth."
              }
            </p>
          </div>
          <div className="flex justify-center">
            {isConnected ? (
              <LiquidityCard />
            ) : (
              <div className="text-center p-8 rounded-2xl border border-border bg-card/50 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-verified bg-verified/10 text-primary mb-4">
                  <Droplets className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect to Provide Liquidity</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your wallet to start earning rewards by providing liquidity to the VF ecosystem.
                </p>
                <div className="text-xs text-primary font-medium">
                  Higher rewards for early participants
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}