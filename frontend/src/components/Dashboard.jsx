import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { BarChart2, ShieldAlert, ShieldCheck, Activity, Database, TrendingUp, Cpu, HardDrive } from 'lucide-react';

const API = 'https://all-safe-final-j8mc.onrender.com';

const itemV = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: .1, delayChildren: .2 } } };

const DonutRing = ({ pct, color, size = 80 }) => {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="6" />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={`${circ}`}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - dash }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: .3 }}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </svg>
    );
};

export default function Dashboard() {
    const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, clean: 0, by_type: {} });
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Try fetching stats
                const sRes = await axios.get(`${API}/stats`).catch(() => null);
                if (sRes) setStats(sRes.data);

                // Try fetching news
                const nRes = await axios.get(`${API}/news`).catch(() => null);
                if (nRes) setNews(nRes.data);
            } catch (e) {
                console.error("Dashboard intel fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const total = stats.total || 0;
    const high = stats.high || 0;
    const medium = stats.medium || 0;
    const clean = stats.clean || 0;
    const cleanPct = total ? Math.round((clean / total) * 100) : 0;
    const highPct = total ? Math.round((high / total) * 100) : 0;
    const mediumPct = total ? Math.round((medium / total) * 100) : 0;
    const byType = stats.by_type || {};

    const kpis = [
        { icon: Database, label: 'Total Scans', val: total, color: 'var(--cyan)', delta: '+Live' },
        { icon: ShieldAlert, label: 'High Risk', val: high, color: 'var(--red)', delta: `${highPct}%` },
        { icon: Activity, label: 'Medium Risk', val: medium, color: '#ff7832', delta: `${mediumPct}%` },
        { icon: ShieldCheck, label: 'Clean Results', val: clean, color: 'var(--green)', delta: `${cleanPct}%` },
    ];

    const typeColors = ['var(--cyan)', 'var(--violet)', 'var(--green)', '#ffb830'];

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--cyan)' }}>
                <div style={{ width: 48, height: 48, border: '2px solid var(--cyan)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin-slow .8s linear infinite' }} />
                <div className="mono" style={{ fontSize: 12, letterSpacing: '.1em' }}>CONNECTING TO SOC COMMAND...</div>
            </div>
        </div>
    );

    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80 }}>
            <div className="container">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="section-eyebrow"><BarChart2 size={12} /> SOC OPERATIONAL COMMAND</div>
                        <h1 className="syne" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-.02em' }}>
                            Threat <span className="glow-text">Intelligence</span> Center
                        </h1>
                        <p style={{ color: 'var(--text-2)', marginTop: 8, fontSize: 15 }}>Consolidated security posture and real-time incident telemetry.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '16px 32px', borderRadius: 'var(--r-md)', background: 'rgba(255,46,91,.05)', border: '1px solid rgba(255,46,91,.2)', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 4 }}>Current Threat Level</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--red)', letterSpacing: '.1em' }}>ELEVATED</div>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: 12, height: 4, borderRadius: 2, background: i <= 4 ? 'var(--red)' : 'rgba(255,255,255,.1)' }} />)}
                        </div>
                    </motion.div>
                </div>

                {/* KPI Grid */}
                <motion.div variants={stagger} initial="hidden" animate="show"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}
                >
                    {kpis.map(k => {
                        const Icon = k.icon;
                        return (
                            <motion.div key={k.label} variants={itemV} className="glass" style={{ padding: 24, background: 'rgba(5,10,25,0.4)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ padding: 8, borderRadius: 8, background: k.color + '15', color: k.color }}><Icon size={18} /></div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: k.color, background: k.color + '10', padding: '2px 8px', borderRadius: 10 }}>{k.delta}</div>
                                </div>
                                <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{k.val.toLocaleString()}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>{k.label}</div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) clamp(260px,340px,100%)', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Posture Analysis */}
                        <motion.div variants={itemV} initial="hidden" animate="show" className="glass" style={{ padding: 28 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.15em', marginBottom: 24 }}>POSTURE ANALYSIS</div>
                            {total === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Waiting for scanner telemetry...</div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
                                    <div style={{ position: 'relative' }}>
                                        <DonutRing pct={cleanPct} color="var(--green)" size={160} />
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--green)' }}>{cleanPct}%</div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.1em' }}>HEALTH</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {[
                                            { label: 'High Severity', count: high, color: 'var(--red)', pct: highPct },
                                            { label: 'Medium Risk', count: medium, color: '#ff7832', pct: mediumPct },
                                            { label: 'Baseline Clean', count: clean, color: 'var(--green)', pct: cleanPct },
                                        ].map(row => (
                                            <div key={row.label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                                                    <span style={{ color: 'var(--text-2)' }}>{row.label.toUpperCase()}</span>
                                                    <span className="mono" style={{ color: row.color }}>{row.count}</span>
                                                </div>
                                                <div className="progress-bar" style={{ height: 4 }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${row.pct}%` }} transition={{ duration: 1.5 }}
                                                        style={{ height: '100%', background: row.color, borderRadius: 2 }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flexWrap: 'wrap' }}>
                            <div className="glass" style={{ padding: 24 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 20 }}>ATTACK VECTORS</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {Object.entries(byType).length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No data logged.</div> :
                                        Object.entries(byType).map(([type, count], i) => (
                                            <div key={type}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                                                    <span className="mono" style={{ color: typeColors[i % 4] }}>{type.toUpperCase()}</span>
                                                    <span style={{ color: 'var(--text-3)' }}>{count}</span>
                                                </div>
                                                <div style={{ height: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / total) * 100}%` }} style={{ height: '100%', background: typeColors[i % 4], borderRadius: 2 }} />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <div className="glass" style={{ padding: 24 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 20 }}>SYSTEM RESOURCES</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {[
                                        { label: 'CENTRAL_PROC', val: Math.round(stats.system_resources?.cpu || 14), icon: Cpu },
                                        { label: 'MEMORY_ALLOC', val: Math.round(stats.system_resources?.mem || 32), icon: Database },
                                        { label: 'STORAGE_VAULT', val: Math.round(stats.system_resources?.disk || 42), icon: HardDrive }
                                    ].map(res => {
                                        const Icon = res.icon;
                                        return (
                                            <div key={res.label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                                                    <span style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={10} /> {res.label}</span>
                                                    <span className="mono" style={{ color: 'var(--cyan)' }}>{res.val}%</span>
                                                </div>
                                                <div style={{ height: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                                    <div style={{ height: '100%', background: 'var(--cyan)', width: `${res.val}%`, borderRadius: 2, opacity: 0.6 }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* News Sidebar */}
                    <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', background: 'rgba(2,6,23,0.6)' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--violet)', letterSpacing: '.15em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={14} /> LIVE THREAT INTEL
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 600 }}>
                            {news.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Fetching global logs...</div> :
                                news.map((item, i) => (
                                    <motion.a key={i} href={item.link} target="_blank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        style={{ textDecoration: 'none', display: 'block', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--cyan)', marginBottom: 6 }}>{item.tag}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 4 }}>{item.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{item.summary ? item.summary.slice(0, 120) + (item.summary.length > 120 ? '...' : '') : ''}</div>
                                    </motion.a>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
