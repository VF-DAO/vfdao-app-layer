import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeHub } from './HomeHub';

const openDrawer = vi.fn();

vi.mock('@/features/shell', () => ({
  useAppDrawer: () => ({ openDrawer, closeDrawer: vi.fn() }),
}));

vi.mock('@/features/tracking', () => ({
  ProductCard: ({ product }: { product: { id: string; name: string } }) => <div>{product.name}</div>,
  useProducts: () => ({
    data: [{ id: 'prd-1', name: 'Oat Drink', brand: 'Nordic', description: 'Demo' }],
    loading: false,
  }),
  useScanHistory: () => ({ data: [], loading: false }),
}));

describe('HomeHub', () => {
  it('opens scan and studio in the shared overlay', async () => {
    const user = userEvent.setup();
    render(<HomeHub />);

    await user.click(screen.getByRole('button', { name: /scan a product/i }));
    expect(openDrawer).toHaveBeenCalledWith({ id: 'scan' });

    await user.click(screen.getByRole('button', { name: /studio/i }));
    expect(openDrawer).toHaveBeenCalledWith({ id: 'studio' });

    expect(screen.getByText('Oat Drink')).toBeInTheDocument();
  });
});
