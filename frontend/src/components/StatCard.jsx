/**
 * Single metric tile used in the Dashboard stats grid.
 * valueClass controls the colour of the number (e.g. "text-emerald-600").
 */
export default function StatCard({ icon, value, label, valueClass = "text-slate-800" }) {
  return (
    <div className="bg-white/55 backdrop-blur-md border border-white/70 rounded-xl p-4 flex flex-col items-center text-center gap-1 shadow-lg">
      <span className="text-xl">{icon}</span>
      <span className={`text-2xl font-bold ${valueClass}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
