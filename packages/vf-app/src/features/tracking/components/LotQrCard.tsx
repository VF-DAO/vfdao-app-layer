'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { encodeLotQr, scanPublicUrl } from '../lib/qr';

export function LotQrCard({ lotId, lotLabel }: { lotId: string; lotLabel?: string }) {
  const lotCode = encodeLotQr(lotId);
  const url = scanPublicUrl(lotId);
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toString(url, { type: 'svg', margin: 1, width: 192 })
      .then((next) => {
        if (!cancelled) setSvg(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not render QR');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function copyCode() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function downloadPng() {
    const png = await QRCode.toDataURL(url, { margin: 1, width: 512 });
    const link = document.createElement('a');
    link.href = png;
    link.download = `${lotId}.png`;
    link.click();
  }

  async function shareCode() {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title: lotLabel ?? 'Lot QR', text: url, url });
      return;
    }
    await copyCode();
  }

  return (
    <Card className="border border-border p-6">
      <p className="text-sm text-muted-foreground">Lot QR</p>
      <h3 className="text-lg font-semibold text-foreground">Print this on the carton</h3>
      <p className="mt-1 break-all font-mono text-xs text-foreground">{url}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{lotCode}</p>
      <div className="mt-4 flex justify-center rounded-2xl bg-white p-4">
        {svg ? (
          <div
            aria-hidden="true"
            className="h-48 w-48 text-foreground"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{error ?? 'Rendering QR…'}</p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void copyCode()}>
          {copied ? 'Copied' : 'Copy code'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void downloadPng()}>
          Download PNG
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={() => void shareCode()}>
          Share
        </Button>
      </div>
    </Card>
  );
}
