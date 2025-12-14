'use client';

import { ComingSoon } from '@/features/explore/components/ComingSoon';
import { Palette } from 'lucide-react';

export default function ArtistsPage() {
  return (
    <ComingSoon 
      title="Artists"
      description="Explore and support vegan artists and creators. Purchase digital art, NFTs, and physical artwork from our creative community."
      icon={<Palette className="w-12 h-12" />}
      features={[
        'Artist portfolios and galleries',
        'Digital art marketplace',
        'NFT collections',
        'Commission requests',
      ]}
    />
  );
}
