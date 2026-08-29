'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title = 'Operación Exitosa') => addToast('success', message, title),
    [addToast]
  );
  const error = useCallback(
    (message: string, title = 'Error') => addToast('error', message, title),
    [addToast]
  );
  const info = useCallback(
    (message: string, title = 'Información') => addToast('info', message, title),
    [addToast]
  );
  const warning = useCallback(
    (message: string, title = 'Advertencia') => addToast('warning', message, title),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: { success, error, info, warning } }}>
      {children}

      {/* Contenedor de Notificaciones Toast Flotantes */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          let Icon = CheckCircle2;
          let borderCol = 'border-emerald-500/40 bg-[#0c1914]/95 text-emerald-300 shadow-emerald-950/50';
          let iconCol = 'text-emerald-400';

          if (t.type === 'error') {
            Icon = AlertCircle;
            borderCol = 'border-rose-500/40 bg-[#190c0f]/95 text-rose-300 shadow-rose-950/50';
            iconCol = 'text-rose-400';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            borderCol = 'border-amber-500/40 bg-[#19150c]/95 text-amber-300 shadow-amber-950/50';
            iconCol = 'text-amber-400';
          } else if (t.type === 'info') {
            Icon = Info;
            borderCol = 'border-sky-500/40 bg-[#0c1419]/95 text-sky-300 shadow-sky-950/50';
            iconCol = 'text-sky-400';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slideDown ${borderCol}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconCol}`} />

              <div className="flex-1 min-w-0">
                {t.title && <h4 className="text-xs font-extrabold tracking-tight text-white mb-0.5">{t.title}</h4>}
                <p className="text-xs text-slate-300 leading-relaxed break-words">{t.message}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context.toast;
}
