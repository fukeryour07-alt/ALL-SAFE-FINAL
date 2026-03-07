import { motion } from 'framer-motion';
import { Shield, Command, Zap } from 'lucide-react';

const tabs = [
    { id: 'hero', label: 'HOME', key: 'H' },
    { id: 'scanner', label: 'SCAN', key: 'S' },
    { id: 'livemap', label: 'MAP', key: 'M' },
    { id: 'dashboard', label: 'INTEL', key: 'I' },
    { id: 'crypto', label: 'VAULT', key: 'V' },
    { id: 'news', label: 'NEWS', key: 'N' },
    { id: 'history', label: 'LOGS', key: 'L' },
    { id: 'jobscam', label: 'JOB SCAM', key: 'J', alert: true },
];

export default function Navbar({ page, nav, scrolled, cmdOpen, threatScore }) {
    return (
        <motion.header
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                transition: 'all .4s ease',
                background: scrolled ? 'rgba(2,6,23,0.92)' : 'transparent',
                backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(0,245,255,0.08)' : '1px solid transparent',
                padding: scrolled ? '10px 0' : '20px 0',
            }}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: .7, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

                {/* Logo */}
                <motion.button
                    onClick={() => nav('hero')}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: .96 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', flexShrink: 0 }}
                >
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute', inset: -5,
                            background: 'radial-gradient(circle, rgba(0,245,255,.35), transparent 70%)',
                            borderRadius: '50%', animation: 'pulse-dot 2.5s ease-out infinite',
                        }} />
                        <Shield size={24} color="var(--cyan)" />
                    </div>
                    <span className="syne" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.01em', color: 'var(--text-1)' }}>
                        ALL<span style={{ color: 'var(--cyan)' }}> SAFE</span>
                    </span>
                </motion.button>

                {/* Nav tabs */}
                <nav style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-full)', padding: '4px',
                }}>
                    {tabs.map(t => (
                        <motion.button
                            key={t.id}
                            onClick={() => nav(t.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: .95 }}
                            title={`Shortcut: ${t.key}`}
                            style={{
                                padding: '7px 14px', borderRadius: 'var(--r-full)', border: 'none',
                                background: page === t.id
                                    ? (t.alert ? 'var(--red)' : 'var(--cyan)')
                                    : 'transparent',
                                color: page === t.id ? '#000' : (t.alert ? 'var(--red)' : 'var(--text-2)'),
                                fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
                                fontFamily: 'Space Grotesk, sans-serif',
                                transition: 'color .25s ease',
                                position: 'relative',
                            }}
                        >
                            {t.label}
                            {t.alert && page !== t.id && (
                                <span style={{ position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
                            )}
                            {page === t.id && (
                                <motion.div
                                    layoutId="active-nav"
                                    style={{
                                        position: 'absolute', inset: 0,
                                        background: 'var(--cyan)',
                                        borderRadius: 'var(--r-full)', zIndex: -1,
                                    }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </nav>

                {/* Right controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Live threat counter */}
                    <motion.div
                        title="Total threats detected today"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 'var(--r-full)',
                            background: 'rgba(255,46,91,0.08)', border: '1px solid rgba(255,46,91,0.2)',
                            cursor: 'default',
                        }}
                    >
                        <Zap size={11} color="var(--red)" />
                        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)' }}>
                            {(threatScore || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '.05em', fontWeight: 600 }}>THREATS</span>
                    </motion.div>

                    {/* Command palette trigger */}
                    <motion.button
                        onClick={cmdOpen}
                        whileHover={{ scale: 1.05, borderColor: 'rgba(0,245,255,0.4)' }}
                        whileTap={{ scale: .95 }}
                        title="Command Palette (Ctrl+K)"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 'var(--r-full)',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                            color: 'var(--text-2)', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            transition: 'all 0.2s',
                        }}
                    >
                        <Command size={12} />
                        <span className="hide-tablet">K</span>
                    </motion.button>

                    {/* Status pill */}
                    <motion.div
                        whileHover={{ scale: 1.04 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 'var(--r-full)',
                            background: 'rgba(0,255,136,.06)', border: '1px solid rgba(0,255,136,.18)',
                            fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: 'var(--green)',
                            fontFamily: 'JetBrains Mono, monospace',
                            cursor: 'default',
                        }}
                    >
                        <span className="status-dot dot-green" />
                        <span className="hide-tablet">ONLINE</span>
                    </motion.div>
                </div>
            </div>
        </motion.header>
    );
}
