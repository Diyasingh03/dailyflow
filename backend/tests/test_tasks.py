"""
Tests for the /tasks and /subtasks endpoints.

All task titles are prefixed with [TEST] so the conftest cleanup fixture
removes them automatically after each test.
"""
import pytest


# ── CREATE ───────────────────────────────────────────────────────────────────

class TestCreateTask:
    def test_create_task_minimal(self, client):
        """Create a task with only a title."""
        resp = client.post("/tasks/", json={"title": "[TEST] Minimal task"})
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["title"] == "[TEST] Minimal task"
        assert data["status"] == "pending"
        assert data["priority"] == "medium"
        assert data["subtasks"] == []

    def test_create_task_full(self, client):
        """Create a task with all fields."""
        resp = client.post("/tasks/", json={
            "title": "[TEST] Full task",
            "description": "A complete task",
            "priority": "high",
        })
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["description"] == "A complete task"
        assert data["priority"] == "high"

    def test_create_task_missing_title_fails(self, client):
        """A missing title should return 422 Unprocessable Entity."""
        resp = client.post("/tasks/", json={"description": "no title"})
        assert resp.status_code == 422

    def test_create_returns_data_error_shape(self, client):
        """Response envelope must have 'data' and 'error' keys."""
        resp = client.post("/tasks/", json={"title": "[TEST] Envelope check"})
        assert resp.status_code == 201
        body = resp.json()
        assert "data" in body
        assert "error" in body
        assert body["error"] is None


# ── LIST ─────────────────────────────────────────────────────────────────────

class TestListTasks:
    def test_list_returns_array(self, client, sample_task):
        resp = client.get("/tasks/")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert isinstance(data, list)

    def test_list_contains_created_task(self, client, sample_task):
        resp = client.get("/tasks/")
        ids = [t["id"] for t in resp.json()["data"]]
        assert sample_task["id"] in ids

    def test_list_filter_by_status(self, client, sample_task):
        """Filtering by status=pending should include the new task."""
        resp = client.get("/tasks/?status=pending")
        assert resp.status_code == 200
        statuses = {t["status"] for t in resp.json()["data"]}
        assert statuses <= {"pending"}  # only pending tasks

    def test_list_filter_completed_excludes_pending(self, client, sample_task):
        """Filter by completed must not include our pending test task."""
        resp = client.get("/tasks/?status=completed")
        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()["data"]]
        assert sample_task["id"] not in ids

    def test_tasks_include_subtasks_field(self, client, sample_task):
        resp = client.get("/tasks/")
        task = next((t for t in resp.json()["data"] if t["id"] == sample_task["id"]), None)
        assert task is not None
        assert "subtasks" in task


# ── GET SINGLE ───────────────────────────────────────────────────────────────

class TestGetTask:
    def test_get_existing_task(self, client, sample_task):
        resp = client.get(f"/tasks/{sample_task['id']}")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["id"] == sample_task["id"]
        assert data["title"] == sample_task["title"]

    def test_get_nonexistent_task_returns_404(self, client):
        resp = client.get("/tasks/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404


# ── UPDATE ───────────────────────────────────────────────────────────────────

class TestUpdateTask:
    def test_update_title(self, client, sample_task):
        resp = client.put(f"/tasks/{sample_task['id']}", json={"title": "[TEST] Updated title"})
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "[TEST] Updated title"

    def test_update_priority(self, client, sample_task):
        resp = client.put(f"/tasks/{sample_task['id']}", json={"priority": "high"})
        assert resp.status_code == 200
        assert resp.json()["data"]["priority"] == "high"

    def test_update_empty_body_returns_400(self, client, sample_task):
        resp = client.put(f"/tasks/{sample_task['id']}", json={})
        assert resp.status_code == 400


# ── COMPLETE ─────────────────────────────────────────────────────────────────

class TestCompleteTask:
    def test_complete_sets_status(self, client, sample_task):
        resp = client.patch(f"/tasks/{sample_task['id']}/complete")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    def test_complete_nonexistent_returns_404(self, client):
        resp = client.patch("/tasks/00000000-0000-0000-0000-000000000000/complete")
        assert resp.status_code == 404


# ── DELETE ───────────────────────────────────────────────────────────────────

class TestDeleteTask:
    def test_delete_task(self, client):
        # Create a fresh task just for this deletion test
        create = client.post("/tasks/", json={"title": "[TEST] To be deleted"})
        task_id = create.json()["data"]["id"]

        resp = client.delete(f"/tasks/{task_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["deleted"] is True

        # Confirm it's gone
        get = client.get(f"/tasks/{task_id}")
        assert get.status_code == 404


# ── SUBTASKS (AI) ────────────────────────────────────────────────────────────
# Use a module-scoped fixture so we only call the AI ONCE for all subtask tests.

@pytest.fixture(scope="module")
def task_with_subtasks(client):
    """Create a task, generate subtasks once, return both. Module-scoped to avoid rate limits."""
    # Create the task
    create = client.post("/tasks/", json={
        "title": "[TEST] AI subtask module task",
        "description": "Automated test task for subtask generation",
        "priority": "high",
    })
    assert create.status_code == 201, create.text
    task = create.json()["data"]

    # Generate subtasks (one AI call for all tests in this module)
    gen = client.post(f"/tasks/{task['id']}/generate-subtasks")
    assert gen.status_code == 200, f"Subtask generation failed: {gen.text}"
    subtasks = gen.json()["data"]

    yield {"task": task, "subtasks": subtasks}

    # Cleanup — delete the task (cascades to subtasks)
    client.delete(f"/tasks/{task['id']}")


class TestGenerateSubtasks:
    def test_generate_subtasks_returns_list(self, task_with_subtasks):
        """AI subtask generation should return a non-empty list."""
        subtasks = task_with_subtasks["subtasks"]
        assert isinstance(subtasks, list)
        assert len(subtasks) >= 2, "Expected at least 2 subtasks from AI"

    def test_subtasks_have_title_field(self, task_with_subtasks):
        for sub in task_with_subtasks["subtasks"]:
            assert "title" in sub
            assert isinstance(sub["title"], str)
            assert len(sub["title"]) > 0

    def test_subtasks_have_completed_false(self, task_with_subtasks):
        for sub in task_with_subtasks["subtasks"]:
            assert sub["completed"] is False

    def test_generate_subtasks_for_nonexistent_task(self, client):
        resp = client.post("/tasks/00000000-0000-0000-0000-000000000000/generate-subtasks")
        assert resp.status_code == 404

    def test_regenerate_replaces_subtasks(self, client, task_with_subtasks):
        """Calling generate-subtasks a second time should replace, not accumulate."""
        task_id = task_with_subtasks["task"]["id"]
        client.post(f"/tasks/{task_id}/generate-subtasks")
        count = len(client.get(f"/tasks/{task_id}").json()["data"]["subtasks"])
        assert count <= 6, "Should not accumulate subtasks across regenerations"


# ── COMPLETE SUBTASK ─────────────────────────────────────────────────────────

class TestCompleteSubtask:
    def test_complete_subtask(self, client, task_with_subtasks):
        subtasks = task_with_subtasks["subtasks"]
        assert subtasks, "Need at least one subtask"

        sub_id = subtasks[0]["id"]
        resp = client.patch(f"/tasks/subtasks/{sub_id}/complete")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["completed"] is True
        assert data["completed_at"] is not None
