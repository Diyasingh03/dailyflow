"""
Tests for the /briefing endpoints.

These tests hit the real AI and Supabase — the briefing for today
is fetched-or-generated and cached, so subsequent calls are fast.
"""


class TestBriefing:
    def test_get_today_briefing_200(self, client):
        """GET /briefing/today should return 200 with content."""
        resp = client.get("/briefing/today")
        assert resp.status_code == 200

    def test_briefing_has_content(self, client):
        resp = client.get("/briefing/today")
        data = resp.json()["data"]
        assert "content" in data
        assert isinstance(data["content"], str)
        assert len(data["content"]) > 50, "Briefing content seems too short"

    def test_briefing_has_date(self, client):
        resp = client.get("/briefing/today")
        data = resp.json()["data"]
        assert "date" in data

    def test_second_call_is_cached(self, client):
        """Two calls should return the same content (cache hit)."""
        r1 = client.get("/briefing/today")
        r2 = client.get("/briefing/today")
        assert r1.json()["data"]["content"] == r2.json()["data"]["content"]

    def test_generate_returns_new_content(self, client):
        """POST /briefing/generate should always return content."""
        resp = client.post("/briefing/generate")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "content" in data
        assert len(data["content"]) > 50

    def test_response_envelope(self, client):
        resp = client.get("/briefing/today")
        body = resp.json()
        assert "data" in body
        assert "error" in body
