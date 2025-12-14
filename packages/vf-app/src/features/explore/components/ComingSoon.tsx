'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, Check, Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features?: string[];
}

export function ComingSoon({ title, description, icon, features = [] }: ComingSoonProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/explore">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-verified/20 flex items-center justify-center mx-auto mb-6 text-primary">
            {icon}
          </div>

          {/* Badge */}
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{title}</h1>

          {/* Description */}
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            {description}
          </p>

          {/* Features */}
          {features.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-6 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold mb-4 text-left">Planned Features</h3>
              <ul className="space-y-3 text-left">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notify Button */}
          <Button variant="outline" className="gap-2" disabled>
            <Bell className="w-4 h-4" />
            Get Notified When Available
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Join our DAO to participate in building this feature
          </p>
        </Card>
      </div>
    </div>
  );
}
