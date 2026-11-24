export function Card({ className = '', padding = 'p-6', children }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-card ${padding} ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, subtitle, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700',
    secondary: 'bg-secondary-50 text-secondary-800',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-600 tracking-wide uppercase">{label}</p>
        <p className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums truncate">
          {value}
        </p>
        {subtitle && <p className="mt-1 text-xs text-slate-600">{subtitle}</p>}
      </div>
      {Icon && (
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone] || tones.primary}`}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        {breadcrumb && <div className="mb-1.5">{breadcrumb}</div>}
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
