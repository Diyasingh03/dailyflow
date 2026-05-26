/**
 * Red dismissible error banner.
 * Renders nothing when message is falsy.
 * onDismiss is optional — omit it to show a non-dismissible banner.
 */
export default function ErrorBanner({ message, onDismiss, className = "" }) {
  if (!message) return null;
  return (
    <div className={`mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm backdrop-blur-sm flex items-center justify-between gap-3 ${className}`}>
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 flex-shrink-0 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
