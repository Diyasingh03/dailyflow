# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run from backend/
uvicorn main:app --reload        # Start dev server → http://localhost:8000
                                 # Swagger UI at http://localhost:8000/docs

# Tests require the live server running first
pytest                           # Run all tests
pytest tests/test_tasks.py       # Run a single test file
pytest -k "test_create"          # Run tests matching a keyword
pytest -m "not ai"               # Skip Gemini API calls (use when quota exhausted)
pytest tests/test_tasks.py::TestCreateTask::test_create_task_minimal  # Single test
```

## Architecture

**Request flow:** `main.py` → router (in `routers/`) → `database.py` (Supabase) + `ai.py` (Gemini)

| File | Role |
|------|------|
| `main.py` | FastAPI app, CORS, router registration |
| `database.py` | Lazy singleton `get_supabase()` → Supabase client |
| `ai.py` | Lazy singleton `get_ai_client()`, `generate_text()`, `parse_json_response()` |
| `routers/tasks.py` | Task CRUD + subtask endpoints (all under `/tasks` prefix) |
| `routers/briefing.py` | `/briefing/today` (cache or generate) + `/briefing/generate` |
| `routers/standup.py` | `/standup/generate` + `/standup/history` |
| `routers/insights.py` | `/insights/daily` (cache or generate) + `/insights/generate` |

## Key Patterns

**Response envelope** — every endpoint returns this shape:
```python
return {"data": <result>, "error": None}   # success
# FastAPI HTTPException used for errors (detail= maps to error message on client)
```

**Cache-then-generate** — `briefings` and `insights` tables have a `unique(user_id, date)` constraint. `GET /today` and `GET /daily` return the cached DB row if it exists; `POST /generate` always re-calls AI and upserts:
```python
db.table("briefings").upsert(row, on_conflict="user_id,date").execute()
```
`standups` has no uniqueness constraint — every `POST /generate` inserts a new row.

**`USER_ID = "default_user"`** — hardcoded constant declared at the top of every router file. Always filter by it: `.eq("user_id", USER_ID)`.

**Subtask route collision** — `PATCH /subtasks/{id}/complete` is defined in `tasks.py` (at the `/tasks` router). Its full URL is therefore `/tasks/subtasks/{subtask_id}/complete`. This is intentional — it keeps all task-related logic in one file. The frontend `api.js` calls `/tasks/subtasks/{id}/complete`.

## AI Layer (`ai.py`)

**Always use `parse_json_response()`** before `json.loads()` on any Gemini output that should be JSON. Gemini sometimes wraps responses in ` ```json ``` ` fences.

**Rate limits** — the free tier allows ~20 requests/day for `gemini-2.5-flash-lite`. `generate_text()` retries on 429 with exponential backoff (15s → 30s → 60s, 3 attempts). When the daily quota is exhausted, tests marked `@pytest.mark.ai` should be skipped with `-m "not ai"`.

**Changing the model** — update `MODEL = "..."` in `ai.py`. Use `client.models.list()` to enumerate available models for the configured API key.

## Testing

Tests hit the **live uvicorn server** — `TestClient` is not used due to a version conflict between `starlette==0.27` (pinned by `fastapi==0.104.1`) and `httpx>=0.28`.

**Cleanup** — prefix all test task titles with `[TEST]`. The `autouse` fixture in `conftest.py` deletes all `[TEST]*` tasks from Supabase after every test.

**AI tests use module-scoped fixtures** to make one AI call per test module (not one per test case), staying within the daily quota:
```python
@pytest.fixture(scope="module")
def task_with_subtasks(client):
    # Creates task + generates subtasks ONCE for the whole module
    ...
```

## Dependency Notes

Versions in `requirements.txt` are pinned for compatibility:
- `supabase==2.30.0` — minimum version that supports `httpx>=0.28`; earlier versions required `httpx<0.28` which conflicts with `google-genai`
- `httpx==0.28.1` — required by both `google-genai` and `supabase==2.30.0`
- `fastapi==0.104.1` + `starlette` — tested working version; upgrading FastAPI may re-enable TestClient use
