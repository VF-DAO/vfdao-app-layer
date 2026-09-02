'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/features/wallet';
import { encodeLotQr, useScanHistory } from '@/features/tracking';

export default function HistoryPage() {
  const { accountId } = useWallet();
  const { data, loading } = useScanHistory(accountId ?? undefined);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
        Verification History
      </h1>
      <p className="mb-8 text-muted-foreground">Products you have scanned in this app.</p>

      {loading && <p className="text-muted-foreground">Loading history…</p>}

      {!loading && !data?.length && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
          <h2 className="mb-2 text-2xl font-bold text-foreground">No verifications yet</h2>
          <p className="mb-4 text-muted-foreground">Scan a product to start your history.</p>
          <Button asChild variant="verified">
            <Link href="/scan">Scan a product</Link>
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {data?.map((scan) => (
          <Card key={scan.id} className="border border-border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{scan.productId}</p>
                <p className="font-mono text-xs text-muted-foreground">{encodeLotQr(scan.lotId)}</p>
                <p className="text-xs text-muted-foreground">{new Date(scan.scannedAt).toLocaleString()}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/scan/${encodeURIComponent(scan.code)}`}>Open</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
