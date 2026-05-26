from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_supabase
from ai import generate_text

router = APIRouter()
USER_ID = "default_user"


class StandupRequest(BaseModel):
    target_date: Optional[str] = None  # ISO date string, defaults to today


@router.post("/generate")
def generate_standup(req: StandupRequest = StandupRequest()):
    """Generate a standup report from tasks completed today (or the specified date)."""
    target = req.target_date or date.today().isoformat()
    db = get_supabase()

    # Fetch tasks completed on the target date
    completed = db.table("tasks").select("title,description,priority").eq("user_id", USER_ID).eq("status", "completed").gte("completed_at", f"{target}T00:00:00").lte("completed_at", f"{target}T23:59:59").execute()
    done_tasks = completed.data or []

    # Fetch remaining pending tasks for "today" section
    pending = db.table("tasks").select("title,priority").eq("user_id", USER_ID).eq("status", "pending").limit(5).execute()
    pending_tasks = pending.data or []

    # Build context strings
    if done_tasks:
        done_str = "\n".join(f"- {t['title']}" + (f": {t['description']}" if t['description'] else "") for t in done_tasks)
    else:
        done_str = "No tasks were completed yet today."

    if pending_tasks:
        pending_str = "\n".join(f"- {t['title']}" for t in pending_tasks)
    else:
        pending_str = "No pending tasks."

    prompt = (
        f"Date: {target}\n"
        f"Completed tasks:\n{done_str}\n\n"
        f"Remaining pending tasks:\n{pending_str}\n\n"
        "Generate a concise engineering standup report in this exact format:\n"
        "**Yesterday:** [what was accomplished based on the completed tasks]\n"
        "**Today:** [planned focus based on pending tasks]\n"
        "**Blockers:** None\n\n"
        "Keep it professional and brief (3 sentences max per section)."
    )

    try:
        content = generate_text(
            prompt,
            system_instruction="You are generating a concise daily standup report for a software engineer."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # Store the standup
    row = {
        "user_id": USER_ID,
        "date": target,
        "content": content,
        "tasks_completed": len(done_tasks),
    }
    result = db.table("standups").insert(row).execute()
    stored = result.data[0] if result.data else row

    return {"data": stored, "error": None}


@router.get("/history")
def get_standup_history():
    """Return the last 10 standup reports."""
    db = get_supabase()
    result = db.table("standups").select("*").eq("user_id", USER_ID).order("date", desc=True).limit(10).execute()
    return {"data": result.data or [], "error": None}
