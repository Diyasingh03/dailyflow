/**
 * Tests for src/pages/Recap.jsx
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Recap from '../pages/Recap';

vi.mock('../api', () => ({
  api: {
    generateStandup:    vi.fn(),
    getStandupHistory:  vi.fn(),
  },
}));

import { api } from '../api';

const MOCK_RECAP = {
  id: 'recap-1',
  date: '2026-05-25',
  content: '**Yesterday:** Completed onboarding.\n**Today:** Work on features.\n**Blockers:** None',
  tasks_completed: 3,
};

const MOCK_HISTORY = [
  { id: 'h-1', date: '2026-05-24', content: '**Yesterday:** Fixed bugs.', tasks_completed: 2 },
  { id: 'h-2', date: '2026-05-23', content: '**Yesterday:** Reviewed PRs.', tasks_completed: 1 },
];

function renderRecap() {
  return render(<MemoryRouter><Recap /></MemoryRouter>);
}

describe('Recap page — initial load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getStandupHistory.mockResolvedValue(MOCK_HISTORY);
    api.generateStandup.mockResolvedValue(MOCK_RECAP);
  });

  it('renders the Daily Recap heading', async () => {
    renderRecap();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Daily Recap/i })).toBeInTheDocument()
    );
  });

  it('loads history on mount', async () => {
    renderRecap();
    await waitFor(() => expect(api.getStandupHistory).toHaveBeenCalledOnce());
  });

  it('displays history items after loading', async () => {
    renderRecap();
    await waitFor(() =>
      expect(screen.getByText('2026-05-24')).toBeInTheDocument()
    );
  });

  it('shows "Generate Recap" button', async () => {
    renderRecap();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Generate Recap/i })).toBeInTheDocument()
    );
  });

  it('shows "No recaps yet" when history is empty', async () => {
    api.getStandupHistory.mockResolvedValue([]);
    renderRecap();
    await waitFor(() =>
      expect(screen.getByText(/No recaps yet/i)).toBeInTheDocument()
    );
  });
});

describe('Recap page — generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getStandupHistory.mockResolvedValue(MOCK_HISTORY);
    api.generateStandup.mockResolvedValue(MOCK_RECAP);
  });

  it('calls generateStandup when button is clicked', async () => {
    const user = userEvent.setup();
    renderRecap();
    await waitFor(() => screen.getByRole('button', { name: /Generate Recap/i }));

    await user.click(screen.getByRole('button', { name: /Generate Recap/i }));

    await waitFor(() => expect(api.generateStandup).toHaveBeenCalledOnce());
  });

  it('displays the recap content after generation', async () => {
    const user = userEvent.setup();
    renderRecap();
    await waitFor(() => screen.getByRole('button', { name: /Generate Recap/i }));

    await user.click(screen.getByRole('button', { name: /Generate Recap/i }));

    // Content appears in both the recap card and the history snippet
    await waitFor(() => {
      const matches = screen.getAllByText(/Completed onboarding/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('shows the tasks_completed count', async () => {
    const user = userEvent.setup();
    renderRecap();
    await waitFor(() => screen.getByRole('button', { name: /Generate Recap/i }));

    await user.click(screen.getByRole('button', { name: /Generate Recap/i }));

    await waitFor(() =>
      expect(screen.getByText(/3 tasks? completed/i)).toBeInTheDocument()
    );
  });

  it('shows a Copy button after generation', async () => {
    const user = userEvent.setup();
    renderRecap();
    await waitFor(() => screen.getByRole('button', { name: /Generate Recap/i }));

    await user.click(screen.getByRole('button', { name: /Generate Recap/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument()
    );
  });

  it('shows error banner on API failure', async () => {
    const user = userEvent.setup();
    api.generateStandup.mockRejectedValue(new Error('AI quota exceeded'));
    renderRecap();
    await waitFor(() => screen.getByRole('button', { name: /Generate Recap/i }));

    await user.click(screen.getByRole('button', { name: /Generate Recap/i }));

    await waitFor(() =>
      expect(screen.getByText('AI quota exceeded')).toBeInTheDocument()
    );
  });
});
