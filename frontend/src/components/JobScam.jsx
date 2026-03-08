import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    Briefcase, AlertTriangle, ShieldCheck, ShieldAlert, Shield,
    Search, Loader2, Globe, FileText, X, ChevronRight, Zap, Copy, Check, ExternalLink
} from 'lucide-react';
import { toast } from './Toast';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const SCAM_INDICATORS = [
    { id: 'upfront_payment', label: 'Asks for upfront payment / registration fee', weight: 25 },
    { id: 'too_good_salary', label: 'Salary unrealistically high for role (e.g. ₹50k/month for simple data entry)', weight: 20 },
    { id: 'work_from_home', label: 'WFH with no interview required', weight: 15 },
    { id: 'no_company_details', label: 'No company name, address, or verifiable contact', weight: 20 },
    { id: 'whatsapp_only', label: 'Only WhatsApp / Telegram contact, no official email', weight: 15 },
    { id: 'personal_info', label: 'Asks for Aadhaar, PAN, or bank details upfront', weight: 25 },
    { id: 'urgent_pressure', label: 'Extreme urgency — "join today or lose the spot"', weight: 10 },
    { id: 'poor_writing', label: 'Very poor grammar, spelling mistakes, generic description', weight: 5 },
    { id: 'gmail_sender', label: 'HR email is gmail.com, yahoo.com — not a company domain', weight: 15 },
];

const EXAMPLE_SCAMS = [
    {
        title: 'Fake Data Entry Job',
        tag: 'MOST COMMON',
        tagColor: 'var(--red)',
        desc: 'Offers ₹500–1000/hour for typing, clicking, or filling forms. Requires ₹500–5000 "security deposit". You never get paid.',
        redFlags: ['Upfront payment', 'WhatsApp only', 'No company details'],
    },
    {
        title: 'Fake Investment / Trading Job',
        tag: 'HIGH RISK',
        tagColor: '#ff7832',
        desc: 'Claims you can earn ₹20,000+/day trading crypto or stocks on their "exclusive platform". Victims lose their investment.',
        redFlags: ['Too-good salary', 'No interview', 'App-based platform'],
    },
    {
        title: 'Fake HR / Recruiter Scam',
        tag: 'PHISHING',
        tagColor: 'var(--violet)',
        desc: 'Fake job offer via LinkedIn/WhatsApp asks you to fill a "background check form" — steals your Aadhaar, PAN, bank details.',
        redFlags: ['Personal info demanded', 'Gmail HR email', 'No office address'],
    },
];

const itemV = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } },
};
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const SCORE_META = (score) => {
    if (score >= 70) return { label: 'CONFIRMED SCAM', color: 'var(--red)', icon: ShieldAlert, badge: 'badge-high' };
    if (score >= 40) return { label: 'HIGHLY SUSPICIOUS', color: '#ff7832', icon: Shield, badge: 'badge-medium' };
    if (score >= 15) return { label: 'PROCEED WITH CAUTION', color: '#ffb830', icon: Shield, badge: 'badge-low' };
    return { label: 'LIKELY LEGITIMATE', color: 'var(--green)', icon: ShieldCheck, badge: 'badge-clean' };
};

export default function JobScam() {
    const [tab, setTab] = useState('analyze'); // 'analyze' | 'domain' | 'checklist'
    const [jobText, setJobText] = useState('');
    const [domain, setDomain] = useState('');
    const [checklist, setChecklist] = useState({});
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const checklistScore = Object.entries(checklist)
        .filter(([, v]) => v)
        .reduce((acc, [id]) => {
            const item = SCAM_INDICATORS.find(s => s.id === id);
            return acc + (item?.weight || 0);
        }, 0);
    const clampedChecklist = Math.min(100, checklistScore);
    const checklistMeta = SCORE_META(clampedChecklist);

    const handleAnalyze = async () => {
        if (!jobText.trim()) return;
        setLoading(true); setError(''); setResult(null);
        toast.info('Analyzing Job Offer', 'Running AI scam detection on the job description...');
        try {
            const res = await axios.post(`${API}/scan/job-scam`, { text: jobText });

            // Automatically extract and check domain if present
            const emailMatch = jobText.match(/[a-zA-Z0-9._-]+@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            let extractedDomain = emailMatch ? emailMatch[1] : null;
            if (!extractedDomain) {
                const urlMatch = jobText.match(/https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                if (urlMatch) extractedDomain = urlMatch[1];
            }

            const isFreeProvider = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'].includes(extractedDomain?.toLowerCase());

            let domainAnalysis = null;
            if (extractedDomain && !isFreeProvider) {
                toast.info('Domain Check', 'Automatically verifying associated domain: ' + extractedDomain);
                try {
                    const domRes = await axios.post(`${API}/scan/domain`, { domain: extractedDomain.trim() });
                    domainAnalysis = domRes.data;
                } catch (e) {
                    // Ignore domain error, proceed with job analysis
                }
            }

            setResult({ ...res.data, extractedDomain, domainAnalysis });

            if (res.data.scam_score >= 70) {
                toast.critical('SCAM DETECTED', `Scam probability: ${res.data.scam_score}% — Do NOT apply or pay anything!`);
            } else if (res.data.scam_score >= 40) {
                toast.high('SUSPICIOUS JOB OFFER', `${res.data.scam_score}% suspicious — verify the company before proceeding`);
            } else {
                toast.success('ANALYSIS COMPLETE', `Scam score: ${res.data.scam_score}% — appears relatively safe`);
            }
        } catch (e) {
            const msg = e.response?.data?.detail || e.message || 'Analysis failed';
            setError(msg);
            if (e.message === 'Network Error') {
                toast.high('CONNECTION FAILED', 'Could not connect to backend. Is it running on port 8000?');
            } else {
                toast.high('ANALYSIS FAILED', msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDomainCheck = async () => {
        if (!domain.trim()) return;
        setLoading(true); setError(''); setResult(null);
        toast.info('Domain Check', `Verifying ${domain} with VirusTotal...`);
        try {
            const res = await axios.post(`${API}/scan/domain`, { domain: domain.trim() });
            // Reuse domain scan result but display in job context
            const isScam = (res.data.stats?.malicious || 0) > 2;
            setResult({
                type: 'domain',
                domain: domain.trim(),
                ...res.data,
                scam_score: isScam ? 80 : (res.data.stats?.suspicious || 0) > 0 ? 40 : 5,
                flags: isScam ? ['Domain flagged as malicious by VirusTotal engines'] : [],
                ai_summary: res.data.ai_summary,
            });
        } catch (e) {
            const msg = e.response?.data?.detail || e.message || 'Domain check failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const copyResult = () => {
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const score = result?.scam_score || 0;
    const meta = SCORE_META(score);
    const MetaIcon = meta.icon;

    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80, position: 'relative' }}>
            {/* Background orbs */}
            <div style={{ position: 'absolute', top: '15%', right: '5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(255,46,91,.05) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', left: '0%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(0,245,255,.04) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />

            <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 960 }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: 48 }}
                >
                    <div className="section-eyebrow" style={{ display: 'inline-flex' }}>
                        <Briefcase size={12} />
                        Cyber Fraud Intelligence
                    </div>
                    <h1 className="syne" style={{ fontSize: 'clamp(36px,5vw,58px)', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 8 }}>
                        Job Fraud <span className="glow-text" style={{ color: 'var(--red)' }}>Analyzer</span>
                    </h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 15.5, maxWidth: 600, margin: '0 auto' }}>
                        Detect suspicious job offers automatically. AI scans details, flags fraud, and verifies domains.
                    </p>
                </motion.div>

                {/* Alert Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ marginBottom: 36, padding: '14px 20px', borderRadius: 'var(--r-md)', background: 'rgba(255,46,91,0.06)', border: '1px solid rgba(255,46,91,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                    <AlertTriangle size={16} color="var(--red)" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: 'var(--red)' }}>₹1,000 Crore+</span> lost to job scams in India annually. Fake WFH offers, data-entry frauds, and investment scam jobs are rising. Verify before you apply.
                    </div>
                </motion.div>

                {/* Tab selector */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}
                >
                    {[
                        { id: 'analyze', icon: FileText, label: 'AI Job Analyzer' },
                        { id: 'domain', icon: Globe, label: 'Company Domain Check' },
                        { id: 'checklist', icon: ShieldCheck, label: 'Red Flag Checklist' },
                    ].map(t => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <motion.button
                                key={t.id}
                                onClick={() => { setTab(t.id); setResult(null); setError(''); }}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 20px', borderRadius: 'var(--r-full)',
                                    background: active ? 'var(--red)' : 'rgba(255,255,255,.04)',
                                    border: active ? 'none' : '1px solid var(--border)',
                                    color: active ? '#fff' : 'var(--text-2)',
                                    fontWeight: 600, fontSize: 13, letterSpacing: '.04em',
                                    transition: 'all .2s ease',
                                }}
                            >
                                <Icon size={14} />
                                {t.label}
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Tab: AI Analyzer */}
                {tab === 'analyze' && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={14} color="var(--red)" />
                                Paste the Job Description / WhatsApp Message
                            </div>
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    value={jobText}
                                    onChange={e => setJobText(e.target.value)}
                                    placeholder={`Paste the suspicious job description here...\n\nExample: "Dear Candidate, You have been selected for a Work From Home data entry job. Salary ₹40,000/month. No experience needed. Pay ₹1,999 registration fee to activate your account. Contact HR on WhatsApp: +91-XXXXXXXXX"`}
                                    rows={9}
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,.03)',
                                        border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                                        padding: '16px 20px', fontSize: 14, color: 'var(--text-1)',
                                        fontFamily: 'Space Grotesk, sans-serif', resize: 'vertical',
                                        outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
                                        transition: 'border-color .2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(255,46,91,.5)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                />
                                {jobText && (
                                    <button
                                        onClick={() => setJobText('')}
                                        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                    {jobText.length} characters · Powered by Gemini AI
                                </span>
                                <motion.button
                                    className="btn-primary"
                                    onClick={handleAnalyze}
                                    disabled={loading || !jobText.trim()}
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                    style={{
                                        background: 'linear-gradient(135deg, #ff2e5b, #ff7832)',
                                        border: 'none', opacity: loading || !jobText.trim() ? 0.5 : 1
                                    }}
                                >
                                    {loading
                                        ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> ANALYZING...</>
                                        : <><Search size={15} /> DETECT SCAM</>
                                    }
                                </motion.button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.12em' }}>LOAD SAMPLE:</span>
                            {[
                                { label: 'Fake Data Entry', text: 'Dear selected candidate! You have been chosen for a Work From Home data entry job. Earn ₹30,000 to ₹50,000 per month working just 2-3 hours daily. No experience required. To activate your account and start work, you need to pay a refundable security deposit of ₹2,000. Contact our HR on WhatsApp immediately. Offer valid for 24 hours only!' },
                                { label: 'Fake Trading Job', text: 'Exciting opportunity! Join our trading team and earn ₹20,000 daily. Work from home on our exclusive crypto platform. No experience needed. 100% guaranteed profit. We will train you. Register now with a small investment of ₹5000 to get started on our official app.' },
                            ].map(s => (
                                <motion.button
                                    key={s.label}
                                    onClick={() => setJobText(s.text)}
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: '4px 12px', borderRadius: 'var(--r-full)',
                                        border: '1px solid rgba(255,46,91,0.25)', background: 'rgba(255,46,91,0.06)',
                                        color: 'var(--red)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    {s.label}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Tab: Domain Check */}
                {tab === 'domain' && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Globe size={14} color="var(--cyan)" />
                                Enter the company's website or HR email domain
                            </div>
                            <div className="glass-flat" style={{ padding: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    className="nx-input"
                                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 20px', fontSize: 15 }}
                                    placeholder="e.g. company-hr-jobs.com or legitcorp.in"
                                    value={domain}
                                    onChange={e => setDomain(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleDomainCheck()}
                                />
                                {domain && <button onClick={() => setDomain('')} style={{ color: 'var(--text-3)', background: 'none', padding: 8 }}><X size={16} /></button>}
                            </div>
                            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                <motion.button
                                    className="btn-primary"
                                    onClick={handleDomainCheck}
                                    disabled={loading || !domain.trim()}
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                    style={{ opacity: loading || !domain.trim() ? 0.5 : 1 }}
                                >
                                    {loading
                                        ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> CHECKING...</>
                                        : <><Search size={15} /> CHECK DOMAIN</>
                                    }
                                </motion.button>
                            </div>
                        </div>
                        <div className="glass" style={{ padding: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.12em', marginBottom: 12 }}>COMMON SCAM DOMAIN PATTERNS TO WATCH FOR</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    '⚠ Domain registered very recently (< 30 days)',
                                    '⚠ Domain mimics real company: "infosys-hr.com", "wiprojobs.in"',
                                    '⚠ Free TLDs: .tk, .ml, .gq, .cf',
                                    '⚠ HR email from gmail.com, yahoo.com, outlook.com',
                                    '✅ Real IT companies always use their official domain email',
                                ].map(t => (
                                    <div key={t} style={{ fontSize: 13, color: 'var(--text-2)', padding: '8px 12px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.02)' }}>{t}</div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tab: Checklist */}
                {tab === 'checklist' && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ShieldCheck size={14} color="var(--red)" />
                                Check all red flags that apply to this job offer
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {SCAM_INDICATORS.map(item => {
                                    const checked = !!checklist[item.id];
                                    return (
                                        <motion.div
                                            key={item.id}
                                            onClick={() => setChecklist(p => ({ ...p, [item.id]: !p[item.id] }))}
                                            whileHover={{ x: 4 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                                                borderRadius: 'var(--r-md)', cursor: 'pointer',
                                                background: checked ? 'rgba(255,46,91,.07)' : 'rgba(255,255,255,.02)',
                                                border: `1px solid ${checked ? 'rgba(255,46,91,.3)' : 'var(--border)'}`,
                                                transition: 'all .2s',
                                            }}
                                        >
                                            <div style={{
                                                width: 20, height: 20, borderRadius: 6,
                                                background: checked ? 'var(--red)' : 'rgba(255,255,255,.05)',
                                                border: `2px solid ${checked ? 'var(--red)' : 'rgba(255,255,255,.15)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, transition: 'all .2s',
                                            }}>
                                                {checked && <Check size={12} color="#fff" />}
                                            </div>
                                            <div style={{ flex: 1, fontSize: 14, color: checked ? 'var(--text-1)' : 'var(--text-2)' }}>
                                                {item.label}
                                            </div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>
                                                +{item.weight}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Checklist Score Display */}
                        <div className="premium-glass glow-border" style={{ padding: 32, boxShadow: `0 0 60px ${checklistMeta.color}15` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{ width: 72, height: 72, borderRadius: '50%', background: checklistMeta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: checklistMeta.color }}
                                >
                                    <checklistMeta.icon size={32} />
                                </motion.div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: checklistMeta.color }}>{checklistMeta.label}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Scam score based on selected indicators</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 52, fontWeight: 900, color: checklistMeta.color, lineHeight: 1 }}>{clampedChecklist}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>/ 100 scam score</div>
                                </div>
                            </div>
                            <div style={{ marginTop: 20 }}>
                                <div className="progress-bar" style={{ height: 8 }}>
                                    <motion.div
                                        className="progress-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${clampedChecklist}%` }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ background: checklistMeta.color, height: '100%', borderRadius: 4 }}
                                    />
                                </div>
                            </div>
                            {clampedChecklist >= 40 && (
                                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'rgba(255,46,91,.06)', border: '1px solid rgba(255,46,91,.2)', fontSize: 13, color: 'var(--red)', lineHeight: 1.5 }}>
                                    ⚠ <strong>Warning:</strong> This job offer shows multiple hallmarks of employment fraud. Do NOT pay any money or share personal/financial documents. Report to <strong>cybercrime.gov.in</strong>.
                                </div>
                            )}
                            <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <button
                                    className="btn-ghost"
                                    onClick={() => setChecklist({})}
                                    style={{ fontSize: 12 }}
                                >
                                    Reset Checklist
                                </button>
                                <a
                                    href="https://cybercrime.gov.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-ghost"
                                    style={{ fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                    <ExternalLink size={13} /> Report to Cyber Cell
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            style={{ marginTop: 20, padding: 16, borderRadius: 'var(--r-md)', background: 'rgba(255,46,91,.08)', border: '1px solid rgba(255,46,91,.2)', color: 'var(--red)', fontSize: 13 }}
                        >
                            ⚠ {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading state */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="glass" style={{ marginTop: 24, padding: 40, textAlign: 'center' }}
                        >
                            <div style={{ width: 64, height: 64, margin: '0 auto 16px', position: 'relative' }}>
                                <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--red)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin-slow .8s linear infinite' }} />
                                <Briefcase size={24} color="var(--red)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>
                                {tab === 'domain' ? 'Verifying domain with VirusTotal...' : 'Running AI scam analysis...'}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Checking against fraud databases and AI models</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence>
                    {result && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                            style={{ marginTop: 28 }}
                        >
                            {/* Verdict card */}
                            <div className="premium-glass glow-border" style={{ padding: 36, marginBottom: 20, boxShadow: `0 0 80px ${meta.color}15` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 1.5, ease: 'easeInOut' }}
                                            style={{ width: 72, height: 72, borderRadius: '50%', background: meta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}
                                        >
                                            <MetaIcon size={32} />
                                        </motion.div>
                                        <div>
                                            <div style={{ fontSize: 26, fontWeight: 800, color: meta.color }}>{meta.label}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                                                {result.domain || 'Job description analysis'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 52, fontWeight: 900, color: meta.color, lineHeight: 1 }}>{score}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>/ 100 scam score</div>
                                    </div>
                                </div>

                                {/* Score bar */}
                                <div className="progress-bar" style={{ height: 8, marginBottom: 24 }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score}%` }}
                                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                                        style={{ height: '100%', background: `linear-gradient(90deg, ${meta.color}aa, ${meta.color})`, borderRadius: 4 }}
                                    />
                                </div>

                                {/* Domain Auto Check Result */}
                                {result.domainAnalysis && (
                                    <div style={{ padding: 20, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', marginBottom: 20 }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                                            <Globe size={14} color="var(--cyan)" /> Automatic Domain Verification ({result.extractedDomain})
                                        </div>
                                        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65 }}>
                                            Reputation: <strong>{result.domainAnalysis.reputation}</strong>.
                                            Malicious engines: {result.domainAnalysis.stats?.malicious || 0}.
                                            Registrar: {result.domainAnalysis.registrar || 'Unknown'}.
                                            <br />
                                            <span style={{ color: result.domainAnalysis.stats?.malicious > 0 ? 'var(--red)' : 'var(--green)' }}>
                                                Verdict: {result.domainAnalysis.risk}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* AI Summary (Moved to Bottom/End as requested) */}
                                {result.ai_summary && (
                                    <div style={{ padding: 20, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg, rgba(255,46,91,.08) 0%, rgba(124,58,237,.06) 100%)', border: '1px solid rgba(255,46,91,.2)', marginBottom: 20 }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                                            <Zap size={14} color="var(--red)" /> AI Scam Intelligence Briefing
                                        </div>
                                        <div style={{ fontSize: 14, color: '#e0e0e0', lineHeight: 1.65 }}>{result.ai_summary}</div>
                                    </div>
                                )}

                                {/* Flags */}
                                {result.flags && result.flags.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.1em', marginBottom: 4 }}>DETECTED RED FLAGS</div>
                                        {result.flags.map((flag, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(255,46,91,.05)', borderLeft: '3px solid var(--red)' }}>
                                                <AlertTriangle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{flag}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Domain VirusTotal stats */}
                                {result.type === 'domain' && result.stats && (
                                    <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 12 }}>
                                        {[
                                            { label: 'Malicious', val: result.stats.malicious || 0, color: 'var(--red)' },
                                            { label: 'Suspicious', val: result.stats.suspicious || 0, color: '#ff7832' },
                                            { label: 'Harmless', val: result.stats.harmless || 0, color: 'var(--green)' },
                                        ].map(s => (
                                            <div key={s.label} style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,.02)', textAlign: 'center' }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <button className="btn-ghost" onClick={copyResult} style={{ fontSize: 13 }}>
                                    {copied ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy JSON</>}
                                </button>
                                <a
                                    href="https://cybercrime.gov.in"
                                    target="_blank" rel="noopener noreferrer"
                                    className="btn-primary"
                                    style={{ fontSize: 13, padding: '10px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#ff2e5b,#ff7832)', border: 'none' }}
                                >
                                    <ExternalLink size={14} /> Report Scam to Cyber Cell
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Common Scam Examples */}
                <motion.div
                    variants={stagger} initial="hidden" animate="show"
                    style={{ marginTop: 56 }}
                >
                    <div className="cyber-divider" style={{ marginBottom: 40 }} />
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 24 }}>
                        Common Employment Scams in India
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 20 }}>
                        {EXAMPLE_SCAMS.map((ex, i) => (
                            <motion.div key={i} variants={itemV} className="glass card-lift" style={{ padding: 24 }}
                                whileHover={{ borderColor: 'rgba(255,46,91,.25)', boxShadow: '0 0 30px rgba(255,46,91,.06)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <span style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: ex.tagColor + '18', color: ex.tagColor, fontSize: 10, fontWeight: 800, letterSpacing: '.1em' }}>
                                        {ex.tag}
                                    </span>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>{ex.title}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>{ex.desc}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {ex.redFlags.map(f => (
                                        <span key={f} style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'rgba(255,46,91,.08)', border: '1px solid rgba(255,46,91,.2)', color: 'var(--red)', fontSize: 11, fontWeight: 600 }}>
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
