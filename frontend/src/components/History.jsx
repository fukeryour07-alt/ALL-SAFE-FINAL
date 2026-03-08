import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Clock, RefreshCw, Loader2, Trash2 } from 'lucide-react';

const API = 'https://all-safe-final-j8mc.onrender.com';

const RISK_COLORS = {
    CLEAN: 'var(--green)', LOW: '#ffb830', MEDIUM: '#ff7832', HIGH: 'var(--red)', UNKNOWN: 'var(--text-3)',
};
const RISK_BADGES = {
    CLEAN: 'badge-clean', LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', UNKNOWN: 'badge-unknown',
};

const itemV = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } } };

export default function History() {
    const [rows, setRows] = useState([]);
    const [loading, setLoad] = useState(true);
    const [expanded, setExp] = useState(null);
    const load = async () => {
        setLoad(true);
        try {
            const r = await axios.get(`${API}/history?limit=50`);
            setRows(r.data);
        } catch { setRows([]); }
        finally { setLoad(false); }
    };

    const handleClear = async () => {
        if (!window.confirm("Are you sure you want to permanently delete all SOC logs?")) return;
        try {
            await axios.delete(`${API}/history/clear`);
            setRows([]);
        } catch (e) { console.error("Clear error:", e); }
    };

    useEffect(() => { load(); }, []);

    const fmt = ts => {
        if (!ts) return '—';
        const d = new Date(ts + 'Z');
        return d.toLocaleString();
    };

    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80 }}>
            <div className="container">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div className="section-eyebrow"><Clock size={12} /> Scan History</div>
                        <h1 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-.02em' }}>
                            SOC <span className="glow-text">Logs</span>
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <motion.button
                            className="btn-ghost" onClick={handleClear} whileHover={{ scale: 1.04, color: 'var(--red)' }} whileTap={{ scale: .96 }}
                            style={{ fontSize: 13, borderColor: 'rgba(255,46,91,.2)' }}
                        >
                            <Trash2 size={14} />
                            Clear Data
                        </motion.button>
                        <motion.button
                            className="btn-ghost" onClick={load} whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }}
                            style={{ fontSize: 13 }}
                        >
                            <RefreshCw size={14} style={{ animation: loading ? 'spin-slow .8s linear infinite' : 'none' }} />
                            Refresh
                        </motion.button>
                    </div>
                </motion.div>

                {loading && (
                    <div style={{ textAlign: 'center', color: 'var(--cyan)', padding: '80px 0' }}>
                        <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin-slow .8s linear infinite' }} />
                    </div>
                )}

                {!loading && rows.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ padding: 60, textAlign: 'center' }}>
                        <Clock size={48} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
                        <div style={{ color: 'var(--text-2)', fontSize: 15 }}>No scan history yet. Run your first scan!</div>
                    </motion.div>
                )}

                {!loading && rows.length > 0 && (
                    <motion.div
                        initial="hidden" animate="show"
                        variants={{ show: { transition: { staggerChildren: .06 } } }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                    >
                        {rows.map(row => {
                            const parsed = (() => { try { return JSON.parse(row.result || '{}'); } catch { return {}; } })();
                            const stats = parsed.stats || {};
                            const mal = (stats.malicious || 0) + (stats.suspicious || 0);
                            const total = Object.values(stats).reduce((a, b) => a + b, 0);
                            const isOpen = expanded === row.id;

                            return (
                                <motion.div key={row.id} variants={itemV}>
                                    <div
                                        className="glass"
                                        onClick={() => setExp(isOpen ? null : row.id)}
                                        data-hover=""
                                        style={{ padding: '16px 24px', cursor: 'pointer', borderColor: isOpen ? RISK_COLORS[row.risk] + '30' : 'var(--border)', transition: 'all .3s' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                            {/* Type badge */}
                                            <div style={{
                                                minWidth: 60, padding: '4px 10px', borderRadius: 'var(--r-full)', textAlign: 'center',
                                                background: 'rgba(0,245,255,.08)', border: '1px solid rgba(0,245,255,.15)',
                                                fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--cyan)', textTransform: 'uppercase',
                                                fontFamily: 'JetBrains Mono,monospace',
                                            }}>
                                                {row.type}
                                            </div>

                                            {/* Target */}
                                            <div style={{ flex: 1, fontSize: 13, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-2)', wordBreak: 'break-all', minWidth: 120 }}>
                                                {row.target}
                                            </div>

                                            {/* Detection */}
                                            <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                                {total > 0 ? `${mal}/${total}` : '—'}
                                            </div>

                                            {/* Risk badge */}
                                            <span className={`badge ${RISK_BADGES[row.risk] || 'badge-unknown'}`}>
                                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                                                {row.risk}
                                            </span>

                                            {/* Time */}
                                            <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmt(row.ts)}</div>
                                        </div>

                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: .3 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <pre style={{
                                                        marginTop: 16, padding: 16, borderRadius: 'var(--r-sm)',
                                                        background: 'rgba(0,0,0,.4)', fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
                                                        color: 'var(--text-2)', overflow: 'auto', maxHeight: 300,
                                                        borderLeft: `3px solid ${RISK_COLORS[row.risk]}`,
                                                    }}>
                                                        {JSON.stringify(parsed, null, 2)}
                                                    </pre>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
