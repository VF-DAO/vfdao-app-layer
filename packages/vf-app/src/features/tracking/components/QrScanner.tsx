'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QrScannerProps {
  onCode: (code: string) => void;
  disabled?: boolean;
}

export function QrScanner({ onCode, disabled }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'camera' | 'paste'>('paste');
  const [manual, setManual] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'camera' || disabled) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let scanner: { start: () => Promise<void>; stop: () => void; destroy: () => void } | null = null;

    const start = async () => {
      try {
        const { default: QrScannerLib } = await import('qr-scanner');
        if (cancelled) return;
        scanner = new QrScannerLib(
          video,
          (result) => {
            onCode(result.data);
          },
          { highlightScanRegion: true, highlightCodeOutline: true }
        );
        await scanner.start();
      } catch (error) {
        setCameraError(error instanceof Error ? error.message : 'Camera is not available');
        setMode('paste');
      }
    };

    void start();
    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [mode, disabled, onCode]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'camera' ? 'verified' : 'outline'}
          onClick={() => setMode('camera')}
          disabled={disabled}
        >
          <Camera className="h-4 w-4" />
          Camera
        </Button>
        <Button
          type="button"
          variant={mode === 'paste' ? 'verified' : 'outline'}
          onClick={() => setMode('paste')}
          disabled={disabled}
        >
          <Keyboard className="h-4 w-4" />
          Paste code
        </Button>
      </div>

      {mode === 'camera' ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-muted/30">
          <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
          {cameraError && <p className="p-4 text-sm text-orange">{cameraError}</p>}
        </div>
      ) : (
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (manual.trim()) onCode(manual.trim());
          }}
        >
          <Input
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder="vf:lot:lot-oatmilk-nordic-2403"
            disabled={disabled}
            aria-label="Product lot code"
          />
          <Button type="submit" variant="verified" disabled={disabled === true || manual.trim().length === 0}>
            Verify
          </Button>
        </form>
      )}
    </div>
  );
}
