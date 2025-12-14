'use client';

import { ComingSoon } from '@/features/explore/components/ComingSoon';
import { Utensils } from 'lucide-react';

export default function RestaurantsPage() {
  return (
    <ComingSoon 
      title="Restaurants"
      description="Find vegan and vegan-friendly restaurants, cafes, and food spots. Discover menus, reviews, and make reservations."
      icon={<Utensils className="w-12 h-12" />}
      features={[
        'Fully vegan & vegan-friendly filters',
        'Menu previews with vegan options',
        'Location-based discovery',
        'Community reviews and photos',
      ]}
    />
  );
}
