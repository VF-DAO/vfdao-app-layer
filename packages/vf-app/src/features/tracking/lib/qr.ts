const QR_PREFIX = 'vf:lot:';

export function encodeLotQr(lotId: string): string {
  return `${QR_PREFIX}${lotId}`;
}

export function parseScanCode(raw: string): { lotId: string } | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith(QR_PREFIX)) {
    const lotId = value.slice(QR_PREFIX.length).trim();
    return lotId ? { lotId } : null;
  }

  try {
    const url = new URL(value);
    const fromQuery = url.searchParams.get('lot') ?? url.searchParams.get('code');
    if (fromQuery) return parseScanCode(fromQuery);

    const parts = url.pathname.split('/').filter(Boolean);
    const scanIndex = parts.lastIndexOf('scan');
    if (scanIndex >= 0 && parts[scanIndex + 1]) {
      return parseScanCode(decodeURIComponent(parts[scanIndex + 1]));
    }
    const lotIndex = parts.lastIndexOf('lots');
    if (lotIndex >= 0 && parts[lotIndex + 1]) {
      return { lotId: decodeURIComponent(parts[lotIndex + 1]) };
    }
  } catch {
    // not a URL — treat as a bare lot id
  }

  if (/^[a-z0-9][a-z0-9._:-]{1,80}$/i.test(value)) {
    return { lotId: value };
  }

  return null;
}

export function scanHref(lotId: string): string {
  return `/scan/${encodeURIComponent(encodeLotQr(lotId))}`;
}
