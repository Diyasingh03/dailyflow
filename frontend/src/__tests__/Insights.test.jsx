/**
 * Tests for src/pages/Insights.jsx
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Insights from '../pages/Insights';

vi.mock('../api', () => ({
  api: {
    getDailyInsights: vi.fn(),
    regenerateInsights: vi.fn(),
  },
}));

import { api } from '../api';

const MOCK_INSIGHTS = {
  date: '2026-05-25',
  summary: 'Solid productivity day — all high-priority tasks completed.',
  insights: [
    'You completed all high-priority tasks.',
    'Average task completion time improved by 20%.',
    'Consider breaking large tasks into subtasks earlier.',
  ],
  score: 82,
};

const LOW_SCORE_INSIGHTS = { ...MOCK_INSIGHTS, score: 25, summary: 'Tough day.' };
const MID_SCORE_INSIGHTS = { ...MOCK_INSIGHTS, score: 55, summary: 'Decent progress.' };

function renderInsights() {
  return render(<MemoryRouter><Insights /></MemoryRouter>);
}

describe('Insights page — initial render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDailyInsights.mockResolvedValue(MOCK_INSIGHTS);
    api.regenerateInsights.mockResolvedValue({ ...MOCK_INSIGHTS, score: 90 });
  });

  it('shows a loading spinner initially', () => {
    api.getDailyInsights.mockReturnValue(new Promise(() => {}));
    renderInsights();
    expect(screen.getByText(/Analyzing your productivity/i)).toBeInTheDocument();
  });

  it('renders the Daily Insights heading', async () => {
    renderInsights();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Daily Insights/i })).toBeInTheDocument()
    );
  });

  it('calls getDailyInsights on mount', async () => {
    renderInsights();
    await waitFor(() => expect(api.getDailyInsights).toHaveBeenCalledOnce());
  });

  it('displays the productivity score', async () => {
    renderInsights();
    await waitFor(() => expect(screen.getByText('82')).toBeInTheDocument());
  });

  it('displays the summary text', async () => {
    renderInsights();
    await waitFor(() =>
      expect(screen.getByText(MOCK_INSIGHTS.summary)).toBeInTheDocument()
    );
  });

  it('renders all three insight cards', async () => {
    renderInsights();
    await waitFor(() => {
      MOCK_INSIGHTS.insights.forEach((insight) => {
        expect(screen.getByText(insight)).toBeInTheDocument();
      });
    });
  });

  it('shows numbered badges on insight cards (1, 2, 3)', async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('shows the Refresh button', async () => {
    renderInsights();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument()
    );
  });
});

describe('Insights page — score ring labels', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows "Great day!" for score >= 70', async () => {
    api.getDailyInsights.mockResolvedValue(MOCK_INSIGHTS); // score 82
    renderInsights();
    await waitFor(() =>
      expect(screen.getByText(/Great day/i)).toBeInTheDocument()
    );
  });

  it('shows "Keep going!" for score >= 40 and < 70', async () => {
    api.getDailyInsights.mockResolvedValue(MID_SCORE_INSIGHTS); // score 55
    renderInsights();
    await waitFor(() =>
      expect(screen.getByText(/Keep going/i)).toBeInTheDocument()
    );
  });

  it('shows "Room to grow" for score < 40', async () => {
    api.getDailyInsights.mockResolvedValue(LOW_SCORE_INSIGHTS); // score 25
    renderInsights();
    await waitFor(() =>
      expect(screen.getByText(/Room to grow/i)).toBeInTheDocument()
    );
  });
});

describe('Insights page — refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDailyInsights.mockResolvedValue(MOCK_INSIGHTS);
    api.regenerateInsights.mockResolvedValue({ ...MOCK_INSIGHTS, score: 95, summary: 'Outstanding!' });
  });

  it('calls regenerateInsights when Refresh is clicked', async () => {
    const user = userEvent.setup();
    renderInsights();
    await waitFor(() => screen.getByRole('button', { name: /Refresh/i }));

    await user.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => expect(api.regenerateInsights).toHaveBeenCalledOnce());
  });

  it('updates the display with new score after refresh', async () => {
    const user = userEvent.setup();
    renderInsights();
    await waitFor(() => screen.getByRole('button', { name: /Refresh/i }));

    await user.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => expect(screen.getByText('95')).toBeInTheDocument());
  });

  it('updates the summary after refresh', async () => {
    const user = userEvent.setup();
    renderInsights();
    await waitFor(() => screen.getByRole('button', { name: /Refresh/i }));

    await user.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => expect(screen.getByText('Outstanding!')).toBeInTheDocument());
  });

  it('shows error on refresh failure', async () => {
    const user = userEvent.setup();
    api.regenerateInsights.mockRejectedValue(new Error('Quota exceeded'));
    renderInsights();
    await waitFor(() => screen.getByRole('button', { name: /Refresh/i }));

    await user.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() =>
      expect(screen.getByText('Quota exceeded')).toBeInTheDocument()
    );
  });

  it('Refresh button is disabled while loading', () => {
    api.getDailyInsights.mockReturnValue(new Promise(() => {}));
    renderInsights();
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeDisabled();
  });
});

describe('Insights page — empty/null state', () => {
  it('shows empty state when insights is null', async () => {
    api.getDailyInsights.mockResolvedValue(null);
    renderInsights();
    await waitFor(() =>
      expect(screen.getByText(/Click Refresh to generate/i)).toBeInTheDocument()
    );
  });

  it('handles empty insights array gracefully', async () => {
    api.getDailyInsights.mockResolvedValue({ ...MOCK_INSIGHTS, insights: [] });
    renderInsights();
    await waitFor(() =>
      expect(screen.getByText(/No insights available yet/i)).toBeInTheDocument()
    );
  });
});
