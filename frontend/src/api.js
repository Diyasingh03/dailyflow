const BASE = "http://localhost:8000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || json.error || "Request failed");
  // Backend returns { data: ..., error: null } or plain objects
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // ── Tasks ────────────────────────────────────────────────────────────────
  listTasks: (status) =>
    apiFetch(`/tasks/${status ? `?status=${status}` : ""}`),
  createTask: (body) =>
    apiFetch("/tasks/", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id, body) =>
    apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  completeTask: (id) =>
    apiFetch(`/tasks/${id}/complete`, { method: "PATCH" }),
  deleteTask: (id) =>
    apiFetch(`/tasks/${id}`, { method: "DELETE" }),
  generateSubtasks: (id) =>
    apiFetch(`/tasks/${id}/generate-subtasks`, { method: "POST" }),

  // ── Subtasks ─────────────────────────────────────────────────────────────
  completeSubtask: (id) =>
    apiFetch(`/tasks/subtasks/${id}/complete`, { method: "PATCH" }),

  // ── Briefing ──────────────────────────────────────────────────────────────
  getTodayBriefing: () => apiFetch("/briefing/today"),
  regenerateBriefing: () =>
    apiFetch("/briefing/generate", { method: "POST" }),

  // ── Standup ───────────────────────────────────────────────────────────────
  generateStandup: () =>
    apiFetch("/standup/generate", { method: "POST" }),
  getStandupHistory: () => apiFetch("/standup/history"),

  // ── Insights ──────────────────────────────────────────────────────────────
  getDailyInsights: () => apiFetch("/insights/daily"),
  regenerateInsights: () =>
    apiFetch("/insights/generate", { method: "POST" }),
};
