'use client';

import { use, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/features/wallet';
import { getClientTracker, LotBundleView, useScanResolve } from '@/features/tracking';

export default function ScanResultPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = use(params);
  const code = decodeURIComponent(rawCode);
  const { accountId } = useWallet();
  const { data, loading, error } = useScanResolve(code);
  const recordedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const key = `${code}:${data.lot.id}:${accountId ?? 'anon'}`;
    if (recordedKey.current === key) return;
    recordedKey.current = key;
    void getClientTracker()
      .recordScan({
        code,
        lotId: data.lot.id,
        productId: data.product.id,
        accountId: accountId ?? undefined,
      })
      .catch(() => {
        recordedKey.current = null;
      });
  }, [accountId, code, data]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:py-12">
      <Button asChild variant="ghost" size="sm">
        <Link href="/scan">
          <ArrowLeft className="h-4 w-4" />
          Scan another
        </Link>
      </Button>
      {loading && <p className="text-muted-foreground">Resolving lot…</p>}
      {error && <p className="text-orange">{error}</p>}
      {!loading && !data && !error && (
        <p className="text-muted-foreground">No lot found for that code.</p>
      )}
      {data && <LotBundleView bundle={data} />}
    </div>
  );
}
