/**
 * Consistent page-level header: title + optional subtitle + optional action slot.
 * Usage:
 *   <PageHeader title="Dashboard" subtitle={today} action={<Button>...</Button>} />
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
