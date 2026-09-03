import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LotQrCard } from './LotQrCard';

vi.mock('qrcode', () => ({
  default: {
    toString: vi.fn(async () => '<svg data-testid="lot-qr-svg"></svg>'),
    toDataURL: vi.fn(async () => 'data:image/png;base64,xx'),
  },
}));

describe('LotQrCard', () => {
  it('renders the VF lot code and share actions', async () => {
    render(<LotQrCard lotId="lot-oatmilk-nordic-2403" lotLabel="Spring harvest" />);

    expect(await screen.findByTestId('lot-qr-svg')).toBeInTheDocument();
    expect(screen.getByText('vf:lot:lot-oatmilk-nordic-2403')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });
});
