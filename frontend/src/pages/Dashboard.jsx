import { useState, useEffect } from "react";
import { api } from "../api";
import Button from "../components/Button";
import ErrorBanner from "../components/ErrorBanner";
import GlassCard from "../components/GlassCard";
import LoadingSpinner from "../components/LoadingSpinner";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

const scoreColor = (s) =>
  s >= 70 ? "text-emerald-600" : s >= 40 ? "text-amber-600" : "text-rose-600";
const scoreLabel = (s) =>
  s >= 70 ? "🚀 Great day!" : s >= 40 ? "⚡ Keep going!" : "💪 Room to grow";

export default function Dashboard() {
  const [briefing, setBriefing]         = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [insights, setInsights]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError]               = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    const [bRes, tRes, iRes] = await Promise.allSettled([
      api.getTodayBriefing(),
      api.listTasks(),
      api.getDailyInsights(),
    ]);
    if (bRes.status === "fulfilled") setBriefing(bRes.value);
    else setError(bRes.reason?.message || "Failed to load briefing");
    if (tRes.status === "fulfilled") setTasks(tRes.value || []);
    if (iRes.status === "fulfilled") setInsights(iRes.value);
    setLoading(false);
  };

  const regenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      setBriefing(await api.regenerateBriefing());
    } catch (e) {
      setError(e.message);
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const completed  = tasks.filter((t) => t.status === "completed").length;
  const pending    = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={today}
        action={
          <Button
            onClick={regenerate}
            disabled={loading}
            loading={regenerating}
            loadingText="Generating…"
          >
            ✨ Refresh Briefing
          </Button>
        }
      />

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner message="Loading your dashboard…" />
      ) : (
        <div className="space-y-4">
          {/* Morning briefing */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">☀️</span>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Morning Briefing</h3>
                <p className="text-xs text-slate-400">AI-generated just for you</p>
              </div>
            </div>
            {briefing ? (
              <p className="text-slate-700 leading-relaxed text-sm">
                {briefing.content}
              </p>
            ) : (
              <p className="text-slate-400 text-sm">
                No briefing available. Click Refresh Briefing to generate one.
              </p>
            )}
          </GlassCard>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard icon="📋" label="Total Tasks"  value={tasks.length} />
            <StatCard icon="⏳" label="Pending"      value={pending}    valueClass="text-amber-600" />
            <StatCard icon="🔄" label="In Progress"  value={inProgress} valueClass="text-blue-600" />
            <StatCard icon="✅" label="Completed"    value={completed}  valueClass="text-emerald-600" />
            {insights ? (
              <StatCard
                icon="📊"
                label={scoreLabel(insights.score)}
                value={insights.score}
                valueClass={scoreColor(insights.score)}
              />
            ) : (
              <StatCard icon="📊" label="Today's Score" value="—" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
