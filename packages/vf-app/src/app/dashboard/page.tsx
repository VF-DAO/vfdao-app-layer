'use client';

import Link from 'next/link';
import { Award, CheckCircle2, Leaf, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScanHistory } from '@/features/tracking';
import { useWallet } from '@/features/wallet';

export default function ConsumerDashboard() {
  const { accountId } = useWallet();
  const { data: scans } = useScanHistory(accountId ?? undefined);
  const verifiedCount = scans?.length ?? 0;

  const stats = [
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      label: 'Products Verified',
      value: String(verifiedCount),
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
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">Welcome to VeganFriends</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Connect your wallet to start verifying products and earning rewards.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-muted-foreground/50 transition-all"
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
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">Recent Verifications</h2>
          <div className="space-y-3 sm:space-y-4">
          {(scans && scans.length > 0 ? scans.slice(0, 3) : []).map((scan, i) => (
              <Link
                key={scan.id}
                href={`/scan/${encodeURIComponent(scan.code)}`}
                className="p-3 sm:p-4 rounded-lg bg-muted/50 flex items-center justify-between hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm sm:text-base">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm sm:text-base">{scan.productId}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(scan.scannedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {!scans?.length && (
              <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                <p className="font-medium text-foreground text-sm sm:text-base">No verifications yet</p>
                <p className="text-xs text-muted-foreground">
                  Start scanning products to build your history
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card">
            <h3 className="font-bold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Quick Start</h3>
            <Button asChild variant="verified" className="w-full mb-2 sm:mb-3">
              <Link href="/scan">Scan Product</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/products">Browse products</Link>
            </Button>
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
