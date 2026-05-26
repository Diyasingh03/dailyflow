from datetime import date
from fastapi import APIRouter, HTTPException
from database import get_supabase
from ai import generate_text

router = APIRouter()
USER_ID = "default_user"


def _generate_and_store(today: str) -> dict:
    """Generate a morning briefing using AI and upsert it into the DB."""
    db = get_supabase()

    # Fetch today's pending tasks
    tasks_result = db.table("tasks").select("title,description,priority").eq("user_id", USER_ID).eq("status", "pending").order("priority").limit(10).execute()
    tasks = tasks_result.data or []

    # Build task list string
    if tasks:
        task_lines = "\n".join(
            f"- [{t['priority'].upper()}] {t['title']}" + (f": {t['description']}" if t['description'] else "")
            for t in tasks
        )
    else:
        task_lines = "No pending tasks — a great day to get ahead!"

    prompt = (
        f"Today is {today}. The user has these pending tasks:\n{task_lines}\n\n"
        "Generate a warm, motivating morning briefing in 2-3 sentences of flowing prose.\n"
        "Cover: a brief greeting, today's focus, and a motivational nudge.\n"
        "No headers, no bullet points, no markdown. Plain prose only."
    )

    try:
        content = generate_text(
            prompt,
            system_instruction="You are a personal AI assistant generating a warm, concise morning briefing.",
            max_output_tokens=120,   # ~90 words — enough for 2-3 readable sentences
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # Upsert (one briefing per day)
    row = {"user_id": USER_ID, "date": today, "content": content}
    db.table("briefings").upsert(row, on_conflict="user_id,date").execute()

    return {"date": today, "content": content}


@router.get("/today")
def get_today_briefing():
    """Return today's briefing from cache, or generate it if not yet created."""
    today = date.today().isoformat()
    db = get_supabase()

    result = db.table("briefings").select("*").eq("user_id", USER_ID).eq("date", today).execute()
    if result.data:
        return {"data": result.data[0], "error": None}

    # Not cached — generate now
    briefing = _generate_and_store(today)
    return {"data": briefing, "error": None}


@router.post("/generate")
def generate_briefing():
    """Force-regenerate today's morning briefing."""
    today = date.today().isoformat()
    briefing = _generate_and_store(today)
    return {"data": briefing, "error": None}
