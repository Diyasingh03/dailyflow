# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**DailyPulse** — a personal AI productivity web app with four features:

| Feature | Route | What it does |
|---------|-------|-------------|
| Morning Briefing | `/` | AI-generated daily briefing from pending tasks |
| Smart Tasks | `/tasks` | Task CRUD; AI breaks any task into 3–5 subtasks |
| Standup Generator | `/standup` | AI standup report from today's completed tasks |
| Daily Insights | `/insights` | Productivity score (0–100) + 3 AI insight cards |

## Starting the App

Two servers must run simultaneously:

```bash
# Terminal 1 — backend (from dailyflow/backend/)
uvicorn main:app --reload        # → http://localhost:8000
                                 # Swagger UI: http://localhost:8000/docs

# Terminal 2 — frontend (from dailyflow/frontend/)
npm run dev                      # → http://localhost:5173
```

## Environment Setup

Create `backend/.env` (never commit this):

```
SUPABASE_ID=<your-project-id>
SUPABASE_API_KEY=<service-role key — not the anon key>
SUPABASE_PASS=<db password>
GEMINI_API_KEY=<google ai studio key>
```

The Supabase URL is constructed as `https://{SUPABASE_ID}.supabase.co`. Use the **service-role key** (bypasses RLS), not the anon key.

## Supabase Tables

Run these in Supabase → SQL Editor **in order** (subtasks has a FK to tasks):

```sql
create table tasks (
  id           uuid primary key default uuid_generate_v4(),
  user_id      text not null default 'default_user',
  title        text not null,
  description  text default '',
  priority     text not null default 'medium' check (priority in ('low','medium','high')),
  status       text not null default 'pending' check (status in ('pending','in_progress','completed')),
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  due_date     date
);
create index tasks_user_id_idx on tasks(user_id);
create index tasks_status_idx  on tasks(status);

create table subtasks (
  id           uuid primary key default uuid_generate_v4(),
  task_id      uuid not null references tasks(id) on delete cascade,
  title        text not null,
  completed    boolean not null default false,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index subtasks_task_id_idx on subtasks(task_id);

create table briefings (
  id         uuid primary key default uuid_generate_v4(),
  user_id    text not null default 'default_user',
  date       date not null,
  content    text not null,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create table standups (
  id              uuid primary key default uuid_generate_v4(),
  user_id         text not null default 'default_user',
  date            date not null,
  content         text not null,
  tasks_completed int not null default 0,
  created_at      timestamptz not null default now()
);
create index standups_user_date_idx on standups(user_id, date desc);

create table insights (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null default 'default_user',
  date        date not null,
  summary     text not null,
  insights    jsonb not null default '[]',
  score       int not null default 0,
  raw_content text not null default '',
  created_at  timestamptz not null default now(),
  unique(user_id, date)
);
```

## Architecture

```
dailyflow/
├── backend/          # Python 3.11+ · FastAPI · port 8000
│   ├── .env          # secrets — never commit
│   ├── main.py       # app factory, CORS, router registration
│   ├── database.py   # get_supabase() singleton
│   ├── ai.py         # get_ai_client(), generate_text(), parse_json_response()
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── routers/      # one file per feature domain
│   └── tests/        # live-server integration tests (pytest + requests)
│
└── frontend/         # React 19 · Vite 8 · Tailwind CSS v4 · port 5173
    ├── src/
    │   ├── api.js        # all fetch() calls — only file that talks to the backend
    │   ├── App.jsx       # BrowserRouter + route definitions
    │   ├── components/   # Layout (sidebar), LoadingSpinner
    │   └── pages/        # Briefing, Tasks, Standup, Insights
    └── src/__tests__/    # Vitest + React Testing Library (106 tests)
```

## Frontend ↔ Backend Contract

All backend responses use `{"data": <payload>, "error": null}`. The frontend `apiFetch()` unwraps `.data` automatically, or re-throws on non-2xx.

Key non-obvious endpoint: subtask completion is `PATCH /tasks/subtasks/{id}/complete` — it lives in `routers/tasks.py` under the `/tasks` prefix, not a separate `/subtasks` router.

## AI Model

**`gemini-2.5-flash-lite`** via `google-genai` v2 SDK (set in `backend/ai.py` as `MODEL`). Free tier is ~20 requests/day — rate-limit retries with exponential backoff are built into `generate_text()`. To change the model, update only the `MODEL` constant in `ai.py`.

## Detailed Guidance

- Backend patterns, testing, and dependency notes → `backend/CLAUDE.md`
- Frontend patterns, testing, and platform quirks → `frontend/CLAUDE.md`
