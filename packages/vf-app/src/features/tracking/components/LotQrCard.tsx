'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { encodeLotQr } from '../lib/qr';

export function LotQrCard({ lotId, lotLabel }: { lotId: string; lotLabel?: string }) {
  const code = encodeLotQr(lotId);
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toString(code, { type: 'svg', margin: 1, width: 192 })
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
  }, [code]);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function downloadPng() {
    const url = await QRCode.toDataURL(code, { margin: 1, width: 512 });
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lotId}.png`;
    link.click();
  }

  async function shareCode() {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title: lotLabel ?? 'Lot QR', text: code });
      return;
    }
    await copyCode();
  }

  return (
    <Card className="border border-border p-6">
      <p className="text-sm text-muted-foreground">Lot QR</p>
      <h3 className="text-lg font-semibold text-foreground">Share this batch</h3>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{code}</p>
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
