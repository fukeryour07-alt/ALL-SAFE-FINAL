import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Globe, FileSearch, Lock, ChevronRight, ArrowRight, Activity, AlertTriangle } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

const FEATURES = [
    { icon: FileSearch, title: 'Multi-Engine Analysis', desc: 'Cross-reference files against 70+ industry-leading AV engines for 99.9% detection accuracy.', color: 'var(--cyan)' },
    { icon: Globe, title: 'Network Intelligence', desc: 'Real-time reputation evaluation for Domains, URLs, and IPv4/IPv6 exit nodes.', color: 'var(--violet)' },
    { icon: Lock, title: 'Cryptographic Index', desc: 'Instant identification of high-risk binaries via billions of indexed SHA-256 and MD5 hashes.', color: 'var(--green)' },
    { icon: Zap, title: 'Neural Summarization', desc: 'Advanced AI-driven threat modeling providing human-readable risk summaries in seconds.', color: '#ffb830' },
];

const THREAT_OF_DAY = [
    { cve: 'CVE-2024-3400', name: 'PAN-OS Zero-Day', severity: 'CRITICAL', desc: 'Palo Alto firewall command injection — patch immediately' },
    { cve: 'CVE-2024-21762', name: 'Fortinet SSL VPN RCE', severity: 'CRITICAL', desc: 'Unauthenticated remote code execution in FortiOS' },
    { cve: 'CVE-2024-1708', name: 'ConnectWise ScreenConnect', severity: 'CRITICAL', desc: 'Path traversal allows full system compromise' },
    { cve: 'CVE-2023-44487', name: 'HTTP/2 Rapid Reset DDoS', severity: 'HIGH', desc: 'Protocol-level DDoS amplification affecting major providers' },
    { cve: 'CVE-2022-0847', name: 'Dirty Pipe (Linux)', severity: 'HIGH', desc: 'Local privilege escalation via pipe buffer overwrite' },
];

const STATS = [
    { val: '72+', label: 'Detection Modules', color: 'var(--cyan)' },
    { val: '200ms', label: 'API Response Time', color: 'var(--violet)' },
    { val: '99.9%', label: 'Uptime SLA', color: 'var(--green)' },
    { val: '1.2B+', label: 'Signals Analyzed', color: '#ffb830' },
];

const TRUSTED_BY = [
    'CYBER_GRID', 'NODE_SEC', 'APEX_LABS', 'PHALANX', 'QUBIT_INTEL', 'STRATUM',
];

const itemV = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } },
};
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: .12, delayChildren: .3 } },
};

export default function Hero({ nav }) {
    const heroRef = useRef(null);
    const { scrollY } = useScroll();
    const bgY = useTransform(scrollY, [0, 500], [0, 150]);
    const fadeO = useTransform(scrollY, [0, 300], [1, 0]);
    const [todIdx, setTodIdx] = useState(0);

    // Rotate threat-of-day every 6 seconds
    useEffect(() => {
        const t = setInterval(() => setTodIdx(p => (p + 1) % THREAT_OF_DAY.length), 6000);
        return () => clearInterval(t);
    }, []);

    const tod = THREAT_OF_DAY[todIdx];

    return (
        <section ref={heroRef} style={{ minHeight: '100vh', paddingTop: 130, paddingBottom: 80, overflow: 'hidden', position: 'relative' }}>
            {/* Glow orbs */}
            <motion.div style={{ y: bgY, position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <div style={{
                    position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
                    width: 800, height: 800,
                    background: 'radial-gradient(ellipse, rgba(0,245,255,.06) 0%, transparent 65%)',
                    borderRadius: '50%',
                }} />
                <div style={{
                    position: 'absolute', top: '25%', right: '-8%',
                    width: 500, height: 500,
                    background: 'radial-gradient(ellipse, rgba(124,58,237,.09) 0%, transparent 65%)',
                    borderRadius: '50%',
                }} />
                <div style={{
                    position: 'absolute', top: '35%', left: '-5%',
                    width: 400, height: 400,
                    background: 'radial-gradient(ellipse, rgba(0,255,136,.05) 0%, transparent 65%)',
                    borderRadius: '50%',
                }} />
            </motion.div>

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Eyebrow badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}
                    style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}
                >
                    <div className="section-eyebrow" style={{ gap: 10 }}>
                        <span className="status-dot dot-cyan" />
                        Core Intelligence API — Live Threat Intelligence
                        <span style={{
                            marginLeft: 4, padding: '2px 8px', borderRadius: 'var(--r-full)',
                            background: 'rgba(0,245,255,0.15)', fontSize: 9,
                            fontWeight: 900, letterSpacing: '.1em',
                        }}>
                            v2.0
                        </span>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.div style={{ opacity: fadeO, textAlign: 'center', marginBottom: 40 }} variants={stagger} initial="hidden" animate="show">
                    <motion.h1 variants={itemV} className="syne" style={{
                        fontSize: 'clamp(48px, 8vw, 108px)', fontWeight: 900,
                        lineHeight: 0.92, letterSpacing: '-.04em', marginBottom: 16,
                    }}>
                        Defend Your <br />
                        <span className="grad-text">Digital Perimeter</span>
                    </motion.h1>
                    <motion.p variants={itemV} style={{
                        maxWidth: 580, margin: '0 auto 12px',
                        fontSize: 13, fontWeight: 700, color: 'var(--cyan)', opacity: 0.8,
                        letterSpacing: '.4em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace',
                    }}>
                        ENTERPRISE THREAT INTELLIGENCE &amp; RESPONSE
                    </motion.p>
                    <motion.p variants={itemV} style={{
                        maxWidth: 640, margin: '0 auto 48px', fontSize: 17,
                        color: 'var(--text-2)', lineHeight: 1.65, fontWeight: 400,
                    }}>
                        A Unified Cyber Defense Platform combining multi-engine recursion, cryptographic lookup,
                        and AI-driven behavior modeling to neutralize threats before they scale.
                    </motion.p>

                    {/* Threat of the Day Banner */}
                    <motion.div variants={itemV} style={{ marginBottom: 48, display: 'flex', justifyContent: 'center', height: 48 }}>
                        <AnimatePresence mode="wait">
                            <motion.button
                                key={todIdx}
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                                onClick={() => nav('news')}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 'var(--r-full)',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', cursor: 'pointer', maxWidth: '100%'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: tod.severity === 'CRITICAL' ? 'var(--red)' : '#f97316', background: tod.severity === 'CRITICAL' ? 'rgba(255,46,91,0.1)' : 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                                    <AlertTriangle size={10} /> {tod.severity}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{tod.cve}: {tod.name}</span>
                                <span className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-3)' }}>— {tod.desc}</span>
                                <ChevronRight size={14} color="var(--cyan)" style={{ marginLeft: 'auto' }} />
                            </motion.button>
                        </AnimatePresence>
                    </motion.div>

                    {/* CTA buttons */}
                    <motion.div variants={itemV} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.button
                            className="btn-primary"
                            onClick={() => nav('scanner')}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: .96 }}
                        >
                            <Zap size={16} fill="currentColor" />
                            START SCANNING
                            <ArrowRight size={16} />
                        </motion.button>
                        <motion.button
                            className="btn-ghost"
                            onClick={() => nav('livemap')}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: .96 }}
                        >
                            <Activity size={16} />
                            LIVE THREAT MAP
                            <ChevronRight size={16} />
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: .8 }}
                    className="hero-stats"
                >
                    {STATS.map((s, i) => (
                        <div key={s.label} className="hero-stat-item">
                            <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                                {s.val}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginTop: 6, letterSpacing: '.05em' }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Trusted by marquee */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                    style={{ marginTop: 48, textAlign: 'center' }}
                >
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '.25em', marginBottom: 20, textTransform: 'uppercase' }}>
                        Powering the future of defense-tech
                    </div>
                    <div style={{ display: 'flex', gap: 48, justifyContent: 'center', opacity: 0.35, flexWrap: 'wrap' }}>
                        {TRUSTED_BY.map(t => (
                            <span key={t} className="mono" style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.1em' }}>{t}</span>
                        ))}
                    </div>
                </motion.div>

                {/* Cyber divider */}
                <div className="cyber-divider" style={{ margin: '48px 0 32px' }} />

                {/* Feature cards */}
                <motion.div
                    variants={stagger} initial="hidden" animate="show"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}
                >
                    {FEATURES.map(f => {
                        const Icon = f.icon;
                        return (
                            <motion.div
                                key={f.title}
                                variants={itemV}
                                className="glass card-lift"
                                style={{ padding: 28, cursor: 'default' }}
                                whileHover={{ borderColor: f.color + '30', boxShadow: `0 0 30px ${f.color}10` }}
                            >
                                <div style={{
                                    width: 50, height: 50, borderRadius: 14,
                                    background: f.color + '15',
                                    border: `1px solid ${f.color}25`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 18, color: f.color,
                                }}>
                                    <Icon size={22} />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: 'var(--text-1)' }}>{f.title}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{f.desc}</div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
