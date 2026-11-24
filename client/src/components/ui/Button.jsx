import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800 border border-transparent shadow-sm',
  secondary: 'bg-secondary-800 text-white hover:bg-secondary-900 border border-transparent shadow-sm',
  outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-xs',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 border border-transparent shadow-sm',
  'danger-outline': 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
};

const SIZES = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-sm gap-2 rounded-xl'
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
}
