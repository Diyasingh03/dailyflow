import { useState, useEffect } from "react";
import { api } from "../api";
import Button from "../components/Button";
import ErrorBanner from "../components/ErrorBanner";
import GlassCard from "../components/GlassCard";
import InlineMarkdown from "../components/InlineMarkdown";
import LoadingSpinner from "../components/LoadingSpinner";
import PageHeader from "../components/PageHeader";

/* ── Score ring colours ── */
const RING_COLOR  = (s) => s >= 70 ? "#10b981" : s >= 40 ? "#f59e0b" : "#f43f5e";
const SCORE_LABEL = (s) => ({
  text: s >= 70 ? "🚀 Great day!" : s >= 40 ? "⚡ Keep going!" : "💪 Room to grow",
  cls:  s >= 70
    ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
    : s >= 40
    ? "text-amber-600 bg-amber-50 border border-amber-200"
    : "text-rose-600 bg-rose-50 border border-rose-200",
});

function ScoreRing({ score }) {
  const r            = 52;
  const circumference = 2 * Math.PI * r;
  const label        = SCORE_LABEL(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={RING_COLOR(score)}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (score / 100) * circumference}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="text-center -mt-24">
        <span className="text-4xl font-bold text-slate-800">{score}</span>
        <span className="text-lg text-slate-400">/100</span>
      </div>
      <div className="mt-16">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${label.cls}`}>
          {label.text}
        </span>
      </div>
    </div>
  );
}

export default function Insights() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getDailyInsights());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      setData(await api.regenerateInsights());
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div>
      <PageHeader
        title="Daily Insights"
        subtitle={today}
        action={
          <Button
            onClick={refresh}
            disabled={loading}
            loading={refreshing}
            loadingText="Analyzing…"
          >
            🔄 Refresh
          </Button>
        }
      />

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner message="Analyzing your productivity…" />
      ) : data ? (
        <div className="space-y-4">
          {/* Score + summary */}
          <GlassCard size="lg" className="flex flex-col sm:flex-row items-center gap-8">
            <ScoreRing score={data.score ?? 0} />
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Today's Summary
              </h3>
              <p className="text-slate-700 text-base leading-relaxed">{data.summary}</p>
            </div>
          </GlassCard>

          {/* Insight cards */}
          <div className="grid grid-cols-1 gap-3">
            {(data.insights || []).map((insight, i) => (
              <GlassCard key={i} size="sm" className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  {i + 1}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  <InlineMarkdown text={insight} />
                </p>
              </GlassCard>
            ))}
            {(!data.insights || data.insights.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">No insights available yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Click Refresh to generate today's insights.</p>
        </div>
      )}
    </div>
  );
}
