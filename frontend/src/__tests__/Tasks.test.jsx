/**
 * Tests for src/pages/Tasks.jsx and the TaskCard sub-component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Tasks from '../pages/Tasks';

// ── Mock api ──────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  api: {
    listTasks: vi.fn(),
    createTask: vi.fn(),
    completeTask: vi.fn(),
    deleteTask: vi.fn(),
    generateSubtasks: vi.fn(),
    completeSubtask: vi.fn(),
  },
}));

import { api } from '../api';

// ── Test data ─────────────────────────────────────────────────────────────────

const PENDING_TASK = {
  id: 'task-1',
  title: 'Write report',
  description: 'Q1 summary',
  priority: 'high',
  status: 'pending',
  subtasks: [],
  created_at: '2026-05-25T00:00:00Z',
  completed_at: null,
};

const COMPLETED_TASK = {
  id: 'task-2',
  title: 'Read docs',
  description: '',
  priority: 'low',
  status: 'completed',
  subtasks: [],
  created_at: '2026-05-24T00:00:00Z',
  completed_at: '2026-05-24T12:00:00Z',
};

const TASK_WITH_SUBTASKS = {
  ...PENDING_TASK,
  id: 'task-3',
  title: 'Ship feature',
  subtasks: [
    { id: 'sub-1', title: 'Write tests', completed: false },
    { id: 'sub-2', title: 'Code review', completed: true },
  ],
};

function renderTasks() {
  return render(
    <MemoryRouter>
      <Tasks />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Tasks page — initial render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listTasks.mockResolvedValue([PENDING_TASK, COMPLETED_TASK]);
  });

  it('shows a loading spinner while tasks are loading', () => {
    api.listTasks.mockReturnValue(new Promise(() => {}));
    renderTasks();
    expect(screen.getByText(/Loading tasks/i)).toBeInTheDocument();
  });

  it('renders the Smart Tasks heading', async () => {
    renderTasks();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Smart Tasks/i })).toBeInTheDocument()
    );
  });

  it('calls listTasks on mount', async () => {
    renderTasks();
    await waitFor(() => expect(api.listTasks).toHaveBeenCalledOnce());
  });

  it('displays task titles after loading', async () => {
    renderTasks();
    await waitFor(() => {
      expect(screen.getByText('Write report')).toBeInTheDocument();
      expect(screen.getByText('Read docs')).toBeInTheDocument();
    });
  });

  it('displays task description', async () => {
    renderTasks();
    await waitFor(() =>
      expect(screen.getByText('Q1 summary')).toBeInTheDocument()
    );
  });

  it('shows priority badge for each task', async () => {
    renderTasks();
    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no tasks', async () => {
    api.listTasks.mockResolvedValue([]);
    renderTasks();
    await waitFor(() =>
      expect(screen.getByText(/No tasks here yet/i)).toBeInTheDocument()
    );
  });

  it('shows error when listTasks fails', async () => {
    api.listTasks.mockRejectedValue(new Error('Failed to load'));
    renderTasks();
    await waitFor(() =>
      expect(screen.getByText('Failed to load')).toBeInTheDocument()
    );
  });
});

describe('Tasks page — tab filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listTasks.mockResolvedValue([PENDING_TASK, COMPLETED_TASK]);
  });

  it('renders all four status tabs', async () => {
    renderTasks();
    await waitFor(() => screen.getByText(/^all/i));
    expect(screen.getByText(/^all/i)).toBeInTheDocument();
    expect(screen.getByText(/^pending/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/^completed/i)).toBeInTheDocument();
  });

  it('shows task counts in tabs', async () => {
    renderTasks();
    await waitFor(() => screen.getByText('Write report'));
    // "all" tab should show (2)
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
  });

  it('filters to show only pending tasks on pending tab', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByText('Write report'));

    await user.click(screen.getByText(/^pending/i));

    expect(screen.getByText('Write report')).toBeInTheDocument();
    expect(screen.queryByText('Read docs')).not.toBeInTheDocument();
  });

  it('filters to show only completed tasks on completed tab', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByText('Read docs'));

    await user.click(screen.getByText(/^completed/i));

    expect(screen.getByText('Read docs')).toBeInTheDocument();
    expect(screen.queryByText('Write report')).not.toBeInTheDocument();
  });
});

describe('Tasks page — add task form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listTasks.mockResolvedValue([]);
    api.createTask.mockResolvedValue({
      id: 'new-task',
      title: 'New task',
      description: '',
      priority: 'medium',
      status: 'pending',
      subtasks: [],
    });
  });

  it('renders the task title input', async () => {
    renderTasks();
    await waitFor(() => screen.getByPlaceholderText(/Task title/i));
    expect(screen.getByPlaceholderText(/Task title/i)).toBeInTheDocument();
  });

  it('renders the Add Task button', async () => {
    renderTasks();
    await waitFor(() => screen.getByRole('button', { name: /Add Task/i }));
  });

  it('Add Task button is disabled when title is empty', async () => {
    renderTasks();
    await waitFor(() => screen.getByRole('button', { name: /Add Task/i }));
    expect(screen.getByRole('button', { name: /Add Task/i })).toBeDisabled();
  });

  it('enables Add Task button when title is typed', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByPlaceholderText(/Task title/i));

    await user.type(screen.getByPlaceholderText(/Task title/i), 'New task');

    expect(screen.getByRole('button', { name: /Add Task/i })).not.toBeDisabled();
  });

  it('calls createTask with correct data on form submit', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByPlaceholderText(/Task title/i));

    await user.type(screen.getByPlaceholderText(/Task title/i), 'New task');
    await user.type(screen.getByPlaceholderText(/Description/i), 'Some desc');
    await user.click(screen.getByRole('button', { name: /Add Task/i }));

    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith({
        title: 'New task',
        description: 'Some desc',
        priority: 'medium',
      })
    );
  });

  it('adds the new task to the list after creation', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByPlaceholderText(/Task title/i));

    await user.type(screen.getByPlaceholderText(/Task title/i), 'New task');
    await user.click(screen.getByRole('button', { name: /Add Task/i }));

    await waitFor(() =>
      expect(screen.getByText('New task')).toBeInTheDocument()
    );
  });

  it('clears the form after successful submission', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByPlaceholderText(/Task title/i));

    await user.type(screen.getByPlaceholderText(/Task title/i), 'New task');
    await user.click(screen.getByRole('button', { name: /Add Task/i }));

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Task title/i)).toHaveValue('')
    );
  });
});

describe('Tasks page — task actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listTasks.mockResolvedValue([PENDING_TASK, COMPLETED_TASK]);
    api.completeTask.mockResolvedValue({ ...PENDING_TASK, status: 'completed', completed_at: '2026-05-25T10:00:00Z' });
    api.deleteTask.mockResolvedValue({ deleted: true, id: PENDING_TASK.id });
  });

  it('shows complete (✓) button for pending tasks', async () => {
    renderTasks();
    await waitFor(() => screen.getByText('Write report'));
    // Each pending task card should have a ✓ button
    const completeButtons = screen.getAllByTitle('Mark complete');
    expect(completeButtons.length).toBeGreaterThan(0);
  });

  it('does NOT show complete button for completed tasks', async () => {
    renderTasks();
    await waitFor(() => screen.getByText('Read docs'));
    // Completed tasks don't get a ✓ button
    const completeButtons = screen.queryAllByTitle('Mark complete');
    // Only pending task has it
    expect(completeButtons).toHaveLength(1);
  });

  it('calls completeTask when ✓ button is clicked', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByTitle('Mark complete'));

    await user.click(screen.getByTitle('Mark complete'));

    await waitFor(() =>
      expect(api.completeTask).toHaveBeenCalledWith(PENDING_TASK.id)
    );
  });

  it('calls deleteTask when ✕ button is clicked', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByText('Write report'));

    // Click first delete button
    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => expect(api.deleteTask).toHaveBeenCalled());
  });

  it('removes the task from the list after deletion', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByText('Write report'));

    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() =>
      expect(screen.queryByText('Write report')).not.toBeInTheDocument()
    );
  });
});

describe('Tasks page — subtasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listTasks.mockResolvedValue([TASK_WITH_SUBTASKS]);
    api.generateSubtasks.mockResolvedValue([
      { id: 'new-sub-1', title: 'Generated subtask', completed: false },
    ]);
    api.completeSubtask.mockResolvedValue({ id: 'sub-1', completed: true, completed_at: '2026-05-25T10:00:00Z' });
  });

  it('displays existing subtask titles', async () => {
    renderTasks();
    await waitFor(() => {
      expect(screen.getByText('Write tests')).toBeInTheDocument();
      expect(screen.getByText('Code review')).toBeInTheDocument();
    });
  });

  it('shows completed subtasks with line-through style', async () => {
    renderTasks();
    await waitFor(() => screen.getByText('Code review'));
    const completedSubtask = screen.getByText('Code review');
    expect(completedSubtask.className).toContain('line-through');
  });

  it('shows Generate subtasks button on pending tasks', async () => {
    renderTasks();
    await waitFor(() =>
      expect(screen.getByText(/Regenerate subtasks/i)).toBeInTheDocument()
    );
  });

  it('calls generateSubtasks when button is clicked', async () => {
    const user = userEvent.setup();
    api.listTasks.mockResolvedValue([{ ...PENDING_TASK, id: 'task-fresh' }]);

    renderTasks();
    await waitFor(() => screen.getByText(/Generate subtasks/i));

    await user.click(screen.getByText(/Generate subtasks/i));

    await waitFor(() =>
      expect(api.generateSubtasks).toHaveBeenCalledWith('task-fresh')
    );
  });

  it('renders subtask checkboxes', async () => {
    renderTasks();
    await waitFor(() => screen.getByText('Write tests'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('completed subtask checkbox is checked', async () => {
    renderTasks();
    await waitFor(() => screen.getByText('Code review'));

    const checkboxes = screen.getAllByRole('checkbox');
    const checkedBox = checkboxes.find((cb) => cb.checked);
    expect(checkedBox).toBeDefined();
  });

  it('calls completeSubtask when uncompleted checkbox is clicked', async () => {
    const user = userEvent.setup();
    renderTasks();
    await waitFor(() => screen.getByText('Write tests'));

    const checkboxes = screen.getAllByRole('checkbox');
    const unchecked = checkboxes.find((cb) => !cb.checked);
    await user.click(unchecked);

    await waitFor(() =>
      expect(api.completeSubtask).toHaveBeenCalledWith('sub-1')
    );
  });
});

describe('TaskCard — display logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('strikes through title of completed task', async () => {
    api.listTasks.mockResolvedValue([COMPLETED_TASK]);
    renderTasks();
    await waitFor(() => screen.getByText('Read docs'));
    expect(screen.getByText('Read docs').className).toContain('line-through');
  });

  it('shows "✓ done" badge for completed tasks', async () => {
    api.listTasks.mockResolvedValue([COMPLETED_TASK]);
    renderTasks();
    await waitFor(() =>
      expect(screen.getByText(/✓ done/i)).toBeInTheDocument()
    );
  });

  it('shows "in progress" badge for in_progress tasks', async () => {
    const inProgress = { ...PENDING_TASK, status: 'in_progress' };
    api.listTasks.mockResolvedValue([inProgress]);
    renderTasks();
    await waitFor(() =>
      expect(screen.getByText('in progress')).toBeInTheDocument()
    );
  });

  it('does NOT show Generate subtasks on completed tasks', async () => {
    api.listTasks.mockResolvedValue([COMPLETED_TASK]);
    renderTasks();
    await waitFor(() => screen.getByText('Read docs'));
    expect(screen.queryByText(/Generate subtasks/i)).not.toBeInTheDocument();
  });
});
