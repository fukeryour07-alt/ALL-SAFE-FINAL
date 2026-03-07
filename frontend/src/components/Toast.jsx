import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Info, X, Zap, AlertTriangle } from 'lucide-react';

const ToastCtx = createContext(null);

const ICONS = {
    critical: ShieldAlert,
    high: AlertTriangle,
    success: ShieldCheck,
    info: Info,
    threat: Zap,
};
const COLORS = {
    critical: { bg: 'rgba(255,46,91,0.12)', border: 'rgba(255,46,91,0.4)', icon: '#ff2e5b', bar: 'var(--red)' },
    high: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)', icon: '#f97316', bar: '#f97316' },
    success: { bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.3)', icon: 'var(--green)', bar: 'var(--green)' },
    info: { bg: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.25)', icon: 'var(--cyan)', bar: 'var(--cyan)' },
    threat: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.35)', icon: '#a855f7', bar: '#a855f7' },
};

let _addToast = null;
export const toast = {
    critical: (title, msg) => _addToast?.({ type: 'critical', title, msg }),
    high: (title, msg) => _addToast?.({ type: 'high', title, msg }),
    success: (title, msg) => _addToast?.({ type: 'success', title, msg }),
    info: (title, msg) => _addToast?.({ type: 'info', title, msg }),
    threat: (title, msg) => _addToast?.({ type: 'threat', title, msg }),
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type, title, msg }) => {
        const id = Date.now() + Math.random();
        setToasts(p => [...p.slice(-4), { id, type, title, msg }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
    }, []);

    _addToast = addToast;

    const remove = (id) => setToasts(p => p.filter(t => t.id !== id));

    return (
        <ToastCtx.Provider value={addToast}>
            {children}
            {/* Toast container */}
            <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
                <AnimatePresence>
                    {toasts.map(t => {
                        const c = COLORS[t.type] || COLORS.info;
                        const Icon = ICONS[t.type] || Info;
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                style={{
                                    pointerEvents: 'all',
                                    width: 320,
                                    background: c.bg,
                                    border: `1px solid ${c.border}`,
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${c.border}`,
                                }}
                            >
                                {/* Progress bar */}
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 5, ease: 'linear' }}
                                    style={{ height: 2, background: c.bar, borderRadius: '2px 2px 0 0' }}
                                />
                                <div style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c.icon}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={16} color={c.icon} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: c.icon, letterSpacing: '.05em', marginBottom: 2 }}>{t.title}</div>
                                        {t.msg && <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>{t.msg}</div>}
                                    </div>
                                    <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                                        <X size={13} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastCtx.Provider>
    );
}

export function useToast() {
    return useContext(ToastCtx);
}
