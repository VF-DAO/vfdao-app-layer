'use client';

import { Award, CheckCircle2, Leaf, TrendingUp } from 'lucide-react';

export default function ConsumerDashboard() {
  const stats = [
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      label: 'Products Verified',
      value: '0',
      color: 'text-verified',
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      label: 'Carbon Saved',
      value: '0 kg',
      color: 'text-green-500',
    },
    {
      icon: <Award className="w-8 h-8" />,
      label: 'Badges Earned',
      value: '0',
      color: 'text-yellow-500',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      label: '$VF Rewards',
      value: '0',
      color: 'text-primary',
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Welcome to VeganFriends</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Connect your wallet to start verifying products and earning rewards.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all"
          >
            <div className={`${stat.color} mb-3 sm:mb-4`}>
              <div className="w-6 h-6 sm:w-8 sm:h-8">{stat.icon}</div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Product History */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border border-border bg-card">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-3 sm:mb-4">Recent Verifications</h2>
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 sm:p-4 rounded-lg bg-muted/50 flex items-center justify-between hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm sm:text-base">
                    {i}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm sm:text-base">No verifications yet</p>
                    <p className="text-xs text-muted-foreground">
                      Start scanning products to build your history
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card">
            <h3 className="font-bold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Quick Start</h3>
            <button className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors mb-2 sm:mb-3 text-sm sm:text-base">
              📱 Scan Product
            </button>
            <button className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-primary/30 text-primary font-semibold hover:bg-primary/10 transition-colors text-sm sm:text-base">
              📚 Learn More
            </button>
          </div>

          {/* Rewards Info */}
          <div className="p-4 sm:p-6 rounded-2xl border border-verified/20 bg-verified/5">
            <h3 className="font-bold text-foreground mb-2 text-sm sm:text-base">Earn Rewards</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Every product you verify earns you $VF tokens and exclusive badges.
            </p>
            <div className="text-xs text-verified font-semibold">Coming Soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}
