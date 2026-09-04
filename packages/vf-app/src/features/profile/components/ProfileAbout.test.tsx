import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileAbout } from './ProfileAbout';

describe('ProfileAbout', () => {
  it('hides when there is only a face bio', () => {
    const { container } = render(
      <ProfileAbout
        profile={{
          accountId: 'green-valley.near',
          bio: 'Family farm in Kalmar.',
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the OnSocial About essay and lead', () => {
    render(
      <ProfileAbout
        profile={{
          accountId: 'green-valley.near',
          lead: 'Oats from Kalmar. Logged, not claimed.',
          about: 'We grow oats in Kalmar County.',
        }}
      />
    );
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByText('Oats from Kalmar. Logged, not claimed.')).toBeInTheDocument();
    expect(screen.getByText('We grow oats in Kalmar County.')).toBeInTheDocument();
  });
});
