'use client';

import Link from 'next/link';
import { ArrowRight, ArrowRightLeft, BarChart3, Sprout, Droplets } from 'lucide-react';
import { RheaSwapWidget } from '@/components/swap/SwapWidget';
import { PortfolioDashboard } from '@/components/portfolio-dashboard';
import { LiquidityCard } from '@/components/liquidity/LiquidityCard';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center px-4 pt-2 sm:pt-40 pb-20 sm:pb-32">
        <div className="text-center max-w-5xl mb-12 w-full">
          {/* Main Hero Content */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
              <span className="text-primary">Vegan</span><span className="text-verified">Friends</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-xl md:text-2xl max-w-3xl mx-auto mb-12">
              Join a community building trust in vegan products. Swap tokens, support the ecosystem, and help verify ethical supply chains together.
            </p>
            <div className="flex flex-row gap-4 justify-center w-full flex-wrap">
              <PortfolioDashboard />
            </div>

            {/* VF Token Purpose */}
            <div className="max-w-2xl mx-auto mt-16 mb-6">
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center">
                VF tokens help you be part of something bigger. With them, you can use our verification tools, 
                have a say in how we certify products, and join others making the vegan world more trustworthy.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            <div 
              className="relative p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg cursor-pointer group"
              onClick={() => {
                const element = document.querySelector('#tokens');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <div className="absolute top-3 right-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 transform -rotate-45" />
              </div>
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 mb-4">
                <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Get VF Tokens</h3>
              <p className="text-sm text-muted-foreground">Exchange NEAR for VF tokens and join our community</p>
            </div>
            <div 
              className="relative p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg cursor-pointer group"
              onClick={() => {
                const element = document.querySelector('#liquidity');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <div className="absolute top-3 right-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 transform -rotate-45" />
              </div>
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 mb-4">
                <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Support the Pool</h3>
              <p className="text-sm text-muted-foreground">Help others trade and earn rewards for your contribution</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg opacity-75">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 mb-4">
                <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Participate</h3>
              <p className="text-sm text-muted-foreground">Coming soon - Have a voice in community decisions</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg opacity-75">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 mb-4">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">Coming soon - See your contributions and community growth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Acquisition Section */}
      <section id="tokens" className="py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">Get VF Tokens</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              VF tokens let you participate in the community. Exchange your NEAR for VF tokens below - it's simple and takes just a few seconds.
            </p>
          </div>
          <div className="flex justify-center">
            <RheaSwapWidget />
          </div>
        </div>
      </section>

      {/* Liquidity Section */}
      <section id="liquidity" className="py-16 sm:py-24 px-4 border-t border-border bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">Support the Trading Pool</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Help others trade by adding your tokens to the pool. You'll earn a share of trading fees whenever someone swaps. Remove your contribution anytime.
            </p>
          </div>
          <div className="flex justify-center">
            <LiquidityCard />
          </div>
        </div>
      </section>
    </div>
  );
}