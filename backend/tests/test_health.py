"""Tests for the health endpoint and basic server setup."""


def test_health_returns_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_docs_accessible(client):
    """Swagger UI should be reachable."""
    resp = client.get("/docs")
    assert resp.status_code == 200


def test_openapi_schema(client):
    """OpenAPI schema paths should include all four feature tag groups."""
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    data = resp.json()
    # Collect all tags from all path operations
    all_tags = set()
    for path_item in data.get("paths", {}).values():
        for op in path_item.values():
            if isinstance(op, dict):
                all_tags.update(op.get("tags", []))
    assert {"tasks", "briefing", "standup", "insights"}.issubset(all_tags), (
        f"Expected feature tags in OpenAPI paths, found: {all_tags}"
    )
