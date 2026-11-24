export function BrandLogo({ subtitle = 'Medical Center', size = 'md', dark = false, className = '' }) {
  const sizes = {
    sm: { box: 'w-8 h-8 rounded-lg', title: 'text-base', sub: 'text-xs' },
    md: { box: 'w-10 h-10 rounded-xl', title: 'text-lg', sub: 'text-xs' },
    lg: { box: 'w-12 h-12 rounded-xl', title: 'text-xl', sub: 'text-xs' }
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`${s.box} bg-primary-700 text-white flex items-center justify-center shrink-0 shadow-sm`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
          <path d="M16 6v20M6 16h20" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.8" fill="#99F6E4" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={`font-display font-bold tracking-tight ${s.title} ${dark ? 'text-white' : 'text-slate-900'}`}>
          Health<span className={dark ? 'text-primary-300' : 'text-primary-700'}>Core</span>
        </div>
        {subtitle && (
          <div className={`${s.sub} font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
