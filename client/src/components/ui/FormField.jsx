import { useId, useState, useRef, useEffect, Children, isValidElement } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const baseControl =
  'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20 disabled:bg-slate-100 disabled:text-slate-500';

function extractText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (isValidElement(node)) return extractText(node.props?.children);
  return '';
}

function collectOptions(children, result = []) {
  Children.forEach(children, (child) => {
    if (!child) return;
    if (Array.isArray(child)) {
      collectOptions(child, result);
      return;
    }
    if (isValidElement(child)) {
      if (child.type === 'option') {
        const label = extractText(child.props.children).trim();
        const value = child.props.value !== undefined ? String(child.props.value) : label;
        result.push({
          value,
          label,
          disabled: Boolean(child.props.disabled)
        });
      } else if (child.props?.children) {
        collectOptions(child.props.children, result);
      }
    }
  });
  return result;
}

export function Input({
  label,
  id: providedId,
  error,
  hint,
  icon: Icon,
  required,
  className = '',
  inputClassName = '',
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-rose-600 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={descId}
          className={`${baseControl} h-10 ${Icon ? 'pl-10 pr-3.5' : 'px-3.5'} ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300'
          } ${inputClassName}`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-600">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Select({
  label,
  id: providedId,
  name,
  value,
  onChange,
  disabled = false,
  error,
  hint,
  required = false,
  className = '',
  selectClassName = '',
  children,
  'aria-label': ariaLabel,
  ...rest
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const listboxId = `${id}-listbox`;
  const descId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const options = collectOptions(children);
  const normalizedValue = value !== undefined && value !== null ? String(value) : '';
  const selectedIndex = options.findIndex((o) => o.value === normalizedValue);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : options[0] || null;

  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 240 && rect.top > spaceBelow);
    }
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-option-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const selectOption = (opt) => {
    if (!opt || opt.disabled) return;
    onChange?.({
      target: { value: opt.value, name: name || '' },
      currentTarget: { value: opt.value, name: name || '' }
    });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setActiveIndex((prev) => {
          let next = prev + 1;
          while (next < options.length && options[next]?.disabled) next++;
          return next < options.length ? next : prev;
        });
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setActiveIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && options[next]?.disabled) next--;
          return next >= 0 ? next : prev;
        });
      }
      return;
    }

    if (e.key === 'Home' && open) {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (e.key === 'End' && open) {
      e.preventDefault();
      setActiveIndex(Math.max(0, options.length - 1));
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (options[activeIndex]) {
        selectOption(options[activeIndex]);
      }
    }
  };

  const isPlaceholder = !normalizedValue && selectedOption?.value === '';

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-rose-600 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Native hidden input for HTML5 required form validation */}
        {required && (
          <input
            type="text"
            tabIndex={-1}
            aria-hidden="true"
            required
            value={normalizedValue}
            onChange={() => {}}
            className="sr-only pointer-events-none"
          />
        )}

        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-label={!label ? ariaLabel : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={descId}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          className={`w-full h-10 px-3.5 rounded-lg border bg-white text-sm text-left flex items-center justify-between gap-2 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
            open
              ? 'border-primary-700 ring-2 ring-primary-700/20'
              : error
              ? 'border-rose-400 hover:border-rose-500'
              : 'border-slate-300 hover:border-slate-400'
          } ${selectClassName}`}
          {...rest}
        >
          <span className={`truncate ${isPlaceholder ? 'text-slate-500' : 'text-slate-900 font-medium'}`}>
            {selectedOption?.label || 'Select an option'}
          </span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
              open ? 'rotate-180 text-primary-700' : 'text-slate-500'
            }`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={label || ariaLabel || 'Options'}
            className={`absolute left-0 right-0 z-50 bg-white rounded-xl border border-slate-200 shadow-elevated py-1.5 max-h-60 overflow-y-auto scrollbar-thin animate-fadeIn ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            {options.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-slate-500 text-center">No options available</li>
            ) : (
              options.map((opt, idx) => {
                const isSelected = opt.value === normalizedValue;
                const isActive = idx === activeIndex;
                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    data-option-index={idx}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOption(opt);
                    }}
                    className={`mx-1.5 px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${
                      opt.disabled
                        ? 'text-slate-400 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary-50 text-primary-900 font-semibold cursor-pointer'
                        : isActive
                        ? 'bg-slate-100 text-slate-900 cursor-pointer'
                        : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary-700 shrink-0" aria-hidden="true" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-600">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  id: providedId,
  error,
  hint,
  required,
  rows = 3,
  className = '',
  textareaClassName = '',
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-rose-600 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={descId}
        className={`${baseControl} px-3.5 py-2.5 ${
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300'
        } ${textareaClassName}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-600">
          {hint}
        </p>
      )}
    </div>
  );
}
