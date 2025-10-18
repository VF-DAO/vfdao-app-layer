'use client';

import Link from 'next/link';
import { RheaSwapWidget } from '@/components/swap/SwapWidget';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20">
        <div className="text-center max-w-5xl mb-12 w-full">
          {/* Simple Construction Message */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-4 transform rotate-12">🥕</div>
            <p className="text-muted-foreground text-lg">
              This app is currently under development. Check back soon!
            </p>
          </div>
        </div>
      </div>

      {/* Swap Section */}
      <section id="swap" className="py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-foreground">Swap Tokens</h2>
            <p className="text-lg text-muted-foreground">
              Trade tokens seamlessly using Rhea Finance liquidity
            </p>
          </div>
          <div className="flex justify-center">
            <RheaSwapWidget />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-muted-foreground text-sm">
        <p>
          Not ready yet?{' '}
          <Link href="/" className="text-primary hover:underline">
            Go back to the landing site
          </Link>
        </p>
      </footer>
    </div>
  );
}
