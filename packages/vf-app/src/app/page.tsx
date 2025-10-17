'use client'

import { Wallet, Leaf, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-5xl mb-12 w-full">
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
        <div className="grid md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl mx-auto">
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

      {/* Dashboard Section */}
      <section id="dashboard" className="py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-foreground">Dashboard</h2>
            <p className="text-lg text-muted-foreground">Track your verified products and earned rewards</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border border-border bg-card space-y-4">
              <div className="text-4xl font-bold text-primary">42</div>
              <p className="text-foreground font-semibold">Products Verified</p>
              <p className="text-sm text-muted-foreground">You've verified 42 products this month</p>
            </div>
            <div className="p-8 rounded-2xl border border-border bg-card space-y-4">
              <div className="text-4xl font-bold text-verified">1,240</div>
              <p className="text-foreground font-semibold">$VF Earned</p>
              <p className="text-sm text-muted-foreground">Total rewards accumulated</p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-foreground">Marketplace</h2>
            <p className="text-lg text-muted-foreground">Discover verified vegan products</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all">
                <div className="w-full h-40 bg-muted rounded-lg mb-4 flex items-center justify-center text-4xl">
                  {i === 1 ? '🥗' : i === 2 ? '🌾' : '🍓'}
                </div>
                <h3 className="font-bold text-foreground mb-2">Product {i}</h3>
                <p className="text-sm text-muted-foreground mb-4">Verified vegan certified product</p>
                <button className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all text-sm">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-foreground">Community</h2>
            <p className="text-lg text-muted-foreground">Join thousands of conscious consumers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-2xl font-bold text-foreground mb-2">12.5K</p>
              <p className="text-sm text-muted-foreground">Active Members</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-2xl font-bold text-foreground mb-2">156K</p>
              <p className="text-sm text-muted-foreground">Products Verified</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card text-center">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-2xl font-bold text-foreground mb-2">98%</p>
              <p className="text-sm text-muted-foreground">Trust Score</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-muted-foreground text-sm">
        <p>
          Not ready yet? <Link href="/" className="text-primary hover:underline">Go back to the landing site</Link>
        </p>
      </footer>
    </div>
  )
}
