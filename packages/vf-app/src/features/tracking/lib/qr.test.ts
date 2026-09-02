import { describe, expect, it } from 'vitest';
import { encodeLotQr, parseScanCode, scanHref } from './qr';

describe('lot QR codes', () => {
  it('encodes a VF lot payload', () => {
    expect(encodeLotQr('lot-oatmilk-nordic-2403')).toBe('vf:lot:lot-oatmilk-nordic-2403');
  });

  it('parses the VF prefix, a bare lot id, and a scan URL', () => {
    expect(parseScanCode('vf:lot:lot-oatmilk-nordic-2403')).toEqual({ lotId: 'lot-oatmilk-nordic-2403' });
    expect(parseScanCode('lot-oatmilk-nordic-2403')).toEqual({ lotId: 'lot-oatmilk-nordic-2403' });
    expect(parseScanCode('https://app.vfdao.org/scan/vf%3Alot%3Alot-oatmilk-nordic-2403')).toEqual({
      lotId: 'lot-oatmilk-nordic-2403',
    });
  });

  it('rejects empty or junk input', () => {
    expect(parseScanCode('')).toBeNull();
    expect(parseScanCode('???')).toBeNull();
  });

  it('builds a scan href', () => {
    expect(scanHref('lot-1')).toBe('/scan/vf%3Alot%3Alot-1');
  });
});
