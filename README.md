# 🌊 DailyFlow

> Your personal AI productivity hub — morning briefings, smart tasks, daily recaps, and productivity insights, all powered by Google Gemini.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white&style=flat-square)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash_Lite-4285F4?logo=google&logoColor=white&style=flat-square)

---

## ✨ Features

| Page | What it does |
|------|-------------|
| 🏠 **Dashboard** | AI-generated morning briefing from your pending tasks, plus a live stat grid (total, pending, in-progress, completed, score) |
| ✅ **Smart Tasks** | Full task CRUD with priority levels; one click lets Gemini break any task into 3–5 actionable subtasks |
| 📋 **Daily Recap** | Generates a standup-style report from tasks you completed today; copy to clipboard in one click |
| 📊 **Daily Insights** | Animated productivity score ring (0–100) with an AI summary and three personalised insight cards |

---

## 🛠 Tech Stack

**Frontend**
- [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) — pastel glassmorphism design
- [React Router v7](https://reactrouter.com/)
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) — 109 tests

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- [Supabase](https://supabase.com/) — PostgreSQL database
- [Google Gemini 2.5 Flash Lite](https://ai.google.dev/) via `google-genai` SDK
- [pytest](https://pytest.org/) — live-server integration tests

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- A [Supabase](https://supabase.com/) project
- A [Google AI Studio](https://aistudio.google.com/) API key

### 1 — Database setup

Run the following SQL in your Supabase SQL Editor (in order):

<details>
<summary>Click to expand SQL</summary>

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

create table subtasks (
  id           uuid primary key default uuid_generate_v4(),
  task_id      uuid not null references tasks(id) on delete cascade,
  title        text not null,
  completed    boolean not null default false,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

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

</details>

### 2 — Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SUPABASE_ID=your_project_id
SUPABASE_API_KEY=your_service_role_key   # use the service-role key, not the anon key
SUPABASE_PASS=your_db_password
GEMINI_API_KEY=your_gemini_api_key
```

```bash
uvicorn main:app --reload
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

---

## 📁 Project Structure

```
dailyflow/
├── backend/
│   ├── main.py            # FastAPI app, CORS, router registration
│   ├── database.py        # Supabase singleton
│   ├── ai.py              # Gemini client + retry logic
│   ├── requirements.txt
│   └── routers/
│       ├── tasks.py       # Task CRUD + AI subtask generation
│       ├── briefing.py    # Morning briefing (cached per day)
│       ├── standup.py     # Daily recap generation
│       └── insights.py    # Productivity score + insights
│
└── frontend/
    └── src/
        ├── api.js          # All fetch() calls — single source of truth
        ├── App.jsx         # Routes
        ├── components/     # Button, GlassCard, TaskCard, StatCard, …
        └── pages/          # Dashboard, Tasks, Recap, Insights
```

---

## 🧪 Testing

```bash
# Frontend (Vitest — no server needed)
cd frontend
npm test

# Backend (pytest — requires uvicorn running on port 8000)
cd backend
uvicorn main:app &
pytest
pytest -m "not ai"   # skip Gemini API calls when quota is low
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/tasks/` | Create a task |
| `GET` | `/tasks/` | List tasks (optional `?status=`) |
| `PATCH` | `/tasks/{id}/complete` | Mark task complete |
| `DELETE` | `/tasks/{id}` | Delete a task |
| `POST` | `/tasks/{id}/generate-subtasks` | AI: break task into subtasks |
| `PATCH` | `/tasks/subtasks/{id}/complete` | Mark subtask complete |
| `GET` | `/briefing/today` | Get today's briefing (cached or generate) |
| `POST` | `/briefing/generate` | Force-regenerate briefing |
| `POST` | `/standup/generate` | Generate recap from completed tasks |
| `GET` | `/standup/history` | Last 10 recaps |
| `GET` | `/insights/daily` | Get today's insights (cached or generate) |
| `POST` | `/insights/generate` | Force-regenerate insights |

---

## 📝 Notes

- **Single-user** — no authentication; all data is stored under `user_id = "default_user"`
- **AI quota** — Gemini free tier allows ~20 requests/day; the backend retries on 429s with exponential backoff
- **Caching** — briefings and insights are cached per day in the DB; recap generates a new entry each time
