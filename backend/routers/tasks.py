from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_supabase
from ai import generate_text, parse_json_response

router = APIRouter()
USER_ID = "default_user"


# ── Pydantic models ──────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    due_date: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _attach_subtasks(tasks: list) -> list:
    """For each task, fetch and attach its subtasks."""
    db = get_supabase()
    for task in tasks:
        result = db.table("subtasks").select("*").eq("task_id", task["id"]).order("created_at").execute()
        task["subtasks"] = result.data or []
    return tasks


# ── Task endpoints ───────────────────────────────────────────────────────────

@router.post("/", status_code=201)
def create_task(task: TaskCreate):
    """Create a new task."""
    db = get_supabase()
    payload = {
        "user_id": USER_ID,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": "pending",
    }
    if task.due_date:
        payload["due_date"] = task.due_date

    result = db.table("tasks").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create task")
    created = result.data[0]
    created["subtasks"] = []
    return {"data": created, "error": None}


@router.get("/")
def list_tasks(status: Optional[str] = None):
    """List all tasks for the user, optionally filtered by status."""
    db = get_supabase()
    query = db.table("tasks").select("*").eq("user_id", USER_ID).order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    result = query.execute()
    tasks = result.data or []
    tasks = _attach_subtasks(tasks)
    return {"data": tasks, "error": None}


@router.get("/{task_id}")
def get_task(task_id: str):
    """Get a single task with all its subtasks."""
    db = get_supabase()
    result = db.table("tasks").select("*").eq("id", task_id).eq("user_id", USER_ID).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    task = result.data[0]
    sub = db.table("subtasks").select("*").eq("task_id", task_id).order("created_at").execute()
    task["subtasks"] = sub.data or []
    return {"data": task, "error": None}


@router.put("/{task_id}")
def update_task(task_id: str, task: TaskUpdate):
    """Update task fields."""
    db = get_supabase()
    updates = {k: v for k, v in task.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.table("tasks").update(updates).eq("id", task_id).eq("user_id", USER_ID).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"data": result.data[0], "error": None}


@router.delete("/{task_id}")
def delete_task(task_id: str):
    """Delete a task (subtasks are cascade-deleted by the DB)."""
    db = get_supabase()
    result = db.table("tasks").delete().eq("id", task_id).eq("user_id", USER_ID).execute()
    return {"data": {"deleted": True, "id": task_id}, "error": None}


@router.patch("/{task_id}/complete")
def complete_task(task_id: str):
    """Mark a task as completed."""
    db = get_supabase()
    updates = {"status": "completed", "completed_at": now_utc()}
    result = db.table("tasks").update(updates).eq("id", task_id).eq("user_id", USER_ID).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"data": result.data[0], "error": None}


@router.post("/{task_id}/generate-subtasks")
def generate_subtasks(task_id: str):
    """Use AI to break a task into 3-5 actionable subtasks."""
    db = get_supabase()

    # Fetch the task
    task_result = db.table("tasks").select("*").eq("id", task_id).eq("user_id", USER_ID).execute()
    if not task_result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    task = task_result.data[0]

    # Call AI
    prompt = (
        f'Given this task: "{task["title"]}" — {task["description"]}\n'
        "Break it into 3-5 clear, actionable subtasks. "
        "Return ONLY a JSON array of strings, each being one subtask title. "
        "No markdown, no explanation.\n"
        'Example: ["Research options", "Draft outline", "Write first section"]'
    )
    try:
        raw = generate_text(prompt)
        subtask_titles = parse_json_response(raw)
        if not isinstance(subtask_titles, list):
            raise ValueError("AI did not return a list")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # Delete existing subtasks and insert fresh ones
    db.table("subtasks").delete().eq("task_id", task_id).execute()

    rows = [{"task_id": task_id, "title": t} for t in subtask_titles if isinstance(t, str)]
    if rows:
        inserted = db.table("subtasks").insert(rows).execute()
        subtasks = inserted.data or []
    else:
        subtasks = []

    return {"data": subtasks, "error": None}


# ── Subtask endpoints ────────────────────────────────────────────────────────

@router.patch("/subtasks/{subtask_id}/complete")
def complete_subtask(subtask_id: str):
    """Mark a subtask as completed."""
    db = get_supabase()
    updates = {"completed": True, "completed_at": now_utc()}
    result = db.table("subtasks").update(updates).eq("id", subtask_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return {"data": result.data[0], "error": None}
