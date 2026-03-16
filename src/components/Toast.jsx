/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLORS = {
  success: { bg: 'rgba(34,197,94,.1)', border: 'rgba(34,197,94,.3)', text: '#16a34a', icon: '#22c55e' },
  error: { bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.3)', text: '#dc2626', icon: '#ef4444' },
  info: { bg: 'rgba(4,107,210,.1)', border: 'rgba(4,107,210,.3)', text: '#046BD2', icon: '#3b82f6' },
};

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const colors = COLORS[toast.type] || COLORS.info;
  const Icon = ICONS[toast.type] || Info;

  const dismiss = () => { setVisible(false); setTimeout(() => onDismiss(toast.id), 200); };
  useEffect(() => { const t = setTimeout(dismiss, toast.duration || 4000); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,.12)', minWidth: 280, maxWidth: 420,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-8px)',
      transition: 'all .2s ease', pointerEvents: 'auto',
    }}>
      <Icon size={18} color={colors.icon} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: colors.text, flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <X size={14} color="#94a3b8" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={dismiss} />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
