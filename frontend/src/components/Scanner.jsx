import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    Upload, Link2, Hash, Globe, Search, X, Loader2,
    ShieldCheck, ShieldAlert, Shield, ChevronRight, Copy, Check, Phone, Monitor, Zap, Mail, Play
} from 'lucide-react';
import { toast } from './Toast';

const API = 'http://localhost:8000';

const MODES = [
    { id: 'url', icon: Link2, label: 'URL Scan', ph: 'https://example.com' },
    { id: 'file', icon: Upload, label: 'File Upload', ph: null },
    { id: 'hash', icon: Hash, label: 'Hash Lookup', ph: 'SHA-256 or MD5 hash...' },
    { id: 'domain', icon: Globe, label: 'Domain Intel', ph: 'example.com' },
    { id: 'ip', icon: Monitor, label: 'IP Scan', ph: '192.168.1.1' },
    { id: 'phone', icon: Phone, label: 'Phone Scan', ph: '+1 234 567 8900' },
    { id: 'identity', icon: Mail, label: 'BreachScan', ph: 'user@example.com' },
];

const RISK_MAP = {
    CLEAN: { color: 'var(--green)', icon: ShieldCheck, badge: 'badge-clean', label: 'CLEAN' },
    LOW: { color: '#ffb830', icon: Shield, badge: 'badge-low', label: 'LOW RISK' },
    MEDIUM: { color: '#ff7832', icon: ShieldAlert, badge: 'badge-medium', label: 'MEDIUM RISK' },
    HIGH: { color: 'var(--red)', icon: ShieldAlert, badge: 'badge-high', label: 'HIGH RISK' },
    UNKNOWN: { color: 'var(--text-2)', icon: Shield, badge: 'badge-unknown', label: 'UNKNOWN' },
};

const itemV = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } },
};

const DEMO_SAMPLES = [
    { label: '🔴 Malware URL', value: 'http://malware-test.wicar.org/data/eicar.com', mode: 'url' },
    { label: '🟢 Clean Domain', value: 'google.com', mode: 'domain' },
    { label: '🔵 Hash Lookup', value: '44d88612fea8a8f36de82e1278abb02f', mode: 'hash' },
    { label: '🟡 IP Scan', value: '8.8.8.8', mode: 'ip' },
    { label: '🟣 BreachScan', value: 'test@example.com', mode: 'identity' },
];

export default function Scanner({ demoInput, onDemoConsumed }) {
    const [mode, setMode] = useState('url');
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoad] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [drag, setDrag] = useState(false);
    const fileRef = useRef(null);

    // Demo mode: accept prefilled input from command palette
    useEffect(() => {
        if (demoInput?.val) {
            setMode(demoInput.mode || 'url');
            setInput(demoInput.val);
            onDemoConsumed?.();
        }
    }, [demoInput]);


    const reset = () => { setResult(null); setError(''); setInput(''); setFile(null); };

    const handleScan = async () => {
        setLoad(true); setError(''); setResult(null);
        toast.info('Scan Started', `Analyzing ${mode.toUpperCase()} across 70+ engines...`);
        try {
            let res;
            if (mode === 'url') res = await axios.post(`${API}/scan/url`, { url: input });
            if (mode === 'hash') res = await axios.post(`${API}/scan/hash`, { hash: input });
            if (mode === 'domain') res = await axios.post(`${API}/scan/domain`, { domain: input });
            if (mode === 'ip') res = await axios.post(`${API}/scan/ip`, { ip: input });
            if (mode === 'phone') res = await axios.post(`${API}/scan/phone`, { phone: input });
            if (mode === 'identity') res = await axios.post(`${API}/scan/identity`, { email: input });
            if (mode === 'file') {
                const fd = new FormData(); fd.append('file', file);
                res = await axios.post(`${API}/scan/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            if (!res) throw new Error("Invalid scan mode selected.");
            setResult(res.data);
            // Toast based on risk
            const risk = res.data?.risk;
            if (risk === 'HIGH' || risk === 'MEDIUM') {
                toast.critical('THREAT DETECTED', `${risk} risk — ${res.data.stats?.malicious || 0} engines flagged this target`);
            } else if (risk === 'CLEAN') {
                toast.success('SCAN COMPLETE', 'Target is clean — no threats detected across all engines');
            } else {
                toast.info('SCAN COMPLETE', 'Analysis finished. Review results below.');
            }
        } catch (e) {
            const errDetail = e.response?.data?.detail || e.message || 'Scan failed.';
            setError(errDetail);
            if (e.message === "Network Error") {
                toast.high('CONNECTION FAILED', 'Could not connect to backend. Is it running on port 8000?');
            } else {
                toast.high('SCAN FAILED', errDetail);
            }
        } finally {
            setLoad(false);
        }
    };


    const copyResult = () => {
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const downloadReport = () => {
        const currentRisk = result?.risk && RISK_MAP[result.risk] ? RISK_MAP[result.risk] : RISK_MAP.UNKNOWN;
        const currentStats = result?.stats || {};
        const currentTotal = Object.values(currentStats).reduce((a, b) => a + b, 0) || 0;
        const currentMal = (currentStats.malicious || 0) + (currentStats.suspicious || 0);

        const content = `==========================================================\n` +
            `    ALL SAFE SOC — THREAT INTELLIGENCE REPORT v2.0\n` +
            `==========================================================\n\n` +
            `Timestamp: ${new Date().toLocaleString()}\n` +
            `Type: ${mode.toUpperCase()}\n` +
            `Target: ${result?.url || result?.filename || result?.hash || result?.domain || result?.ip || result?.phone || result?.email || 'Unknown'}\n` +
            `Risk Level: ${currentRisk.label}\n` +
            `Detections: ${currentMal}/${currentTotal}\n\n` +
            `AI Summary:\n${result?.ai_summary || 'N/A'}\n\n` +
            `Raw JSON Data:\n${JSON.stringify(result, null, 2)}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${Date.now()}.txt`;
        a.click();
    };

    const onDrop = useCallback((e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) { setFile(f); setMode('file'); }
    }, []);

    const risk = result?.risk && RISK_MAP[result.risk] ? RISK_MAP[result.risk] : RISK_MAP.UNKNOWN;
    const RIcon = risk.icon;
    const stats = result?.stats || {};
    const total = Object.values(stats).reduce((a, b) => a + b, 0) || 0;
    const mal = (stats.malicious || 0) + (stats.suspicious || 0);
    const pct = total ? Math.round((mal / total) * 100) : 0;

    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80 }}>
            <div className="container" style={{ maxWidth: 900 }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div className="section-eyebrow" style={{ display: 'inline-flex' }}>
                        <Search size={12} />
                        Core Intelligence Analysis
                    </div>
                    <h1 className="syne" style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, letterSpacing: '-.02em' }}>
                        Threat <span className="glow-text">Scanner</span>
                    </h1>
                    <p style={{ color: 'var(--text-2)', marginTop: 12, fontSize: 15.5 }}>
                        Real-time malware detection across 70+ antivirus engines.
                    </p>
                </motion.div>

                {/* Mode selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
                    style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}
                >
                    {MODES.map(m => {
                        const Icon = m.icon;
                        const active = mode === m.id;
                        return (
                            <motion.button
                                key={m.id}
                                onClick={() => { setMode(m.id); reset(); }}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 20px', borderRadius: 'var(--r-full)',
                                    background: active ? 'var(--cyan)' : 'rgba(255,255,255,.04)',
                                    border: active ? 'none' : '1px solid var(--border)',
                                    color: active ? '#000' : 'var(--text-2)',
                                    fontWeight: 600, fontSize: 13, letterSpacing: '.04em',
                                    transition: 'all .2s ease',
                                }}
                            >
                                <Icon size={14} />
                                {m.label}
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Demo quick samples */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}
                >
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.12em' }}>DEMO:</span>
                    {DEMO_SAMPLES.map(s => (
                        <motion.button
                            key={s.label}
                            onClick={() => { setMode(s.mode); setInput(s.value); reset(); setInput(s.value); }}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '4px 12px', borderRadius: 'var(--r-full)', border: '1px solid rgba(0,245,255,0.2)',
                                background: 'rgba(0,245,255,0.06)', color: 'var(--cyan)', fontSize: 11,
                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            }}
                        >
                            <Play size={9} /> {s.label}
                        </motion.button>
                    ))}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }}>
                    {mode === 'file' ? (
                        <div
                            onDragEnter={() => setDrag(true)}
                            onDragLeave={() => setDrag(false)}
                            onDragOver={e => e.preventDefault()}
                            onDrop={onDrop}
                            onClick={() => fileRef.current.click()}
                            className={`glass glow-border ${drag ? 'active' : ''}`}
                            style={{
                                padding: '64px 32px', textAlign: 'center', cursor: 'pointer',
                                background: 'rgba(5,10,25,0.4)',
                                transition: 'all .3s ease',
                            }}
                        >
                            <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                            <motion.div animate={{ y: drag ? -8 : 0 }} transition={{ type: 'spring', stiffness: 200 }}>
                                <Upload size={48} color={file ? 'var(--green)' : 'var(--cyan)'} style={{ margin: '0 auto 20px', filter: 'drop-shadow(0 0 10px var(--cyan))' }} />
                            </motion.div>
                            {file
                                ? <div><div style={{ fontWeight: 800, fontSize: 18, color: 'var(--green)' }}>{file.name}</div><div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>{(file.size / 1024).toFixed(1)} KB — READY FOR ANALYSIS</div></div>
                                : <div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, letterSpacing: '-0.01em' }}>DRAG COMMAND FILE HERE</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.1em' }}>SECURE UPLOAD • MAX 32MB</div></div>
                            }
                        </div>
                    ) : (
                        <div className="glass-flat" style={{ padding: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                className="nx-input"
                                style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 20px', fontSize: 15 }}
                                placeholder={MODES.find(m2 => m2.id === mode)?.ph}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleScan()}
                            />
                            {input && <button onClick={() => setInput('')} style={{ color: 'var(--text-3)', background: 'none', padding: 8 }}><X size={16} /></button>}
                        </div>
                    )}

                    {/* Scan button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                        <motion.button
                            className="btn-primary"
                            onClick={handleScan}
                            disabled={loading || (mode === 'file' ? !file : !input.trim())}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: .96 }}
                            style={{ opacity: loading || (mode === 'file' ? !file : !input.trim()) ? .5 : 1 }}
                        >
                            {loading
                                ? <><Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> ANALYZING...</>
                                : <><Search size={16} /> SCAN NOW</>
                            }
                        </motion.button>
                    </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            style={{ marginTop: 24, padding: 16, borderRadius: 'var(--r-md)', background: 'rgba(255,46,91,.08)', border: '1px solid rgba(255,46,91,.2)', color: 'var(--red)', fontSize: 13 }}
                        >
                            ⚠ {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading indicator */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="glass" style={{ marginTop: 32, padding: 40, textAlign: 'center' }}
                        >
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ width: 64, height: 64, margin: '0 auto 16px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--cyan)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin-slow .8s linear infinite' }} />
                                    <Shield size={24} color="var(--cyan)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                                </div>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--cyan)', marginBottom: 8 }}>Scanning across 70+ engines...</div>
                            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>This may take 15–45 seconds for new files</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                            style={{ marginTop: 32 }}
                        >
                            {/* Risk verdict */}
                            <div className="premium-glass glow-border" style={{ padding: 40, marginBottom: 24, boxShadow: `0 0 80px ${risk.color}15` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 1.5, ease: 'easeInOut' }}
                                            style={{ width: 72, height: 72, borderRadius: '50%', background: risk.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: risk.color }}
                                        >
                                            <RIcon size={32} />
                                        </motion.div>
                                        <div>
                                            <div style={{ fontSize: 28, fontWeight: 800, color: risk.color, letterSpacing: '-.01em' }}>{risk.label}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                                                {result.url || result.filename || result.hash || result.domain || result.ip || result.phone || result.email}
                                            </div>
                                            {result.cached && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>⚡ Cached result (file already known)</div>}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 48, fontWeight: 800, color: risk.color, lineHeight: 1 }}>{mal}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>of {total} engines flagged</div>
                                        <div style={{ marginTop: 12 }}><span className={`badge ${risk.badge}`}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />{pct}% DETECTION</span></div>
                                    </div>
                                </div>

                                {result.ai_summary && (
                                    <div style={{ marginTop: -8, marginBottom: 20, padding: 24, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg, rgba(124,58,237,.15) 0%, rgba(0,245,255,.05) 100%)', border: '1px solid rgba(124,58,237,.3)', boxShadow: '0 4px 24px rgba(124,58,237,.1)' }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                                            <Zap size={16} color="var(--violet)" /> AI Intelligence Briefing
                                        </div>
                                        <div style={{ fontSize: 14.5, color: '#e0e0e0', lineHeight: 1.6 }}>{result.ai_summary}</div>
                                    </div>
                                )}

                                {/* Detection bars */}
                                {total > 0 && (
                                    <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {[
                                            { label: 'Malicious', val: stats.malicious || 0, cls: 'fill-high', color: 'var(--red)' },
                                            { label: 'Suspicious', val: stats.suspicious || 0, cls: 'fill-medium', color: '#ff7832' },
                                            { label: 'Harmless', val: stats.harmless || 0, cls: 'fill-clean', color: 'var(--green)' },
                                            { label: 'Undetected', val: stats.undetected || 0, cls: 'fill-low', color: 'var(--text-3)' },
                                        ].map(s => (
                                            <div key={s.label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                                                    <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
                                                    <span className="mono">{s.val}</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <motion.div
                                                        className={`progress-fill ${s.cls}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: total ? `${(s.val / total) * 100}%` : '0%' }}
                                                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: .3 }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Extra data for domain/phone/ip */}
                            {result.domain && result.reputation !== undefined && (
                                <div className="glass" style={{ padding: 24, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
                                    <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Reputation</div><div style={{ fontSize: 22, fontWeight: 700, color: result.reputation >= 0 ? 'var(--green)' : 'var(--red)' }}>{result.reputation}</div></div>
                                    <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Registrar</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{result.registrar || '—'}</div></div>
                                    <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Categories</div><div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{Object.values(result.categories || {}).join(', ') || '—'}</div></div>
                                </div>
                            )}

                            {result.ip && result.reputation !== undefined && (
                                <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 20 }}>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Reputation</div><div style={{ fontSize: 22, fontWeight: 700, color: result.reputation >= 0 ? 'var(--green)' : 'var(--red)' }}>{result.reputation}</div></div>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Country</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{result.country || '—'}</div></div>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>AS Owner</div><div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{result.as_owner || '—'}</div></div>
                                    </div>

                                    {result.whois && Object.keys(result.whois).length > 0 && (
                                        <div style={{ marginTop: 24, padding: 16, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={14} color="var(--cyan)" /> WHOIS Data</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                                                <div><span style={{ color: 'var(--text-3)' }}>Registrar:</span> {result.whois.registrar || 'N/A'}</div>
                                                <div><span style={{ color: 'var(--text-3)' }}>Organization:</span> {result.whois.org || 'N/A'}</div>
                                                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-3)' }}>Created:</span> {result.whois.creation_date || 'N/A'}</div>
                                            </div>
                                        </div>
                                    )}

                                    {result.nmap && result.nmap.length > 0 && (
                                        <div style={{ marginTop: 16, padding: 16, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Hash size={14} color="var(--violet)" /> Open Ports (NMAP Scan)</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {result.nmap.map(p => (
                                                    <span key={p.port} style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(124,58,237,.1)', color: 'var(--violet)', fontSize: 12, fontWeight: 600 }}>
                                                        {p.port} / {p.service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {result.ipinfo && result.ipinfo.loc && (
                                        <div style={{ marginTop: 16, padding: 16, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={14} color="var(--cyan)" /> Exact Location Tracking (ipinfo.io)</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(100px, 1fr)', gap: 12, fontSize: 13, marginBottom: 16 }}>
                                                <div><span style={{ color: 'var(--text-3)' }}>City:</span> {result.ipinfo.city || 'Unknown'}</div>
                                                <div><span style={{ color: 'var(--text-3)' }}>Region:</span> {result.ipinfo.region || 'Unknown'}</div>
                                                <div><span style={{ color: 'var(--text-3)' }}>Postal:</span> {result.ipinfo.postal || 'Unknown'}</div>
                                                <div><span style={{ color: 'var(--text-3)' }}>Org:</span> <span className="mono">{result.ipinfo.org || 'Unknown'}</span></div>
                                            </div>
                                            <div style={{ width: '100%', height: 260, borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <iframe
                                                    title="IP Location Map"
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    allowFullScreen
                                                    src={`https://maps.google.com/maps?q=${result.ipinfo.loc}&z=12&output=embed`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {result.email && (
                                <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Mail size={16} color="var(--violet)" /> Identity Exposure Results
                                    </div>
                                    {result.breach_count > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'rgba(255,46,91,.06)', border: '1px solid rgba(255,46,91,.2)', color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>
                                                ⚠ Internal records show this email was found in {result.breach_count} known data breaches.
                                            </div>
                                            {result.found_in.map((b, bi) => (
                                                <div key={bi} style={{ padding: '12px 16px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{b.source}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Exposed Data: {b.data}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '24px 16px', borderRadius: 'var(--r-md)', background: 'rgba(0,255,136,.06)', border: '1px solid rgba(0,255,136,.2)', textAlign: 'center' }}>
                                            <ShieldCheck size={32} color="var(--green)" style={{ margin: '0 auto 12px' }} />
                                            <div style={{ color: 'var(--green)', fontWeight: 700 }}>No known exposures found in indexed breaches.</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {result.phone && (
                                <div className="glass" style={{ padding: 24, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Country</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{result.region || 'Unknown'}</div></div>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Carrier</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{result.carrier || '—'}</div></div>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Spam Score</div><div style={{ fontSize: 16, fontWeight: 700, color: result.spam_score > 50 ? 'var(--red)' : 'var(--green)' }}>{result.spam_score || 0}%</div></div>
                                    </div>
                                    {result.danger_explanation && (
                                        <div style={{ padding: 16, borderRadius: 'var(--r-md)', background: result.risk === 'HIGH' ? 'rgba(255,46,91,.08)' : 'rgba(255,184,48,.08)', border: `1px solid ${result.risk === 'HIGH' ? 'rgba(255,46,91,.2)' : 'rgba(255,184,48,.2)'}`, color: result.risk === 'HIGH' ? 'var(--red)' : '#ffb830', fontSize: 13, lineHeight: 1.5 }}>
                                            <strong>{result.risk === 'HIGH' ? 'CRITICAL:' : 'Warning:'}</strong> {result.danger_explanation}
                                        </div>
                                    )}
                                    {result.osint_links && result.osint_links.length > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>OSINT Databases & Analysis</div>
                                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                {result.osint_links.map(l => (
                                                    <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', borderRadius: 'var(--r-full)', background: 'rgba(0,255,136,.1)', border: '1px solid rgba(0,255,136,.3)', color: 'var(--green)', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                                        {l.name} <Link2 size={12} />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Engine results snippet */}
                            {result.engine_results && Object.keys(result.engine_results).length > 0 && (
                                <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Engine Results (malicious & suspicious only)</span>
                                        <button onClick={copyResult} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 11 }}>
                                            {copied ? <><Check size={12} /> COPIED</> : <><Copy size={12} /> COPY JSON</>}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                                        {Object.entries(result.engine_results)
                                            .filter(([, v]) => v.category === 'malicious' || v.category === 'suspicious')
                                            .slice(0, 15)
                                            .map(([engine, v]) => (
                                                <div key={engine} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.02)', borderLeft: `3px solid ${v.category === 'malicious' ? 'var(--red)' : '#ff7832'}` }}>
                                                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{engine}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span className={`badge ${v.category === 'malicious' ? 'badge-high' : 'badge-medium'}`} style={{ fontSize: 10 }}>{v.result || v.category}</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button className="btn-ghost" onClick={copyResult} style={{ fontSize: 13 }}>{copied ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy JSON</>}</button>
                                <button className="btn-primary" onClick={downloadReport} style={{ fontSize: 13, padding: '10px 24px' }}><Upload size={14} /> Download Report</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section >
    );
}
