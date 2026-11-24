import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolver = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
      }
      return id;
    },
    [dismissToast]
  );

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 5500),
    info: (msg) => addToast(msg, 'info')
  };

  const confirm = useCallback((options) => {
    const config =
      typeof options === 'string'
        ? { title: 'Confirm Action', message: options }
        : options;

    return new Promise((resolve) => {
      confirmResolver.current = resolve;
      setConfirmState({
        title: config.title || 'Confirm Action',
        message: config.message || 'Are you sure you want to continue?',
        confirmLabel: config.confirmLabel || 'Confirm',
        cancelLabel: config.cancelLabel || 'Cancel',
        variant: config.variant || 'danger'
      });
    });
  }, []);

  const handleConfirmChoice = (accepted) => {
    setConfirmState(null);
    confirmResolver.current?.(accepted);
    confirmResolver.current = null;
  };

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
  };

  const styles = {
    success: 'bg-white border-emerald-200 text-slate-900',
    error: 'bg-white border-rose-200 text-slate-900',
    info: 'bg-white border-slate-200 text-slate-900'
  };

  const iconColors = {
    success: 'text-emerald-600',
    error: 'text-rose-600',
    info: 'text-primary-700'
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Stack */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none no-print"
      >
        {toasts.map((item) => {
          const Icon = icons[item.type] || Info;
          return (
            <div
              key={item.id}
              className={`pointer-events-auto rounded-xl border shadow-elevated px-4 py-3 flex items-start gap-3 animate-fadeIn ${styles[item.type] || styles.info}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[item.type]}`} aria-hidden="true" />
              <p className="text-sm font-medium flex-1">{item.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog */}
      <Modal
        open={Boolean(confirmState)}
        onClose={() => handleConfirmChoice(false)}
        title={confirmState?.title || ''}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => handleConfirmChoice(false)}>
              {confirmState?.cancelLabel || 'Cancel'}
            </Button>
            <Button
              variant={confirmState?.variant || 'danger'}
              onClick={() => handleConfirmChoice(true)}
            >
              {confirmState?.confirmLabel || 'Confirm'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700 leading-relaxed">{confirmState?.message}</p>
      </Modal>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx.toast;
}

export function useConfirm() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useConfirm must be used within a ToastProvider');
  return ctx.confirm;
}
