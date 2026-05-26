/**
 * Shared button component.
 * variant: 'primary' (indigo→purple gradient) | 'ghost' (glass) | 'subtle' (text-only)
 * Pass loading + loadingText to swap to a spinner state automatically.
 */

function MiniSpinner() {
  return (
    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
  );
}

const VARIANTS = {
  primary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30",
  ghost:   "bg-white/50 text-slate-600 border border-slate-300/70 hover:bg-white/70 hover:text-slate-800",
  subtle:  "text-indigo-500 hover:text-indigo-600 px-0 py-0 shadow-none",
};

export default function Button({
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  loadingText,
  onClick,
  type = "button",
  className = "",
}) {
  const base = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-all";
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
    >
      {loading ? (
        <>
          <MiniSpinner />
          {loadingText ?? children}
        </>
      ) : children}
    </button>
  );
}
