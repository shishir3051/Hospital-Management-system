import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function LoadingSpinner({ label = 'Loading clinical data...' }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div className="w-9 h-9 border-[3px] border-primary-700 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}

export function ErrorAlert({ message, onRetry, className = '' }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-2.5 text-rose-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button variant="danger-outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="py-16 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-display font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs font-medium text-slate-600 tabular-nums">
        Showing <span className="font-semibold text-slate-900">{start}–{end}</span> of{' '}
        <span className="font-semibold text-slate-900">{total}</span> records
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Previous
        </Button>
        <span className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
