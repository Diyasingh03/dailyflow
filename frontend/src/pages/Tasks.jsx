import { useState, useEffect } from "react";
import { api } from "../api";
import Button from "../components/Button";
import ErrorBanner from "../components/ErrorBanner";
import GlassCard from "../components/GlassCard";
import LoadingSpinner from "../components/LoadingSpinner";
import TaskCard from "../components/TaskCard";

const STATUS_TABS = ["all", "pending", "in_progress", "completed"];

export default function Tasks() {
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeTab, setActiveTab]     = useState("all");
  const [submitting, setSubmitting]   = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });

  const loadTasks = async () => {
    setLoading(true);
    try {
      setTasks(await api.listTasks() || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const newTask = await api.createTask(form);
      setTasks((prev) => [newTask, ...prev]);
      setForm({ title: "", description: "", priority: "medium" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      const updated = await api.completeTask(id);
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updated } : t));
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) { setError(e.message); }
  };

  const handleGenerateSubtasks = async (taskId) => {
    try {
      const subtasks = await api.generateSubtasks(taskId);
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, subtasks } : t));
    } catch (e) { setError(e.message); }
  };

  const handleCompleteSubtask = async (taskId, subtaskId) => {
    try {
      const updated = await api.completeSubtask(subtaskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((s) => s.id === subtaskId ? { ...s, ...updated } : s) }
            : t
        )
      );
    } catch (e) { setError(e.message); }
  };

  const filtered = activeTab === "all"
    ? tasks
    : tasks.filter((t) => t.status === activeTab);

  /* ── shared input class ── */
  const inputCls = "w-full bg-white/60 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Smart Tasks</h2>

      {/* Add Task form */}
      <GlassCard className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 mb-3">Add New Task</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            placeholder="Task title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className={inputCls}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
          />
          <div className="flex items-center gap-3">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="bg-white/60 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            >
              <option value="low"    className="bg-white">🟢 Low</option>
              <option value="medium" className="bg-white">🟡 Medium</option>
              <option value="high"   className="bg-white">🔴 High</option>
            </select>
            <Button
              type="submit"
              disabled={!form.title.trim()}
              loading={submitting}
              loadingText="Adding…"
            >
              Add Task
            </Button>
          </div>
        </form>
      </GlassCard>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 bg-white/30 backdrop-blur-sm border border-white/50 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-white/60 text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.replace("_", " ")}
            <span className="ml-1.5 text-slate-400">
              ({tab === "all" ? tasks.length : tasks.filter((t) => t.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <LoadingSpinner message="Loading tasks…" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No tasks here yet. Add one above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onGenerateSubtasks={handleGenerateSubtasks}
              onCompleteSubtask={handleCompleteSubtask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
