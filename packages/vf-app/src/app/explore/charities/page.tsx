'use client';

import { ComingSoon } from '@/features/explore/components/ComingSoon';
import { Heart } from 'lucide-react';

export default function CharitiesPage() {
  return (
    <ComingSoon 
      title="Charities"
      description="Support verified animal welfare organizations and vegan charities. Track donations transparently on the blockchain."
      icon={<Heart className="w-12 h-12" />}
      features={[
        'Verified charity status',
        'Transparent donation tracking',
        'Impact reports and updates',
        'Direct crypto donations',
      ]}
    />
  );
}
