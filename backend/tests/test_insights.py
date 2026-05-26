"""
Tests for the /insights endpoints.
"""


class TestInsights:
    def test_get_daily_insights_200(self, client):
        resp = client.get("/insights/daily")
        assert resp.status_code == 200

    def test_insights_has_required_fields(self, client):
        resp = client.get("/insights/daily")
        data = resp.json()["data"]
        assert "summary" in data
        assert "insights" in data
        assert "score" in data

    def test_insights_summary_is_string(self, client):
        resp = client.get("/insights/daily")
        assert isinstance(resp.json()["data"]["summary"], str)
        assert len(resp.json()["data"]["summary"]) > 5

    def test_insights_list_is_array(self, client):
        resp = client.get("/insights/daily")
        insights_list = resp.json()["data"]["insights"]
        assert isinstance(insights_list, list)

    def test_score_is_valid_int(self, client):
        resp = client.get("/insights/daily")
        score = resp.json()["data"]["score"]
        assert isinstance(score, int)
        assert 0 <= score <= 100

    def test_second_call_cached(self, client):
        """Two GET calls on the same day should return the same score."""
        r1 = client.get("/insights/daily")
        r2 = client.get("/insights/daily")
        assert r1.json()["data"]["score"] == r2.json()["data"]["score"]

    def test_generate_insights_200(self, client):
        """POST /insights/generate should force a fresh response."""
        resp = client.post("/insights/generate")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "summary" in data
        assert "score" in data

    def test_response_envelope(self, client):
        resp = client.get("/insights/daily")
        body = resp.json()
        assert "data" in body
        assert "error" in body
