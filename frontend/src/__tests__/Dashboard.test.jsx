/**
 * Tests for src/pages/Dashboard.jsx
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

vi.mock('../api', () => ({
  api: {
    getTodayBriefing:  vi.fn(),
    regenerateBriefing: vi.fn(),
    listTasks:         vi.fn(),
    getDailyInsights:  vi.fn(),
  },
}));

import { api } from '../api';

const MOCK_BRIEFING = {
  date: '2026-05-25',
  content: 'Good morning! Today is a great day to be productive.',
};

const MOCK_TASKS = [
  { id: 't1', title: 'Task A', status: 'pending',    priority: 'high',   subtasks: [] },
  { id: 't2', title: 'Task B', status: 'completed',  priority: 'medium', subtasks: [] },
  { id: 't3', title: 'Task C', status: 'in_progress',priority: 'low',    subtasks: [] },
];

const MOCK_INSIGHTS = { date: '2026-05-25', summary: 'Solid day.', insights: [], score: 72 };

function renderDashboard() {
  return render(<MemoryRouter><Dashboard /></MemoryRouter>);
}

describe('Dashboard — initial load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTodayBriefing.mockResolvedValue(MOCK_BRIEFING);
    api.listTasks.mockResolvedValue(MOCK_TASKS);
    api.getDailyInsights.mockResolvedValue(MOCK_INSIGHTS);
    api.regenerateBriefing.mockResolvedValue({ ...MOCK_BRIEFING, content: 'Refreshed briefing.' });
  });

  it('shows loading spinner while data loads', () => {
    api.getTodayBriefing.mockReturnValue(new Promise(() => {}));
    api.listTasks.mockReturnValue(new Promise(() => {}));
    api.getDailyInsights.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText(/Loading your dashboard/i)).toBeInTheDocument();
  });

  it('renders the Dashboard heading', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument()
    );
  });

  it('calls all three APIs on mount', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(api.getTodayBriefing).toHaveBeenCalledOnce();
      expect(api.listTasks).toHaveBeenCalledOnce();
      expect(api.getDailyInsights).toHaveBeenCalledOnce();
    });
  });

  it('displays briefing content', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(MOCK_BRIEFING.content)).toBeInTheDocument()
    );
  });

  it('shows total task count', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
  });

  it('shows all stat card counts', async () => {
    renderDashboard();
    // MOCK_TASKS: 3 total, 1 pending, 1 in_progress, 1 completed — all show as "1" except total "3"
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();          // total
      expect(screen.getAllByText('1')).toHaveLength(3);            // pending + in_progress + completed
    });
  });

  it('shows the insights score', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('72')).toBeInTheDocument());
  });

  it('shows the score label for score >= 70', async () => {
    renderDashboard();
    // Function matcher handles emoji prefix ("🚀 Great day!") reliably across environments
    await waitFor(() =>
      expect(
        screen.getByText((content) => content.includes('Great day'))
      ).toBeInTheDocument()
    );
  });

  it('renders the Refresh Briefing button', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Refresh Briefing/i })).toBeInTheDocument()
    );
  });
});

describe('Dashboard — refresh briefing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTodayBriefing.mockResolvedValue(MOCK_BRIEFING);
    api.listTasks.mockResolvedValue(MOCK_TASKS);
    api.getDailyInsights.mockResolvedValue(MOCK_INSIGHTS);
    api.regenerateBriefing.mockResolvedValue({ ...MOCK_BRIEFING, content: 'Refreshed briefing.' });
  });

  it('calls regenerateBriefing when Refresh Briefing is clicked', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitFor(() => screen.getByRole('button', { name: /Refresh Briefing/i }));

    await user.click(screen.getByRole('button', { name: /Refresh Briefing/i }));

    await waitFor(() => expect(api.regenerateBriefing).toHaveBeenCalledOnce());
  });

  it('displays updated briefing content after refresh', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitFor(() => screen.getByRole('button', { name: /Refresh Briefing/i }));

    await user.click(screen.getByRole('button', { name: /Refresh Briefing/i }));

    await waitFor(() =>
      expect(screen.getByText('Refreshed briefing.')).toBeInTheDocument()
    );
  });

  it('shows error when regenerateBriefing fails', async () => {
    api.regenerateBriefing.mockRejectedValue(new Error('AI unavailable'));
    const user = userEvent.setup();
    renderDashboard();
    await waitFor(() => screen.getByRole('button', { name: /Refresh Briefing/i }));

    await user.click(screen.getByRole('button', { name: /Refresh Briefing/i }));

    await waitFor(() =>
      expect(screen.getByText('AI unavailable')).toBeInTheDocument()
    );
  });
});

describe('Dashboard — empty / error states', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows empty briefing state when briefing is null', async () => {
    api.getTodayBriefing.mockResolvedValue(null);
    api.listTasks.mockResolvedValue([]);
    api.getDailyInsights.mockResolvedValue(null);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/No briefing available/i)).toBeInTheDocument()
    );
  });

  it('shows score placeholder when insights are unavailable', async () => {
    api.getTodayBriefing.mockResolvedValue(MOCK_BRIEFING);
    api.listTasks.mockResolvedValue([]);
    api.getDailyInsights.mockResolvedValue(null);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText('—')).toBeInTheDocument()
    );
  });
});
