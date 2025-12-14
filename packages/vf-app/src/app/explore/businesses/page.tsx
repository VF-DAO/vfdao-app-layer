'use client';

import { ComingSoon } from '@/features/explore/components/ComingSoon';
import { Store } from 'lucide-react';

export default function BusinessesPage() {
  return (
    <ComingSoon 
      title="Businesses"
      description="Discover verified vegan-friendly businesses and services in your area. From shops to service providers, find trusted vegan businesses."
      icon={<Store className="w-12 h-12" />}
      features={[
        'Verified vegan-friendly status',
        'Location-based search',
        'Reviews and ratings',
        'Business profiles with products/services',
      ]}
    />
  );
}
