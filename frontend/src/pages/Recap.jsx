import { useState, useEffect } from "react";
import { api } from "../api";
import Button from "../components/Button";
import ErrorBanner from "../components/ErrorBanner";
import GlassCard from "../components/GlassCard";
import InlineMarkdown from "../components/InlineMarkdown";
import LoadingSpinner from "../components/LoadingSpinner";
import PageHeader from "../components/PageHeader";

export default function Recap() {
  const [current, setCurrent]               = useState(null);
  const [history, setHistory]               = useState([]);
  const [generating, setGenerating]         = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError]                   = useState(null);
  const [copied, setCopied]                 = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      setHistory(await api.getStandupHistory() || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.generateStandup();
      setCurrent(data);
      setHistory((prev) => [data, ...prev].slice(0, 10));
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!current?.content) return;
    await navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Daily Recap"
        subtitle="Auto-generate from your completed tasks"
        action={
          <Button loading={generating} loadingText="Generating…" onClick={handleGenerate}>
            📋 Generate Recap
          </Button>
        }
      />

      <ErrorBanner message={error} />

      {/* Generated recap card */}
      {current && (
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Today's Recap</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {current.tasks_completed} task{current.tasks_completed !== 1 ? "s" : ""} completed
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleCopy}
              className={copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ""}
            >
              {copied ? "✓ Copied!" : "📋 Copy"}
            </Button>
          </div>
          <div className="bg-white/40 rounded-xl p-4 space-y-2">
            {current.content.split("\n").map((line, i) => (
              <p key={i} className="text-sm text-slate-700 leading-relaxed">
                <InlineMarkdown text={line} />
              </p>
            ))}
          </div>
        </GlassCard>
      )}

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-3">Recent Recaps</h3>
        {loadingHistory ? (
          <LoadingSpinner message="Loading history…" />
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No recaps yet. Generate your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item, i) => (
              <div
                key={item.id || i}
                className="bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-white/60 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-slate-700">{item.date}</span>
                  <span className="text-xs text-slate-400 ml-3">
                    {item.tasks_completed} task{item.tasks_completed !== 1 ? "s" : ""} done
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xs hidden sm:block">
                  {(item.content?.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1") || "").slice(0, 80)}…
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
