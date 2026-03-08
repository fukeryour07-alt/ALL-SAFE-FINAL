import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, KeyRound, ShieldCheck, ShieldAlert, AlertTriangle, EyeOff, Eye,
    Loader2, ArrowRight, UserCircle2, Building2, CheckCircle2, Megaphone,
    Inbox, ArrowLeft, Fingerprint, Zap, Radar, Link, ExternalLink, Info
} from 'lucide-react';
import { toast } from './Toast';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

const API = 'https://all-safe-final-j8mc.onrender.com';

/* ─── Icon Components ───────────────────────────────────────────────────── */
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const MicrosoftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
);

const YahooIcon = () => (
    <svg width="20" height="20" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" rx="100" fill="#6001D2" />
        <path d="M176.6 200.2l53 158.7c11.4 34 30.2 46.1 55.4 46.1 13.7 0 24.3-1.6 32.7-4.2l-3.2-34.1c-6.8 2-13.6 2.9-20.1 2.9-10.8 0-16.2-5.7-21-20.3L237.6 244l64.2-137.9h-44l-38 90.9-42.3-90.9h-41.9l65.8 132-24.8 62.1z" fill="white" />
    </svg>
);

/* ─── Google Login Button (must be inside GoogleOAuthProvider context) ───── */
const RealGoogleLoginBtn = ({ onComplete, disabled }) => {
    const login = useGoogleLogin({
        onSuccess: tokenResponse => {
            onComplete({
                email: 'Your Google Account',
                provider: 'Google',
                token: tokenResponse.access_token,
                imap_server: 'oauth',
            });
        },
        onError: (err) => {
            console.error('Google OAuth error:', err);
            if (err?.error === 'idpiframe_initialization_failed' || err?.error === 'popup_closed_by_user') {
                toast.error("OAuth Domain Error", "Your site domain is not authorized in Google Cloud Console. Add your Vercel URL to 'Authorized JavaScript Origins'.");
            } else if (err?.error === 'access_denied') {
                toast.error("Access Denied", "You denied the Gmail permission request. Please allow access to scan your inbox.");
            } else {
                toast.error("Login Failed", `Google authentication error: ${err?.error || 'Unknown'}. Check browser console for details.`);
            }
        },
        scope: "https://www.googleapis.com/auth/gmail.readonly"
    });

    return (
        <button
            onClick={() => {
                if (!disabled) {
                    login();
                } else {
                    toast.error("Agreement Required", "Please accept the terms and conditions first.");
                }
            }}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '16px 20px',
                background: disabled ? 'rgba(255,255,255,0.5)' : '#ffffff',
                color: '#1f2937', borderRadius: 14, fontSize: 15, fontWeight: 700,
                border: 'none', transition: 'all 0.25s', width: '100%',
                boxShadow: disabled ? 'none' : '0 4px 20px rgba(255,255,255,0.15)',
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1
            }}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.2)'; } }}
            onMouseLeave={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.15)'; } }}
        >
            <GoogleIcon /> Continue with Google
        </button>
    );
};

/* ─── Main Content Component ─────────────────────────────────────────────── */
const InboxScannerContent = () => {
    const [step, setStep] = useState('provider');
    const [provider, setProvider] = useState(null);
    const [credentials, setCredentials] = useState({ email: '', password: '', imap_server: '', is_oauth: false });
    const [emails, setEmails] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [selectedEmailIdx, setSelectedEmailIdx] = useState(null);

    const handleOAuthComplete = async (authData) => {
        setProvider(authData.provider);
        const creds = {
            email: authData.email,
            password: authData.token,
            imap_server: authData.imap_server,
            is_oauth: true
        };
        setCredentials(creds);
        performScan(creds, '/scan/inbox');
    };

    const initiateLegacyProvider = (providerName) => {
        setProvider(providerName);
        setCredentials({
            email: '', password: '',
            imap_server: providerName === 'Microsoft' ? 'outlook.office365.com' : 'imap.mail.yahoo.com',
            is_oauth: false
        });
        setStep('credentials');
    };

    const handleManualScan = async (e) => {
        e.preventDefault();
        if (!credentials.email || !credentials.password) return toast.error("Missing Credentials", "Enter your email and app password.");
        performScan(credentials, '/scan/inbox');
    };

    const performScan = async (payload, endpoint) => {
        setStep('scanning');
        try {
            const res = await fetch(`${API}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: 'Server error. Check backend logs.' }));
                throw new Error(err.detail || 'Connection failed.');
            }
            const data = await res.json();
            if (data.status === 'success') {
                setEmails(data.emails);
                setStep('complete');
                setSelectedEmailIdx(data.emails.length > 0 ? 0 : null);
                toast.success("Analysis Complete", `Scanned ${data.emails.length} email(s) successfully.`);
            } else {
                throw new Error("Invalid response format from server.");
            }
        } catch (error) {
            toast.error("Analysis Error", error.message);
            setStep('provider');
        }
    };

    const resetSession = () => {
        setStep('provider');
        setCredentials({ email: '', password: '', imap_server: '', is_oauth: false });
        setEmails([]);
        setAgreed(false);
        setSelectedEmailIdx(null);
    };

    const getCategoryStyles = (category, score) => {
        if (score >= 80 || category === 'Scam') return { col: '#ff2e5b', bg: 'rgba(255,46,91,0.10)', icon: <ShieldAlert size={16} color="#ff2e5b" /> };
        if (score >= 40 || category === 'Spam') return { col: '#ffb830', bg: 'rgba(255,184,48,0.10)', icon: <AlertTriangle size={16} color="#ffb830" /> };
        if (category === 'Company') return { col: '#00f5ff', bg: 'rgba(0,245,255,0.08)', icon: <Building2 size={16} color="#00f5ff" /> };
        if (category === 'Personal') return { col: '#a78bfa', bg: 'rgba(167,139,250,0.10)', icon: <UserCircle2 size={16} color="#a78bfa" /> };
        if (category === 'Newsletter') return { col: '#94a3b8', bg: 'rgba(148,163,184,0.08)', icon: <Megaphone size={16} color="#94a3b8" /> };
        return { col: '#00ff88', bg: 'rgba(0,255,136,0.08)', icon: <ShieldCheck size={16} color="#00ff88" /> };
    };

    const scamCount = emails.filter(e => e.category === 'Scam').length;
    const spamCount = emails.filter(e => e.category === 'Spam').length;
    const totalLinks = emails.reduce((acc, curr) => acc + (curr.links_found || 0), 0);
    const averageRisk = emails.length > 0
        ? (emails.reduce((acc, curr) => acc + curr.risk_score, 0) / emails.length).toFixed(0)
        : 0;
    const safeCount = emails.length - scamCount - spamCount;

    return (
        <section className="section-padding" style={{ minHeight: '100vh', position: 'relative' }}>
            <div className="container">

                {/* ─── Page Header ─── */}
                <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 680, margin: '0 auto 56px' }}>
                    <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 16px', background: 'rgba(255,120,50,0.1)',
                            border: '1px solid rgba(255,120,50,0.25)', borderRadius: 20,
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                            color: '#ff7832', marginBottom: 20, textTransform: 'uppercase'
                        }}>
                            <Zap size={12} /> AI Mail Profiler
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ fontSize: 'clamp(34px, 5vw, 54px)', lineHeight: 1.15, marginBottom: 18, fontWeight: 800, letterSpacing: '-0.025em' }}
                    >
                        Autonomous{' '}
                        <span style={{ background: 'linear-gradient(135deg, #00f5ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Email Triage
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                        style={{ color: 'var(--text-2)', fontSize: 17, lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}
                    >
                        Securely connect your inbox. Our AI neural pipeline extracts and neutralizes phishing threats before you ever open them.
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">

                    {/* ─── Step: Provider Selection ─── */}
                    {step === 'provider' && (
                        <motion.div
                            key="provider"
                            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}
                        >
                            <div className="premium-glass" style={{
                                maxWidth: 480, margin: '0 auto', padding: '44px 40px',
                                borderRadius: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
                            }}>
                                {/* Header Icon */}
                                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                    <div style={{
                                        width: 60, height: 60, borderRadius: 18,
                                        background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.15)',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 16, boxShadow: 'inset 0 0 24px rgba(0,245,255,0.06)'
                                    }}>
                                        <Fingerprint size={28} color="#00f5ff" />
                                    </div>
                                    <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>Secure Synchronization</h3>
                                    <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>
                                        OAuth keeps your credentials safe. Passwords are <strong style={{ color: 'var(--text-2)' }}>never stored</strong> or transmitted.
                                    </p>
                                </div>

                                {/* Terms Checkbox */}
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 12,
                                    background: 'rgba(0,0,0,0.25)', padding: '16px 18px',
                                    borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)',
                                    marginBottom: 20, cursor: 'pointer'
                                }} onClick={() => setAgreed(v => !v)}>
                                    <input
                                        type="checkbox" id="terms" checked={agreed}
                                        onChange={e => setAgreed(e.target.checked)}
                                        style={{ marginTop: 2, width: 18, height: 18, accentColor: '#00f5ff', cursor: 'pointer', flexShrink: 0 }}
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <label htmlFor="terms" style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, cursor: 'pointer' }}>
                                        I agree to the{' '}
                                        <a href="#" style={{ color: '#00f5ff', textDecoration: 'none' }}>Terms & Conditions</a>{' '}
                                        and{' '}
                                        <a href="#" style={{ color: '#00f5ff', textDecoration: 'none' }}>Privacy Policy</a>.{' '}
                                        I understand AI will read my inbox to extract phishing threats.
                                    </label>
                                </div>

                                {/* Provider Buttons */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {/* Google OAuth */}
                                    <RealGoogleLoginBtn onComplete={handleOAuthComplete} disabled={!agreed} />

                                    {/* Microsoft */}
                                    <button
                                        onClick={() => agreed ? initiateLegacyProvider('Microsoft') : toast.error('Agreement Required', 'Accept terms and conditions first.')}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                            padding: '16px 20px', background: 'rgba(255,255,255,0.04)',
                                            color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 600,
                                            border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s',
                                            width: '100%', opacity: agreed ? 1 : 0.5, cursor: agreed ? 'pointer' : 'not-allowed'
                                        }}
                                        onMouseEnter={e => { if (agreed) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                        onMouseLeave={e => { if (agreed) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                    >
                                        <MicrosoftIcon /> Continue with Microsoft
                                    </button>

                                    {/* Yahoo */}
                                    <button
                                        onClick={() => agreed ? initiateLegacyProvider('Yahoo') : toast.error('Agreement Required', 'Accept terms and conditions first.')}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                            padding: '16px 20px', background: 'rgba(96,1,210,0.1)',
                                            color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 600,
                                            border: '1px solid rgba(124,58,237,0.25)', transition: 'all 0.2s',
                                            width: '100%', opacity: agreed ? 1 : 0.5, cursor: agreed ? 'pointer' : 'not-allowed'
                                        }}
                                        onMouseEnter={e => { if (agreed) e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; }}
                                        onMouseLeave={e => { if (agreed) e.currentTarget.style.background = 'rgba(96,1,210,0.1)'; }}
                                    >
                                        <YahooIcon /> Continue with Yahoo
                                    </button>
                                </div>

                                {/* Domain Notice */}
                                <div style={{
                                    marginTop: 20,
                                    background: 'rgba(255,184,48,0.08)',
                                    border: '1px solid rgba(255,184,48,0.2)',
                                    borderRadius: 10, padding: '12px 16px',
                                    display: 'flex', gap: 10, alignItems: 'flex-start'
                                }}>
                                    <Info size={14} color="#ffb830" style={{ flexShrink: 0, marginTop: 1 }} />
                                    <p style={{ fontSize: 12, color: '#ffb830', margin: 0, lineHeight: 1.5 }}>
                                        <strong>Google OAuth setup required:</strong> Add your Vercel domain to{' '}
                                        <strong>Authorized JavaScript Origins</strong> in{' '}
                                        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
                                            style={{ color: '#ffd060', textDecoration: 'underline' }}>
                                            Google Cloud Console
                                        </a>{' '}
                                        for login to work on production.
                                    </p>
                                </div>

                                {/* Footer */}
                                <div style={{
                                    marginTop: 20, fontSize: 12, color: 'var(--text-3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                }}>
                                    <ShieldCheck size={13} color="#00ff88" />
                                    Protected by OAuth 2.0 · Read-only access
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Step: Legacy Credentials ─── */}
                    {step === 'credentials' && (
                        <motion.div
                            key="credentials"
                            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
                        >
                            <form
                                onSubmit={handleManualScan}
                                className="premium-glass"
                                style={{ maxWidth: 460, margin: '0 auto', padding: '40px', borderRadius: 24, position: 'relative' }}
                            >
                                <button
                                    type="button" onClick={() => setStep('provider')}
                                    style={{
                                        position: 'absolute', top: 20, left: 20,
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--text-2)', padding: '7px 14px', borderRadius: 20,
                                        fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    <ArrowLeft size={15} /> Back
                                </button>

                                <div style={{ textAlign: 'center', marginTop: 28, marginBottom: 28 }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 52, height: 52, borderRadius: 14,
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                        marginBottom: 14
                                    }}>
                                        {provider === 'Microsoft' ? <MicrosoftIcon /> : <YahooIcon />}
                                    </div>
                                    <h3 style={{ fontSize: 20, color: 'var(--text-1)', fontWeight: 700, marginBottom: 6 }}>App Password Login</h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 }}>
                                        Use a 16-character App Password from your account security settings.
                                    </p>
                                </div>

                                <div style={{ marginBottom: 18 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                                        Email Address
                                    </label>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 12, padding: '0 16px'
                                    }}>
                                        <Mail size={16} color="var(--text-3)" />
                                        <input
                                            style={{ flex: 1, padding: '14px 0', background: 'transparent', border: 'none', color: '#fff', fontSize: 14, outline: 'none' }}
                                            type="email"
                                            placeholder={`you@${provider?.toLowerCase()}.com`}
                                            value={credentials.email}
                                            onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                            required autoFocus
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 28 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                                        App Password
                                    </label>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 12, padding: '0 16px'
                                    }}>
                                        <KeyRound size={16} color="var(--text-3)" />
                                        <input
                                            style={{ flex: 1, padding: '14px 0', background: 'transparent', border: 'none', color: '#fff', fontSize: 14, outline: 'none' }}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="xxxx xxxx xxxx xxxx"
                                            value={credentials.password}
                                            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-3)', padding: 6, cursor: 'pointer', lineHeight: 0 }}>
                                            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15, fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    Authenticate & Scan <ArrowRight size={17} />
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* ─── Step: Scanning Animation ─── */}
                    {step === 'scanning' && (
                        <motion.div
                            key="scanning"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ textAlign: 'center', padding: '80px 20px' }}
                        >
                            <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 28px' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed #00f5ff', opacity: 0.3 }} />
                                <motion.div animate={{ rotate: -360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                    style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '2px dashed #a78bfa', opacity: 0.25 }} />
                                <Loader2 size={36} color="#00f5ff"
                                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                                    className="spin-slow" />
                            </div>
                            <h3 style={{ fontSize: 26, marginBottom: 12, fontWeight: 700 }}>Analyzing Inbox</h3>
                            <p style={{ color: 'var(--text-3)', maxWidth: 400, margin: '0 auto', lineHeight: 1.65, fontSize: 15 }}>
                                Extracting emails from <span style={{ color: '#00f5ff', fontWeight: 600 }}>{provider}</span>, identifying IOCs, and running through AI threat engine.
                            </p>
                        </motion.div>
                    )}

                    {/* ─── Step: Complete — Dashboard ─── */}
                    {step === 'complete' && emails.length > 0 && selectedEmailIdx !== null && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            style={{ maxWidth: 1400, margin: '0 auto' }}
                        >
                            {/* Dashboard Toolbar */}
                            <div className="premium-glass" style={{
                                padding: '20px 28px', marginBottom: 20,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderRadius: 18, gap: 16, flexWrap: 'wrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12,
                                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Radar size={22} color="#a78bfa" />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700, letterSpacing: '-0.01em' }}>AI Threat Dashboard</h2>
                                        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88', display: 'inline-block' }} />
                                            Stream Analyzed · {emails.length} emails
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div style={{ display: 'flex', gap: 20, background: 'rgba(0,0,0,0.2)', padding: '10px 22px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                                    {[
                                        { label: 'TOTAL', value: emails.length, color: 'var(--text-1)' },
                                        { label: 'SCAM', value: scamCount, color: '#ff2e5b' },
                                        { label: 'SPAM', value: spamCount, color: '#ffb830' },
                                        { label: 'SAFE', value: safeCount, color: '#00ff88' },
                                        { label: 'LINKS', value: totalLinks, color: '#ff7832' },
                                        { label: 'AVG RISK', value: `${averageRisk}%`, color: averageRisk > 50 ? '#ff2e5b' : 'var(--text-1)' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ textAlign: 'center', minWidth: 40 }}>
                                            <div style={{ fontSize: 10, color: stat.color, letterSpacing: '0.07em', fontWeight: 700, marginBottom: 3 }}>{stat.label}</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="btn-ghost" onClick={resetSession}
                                    style={{ fontSize: 13, padding: '10px 20px', borderRadius: 10, borderColor: 'rgba(255,255,255,0.12)', whiteSpace: 'nowrap' }}
                                >
                                    End Session
                                </button>
                            </div>

                            {/* Split Pane */}
                            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

                                {/* Left: Email List */}
                                <div style={{
                                    flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 8,
                                    height: 'calc(100vh - 280px)', overflowY: 'auto',
                                    paddingRight: 6, scrollbarWidth: 'thin'
                                }}>
                                    {emails.map((email, idx) => {
                                        const st = getCategoryStyles(email.category, email.risk_score);
                                        const isSelected = selectedEmailIdx === idx;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedEmailIdx(idx)}
                                                style={{
                                                    padding: '14px 16px', cursor: 'pointer', borderRadius: 14,
                                                    border: isSelected ? `1.5px solid ${st.col}` : '1px solid rgba(255,255,255,0.07)',
                                                    background: isSelected ? `${st.bg}` : 'rgba(255,255,255,0.02)',
                                                    transition: 'all 0.2s', display: 'flex', gap: 12, alignItems: 'center'
                                                }}
                                            >
                                                {/* Category Icon */}
                                                <div style={{
                                                    width: 38, height: 38, borderRadius: 10,
                                                    background: st.bg, border: `1px solid ${st.col}30`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                }}>
                                                    {st.icon}
                                                </div>
                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <span style={{ fontSize: 10, fontWeight: 800, color: st.col, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                            {email.category}
                                                        </span>
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 700,
                                                            background: email.risk_score >= 70 ? 'rgba(255,46,91,0.15)' : email.risk_score >= 40 ? 'rgba(255,184,48,0.12)' : 'rgba(0,255,136,0.1)',
                                                            color: email.risk_score >= 70 ? '#ff2e5b' : email.risk_score >= 40 ? '#ffb830' : '#00ff88',
                                                            padding: '2px 7px', borderRadius: 6
                                                        }}>
                                                            {email.risk_score}%
                                                        </span>
                                                    </div>
                                                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {email.subject}
                                                    </h4>
                                                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {email.from}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right: Detail Pane */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {(() => {
                                        const active = emails[selectedEmailIdx];
                                        const st = getCategoryStyles(active.category, active.risk_score);
                                        return (
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={selectedEmailIdx}
                                                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                                    className="premium-glass"
                                                    style={{ padding: '36px 40px', borderRadius: 22, borderTop: `3px solid ${st.col}` }}
                                                >
                                                    {/* Email Header Row */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, gap: 24 }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            {/* Tags */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                                                <span style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                                    padding: '5px 12px', background: st.bg,
                                                                    border: `1px solid ${st.col}40`,
                                                                    borderRadius: 8, color: st.col,
                                                                    fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em'
                                                                }}>
                                                                    {st.icon} {active.category}
                                                                </span>
                                                                <span style={{ fontSize: 12, color: 'var(--text-3)', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: 8 }}>
                                                                    {active.date || 'Unknown Date'}
                                                                </span>
                                                            </div>
                                                            {/* Subject */}
                                                            <h2 style={{
                                                                fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800,
                                                                color: 'var(--text-1)', lineHeight: 1.3,
                                                                margin: '0 0 16px 0', letterSpacing: '-0.02em',
                                                                wordBreak: 'break-word'
                                                            }}>
                                                                {active.subject}
                                                            </h2>
                                                            {/* Sender */}
                                                            <div style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                                                background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.1)',
                                                                padding: '9px 16px', borderRadius: 10
                                                            }}>
                                                                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>From:</span>
                                                                <span style={{ fontSize: 14, color: '#00f5ff', fontWeight: 600, wordBreak: 'break-all' }}>{active.from}</span>
                                                            </div>
                                                        </div>

                                                        {/* Risk Score Badge */}
                                                        <div style={{
                                                            width: 110, height: 110, borderRadius: 20,
                                                            background: 'rgba(0,0,0,0.35)', border: `2px solid ${st.col}35`,
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                            justifyContent: 'center', flexShrink: 0,
                                                            boxShadow: `0 0 30px ${st.col}18`
                                                        }}>
                                                            <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                                                                Risk Index
                                                            </span>
                                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                                                <span style={{ fontSize: 38, fontWeight: 900, color: st.col, lineHeight: 1 }}>{active.risk_score}</span>
                                                                <span style={{ fontSize: 15, color: st.col, fontWeight: 700 }}>%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Snippet */}
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.22)', padding: '22px 26px',
                                                        borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)',
                                                        marginBottom: 28
                                                    }}>
                                                        <h4 style={{ margin: '0 0 10px 0', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                                                            Email Snippet
                                                        </h4>
                                                        <p style={{
                                                            margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75,
                                                            fontStyle: 'italic', borderLeft: '3px solid rgba(255,255,255,0.1)',
                                                            paddingLeft: 16
                                                        }}>
                                                            {active.snippet || 'No snippet available.'}
                                                        </p>
                                                    </div>

                                                    {/* AI Analysis Section */}
                                                    <h4 style={{ margin: '0 0 16px 0', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                                                        AI Neural Engine Analysis
                                                    </h4>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                        {/* Reason */}
                                                        <div style={{
                                                            display: 'flex', alignItems: 'flex-start', gap: 16, padding: '22px 24px',
                                                            background: active.risk_score >= 70 ? st.bg : 'rgba(0,245,255,0.04)',
                                                            borderRadius: 14,
                                                            border: `1px solid ${active.risk_score >= 70 ? st.col + '40' : 'rgba(0,245,255,0.15)'}`
                                                        }}>
                                                            {active.risk_score >= 70
                                                                ? <ShieldAlert size={24} color={st.col} style={{ flexShrink: 0, marginTop: 1 }} />
                                                                : <CheckCircle2 size={24} color="#00f5ff" style={{ flexShrink: 0, marginTop: 1 }} />
                                                            }
                                                            <div>
                                                                <div style={{
                                                                    fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                                                                    letterSpacing: '0.07em', marginBottom: 8,
                                                                    color: active.risk_score >= 70 ? st.col : '#00f5ff'
                                                                }}>
                                                                    Threat Engine Breakdown
                                                                </div>
                                                                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
                                                                    {active.reason}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Action + Links Row */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: active.links_found > 0 ? '1fr 1fr' : '1fr', gap: 14 }}>
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center', gap: 14,
                                                                padding: '18px 20px', borderRadius: 14,
                                                                background: 'rgba(255,255,255,0.03)',
                                                                border: '1px solid rgba(255,255,255,0.08)'
                                                            }}>
                                                                <Zap size={22} color={st.col} style={{ flexShrink: 0 }} />
                                                                <div>
                                                                    <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>
                                                                        Recommended Action
                                                                    </div>
                                                                    <div style={{ fontSize: 16, color: 'var(--text-1)', fontWeight: 700 }}>
                                                                        {active.action || 'No Action Needed'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {active.links_found > 0 && (
                                                                <div style={{
                                                                    display: 'flex', alignItems: 'center', gap: 14,
                                                                    padding: '18px 20px', borderRadius: 14,
                                                                    background: 'rgba(255,120,50,0.08)',
                                                                    border: '1px solid rgba(255,120,50,0.25)'
                                                                }}>
                                                                    <Link size={22} color="#ff7832" style={{ flexShrink: 0 }} />
                                                                    <div>
                                                                        <div style={{ fontSize: 10, color: '#ff7832', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>
                                                                            Threat Vectors
                                                                        </div>
                                                                        <div style={{ fontSize: 16, color: '#ff7832', fontWeight: 700 }}>
                                                                            {active.links_found} Suspicious Link{active.links_found > 1 ? 's' : ''} Detected
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>
                                        );
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Step: Complete — Empty Inbox ─── */}
                    {step === 'complete' && emails.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="premium-glass"
                            style={{
                                textAlign: 'center', padding: '72px 40px',
                                borderRadius: 24, border: '1px dashed rgba(255,255,255,0.12)',
                                maxWidth: 560, margin: '0 auto'
                            }}
                        >
                            <div style={{
                                width: 60, height: 60, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.04)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 18px'
                            }}>
                                <Inbox size={28} color="var(--text-3)" />
                            </div>
                            <h3 style={{ fontSize: 20, marginBottom: 10, fontWeight: 700 }}>No Emails Found</h3>
                            <p style={{ color: 'var(--text-3)', fontSize: 14, maxWidth: 300, margin: '0 auto 28px', lineHeight: 1.6 }}>
                                Your inbox returned 0 readable messages. This may be a permission or API scope issue.
                            </p>
                            <button
                                className="btn-ghost" onClick={resetSession}
                                style={{ fontSize: 13, padding: '10px 22px', borderRadius: 10, borderColor: 'rgba(255,255,255,0.1)' }}
                            >
                                Start Over
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </section>
    );
};

/* ─── Wrapped Export ─────────────────────────────────────────────────────── */
export default function InboxScanner() {
    const CLIENT_ID = "959307556734-bs9vcm29194c97hvjg4uf1olhdi6c4ba.apps.googleusercontent.com";
    return (
        <GoogleOAuthProvider clientId={CLIENT_ID}>
            <InboxScannerContent />
        </GoogleOAuthProvider>
    );
}
