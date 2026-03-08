import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Shield, Globe, Hash, Upload, Lock, Map, BarChart2, Radio, Clock, Zap, X, Command, Briefcase, BookOpen, Server, Siren } from 'lucide-react';

const COMMANDS = [
    { id: 'scanner-url', label: 'Scan URL', desc: 'Analyze a URL for malware', icon: Globe, page: 'scanner', color: 'var(--cyan)' },
    { id: 'scanner-file', label: 'Scan File', desc: 'Upload a file for deep analysis', icon: Upload, page: 'scanner', color: 'var(--cyan)' },
    { id: 'scanner-hash', label: 'Hash Lookup', desc: 'Check a SHA-256 or MD5 hash', icon: Hash, page: 'scanner', color: 'var(--cyan)' },
    { id: 'scanner-ip', label: 'IP Scan', desc: 'Check an IP address reputation', icon: Shield, page: 'scanner', color: 'var(--cyan)' },
    { id: 'jobscam', label: 'Job Scam Detector', desc: 'Analyze job offers for employment fraud', icon: Briefcase, page: 'jobscam', color: 'var(--red)' },
    { id: 'cve', label: 'CVE Search', desc: 'Global vulnerability database lookup', icon: Server, page: 'cve', color: 'var(--green)' },
    { id: 'encyclopedia', label: 'Threat Encyclopedia', desc: 'Learn about common cyber attacks', icon: BookOpen, page: 'encyclopedia', color: 'var(--violet)' },
    { id: 'report', label: 'Report Cybercrime', desc: 'India emergency fraud reporting guide', icon: Siren, page: 'report', color: '#ef4444' },
    { id: 'livemap', label: 'Live Threat Map', desc: 'View real-time global attacks', icon: Map, page: 'livemap', color: 'var(--green)' },
    { id: 'dashboard', label: 'Intel Dashboard', desc: 'SOC threat intelligence center', icon: BarChart2, page: 'dashboard', color: '#ffb830' },
    { id: 'crypto', label: 'Data Vault', desc: 'Encrypt, decrypt, hash data', icon: Lock, page: 'crypto', color: 'var(--violet)' },
    { id: 'news', label: 'Cyber News', desc: 'Latest threat intelligence feed', icon: Radio, page: 'news', color: 'var(--violet)' },
    { id: 'history', label: 'Scan Logs', desc: 'View SOC scan history', icon: Clock, page: 'history', color: 'var(--text-2)' },
];

const DEMO_SAMPLES = [
    { label: 'Malware URL', value: 'http://malware-test.wicar.org/data/eicar.com', mode: 'url' },
    { label: 'Clean Domain', value: 'google.com', mode: 'domain' },
    { label: 'EICAR Hash', value: '44d88612fea8a8f36de82e1278abb02f', mode: 'hash' },
    { label: 'Known Bad IP', value: '185.220.101.45', mode: 'ip' },
];

export default function CommandPalette({ nav, onScan, isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) { setQuery(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
    }, [isOpen]);

    useEffect(() => {
        const handler = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') setSelected(p => Math.min(p + 1, filtered.length - 1));
            if (e.key === 'ArrowUp') setSelected(p => Math.max(p - 1, 0));
            if (e.key === 'Enter') { const cmd = filtered[selected]; if (cmd) { nav(cmd.page); onClose(); } }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, selected, query]);

    const filtered = query
        ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.desc.toLowerCase().includes(query.toLowerCase()))
        : COMMANDS;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 9000 }}
                    />
                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: -20 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        style={{
                            position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
                            width: '100%', maxWidth: 580, zIndex: 9001,
                            background: 'rgba(5,8,20,0.97)',
                            border: '1px solid rgba(0,245,255,0.2)',
                            borderRadius: 20, overflow: 'hidden',
                            boxShadow: '0 0 80px rgba(0,245,255,0.1), 0 32px 64px rgba(0,0,0,0.8)',
                        }}
                    >
                        {/* Search input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <Search size={18} color="var(--cyan)" style={{ flexShrink: 0 }} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                                placeholder="Search commands, pages, tools..."
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 16, fontFamily: 'Space Grotesk, sans-serif' }}
                            />
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* Commands list */}
                        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 0' }}>
                            {filtered.length === 0 && (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No commands found for "{query}"</div>
                            )}
                            {filtered.map((cmd, i) => {
                                const Icon = cmd.icon;
                                return (
                                    <div
                                        key={cmd.id}
                                        onClick={() => { nav(cmd.page); onClose(); }}
                                        onMouseEnter={() => setSelected(i)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px',
                                            cursor: 'pointer',
                                            background: selected === i ? 'rgba(0,245,255,0.07)' : 'transparent',
                                            borderLeft: selected === i ? `2px solid ${cmd.color}` : '2px solid transparent',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${cmd.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={16} color={cmd.color} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{cmd.label}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{cmd.desc}</div>
                                        </div>
                                        {selected === i && <ArrowRight size={14} color="var(--cyan)" />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Demo Samples */}
                        <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '.15em', marginBottom: 8 }}>QUICK DEMO SAMPLES</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {DEMO_SAMPLES.map(s => (
                                    <button
                                        key={s.label}
                                        onClick={() => { nav('scanner'); onScan?.(s.value, s.mode); onClose(); }}
                                        style={{
                                            padding: '4px 10px', borderRadius: 'var(--r-full)',
                                            background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)',
                                            color: 'var(--cyan)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer: shortcuts */}
                        <div style={{ padding: '8px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 16, fontSize: 10, color: 'var(--text-3)' }}>
                            <span><kbd style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>↑↓</kbd> Navigate</span>
                            <span><kbd style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>Enter</kbd> Open</span>
                            <span><kbd style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>Esc</kbd> Close</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
