'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RheaSwapWidget } from '@/features/swap/components/SwapWidget';
import { LiquidityCard } from '@/features/liquidity';
import { useWallet } from '@/features/wallet';
import { ArrowRightLeft, Droplets } from 'lucide-react';

type Tab = 'exchange' | 'pool';

export default function VFTokenPage() {
  const router = useRouter();
  const { isConnected, isLoading } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('exchange');

  // Redirect to home if not connected
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/');
    }
  }, [isConnected, isLoading, router]);

  // Show nothing while checking connection or redirecting
  if (isLoading || !isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-0">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 md:py-16">
        {/* Header */}
        <motion.div 
          className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            <span className="text-primary">V</span><span className="text-verified">F</span> Token
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Powers participation across the VeganFriends ecosystem.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="flex justify-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="inline-flex bg-muted/50 rounded-full p-1 border border-border">
            <button
              onClick={() => setActiveTab('exchange')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'exchange'
                  ? 'bg-card text-primary shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Exchange</span>
            </button>
            <button
              onClick={() => setActiveTab('pool')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'pool'
                  ? 'bg-card text-primary shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>Pool</span>
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center"
        >
          {activeTab === 'exchange' ? (
            <div className="w-full max-w-2xl">
              <RheaSwapWidget />
            </div>
          ) : (
            <div className="w-full max-w-2xl">
              <LiquidityCard />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
