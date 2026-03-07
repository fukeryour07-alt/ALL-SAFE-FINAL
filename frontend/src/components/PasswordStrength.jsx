import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield, ShieldCheck, ShieldAlert, Check, X, RefreshCw, Copy, Zap } from 'lucide-react';

const COMMON_WORDS = [
    'password', '123456', 'qwerty', 'letmein', 'admin', 'welcome', 'monkey',
    'dragon', 'master', 'abc123', 'iloveyou', 'sunshine', 'princess', 'shadow',
    'football', 'superman', 'batman', 'login', 'passw0rd', 'mustang'
];

// ─ Proper entropy calculation (fixed)
function calculateEntropy(pwd) {
    if (!pwd) return 0;
    let charsetSize = 0;
    if (/[a-z]/.test(pwd)) charsetSize += 26;
    if (/[A-Z]/.test(pwd)) charsetSize += 26;
    if (/\d/.test(pwd)) charsetSize += 10;
    if (/[^A-Za-z0-9]/.test(pwd)) charsetSize += 33;
    if (charsetSize === 0) charsetSize = 26;
    return Math.round(Math.log2(charsetSize) * pwd.length);
}

function analyzePassword(pwd) {
    if (!pwd) return null;

    const checks = {
        length: { pass: pwd.length >= 12, label: 'At least 12 characters' },
        uppercase: { pass: /[A-Z]/.test(pwd), label: 'Uppercase letter (A–Z)' },
        lowercase: { pass: /[a-z]/.test(pwd), label: 'Lowercase letter (a–z)' },
        numbers: { pass: /\d/.test(pwd), label: 'Contains numbers (0–9)' },
        special: { pass: /[^A-Za-z0-9]/.test(pwd), label: 'Special character (!@#$...)' },
        noCommon: { pass: !COMMON_WORDS.some(w => pwd.toLowerCase().includes(w)), label: 'Not a common word/phrase' },
        longEnough: { pass: pwd.length >= 16, label: 'At least 16 characters (excellent)' },
        noRepeats: { pass: !/(.)\1{2,}/.test(pwd), label: 'No repeated characters (aaa)' },
    };

    const passCount = Object.values(checks).filter(c => c.pass).length;
    const total = Object.keys(checks).length;
    const entropy = calculateEntropy(pwd);

    const crackTime =
        entropy < 28 ? { label: 'Instantly', color: '#ff2e5b' } :
            entropy < 40 ? { label: 'Seconds', color: '#ff5500' } :
                entropy < 55 ? { label: 'Hours', color: '#f97316' } :
                    entropy < 70 ? { label: 'Days', color: '#facc15' } :
                        entropy < 85 ? { label: 'Years', color: '#00f5ff' } :
                            { label: 'Centuries', color: '#00ff88' };

    const pct = Math.round((passCount / total) * 100);
    const strength =
        passCount <= 2 ? { label: 'VERY WEAK', color: '#ff2e5b', lvl: 1 } :
            passCount <= 3 ? { label: 'WEAK', color: '#f97316', lvl: 2 } :
                passCount <= 5 ? { label: 'FAIR', color: '#facc15', lvl: 3 } :
                    passCount <= 6 ? { label: 'STRONG', color: '#00f5ff', lvl: 4 } :
                        { label: 'VERY STRONG', color: '#00ff88', lvl: 5 };

    return { checks, passCount, total, entropy, crackTime, strength, pct };
}

// Secure password generator
function generateStrongPassword(length = 20) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    const all = upper + lower + digits + special;
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    let pwd = '';
    // Guarantee at least 1 from each class
    const classes = [upper, lower, digits, special];
    classes.forEach(cls => {
        const idx = arr[pwd.length] % cls.length;
        pwd += cls[idx];
    });
    for (let i = classes.length; i < length; i++) {
        pwd += all[arr[i] % all.length];
    }
    // Shuffle
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

const StrengthBar = ({ pct, color }) => (
    <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
        {[20, 40, 60, 80, 100].map(threshold => (
            <motion.div
                key={threshold}
                style={{
                    flex: 1, height: 6, borderRadius: 3,
                    background: pct >= threshold ? color : 'rgba(255,255,255,0.07)',
                    boxShadow: pct >= threshold ? `0 0 8px ${color}60` : 'none',
                }}
                animate={{ background: pct >= threshold ? color : 'rgba(255,255,255,0.07)' }}
                transition={{ duration: 0.4 }}
            />
        ))}
    </div>
);

export default function PasswordStrength() {
    const [pwd, setPwd] = useState('');
    const [show, setShow] = useState(false);
    const [copied, setCopied] = useState(false);
    const result = useMemo(() => analyzePassword(pwd), [pwd]);

    const handleGenerate = useCallback(() => {
        const newPwd = generateStrongPassword(20);
        setPwd(newPwd);
        setShow(true);
    }, []);

    const handleCopy = useCallback(async () => {
        if (!pwd) return;
        try {
            await navigator.clipboard.writeText(pwd);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    }, [pwd]);

    const ShieldIcon = result
        ? (result.strength.lvl >= 4 ? ShieldCheck : result.strength.lvl >= 3 ? Shield : ShieldAlert)
        : Shield;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
                <div className="section-eyebrow" style={{ display: 'inline-flex', marginBottom: 12 }}>
                    <Lock size={12} /> Password Analyzer
                </div>
                <h2 className="syne" style={{ fontSize: 28, fontWeight: 800 }}>
                    Password <span className="glow-text">Strength</span> Checker
                </h2>
                <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 6 }}>
                    100% local analysis — nothing ever leaves your browser.
                </p>
            </div>

            {/* Input Card */}
            <div className="glass" style={{ padding: 24 }}>
                {/* Input row */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)', padding: '12px 16px',
                    transition: 'border-color .3s',
                }}>
                    <Lock size={16} color="var(--cyan)" style={{ flexShrink: 0 }} />
                    <input
                        type={show ? 'text' : 'password'}
                        value={pwd}
                        onChange={e => setPwd(e.target.value)}
                        placeholder="Type or generate a password..."
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            color: 'var(--text-1)', fontSize: 16,
                            fontFamily: 'JetBrains Mono, monospace',
                            letterSpacing: show ? 'normal' : pwd ? '0.15em' : 'normal',
                        }}
                    />
                    <button
                        onClick={handleCopy}
                        title="Copy password"
                        style={{ background: 'none', border: 'none', color: copied ? 'var(--green)' : 'var(--text-3)', cursor: 'pointer', padding: 4 }}
                    >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                    <button
                        onClick={() => setShow(p => !p)}
                        title={show ? 'Hide password' : 'Show password'}
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <motion.button
                        onClick={handleGenerate}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="btn-primary"
                        style={{ flex: 1, padding: '11px 16px', fontSize: 12, justifyContent: 'center' }}
                    >
                        <RefreshCw size={13} /> Generate Strong Password
                    </motion.button>
                    {pwd && (
                        <motion.button
                            onClick={() => setPwd('')}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="btn-ghost"
                            style={{ padding: '11px 16px', fontSize: 12 }}
                        >
                            <X size={13} /> Clear
                        </motion.button>
                    )}
                </div>

                {/* Strength bar + label */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ marginTop: 16, overflow: 'hidden' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ShieldIcon size={14} color={result.strength.color} />
                                    <span style={{ fontSize: 12, fontWeight: 800, color: result.strength.color, letterSpacing: '.1em' }}>
                                        {result.strength.label}
                                    </span>
                                </div>
                                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                    {result.passCount}/{result.total} criteria
                                </span>
                            </div>
                            <StrengthBar pct={result.pct} color={result.strength.color} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Analysis Results */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
                    >
                        {/* Metrics panel */}
                        <div className="glass" style={{ padding: 22 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.15em', marginBottom: 18 }}>
                                ANALYSIS METRICS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <MetricRow label="Entropy" value={`${result.entropy} bits`} color="var(--cyan)" />
                                <MetricRow label="Crack Time" value={result.crackTime.label} color={result.crackTime.color} />
                                <MetricRow label="Length" value={`${pwd.length} chars`} color="var(--text-1)" />
                                <MetricRow label="Strength" value={result.strength.label} color={result.strength.color} />
                            </div>

                            {/* Entropy bar */}
                            <div style={{ marginTop: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>
                                    <span>ENTROPY</span>
                                    <span>{result.entropy} / 128 bits</span>
                                </div>
                                <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                                    <motion.div
                                        animate={{ width: `${Math.min(100, (result.entropy / 128) * 100)}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        style={{
                                            height: '100%', borderRadius: 2,
                                            background: `linear-gradient(90deg, var(--red), ${result.strength.color})`,
                                            boxShadow: `0 0 8px ${result.strength.color}60`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Criteria checklist */}
                        <div className="glass" style={{ padding: 22 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.15em', marginBottom: 18 }}>
                                SECURITY CRITERIA
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {Object.entries(result.checks).map(([key, check]) => (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 9 }}
                                    >
                                        <div style={{
                                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                                            background: check.pass ? 'rgba(0,255,136,0.12)' : 'rgba(255,46,91,0.1)',
                                            border: `1px solid ${check.pass ? 'rgba(0,255,136,0.25)' : 'rgba(255,46,91,0.2)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {check.pass
                                                ? <Check size={10} color="var(--green)" />
                                                : <X size={10} color="var(--red)" />
                                            }
                                        </div>
                                        <span style={{
                                            fontSize: 11,
                                            color: check.pass ? 'var(--text-2)' : 'var(--text-3)',
                                            textDecoration: check.pass ? 'none' : 'none',
                                        }}>
                                            {check.label}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tips */}
            {result && result.strength.lvl < 4 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        padding: '14px 18px', borderRadius: 'var(--r-md)',
                        background: 'linear-gradient(135deg, rgba(124,58,237,.08), rgba(0,245,255,.04))',
                        border: '1px solid rgba(124,58,237,.2)',
                        display: 'flex', gap: 12, alignItems: 'flex-start'
                    }}
                >
                    <Zap size={14} color="var(--violet)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--violet)' }}>AI Tip: </strong>
                        Use the generator above to create a cryptographically secure password.
                        Combine unrelated words, numbers, and symbols for maximum strength.
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function MetricRow({ label, value, color }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
            <span className="mono" style={{ fontSize: 12, color, fontWeight: 700 }}>{value}</span>
        </div>
    );
}
