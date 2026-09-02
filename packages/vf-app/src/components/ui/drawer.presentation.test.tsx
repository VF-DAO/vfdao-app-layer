import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Drawer } from './drawer';

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderDrawer() {
  render(
    <Drawer isOpen onClose={() => undefined} labelledBy="app-drawer-title">
      <Drawer.Header title="Join DAO" />
    </Drawer>
  );
}

describe('drawer presentation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders as a bottom sheet on a phone-sized viewport', () => {
    mockMatchMedia(false);
    renderDrawer();
    expect(screen.getByRole('dialog')).toHaveAttribute('data-presentation', 'sheet');
  });

  it('renders as a centered dialog on a desktop viewport', () => {
    mockMatchMedia(true);
    renderDrawer();
    expect(screen.getByRole('dialog')).toHaveAttribute('data-presentation', 'dialog');
  });
});

