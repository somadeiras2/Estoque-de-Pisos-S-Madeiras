'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export type ToastOptions = 
  | string 
  | { title?: string; description?: string; variant?: 'success' | 'error' | 'warning' | 'info' | 'danger' };

interface ToastContextType {
  toast: (options: ToastOptions) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      const newToasts = [...prev, { id, message, type }];
      if (newToasts.length > 3) {
        return newToasts.slice(1);
      }
      return newToasts;
    });

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const showToast = useCallback((opts: ToastOptions) => {
    if (typeof opts === 'string') {
      addToast(opts, 'info');
    } else {
      const msg = [opts.title, opts.description].filter(Boolean).join(': ');
      let type: ToastType = 'info';
      if (opts.variant === 'danger' || opts.variant === 'error') type = 'error';
      else if (opts.variant === 'warning') type = 'warning';
      else if (opts.variant === 'success') type = 'success';
      addToast(msg || 'Notificação', type);
    }
  }, [addToast]);

  const toastMethods = {
    toast: showToast,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex flex-col gap-3 w-full max-w-[90%] md:max-w-sm mx-auto md:mx-0 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 pointer-events-none">
          {toasts.map((t) => (
            <ToastMessage key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    toast: context.toast,
    success: context.success,
    error: context.error,
    warning: context.warning,
    info: context.info,
  };
}

function ToastMessage({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    setIsShowing(true);
  }, []);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  const bgs = {
    success: 'bg-white border-green-200',
    error: 'bg-white border-red-200',
    warning: 'bg-white border-amber-200',
    info: 'bg-white border-blue-200',
  };

  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto transition-all duration-300 transform ${bgs[toast.type]} ${isShowing ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
    >
      <div className="shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-slate-800">
        {toast.message}
      </p>
      <button 
        onClick={onClose}
        className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
