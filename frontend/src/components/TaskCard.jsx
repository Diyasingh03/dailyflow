/**
 * Individual task card — extracted from Tasks.jsx so the page stays lean.
 * Owns the "Generate subtasks" flow and subtask checkbox list.
 */
import { useState } from "react";
import Button from "./Button";

export const PRIORITY_COLORS = {
  high:   "bg-rose-100 text-rose-600 border border-rose-200",
  medium: "bg-amber-100 text-amber-600 border border-amber-200",
  low:    "bg-emerald-100 text-emerald-600 border border-emerald-200",
};

export default function TaskCard({ task, onComplete, onDelete, onGenerateSubtasks, onCompleteSubtask }) {
  const [generatingSubtasks, setGeneratingSubtasks] = useState(false);

  const handleGenerateSubtasks = async () => {
    setGeneratingSubtasks(true);
    try {
      await onGenerateSubtasks(task.id);
    } finally {
      setGeneratingSubtasks(false);
    }
  };

  return (
    <div className="bg-white/55 backdrop-blur-md border border-white/70 rounded-xl p-5 shadow-lg hover:bg-white/65 transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`font-semibold ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
              {task.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            {task.status === "in_progress" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200 font-medium">
                in progress
              </span>
            )}
            {task.status === "completed" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-medium">
                ✓ done
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-slate-500">{task.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.status !== "completed" && (
            <button
              onClick={() => onComplete(task.id)}
              className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors text-sm"
              title="Mark complete"
            >
              ✓
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors text-sm"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Subtask list */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-4 space-y-2 pl-3 border-l-2 border-indigo-300/60">
          {task.subtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sub.completed}
                onChange={() => !sub.completed && onCompleteSubtask(task.id, sub.id)}
                className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                readOnly={sub.completed}
              />
              <span className={`text-sm ${sub.completed ? "line-through text-slate-400" : "text-slate-600"}`}>
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Generate subtasks */}
      {task.status !== "completed" && (
        <Button
          variant="subtle"
          loading={generatingSubtasks}
          loadingText="Generating subtasks…"
          onClick={handleGenerateSubtasks}
          className="mt-3 text-xs"
        >
          ✨ {task.subtasks?.length > 0 ? "Regenerate" : "Generate"} subtasks
        </Button>
      )}
    </div>
  );
}
