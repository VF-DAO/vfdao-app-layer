'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ScanLine, Warehouse } from 'lucide-react';
import { useAppDrawer } from '@/features/shell';
import { ProductCard, useProducts, useScanHistory } from '@/features/tracking';

function ActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function HomeHub({ accountId }: { accountId?: string | null }) {
  const { openDrawer } = useAppDrawer();
  const products = useProducts();
  const scans = useScanHistory(accountId ?? undefined);
  const featured = products.data?.slice(0, 2) ?? [];
  const recent = scans.data?.slice(0, 3) ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 text-left">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ActionCard
          icon={<ScanLine className="h-5 w-5" />}
          title="Scan a product"
          description="Camera or lot code"
          onClick={() => openDrawer({ id: 'scan' })}
        />
        <ActionCard
          icon={<Warehouse className="h-5 w-5" />}
          title="Studio"
          description="Register, open a lot, certify"
          onClick={() => openDrawer({ id: 'studio' })}
        />
      </div>

      {recent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent scans</h2>
            <Link href="/dashboard/history" className="text-sm text-primary">
              History
            </Link>
          </div>
          <ul className="space-y-2">
            {recent.map((scan) => (
              <li key={scan.id}>
                <Link
                  href={`/scan/${encodeURIComponent(scan.code)}`}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
                >
                  <span className="font-mono text-sm text-foreground">{scan.code}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Verified products</h2>
            <Link href="/products" className="text-sm text-primary">
              All products
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
