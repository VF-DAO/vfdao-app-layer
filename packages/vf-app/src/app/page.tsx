'use client';

import Link from 'next/link';
import { ArrowRight, ArrowRightLeft, BarChart3, Sprout } from 'lucide-react';
import { RheaSwapWidget } from '@/components/swap/SwapWidget';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div className="text-center max-w-5xl mb-12 w-full">
          {/* Main Hero Content */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
              Welcome to <span className="text-verified">VeganFriends</span>
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto mb-8">
              Decentralized infrastructure for the vegan community. Swap tokens, stake for governance, and build trust in ethical supply chains.
            </p>
            <div className="flex flex-row gap-4 justify-center w-full flex-wrap">
              <Link
                href="https://vf-portal.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-verified hover:border-verified/80 text-primary hover:text-primary px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full font-semibold transition-all hover:shadow-md hover:shadow-verified/10 group text-sm md:text-base whitespace-nowrap"
              >
                Learn More
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
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
              <h3 className="text-lg font-semibold mb-2">Token Swapping</h3>
              <p className="text-sm text-muted-foreground">Take part and explore the VeganFriends ecosystem</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg opacity-75">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 mb-4">
                <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Staking</h3>
              <p className="text-sm text-muted-foreground">Coming soon - Stake tokens for governance and rewards</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg opacity-75">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 mb-4">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dashboards</h3>
              <p className="text-sm text-muted-foreground">Coming soon - Track your portfolio and community impact</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Acquisition Section */}
      <section id="tokens" className="py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">VeganFriends Tokens</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Get VF tokens to join the verification community. Stake your tokens to verify products, share insights, and help build trust in ethical supply chains.
            </p>
          </div>
          <div className="flex justify-center">
            <RheaSwapWidget />
          </div>
        </div>
      </section>
    </div>
  );
}
