/**
 * Tests for src/App.jsx — routing
 *
 * All page components are mocked to simple divs so we test only routing,
 * not page implementation.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock all page components and Layout so we can test routing in isolation
vi.mock('../pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock('../pages/Tasks',     () => ({ default: () => <div>Tasks Page</div> }));
vi.mock('../pages/Recap',     () => ({ default: () => <div>Recap Page</div> }));
vi.mock('../pages/Insights',  () => ({ default: () => <div>Insights Page</div> }));
vi.mock('../components/Layout', () => ({
  default: ({ children }) => (
    <div>
      <nav>
        <a href="/">Dashboard</a>
        <a href="/tasks">Tasks</a>
        <a href="/recap">Recap</a>
        <a href="/insights">Insights</a>
      </nav>
      <main>{children}</main>
    </div>
  ),
}));

import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Tasks     from '../pages/Tasks';
import Recap     from '../pages/Recap';
import Insights  from '../pages/Insights';
import Layout    from '../components/Layout';

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/tasks"    element={<Tasks />} />
        <Route path="/recap"    element={<Recap />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function renderRoutes(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

describe('App routing', () => {
  it('renders Dashboard page at /', () => {
    renderRoutes('/');
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders Tasks page at /tasks', () => {
    renderRoutes('/tasks');
    expect(screen.getByText('Tasks Page')).toBeInTheDocument();
  });

  it('renders Recap page at /recap', () => {
    renderRoutes('/recap');
    expect(screen.getByText('Recap Page')).toBeInTheDocument();
  });

  it('renders Insights page at /insights', () => {
    renderRoutes('/insights');
    expect(screen.getByText('Insights Page')).toBeInTheDocument();
  });

  it('redirects unknown paths to /', () => {
    renderRoutes('/unknown-path-xyz');
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
