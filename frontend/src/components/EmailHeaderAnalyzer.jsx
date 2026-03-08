import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X, AlertTriangle, Shield, Zap, Copy, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const API = 'https://all-safe-final-j8mc.onrender.com';

function parseHeaders(raw) {
    const lines = raw.split('\n');
    const headers = {};
    let current = '';
    for (const line of lines) {
        if (/^\s+/.test(line)) {
            headers[current] = (headers[current] || '') + ' ' + line.trim();
            continue;
        }
        const m = line.match(/^([^:]+):\s*(.*)$/);
        if (m) { current = m[1].trim(); headers[current] = m[2].trim(); }
    }
    return headers;
}

function analyzeEmailHeaders(raw) {
    const headers = parseHeaders(raw);
    const results = { headers, flags: [], hops: [], auth: { spf: null, dkim: null, dmarc: null } };

    // SPF / DKIM / DMARC
    const authResults = headers['Authentication-Results'] || headers['ARC-Authentication-Results'] || '';
    results.auth.spf = authResults.includes('spf=pass') ? 'PASS' : authResults.includes('spf=fail') ? 'FAIL' : authResults.includes('spf=softfail') ? 'SOFTFAIL' : 'UNKNOWN';
    results.auth.dkim = authResults.includes('dkim=pass') ? 'PASS' : authResults.includes('dkim=fail') ? 'FAIL' : 'UNKNOWN';
    results.auth.dmarc = authResults.includes('dmarc=pass') ? 'PASS' : authResults.includes('dmarc=fail') ? 'FAIL' : 'UNKNOWN';

    // Received hops
    const received = raw.match(/^Received:.*$/gm) || [];
    results.hops = received.map((r, i) => ({
        idx: i + 1, raw: r.slice(10, 90) + (r.length > 90 ? '…' : ''),
    }));

    // Flag analysis
    if (results.auth.spf === 'FAIL') results.flags.push({ type: 'critical', msg: 'SPF check FAILED — sender domain not authorized to send this email' });
    if (results.auth.spf === 'SOFTFAIL') results.flags.push({ type: 'high', msg: 'SPF SOFTFAIL — sender may be unauthorized; domain policy is lenient' });
    if (results.auth.dkim === 'FAIL') results.flags.push({ type: 'high', msg: 'DKIM signature verification FAILED — message likely tampered or forged' });
    if (results.auth.dmarc === 'FAIL') results.flags.push({ type: 'high', msg: 'DMARC policy check FAILED — domain policy not satisfied' });
    if (!headers['From']) results.flags.push({ type: 'medium', msg: 'No From header found — likely a spoofed or malformed email' });

    const from = headers['From'] || '';
    const replyTo = headers['Reply-To'] || '';
    if (replyTo && from) {
        const fromDomain = (from.match(/@([^>\s]+)/) || [])[1] || '';
        const replyToDomain = (replyTo.match(/@([^>\s]+)/) || [])[1] || '';
        if (fromDomain && replyToDomain && fromDomain !== replyToDomain) {
            results.flags.push({ type: 'critical', msg: `Reply-To (${replyToDomain}) differs from From (${fromDomain}) — classic phishing indicator` });
        }
    }
    if (received.length > 8) results.flags.push({ type: 'medium', msg: `Unusually high hop count (${received.length}) — possible relay abuse or obfuscation` });
    if (headers['X-Mailer']?.toLowerCase().includes('bulk')) results.flags.push({ type: 'medium', msg: 'Bulk mailer header detected — may be spam or marketing email' });

    // Overall score
    const criticalCount = results.flags.filter(f => f.type === 'critical').length;
    const highCount = results.flags.filter(f => f.type === 'high').length;
    results.riskLevel = criticalCount >= 1 ? 'CRITICAL' : highCount >= 2 ? 'HIGH' : highCount >= 1 ? 'MEDIUM' : results.flags.length > 0 ? 'LOW' : 'SAFE';

    results.fromAddr = from;
    results.toAddr = headers['To'] || '';
    results.subject = headers['Subject'] || '';
    results.date = headers['Date'] || '';
    results.messageId = headers['Message-ID'] || '';

    return results;
}

const SAMPLE = `Received: from mail.phishing-domain.xyz (mail.phishing-domain.xyz [185.220.101.45])
  by mx.google.com with ESMTP id abc123
From: "Bank Security" <security@phishing-domain.xyz>
Reply-To: attacker@gmail.com
To: victim@gmail.com
Subject: URGENT: Verify your account immediately
Date: Sat, 28 Feb 2026 10:00:00 +0000
Message-ID: <abc123@phishing-domain.xyz>
Authentication-Results: mx.google.com;
  spf=fail (google.com: domain of phishing-domain.xyz does not designate 185.220.101.45 as permitted sender);
  dkim=fail;
  dmarc=fail`;

const authColor = (v) =>
    v === 'PASS' ? 'var(--green)' :
        v === 'FAIL' ? 'var(--red)' :
            v === 'SOFTFAIL' ? '#ffb830' : 'var(--text-3)';

const riskConfig = {
    SAFE: { color: 'var(--green)', icon: ShieldCheck, label: 'Safe' },
    LOW: { color: '#ffb830', icon: Shield, label: 'Low Risk' },
    MEDIUM: { color: '#f97316', icon: ShieldAlert, label: 'Medium Risk' },
    HIGH: { color: 'var(--red)', icon: ShieldAlert, label: 'High Risk' },
    CRITICAL: { color: '#ff0055', icon: ShieldAlert, label: 'CRITICAL' },
};

export default function EmailHeaderAnalyzer() {
    const [raw, setRaw] = useState('');
    const [result, setResult] = useState(null);
    const [aiSummary, setAi] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const analyze = async () => {
        if (!raw.trim()) return;
        const analysis = analyzeEmailHeaders(raw);
        setResult(analysis);
        setAi('');

        // Fetch Gemini AI summary from backend
        setAiLoading(true);
        try {
            const res = await axios.post(`${API}/analyze/email-headers`, {
                raw_headers: raw,
                from_addr: analysis.fromAddr,
                subject: analysis.subject,
                flags: analysis.flags,
                auth: analysis.auth,
            });
            setAi(res.data?.ai_summary || '');
        } catch {
            setAi('AI summary unavailable — backend may be offline.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        const report = `EMAIL HEADER ANALYSIS REPORT\n` +
            `Risk Level: ${result.riskLevel}\n` +
            `From: ${result.fromAddr}\nSubject: ${result.subject}\n` +
            `SPF: ${result.auth.spf} | DKIM: ${result.auth.dkim} | DMARC: ${result.auth.dmarc}\n\n` +
            `Flags:\n${result.flags.map(f => `  [${f.type.toUpperCase()}] ${f.msg}`).join('\n')}\n\n` +
            `AI Summary:\n${aiSummary}`;
        await navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const riskCfg = result ? riskConfig[result.riskLevel] || riskConfig.SAFE : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
                <div className="section-eyebrow" style={{ display: 'inline-flex', marginBottom: 12 }}>
                    <Mail size={12} /> Phishing Detector
                </div>
                <h2 className="syne" style={{ fontSize: 28, fontWeight: 800 }}>
                    Email Header <span className="glow-text">Analyzer</span>
                </h2>
                <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 6 }}>
                    Detect phishing, SPF/DKIM/DMARC failures, and relay abuse with Gemini AI analysis.
                </p>
            </div>

            {/* Input panel */}
            <div className="glass" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.08em' }}>
                        PASTE RAW EMAIL HEADERS
                    </span>
                    <button
                        onClick={() => { setRaw(SAMPLE); setResult(null); setAi(''); }}
                        style={{ fontSize: 11, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Load Phishing Sample →
                    </button>
                </div>
                <textarea
                    value={raw}
                    onChange={e => { setRaw(e.target.value); setResult(null); setAi(''); }}
                    placeholder={`Received: from mail.example.com...\nFrom: sender@example.com\nAuthentication-Results: mx.google.com;\n  spf=pass; dkim=pass; dmarc=pass\n...`}
                    rows={8}
                    style={{
                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '12px 14px', color: 'var(--text-1)', fontSize: 11,
                        fontFamily: 'JetBrains Mono, monospace', resize: 'vertical', outline: 'none',
                        boxSizing: 'border-box', lineHeight: 1.6,
                        transition: 'border-color .3s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.3)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <motion.button
                    onClick={analyze}
                    disabled={!raw.trim()}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="btn-primary"
                    style={{ marginTop: 12, width: '100%', opacity: !raw.trim() ? 0.5 : 1, justifyContent: 'center' }}
                >
                    <Shield size={14} /> ANALYZE WITH GEMINI AI
                </motion.button>
            </div>

            {/* Results */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                    >
                        {/* Risk verdict */}
                        <div className="premium-glass glow-border" style={{
                            padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexWrap: 'wrap', gap: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: '50%',
                                    background: `${riskCfg.color}18`,
                                    border: `2px solid ${riskCfg.color}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <riskCfg.icon size={24} color={riskCfg.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: riskCfg.color }}>{riskCfg.label}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                                        {result.flags.length} threat flag{result.flags.length !== 1 ? 's' : ''} detected
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="btn-ghost"
                                style={{ padding: '8px 16px', fontSize: 11 }}
                            >
                                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Report</>}
                            </button>
                        </div>

                        {/* AI Gemini Summary */}
                        <div style={{
                            padding: 20, borderRadius: 'var(--r-md)',
                            background: 'linear-gradient(135deg, rgba(124,58,237,.12) 0%, rgba(0,245,255,.05) 100%)',
                            border: '1px solid rgba(124,58,237,.25)',
                        }}>
                            <div style={{
                                fontSize: 11, fontWeight: 800, color: 'var(--violet)',
                                letterSpacing: '.12em', marginBottom: 12,
                                display: 'flex', alignItems: 'center', gap: 8
                            }}>
                                <Zap size={13} /> GEMINI AI THREAT ANALYSIS
                            </div>
                            {aiLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', fontSize: 13 }}>
                                    <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} />
                                    Gemini is analyzing headers...
                                </div>
                            ) : aiSummary ? (
                                <p style={{ fontSize: 13.5, color: '#dde6ff', lineHeight: 1.7 }}>{aiSummary}</p>
                            ) : (
                                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Summary will appear after analysis...</p>
                            )}
                        </div>

                        {/* Auth Check Grid */}
                        <div className="glass" style={{ padding: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.15em', marginBottom: 14 }}>
                                AUTHENTICATION RESULTS
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                                {[
                                    { label: 'SPF', val: result.auth.spf, desc: 'Sender Policy Framework' },
                                    { label: 'DKIM', val: result.auth.dkim, desc: 'DomainKeys Identified Mail' },
                                    { label: 'DMARC', val: result.auth.dmarc, desc: 'Domain-based Authentication' },
                                ].map(a => (
                                    <div key={a.label} style={{
                                        textAlign: 'center', padding: '16px 8px', borderRadius: 10,
                                        background: `${authColor(a.val)}10`,
                                        border: `1px solid ${authColor(a.val)}25`,
                                    }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>{a.desc}</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: authColor(a.val), letterSpacing: '.06em' }}>{a.val}</div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: authColor(a.val), marginTop: 2 }}>{a.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Threat Flags */}
                        {result.flags.length > 0 && (
                            <div className="glass" style={{ padding: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--red)', letterSpacing: '.15em', marginBottom: 12 }}>
                                    ⚠ THREAT FLAGS ({result.flags.length})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {result.flags.map((f, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.07 }}
                                            style={{
                                                display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 10,
                                                background: f.type === 'critical' ? 'rgba(255,46,91,0.08)' : f.type === 'high' ? 'rgba(249,115,22,0.08)' : 'rgba(250,204,21,0.06)',
                                                borderLeft: `3px solid ${f.type === 'critical' ? 'var(--red)' : f.type === 'high' ? '#f97316' : '#facc15'}`,
                                            }}
                                        >
                                            <AlertTriangle
                                                size={14}
                                                color={f.type === 'critical' ? 'var(--red)' : f.type === 'high' ? '#f97316' : '#facc15'}
                                                style={{ flexShrink: 0, marginTop: 1 }}
                                            />
                                            <div>
                                                <div style={{
                                                    fontSize: 10, fontWeight: 700, letterSpacing: '.08em', marginBottom: 3,
                                                    color: f.type === 'critical' ? 'var(--red)' : f.type === 'high' ? '#f97316' : '#facc15'
                                                }}>
                                                    {f.type.toUpperCase()}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5 }}>{f.msg}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Headers */}
                        <div className="glass" style={{ padding: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.15em', marginBottom: 12 }}>
                                KEY HEADERS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {[
                                    { label: 'From', val: result.fromAddr },
                                    { label: 'To', val: result.toAddr },
                                    { label: 'Subject', val: result.subject },
                                    { label: 'Date', val: result.date },
                                    { label: 'Message-ID', val: result.messageId },
                                    { label: 'Hops', val: `${result.hops.length} mail server${result.hops.length !== 1 ? 's' : ''}` },
                                ].filter(h => h.val).map(h => (
                                    <div key={h.label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-3)', width: 90, flexShrink: 0 }}>{h.label}</span>
                                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-1)', wordBreak: 'break-all', lineHeight: 1.5 }}>{h.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
