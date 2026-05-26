"""
Tests for the /standup endpoints.

To stay within the Gemini free-tier rate limit (5 req/min), we generate
ONE standup per test session via a module-scoped fixture and reuse it.
"""
import pytest


@pytest.fixture(scope="module")
def generated_standup(client):
    """Generate exactly one standup and share it across all tests in this module."""
    resp = client.post("/standup/generate")
    assert resp.status_code == 200, f"Standup generation failed: {resp.text}"
    return resp.json()


class TestStandup:
    def test_generate_standup_200(self, generated_standup):
        """The generation call must return 200."""
        # result already checked in fixture; just confirm the fixture ran
        assert generated_standup is not None

    def test_generate_standup_has_content(self, generated_standup):
        data = generated_standup["data"]
        assert "content" in data
        assert isinstance(data["content"], str)
        assert len(data["content"]) > 20

    def test_generate_standup_has_date(self, generated_standup):
        data = generated_standup["data"]
        assert "date" in data

    def test_generate_standup_tasks_completed_field(self, generated_standup):
        """tasks_completed must be a non-negative integer."""
        data = generated_standup["data"]
        assert "tasks_completed" in data
        assert isinstance(data["tasks_completed"], int)
        assert data["tasks_completed"] >= 0

    def test_standup_contains_expected_sections(self, generated_standup):
        """Standup should include Yesterday / Today / Blockers."""
        content = generated_standup["data"]["content"]
        keywords = ["Yesterday", "Today", "Blockers"]
        matched = [kw for kw in keywords if kw in content]
        assert len(matched) >= 2, f"Expected standup sections, got: {content[:200]}"

    def test_history_returns_list(self, client):
        resp = client.get("/standup/history")
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)

    def test_history_max_10(self, client):
        resp = client.get("/standup/history")
        assert len(resp.json()["data"]) <= 10

    def test_response_envelope(self, generated_standup):
        assert "data" in generated_standup
        assert "error" in generated_standup
