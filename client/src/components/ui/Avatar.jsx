import { useState } from 'react';

export function Avatar({ src, firstName = '', lastName = '', alt, size = 'md', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizes = {
    xs: 'w-7 h-7 text-xs rounded-lg',
    sm: 'w-9 h-9 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-14 h-14 text-lg rounded-xl',
    xl: 'w-20 h-20 text-2xl rounded-2xl'
  };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  const label = alt || `${firstName} ${lastName}`.trim() || 'User avatar';

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={label}
        onError={() => setImgFailed(true)}
        className={`${sizes[size] || sizes.md} object-cover border border-slate-200 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`${sizes[size] || sizes.md} bg-primary-50 text-primary-800 border border-primary-100 font-display font-bold flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
