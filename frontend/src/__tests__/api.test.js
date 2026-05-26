/**
 * Tests for src/api.js
 *
 * We stub global `fetch` so no real network calls are made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../api';

// ── helpers ──────────────────────────────────────────────────────────────────

function mockFetch(responseBody, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseBody,
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch({ data: null, error: null }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── apiFetch internals ────────────────────────────────────────────────────────

describe('apiFetch (via api.getTodayBriefing)', () => {
  it('calls the correct URL', async () => {
    const fetchMock = mockFetch({ data: { content: 'hi', date: '2026-01-01' } });
    vi.stubGlobal('fetch', fetchMock);

    await api.getTodayBriefing();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/briefing/today');
  });

  it('sends Content-Type: application/json header', async () => {
    const fetchMock = mockFetch({ data: { content: 'hi', date: '2026-01-01' } });
    vi.stubGlobal('fetch', fetchMock);

    await api.getTodayBriefing();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers?.['Content-Type']).toBe('application/json');
  });

  it('returns data field from {data, error} envelope', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: { content: 'Good morning!', date: '2026-01-01' } }));

    const result = await api.getTodayBriefing();

    expect(result).toEqual({ content: 'Good morning!', date: '2026-01-01' });
  });

  it('returns response directly when no data field exists', async () => {
    vi.stubGlobal('fetch', mockFetch({ status: 'ok' }));

    const result = await api.getTodayBriefing();

    expect(result).toEqual({ status: 'ok' });
  });

  it('throws on non-ok response using detail field', async () => {
    vi.stubGlobal('fetch', mockFetch({ detail: 'Not found' }, false, 404));

    await expect(api.getTodayBriefing()).rejects.toThrow('Not found');
  });

  it('throws on non-ok response using error field', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Server error' }, false, 500));

    await expect(api.getTodayBriefing()).rejects.toThrow('Server error');
  });

  it('throws fallback message when no detail/error field', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 500));

    await expect(api.getTodayBriefing()).rejects.toThrow('Request failed');
  });
});

// ── Tasks API ─────────────────────────────────────────────────────────────────

describe('api.listTasks', () => {
  it('calls GET /tasks/ without filter', async () => {
    const fetchMock = mockFetch({ data: [] });
    vi.stubGlobal('fetch', fetchMock);

    await api.listTasks();

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/tasks/');
  });

  it('calls GET /tasks/?status=pending when status is provided', async () => {
    const fetchMock = mockFetch({ data: [] });
    vi.stubGlobal('fetch', fetchMock);

    await api.listTasks('pending');

    expect(fetchMock.mock.calls[0][0]).toContain('?status=pending');
  });
});

describe('api.createTask', () => {
  it('calls POST /tasks/ with JSON body', async () => {
    const fetchMock = mockFetch({ data: { id: '1', title: 'Test', status: 'pending', subtasks: [] } });
    vi.stubGlobal('fetch', fetchMock);

    await api.createTask({ title: 'Test', priority: 'high' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/tasks/');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ title: 'Test', priority: 'high' });
  });
});

describe('api.completeTask', () => {
  it('calls PATCH /tasks/{id}/complete', async () => {
    const fetchMock = mockFetch({ data: { id: 'abc', status: 'completed' } });
    vi.stubGlobal('fetch', fetchMock);

    await api.completeTask('abc');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/tasks/abc/complete');
    expect(options.method).toBe('PATCH');
  });
});

describe('api.deleteTask', () => {
  it('calls DELETE /tasks/{id}', async () => {
    const fetchMock = mockFetch({ data: { deleted: true } });
    vi.stubGlobal('fetch', fetchMock);

    await api.deleteTask('abc');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/tasks/abc');
    expect(options.method).toBe('DELETE');
  });
});

describe('api.generateSubtasks', () => {
  it('calls POST /tasks/{id}/generate-subtasks', async () => {
    const fetchMock = mockFetch({ data: [] });
    vi.stubGlobal('fetch', fetchMock);

    await api.generateSubtasks('task-1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/tasks/task-1/generate-subtasks');
    expect(options.method).toBe('POST');
  });
});

describe('api.completeSubtask', () => {
  it('calls PATCH /tasks/subtasks/{id}/complete', async () => {
    const fetchMock = mockFetch({ data: { completed: true } });
    vi.stubGlobal('fetch', fetchMock);

    await api.completeSubtask('sub-1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/tasks/subtasks/sub-1/complete');
    expect(options.method).toBe('PATCH');
  });
});

// ── Briefing API ──────────────────────────────────────────────────────────────

describe('api.regenerateBriefing', () => {
  it('calls POST /briefing/generate', async () => {
    const fetchMock = mockFetch({ data: { content: 'new', date: '2026-01-01' } });
    vi.stubGlobal('fetch', fetchMock);

    await api.regenerateBriefing();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/briefing/generate');
    expect(options.method).toBe('POST');
  });
});

// ── Standup API ───────────────────────────────────────────────────────────────

describe('api.generateStandup', () => {
  it('calls POST /standup/generate', async () => {
    const fetchMock = mockFetch({ data: { content: '**Yesterday:** done', date: '2026-01-01', tasks_completed: 1 } });
    vi.stubGlobal('fetch', fetchMock);

    await api.generateStandup();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/standup/generate');
    expect(options.method).toBe('POST');
  });
});

describe('api.getStandupHistory', () => {
  it('calls GET /standup/history', async () => {
    const fetchMock = mockFetch({ data: [] });
    vi.stubGlobal('fetch', fetchMock);

    await api.getStandupHistory();

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/standup/history');
  });
});

// ── Insights API ──────────────────────────────────────────────────────────────

describe('api.getDailyInsights', () => {
  it('calls GET /insights/daily', async () => {
    const fetchMock = mockFetch({ data: { summary: 'good', insights: [], score: 80 } });
    vi.stubGlobal('fetch', fetchMock);

    await api.getDailyInsights();

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/insights/daily');
  });
});

describe('api.regenerateInsights', () => {
  it('calls POST /insights/generate', async () => {
    const fetchMock = mockFetch({ data: { summary: 'great', insights: [], score: 90 } });
    vi.stubGlobal('fetch', fetchMock);

    await api.regenerateInsights();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/insights/generate');
    expect(options.method).toBe('POST');
  });
});
