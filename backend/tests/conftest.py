"""
Shared pytest fixtures for DailyPulse backend tests.

Tests run against the live uvicorn server on localhost:8000.
Start it first with: uvicorn main:app --reload

Cleanup: any task titled '[TEST]*' is deleted from Supabase after each test.
"""
import sys
import os
import pytest
import requests

# Make sure the backend root is on the path so Supabase import works
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import get_supabase

BASE_URL = "http://localhost:8000"


# ── Session-scoped HTTP client ───────────────────────────────────────────────

class LiveClient:
    """Thin wrapper around requests.Session that mimics TestClient's interface."""
    def __init__(self, base_url: str):
        self._base = base_url
        self._s = requests.Session()
        self._s.headers["Content-Type"] = "application/json"

    def get(self, path, **kw):
        return self._s.get(f"{self._base}{path}", **kw)

    def post(self, path, **kw):
        return self._s.post(f"{self._base}{path}", **kw)

    def put(self, path, **kw):
        return self._s.put(f"{self._base}{path}", **kw)

    def patch(self, path, **kw):
        return self._s.patch(f"{self._base}{path}", **kw)

    def delete(self, path, **kw):
        return self._s.delete(f"{self._base}{path}", **kw)


@pytest.fixture(scope="session")
def client():
    """Live HTTP client pointing at localhost:8000."""
    c = LiveClient(BASE_URL)
    # Fail fast if the server isn't running
    try:
        r = c.get("/health")
        assert r.status_code == 200, "Server health check failed"
    except requests.ConnectionError:
        pytest.skip("Backend server not running on localhost:8000 — start it with: uvicorn main:app --reload")
    return c


# ── Supabase cleanup ─────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def cleanup_test_tasks():
    """Delete [TEST]* tasks from Supabase after every test."""
    yield
    db = get_supabase()
    db.table("tasks").delete().like("title", "[TEST]%").execute()


# ── Reusable task fixture ────────────────────────────────────────────────────

@pytest.fixture()
def sample_task(client):
    """Create a single '[TEST] Sample task' and return its data dict."""
    resp = client.post("/tasks/", json={
        "title": "[TEST] Sample task",
        "description": "Created by pytest",
        "priority": "medium",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]
