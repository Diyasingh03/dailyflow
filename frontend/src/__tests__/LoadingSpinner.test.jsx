/**
 * Tests for src/components/LoadingSpinner.jsx
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders the default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders a custom message', () => {
    render(<LoadingSpinner message="Fetching your briefing…" />);
    expect(screen.getByText('Fetching your briefing…')).toBeInTheDocument();
  });

  it('renders the spinner element', () => {
    const { container } = render(<LoadingSpinner />);
    // The spinning div has animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
