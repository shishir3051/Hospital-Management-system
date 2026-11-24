const STATUS_STYLES = {
  // Positive / Completed
  AVAILABLE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PAID: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  // Informational / Scheduled
  CONFIRMED: 'bg-sky-50 text-sky-800 border-sky-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  PARTIAL: 'bg-sky-50 text-sky-800 border-sky-200',
  REVIEWED: 'bg-sky-50 text-sky-800 border-sky-200',
  // Pending / Warning
  SCHEDULED: 'bg-amber-50 text-amber-800 border-amber-200',
  UNPAID: 'bg-amber-50 text-amber-800 border-amber-200',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  BUSY: 'bg-amber-50 text-amber-800 border-amber-200',
  NEW: 'bg-amber-50 text-amber-800 border-amber-200',
  // Negative / Cancelled
  CANCELLED: 'bg-rose-50 text-rose-800 border-rose-200',
  NO_SHOW: 'bg-rose-50 text-rose-800 border-rose-200',
  ON_LEAVE: 'bg-slate-100 text-slate-700 border-slate-200',
  INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200',
  SUSPENDED: 'bg-rose-50 text-rose-800 border-rose-200'
};

const ROLE_STYLES = {
  ADMIN: 'bg-secondary-50 text-secondary-900 border-secondary-200',
  DOCTOR: 'bg-primary-50 text-primary-800 border-primary-200',
  NURSE: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  ACCOUNTANT: 'bg-amber-50 text-amber-800 border-amber-200',
  RECEPTIONIST: 'bg-sky-50 text-sky-800 border-sky-200',
  PHARMACIST: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  LAB_TECH: 'bg-violet-50 text-violet-800 border-violet-200',
  PATIENT: 'bg-slate-100 text-slate-700 border-slate-200'
};

export function Badge({ tone = 'neutral', className = '', children }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-primary-50 text-primary-800 border-primary-200',
    secondary: 'bg-secondary-50 text-secondary-900 border-secondary-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200'
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold whitespace-nowrap ${tones[tone] || tones.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const normalized = String(status || 'UNKNOWN').toUpperCase();
  const style = STATUS_STYLES[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = normalized.replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-semibold capitalize whitespace-nowrap ${style} ${className}`}
    >
      {label.toLowerCase()}
    </span>
  );
}

export function RoleBadge({ role, className = '' }) {
  const normalized = String(role || 'USER').toUpperCase();
  const style = ROLE_STYLES[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-semibold capitalize whitespace-nowrap ${style} ${className}`}
    >
      {normalized.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}
