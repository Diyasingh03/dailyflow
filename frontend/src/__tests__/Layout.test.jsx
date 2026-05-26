/**
 * Tests for src/components/Layout.jsx
 *
 * Layout uses NavLink from react-router-dom, so we need a MemoryRouter.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../components/Layout';

function renderLayout(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Layout>
        <div data-testid="page-content">Page Content</div>
      </Layout>
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('renders the DailyFlow brand name', () => {
    renderLayout();
    expect(screen.getByText('DailyFlow')).toBeInTheDocument();
  });

  it('renders all four navigation links', () => {
    renderLayout();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Smart Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Recap/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Insights/i)).toBeInTheDocument();
  });

  it('renders children inside the main area', () => {
    renderLayout();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('shows Gemini footer text', () => {
    renderLayout();
    expect(screen.getByText(/Powered by Gemini/i)).toBeInTheDocument();
  });

  it('nav links have correct href attributes', () => {
    renderLayout();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/tasks');
    expect(hrefs).toContain('/recap');
    expect(hrefs).toContain('/insights');
  });
});
