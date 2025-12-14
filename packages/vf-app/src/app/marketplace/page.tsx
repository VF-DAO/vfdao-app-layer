'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, Sparkles, Bell, Image, Palette, Package } from 'lucide-react';

export default function MarketplacePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-verified/20 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-primary" />
          </div>

          {/* Badge */}
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Marketplace</h1>

          {/* Description */}
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            A decentralized marketplace for digital art, NFTs, and verified vegan products. 
            Support artists and creators in our community.
          </p>

          {/* Categories Preview */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            <div className="p-4 rounded-xl bg-muted/30 text-center">
              <Image className="w-8 h-8 mx-auto mb-2 text-primary" />
              <span className="text-sm text-muted-foreground">Digital Art</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 text-center">
              <Palette className="w-8 h-8 mx-auto mb-2 text-verified" />
              <span className="text-sm text-muted-foreground">NFTs</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
              <span className="text-sm text-muted-foreground">Products</span>
            </div>
          </div>

          {/* Notify Button */}
          <Button variant="outline" className="gap-2" disabled>
            <Bell className="w-4 h-4" />
            Get Notified When Available
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Smart contract in development
          </p>
        </Card>
      </div>
    </div>
  );
}
