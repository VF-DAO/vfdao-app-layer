'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Store, 
  Heart, 
  Palette, 
  Package,
  Utensils,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ExploreCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  count?: number;
  comingSoon?: boolean;
  gradient: string;
}

const categories: ExploreCategory[] = [
  {
    id: 'businesses',
    title: 'Businesses',
    description: 'Discover verified vegan-friendly businesses and services',
    icon: <Store className="w-6 h-6" />,
    href: '/explore/businesses',
    comingSoon: true,
    gradient: 'from-primary/20 to-primary/5',
  },
  {
    id: 'restaurants',
    title: 'Restaurants',
    description: 'Find vegan and vegan-friendly restaurants near you',
    icon: <Utensils className="w-6 h-6" />,
    href: '/explore/restaurants',
    comingSoon: true,
    gradient: 'from-verified/20 to-verified/5',
  },
  {
    id: 'charities',
    title: 'Charities',
    description: 'Support verified animal welfare and vegan charities',
    icon: <Heart className="w-6 h-6" />,
    href: '/explore/charities',
    comingSoon: true,
    gradient: 'from-primary/20 to-verified/10',
  },
  {
    id: 'artists',
    title: 'Artists',
    description: 'Explore and support vegan artists and creators',
    icon: <Palette className="w-6 h-6" />,
    href: '/explore/artists',
    comingSoon: true,
    gradient: 'from-verified/20 to-primary/10',
  },
  {
    id: 'products',
    title: 'Verified Products',
    description: 'Browse products verified through our tracking system',
    icon: <Package className="w-6 h-6" />,
    href: '/explore/products',
    comingSoon: true,
    gradient: 'from-verified/20 to-verified/5',
  },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-verified/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Explore</h1>
              <p className="text-muted-foreground text-sm">
                Discover the VeganFriends ecosystem
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search businesses, charities, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className={`group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 ${
                category.comingSoon ? 'opacity-75' : ''
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-50`} />
              
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-background/80 border border-border/50 text-primary">
                    {category.icon}
                  </div>
                  {category.comingSoon && (
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>

                {category.count !== undefined && (
                  <p className="text-sm text-primary font-medium mb-4">
                    {category.count} verified
                  </p>
                )}

                {category.comingSoon ? (
                  <Button variant="ghost" disabled className="w-full">
                    Coming Soon
                  </Button>
                ) : (
                  <Link href={category.href}>
                    <Button variant="ghost" className="w-full group-hover:bg-primary/10">
                      Explore
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Coming Soon Message */}
        <Card className="mt-8 p-6 text-center border-dashed">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">More Coming Soon</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            We're building a comprehensive ecosystem for verified vegan businesses, 
            products, and creators. Stay tuned for updates!
          </p>
        </Card>
      </div>
    </div>
  );
}
