'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { encodeLotQr, useScanHistory } from '@/features/tracking';
import { useWallet } from '@/features/wallet';

export default function TrailPage() {
  const { accountId } = useWallet();
  const { data, loading } = useScanHistory(accountId ?? undefined);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-8 md:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Your trail</h1>
        <p className="text-sm text-muted-foreground">Lots you have scanned. Unlisted lots still resolve.</p>
      </header>

      {loading && <p className="text-muted-foreground">Loading trail…</p>}

      {!loading && !data?.length && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="mb-4 text-muted-foreground">No scans yet.</p>
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
                <p className="font-mono text-sm text-foreground">{encodeLotQr(scan.lotId)}</p>
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
