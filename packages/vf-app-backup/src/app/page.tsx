'use client'

import { Wallet, Leaf, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-2xl mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-4xl">
              🌿
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Welcome to VeganFriends
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connect your wallet and join a community verifying transparency in the vegan ecosystem.
          </p>
          <button className="px-8 py-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all text-lg">
            <Wallet className="w-5 h-5 inline mr-2" />
            Connect Wallet
          </button>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl w-full">
          <div className="p-6 rounded-2xl border border-border bg-card">
            <ShieldCheck className="w-8 h-8 text-verified mb-4" />
            <h3 className="font-bold text-foreground mb-2">Verify Products</h3>
            <p className="text-sm text-muted-foreground">Scan products and see their complete supply chain in seconds.</p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card">
            <Leaf className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="font-bold text-foreground mb-2">Earn Rewards</h3>
            <p className="text-sm text-muted-foreground">Get $VF tokens and badges for every verified product.</p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card">
            <Users className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-bold text-foreground mb-2">Join Community</h3>
            <p className="text-sm text-muted-foreground">Connect with other vegans building transparency together.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-muted-foreground text-sm">
        <p>
          Not ready yet? <Link href="/" className="text-primary hover:underline">Go back to the landing site</Link>
        </p>
      </footer>
    </div>
  )
}
