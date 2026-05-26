import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/",         label: "🏠  Dashboard" },
  { to: "/tasks",    label: "✅  Smart Tasks" },
  { to: "/recap",    label: "📋  Daily Recap" },
  { to: "/insights", label: "📊  Daily Insights" },
];

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-200 via-fuchsia-100 to-sky-200 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute top-[-80px] left-[-80px] w-[480px] h-[480px] rounded-full bg-fuchsia-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-60px] right-[-60px] w-[400px] h-[400px] rounded-full bg-violet-300/35 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-pink-300/30 blur-3xl" />

      {/* Sidebar */}
      <aside className="relative z-10 w-64 bg-white/50 backdrop-blur-xl border-r border-slate-200/70 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-200/60">
          <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            DailyFlow
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">AI Productivity Hub</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white/60 text-slate-800 shadow-sm"
                    : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60">
          <p className="text-xs text-slate-400">Powered by Gemini ✨</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
