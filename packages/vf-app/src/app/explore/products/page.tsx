'use client';

import { ComingSoon } from '@/features/explore/components/ComingSoon';
import { Package } from 'lucide-react';

export default function ProductsPage() {
  return (
    <ComingSoon 
      title="Verified Products"
      description="Browse products verified through our blockchain-based tracking system. Scan, verify, and trust what you buy."
      icon={<Package className="w-12 h-12" />}
      features={[
        'QR code verification',
        'Supply chain transparency',
        'Ingredient tracking',
        'Certification verification',
      ]}
    />
  );
}
