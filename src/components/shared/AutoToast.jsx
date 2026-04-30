import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Bootstrap 5-style alert variants
const VARIANTS = {
  success:  { icon: CheckCircle2, bg: 'bg-[#d1e7dd]', border: 'border-[#badbcc]', text: 'text-[#0f5132]', iconColor: 'text-[#0f5132]' },
  danger:   { icon: XCircle,      bg: 'bg-[#f8d7da]', border: 'border-[#f5c2c7]', text: 'text-[#842029]', iconColor: 'text-[#842029]' },
  warning:  { icon: AlertTriangle,bg: 'bg-[#fff3cd]', border: 'border-[#ffecb5]', text: 'text-[#664d03]', iconColor: 'text-[#664d03]' },
  info:     { icon: Info,         bg: 'bg-[#cff4fc]', border: 'border-[#b6effb]', text: 'text-[#055160]', iconColor: 'text-[#055160]' },
  // Semantic aliases used around the codebase
  error:    { icon: XCircle,      bg: 'bg-[#f8d7da]', border: 'border-[#f5c2c7]', text: 'text-[#842029]', iconColor: 'text-[#842029]' },
  repo:     { icon: CheckCircle2, bg: 'bg-[#d1e7dd]', border: 'border-[#badbcc]', text: 'text-[#0f5132]', iconColor: 'text-[#0f5132]' },
  commit:   { icon: CheckCircle2, bg: 'bg-[#d1e7dd]', border: 'border-[#badbcc]', text: 'text-[#0f5132]', iconColor: 'text-[#0f5132]' },
  file:     { icon: Info,         bg: 'bg-[#cff4fc]', border: 'border-[#b6effb]', text: 'text-[#055160]', iconColor: 'text-[#055160]' },
  notification: { icon: Info,     bg: 'bg-[#cff4fc]', border: 'border-[#b6effb]', text: 'text-[#055160]', iconColor: 'text-[#055160]' },
};

let _listeners = [];
export function showAutoToast(msg) {
  _listeners.forEach(fn => fn(msg));
}
export function subscribeAutoToast(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

export function AutoToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = subscribeAutoToast((msg) => {
      const id = Math.random().toString(16).slice(2);
      setToasts(prev => [...prev, { id, ...msg }]);
      // Auto-dismiss after 5 seconds as required
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    });
    return unsub;
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-5 right-5 z-[300] flex flex-col gap-2 w-80 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => {
          const variant = VARIANTS[t.type] || VARIANTS.info;
          const Icon = variant.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.22 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded border ${variant.bg} ${variant.border} ${variant.text} shadow-md`}
              role="alert"
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${variant.iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{t.title}</p>
                {t.message && <p className="text-xs mt-0.5 leading-snug opacity-90">{t.message}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className={`shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity ${variant.text}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
