from datetime import date, timedelta
from fastapi import APIRouter, HTTPException
from database import get_supabase
from ai import generate_text, parse_json_response

router = APIRouter()
USER_ID = "default_user"


def _build_and_store(today: str) -> dict:
    """Compute task stats, call AI for insights, and upsert into DB."""
    db = get_supabase()

    # All tasks for this user
    all_tasks = db.table("tasks").select("status,priority,completed_at").eq("user_id", USER_ID).execute().data or []

    total = len(all_tasks)
    completed = [t for t in all_tasks if t["status"] == "completed"]
    pending = [t for t in all_tasks if t["status"] == "pending"]
    in_progress = [t for t in all_tasks if t["status"] == "in_progress"]

    high_total = len([t for t in all_tasks if t["priority"] == "high"])
    high_done = len([t for t in completed if t["priority"] == "high"])

    # Weekly breakdown (last 7 days)
    weekly = {}
    for i in range(7):
        d = (date.today() - timedelta(days=i)).isoformat()
        weekly[d] = len([t for t in completed if t.get("completed_at", "").startswith(d)])
    weekly_str = ", ".join(f"{k}: {v}" for k, v in sorted(weekly.items()))

    prompt = (
        f"Task summary for {today}:\n"
        f"- Total tasks: {total}\n"
        f"- Completed: {len(completed)}\n"
        f"- In progress: {len(in_progress)}\n"
        f"- Pending: {len(pending)}\n"
        f"- High priority completed: {high_done}/{high_total}\n"
        f"- Tasks completed per day (last 7 days): {weekly_str}\n\n"
        "Provide 3 specific, actionable productivity insights. "
        'Return ONLY a valid JSON object in this exact format (no extra text):\n'
        '{"summary": "one sentence summary", "insights": ["insight1", "insight2", "insight3"], "score": 75}\n'
        "Score is 0-100 reflecting overall productivity. Be honest and constructive.\n"
        "IMPORTANT: Write all text values in plain prose only — no markdown, no asterisks, no bold, no bullet symbols."
    )

    try:
        raw = generate_text(
            prompt,
            system_instruction="You are a productivity coach. Always respond with valid JSON only. Never use markdown formatting like ** or * inside string values."
        )
        parsed = parse_json_response(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    summary = parsed.get("summary", "")
    insights_list = parsed.get("insights", [])
    score = int(parsed.get("score", 0))

    row = {
        "user_id": USER_ID,
        "date": today,
        "summary": summary,
        "insights": insights_list,
        "score": score,
        "raw_content": raw,
    }
    db.table("insights").upsert(row, on_conflict="user_id,date").execute()

    return {"date": today, "summary": summary, "insights": insights_list, "score": score}


@router.get("/daily")
def get_daily_insights():
    """Return today's insights from cache, or generate them if not yet created."""
    today = date.today().isoformat()
    db = get_supabase()

    result = db.table("insights").select("*").eq("user_id", USER_ID).eq("date", today).execute()
    if result.data:
        return {"data": result.data[0], "error": None}

    # Not cached — generate now
    insights = _build_and_store(today)
    return {"data": insights, "error": None}


@router.post("/generate")
def generate_insights():
    """Force-regenerate today's productivity insights."""
    today = date.today().isoformat()
    insights = _build_and_store(today)
    return {"data": insights, "error": None}
