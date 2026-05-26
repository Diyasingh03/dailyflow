from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import tasks, briefing, standup, insights

load_dotenv()

app = FastAPI(
    title="DailyPulse API",
    description="Personal AI productivity backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router,    prefix="/tasks",    tags=["tasks"])
app.include_router(briefing.router, prefix="/briefing", tags=["briefing"])
app.include_router(standup.router,  prefix="/standup",  tags=["standup"])
app.include_router(insights.router, prefix="/insights", tags=["insights"])


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
