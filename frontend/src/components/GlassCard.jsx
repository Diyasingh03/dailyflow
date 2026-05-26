/**
 * Frosted-glass card — the primary surface used across all pages.
 * size: 'sm' (p-4, rounded-xl) | 'md' (p-6, rounded-2xl, default) | 'lg' (p-8, rounded-2xl)
 */
const SIZES = {
  sm: "p-4 rounded-xl",
  md: "p-6 rounded-2xl",
  lg: "p-8 rounded-2xl",
};

export default function GlassCard({ children, size = "md", className = "" }) {
  return (
    <div className={`bg-white/55 backdrop-blur-md border border-white/70 shadow-lg ${SIZES[size]} ${className}`}>
      {children}
    </div>
  );
}
