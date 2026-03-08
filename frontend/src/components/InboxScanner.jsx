import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, ShieldCheck, ShieldAlert, AlertTriangle, EyeOff, Eye, Loader2, ArrowRight, UserCircle2, Building2, CheckCircle2, Megaphone, Inbox, ArrowLeft, Fingerprint, Zap, Radar, Upload, Link } from 'lucide-react';
import { toast } from './Toast';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

const API = 'http://localhost:8000';

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

const RealGoogleLoginBtn = ({ onComplete, disabled }) => {
    const login = useGoogleLogin({
        onSuccess: tokenResponse => {
            onComplete({
                email: 'Your Google Account', // Gmail API infers from Token
                provider: 'Google',
                token: tokenResponse.access_token,
                imap_server: 'oauth',
            });
        },
        onError: () => toast.error("Login Failed", "Google authentication cancelled or failed"),
        scope: "https://www.googleapis.com/auth/gmail.readonly"
    });

    return (
        <button onClick={() => { if (!disabled) login(); else toast.error("Agreement Required", "Please accept the terms and conditions first."); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px', background: disabled ? 'rgba(255,255,255,0.6)' : '#ffffff', color: '#1f2937', borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', transition: 'all 0.2s', width: '100%', boxShadow: '0 4px 12px rgba(255,255,255,0.05)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1 }} onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(255,255,255,0.1)'; } }} onMouseLeave={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.05)'; } }}>
            <GoogleIcon /> Continue with Google
        </button>
    );
};

const InboxScannerContent = () => {
    const [step, setStep] = useState('provider'); // provider, credentials, scanning, complete
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
            password: authData.token, // For OAuth, token is passed in password field
            imap_server: authData.imap_server,
            is_oauth: true
        };
        setCredentials(creds);
        performScan(creds, '/scan/inbox');
    };

    const initiateLegacyProvider = (providerName) => {
        setProvider(providerName);
        setCredentials({ email: '', password: '', imap_server: providerName === 'Microsoft' ? 'outlook.office365.com' : 'imap.mail.yahoo.com', is_oauth: false });
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
                const err = await res.json();
                throw new Error(err.detail || 'Connection failed.');
            }

            const data = await res.json();
            if (data.status === 'success') {
                setEmails(data.emails);
                setStep('complete');
                setSelectedEmailIdx(data.emails.length > 0 ? 0 : null);
                toast.success("Analysis Complete", `Successfully scanned ${data.emails.length} email(s).`);
            } else {
                throw new Error("Invalid response format.");
            }
        } catch (error) {
            toast.error("Analysis Error", error.message);
            setStep('provider');
        }
    };

    const getCategoryStyles = (category, score) => {
        if (score >= 80 || category === 'Scam') return { col: 'var(--red)', bg: 'rgba(255,46,91,.08)', icon: <ShieldAlert size={18} color="var(--red)" /> };
        if (score >= 40 || category === 'Spam') return { col: '#ffb830', bg: 'rgba(255,184,48,.08)', icon: <AlertTriangle size={18} color="#ffb830" /> };
        if (category === 'Company') return { col: 'var(--cyan)', bg: 'rgba(0,245,255,.08)', icon: <Building2 size={18} color="var(--cyan)" /> };
        if (category === 'Personal') return { col: 'var(--violet)', bg: 'rgba(124,58,237,.08)', icon: <UserCircle2 size={18} color="var(--violet)" /> };
        if (category === 'Newsletter') return { col: '#94a3b8', bg: 'rgba(255,255,255,.05)', icon: <Megaphone size={18} color="#94a3b8" /> };
        return { col: 'var(--green)', bg: 'rgba(0,255,136,.06)', icon: <ShieldCheck size={18} color="var(--green)" /> };
    };

    // Summary calculations
    const scamCount = emails.filter(e => e.category === 'Scam').length;
    const spamCount = emails.filter(e => e.category === 'Spam').length;
    const highRiskCount = emails.filter(e => e.risk_score >= 80).length;
    const safeCount = emails.length - scamCount - spamCount;
    const totalLinks = emails.reduce((acc, curr) => acc + (curr.links_found || 0), 0);
    const averageRisk = emails.length > 0 ? (emails.reduce((acc, curr) => acc + curr.risk_score, 0) / emails.length).toFixed(0) : 0;

    return (
        <section className="section-padding" style={{ minHeight: '100vh', position: 'relative' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: 60, maxWidth: 700, margin: '0 auto 60px' }}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: 16 }}>
                        <span className="badge badge-medium" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, borderRadius: 20, letterSpacing: '0.05em' }}>
                            <Zap size={14} color="#ff7832" /> ADVANCED AI MAIL PROFILER
                        </span>
                    </motion.div>
                    <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ fontSize: 'clamp(38px, 5vw, 56px)', lineHeight: 1.1, marginBottom: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Autonomous <span className="gradient-text" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Email Triage</span>
                    </motion.h1>
                    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ color: 'var(--text-2)', fontSize: 18, lineHeight: 1.7, maxWidth: 650, margin: '0 auto' }}>
                        Connect your inbox securely. Our powerful neural pipeline parses incoming payloads to extract and neutralize unseen phishing threats before you interact with them.
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'provider' && (
                        <motion.div key="provider" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
                            <div className="premium-glass" style={{ maxWidth: 500, margin: '0 auto', padding: '48px 40px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: 24 }}>
                                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: 'inset 0 0 20px rgba(0,245,255,0.05)' }}>
                                    <Fingerprint size={32} color="var(--cyan)" />
                                </div>
                                <h3 style={{ fontSize: 24, marginBottom: 12, fontWeight: 600 }}>Secure Synchronization</h3>
                                <p style={{ fontSize: 15, color: 'var(--text-3)', marginBottom: 40, lineHeight: 1.5 }}>Use OAuth to securely let AI analyze your inbox for hidden threats. Passwords are never stored.</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '18px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
                                        <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 4, cursor: 'pointer', width: 20, height: 20, accentColor: 'var(--cyan)' }} />
                                        <label htmlFor="terms" style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, cursor: 'pointer' }}>
                                            I agree to the <a href="#" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}>Terms & Conditions</a> and <a href="#" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</a>. I understand that AI will read my inbox locally to extract phishing intents.
                                        </label>
                                    </div>

                                    {/* REAL GOOGLE OAUTH FLOW */}
                                    <RealGoogleLoginBtn onComplete={handleOAuthComplete} disabled={!agreed} />

                                    <button onClick={() => { if (agreed) initiateLegacyProvider('Microsoft'); else toast.error('Agreement Required', 'Please accept the terms and conditions first.'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px', background: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: 16, fontSize: 16, fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s', width: '100%', opacity: agreed ? 1 : 0.6, cursor: agreed ? 'pointer' : 'not-allowed' }} onMouseEnter={e => { if (agreed) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }} onMouseLeave={e => { if (agreed) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                                        <MicrosoftIcon /> Continue with Microsoft
                                    </button>

                                    <button onClick={() => { if (agreed) initiateLegacyProvider('Yahoo'); else toast.error('Agreement Required', 'Please accept the terms and conditions first.'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px', background: 'rgba(124,58,237,0.1)', color: '#fff', borderRadius: 16, fontSize: 16, fontWeight: 600, border: '1px solid rgba(124,58,237,0.2)', transition: 'all 0.2s', width: '100%', opacity: agreed ? 1 : 0.6, cursor: agreed ? 'pointer' : 'not-allowed' }} onMouseEnter={e => { if (agreed) e.currentTarget.style.background = 'rgba(124,58,237,0.2)' }} onMouseLeave={e => { if (agreed) e.currentTarget.style.background = 'rgba(124,58,237,0.1)' }}>
                                        <YahooIcon /> Continue with Yahoo
                                    </button>

                                </div>
                                <div style={{ marginTop: 32, fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <ShieldCheck size={14} color="var(--green)" /> Protected by OAuth 2.0 API Extractor
                                </div>
                            </div>
                        </motion.div>
                    )}



                    {step === 'credentials' && (
                        <motion.div key="credentials" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                            <form onSubmit={handleManualScan} className="premium-glass" style={{ maxWidth: 480, margin: '0 auto', padding: '40px', borderRadius: 24, position: 'relative' }}>
                                <button type="button" onClick={() => setStep('provider')} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', padding: '8px 14px', borderRadius: '20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                    <ArrowLeft size={16} /> Back
                                </button>

                                <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 32 }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
                                        {provider === 'Microsoft' ? <MicrosoftIcon /> : <YahooIcon />}
                                    </div>
                                    <h3 style={{ fontSize: 22, color: 'var(--text-1)' }}>Legacy App Password</h3>
                                    <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8 }}>OAuth is recommended. Entering App Passwords bypasses modern security flows.</p>
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10, letterSpacing: '.05em' }}>EMAIL ADDRESS</label>
                                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '4px 16px' }}>
                                        <Mail size={18} color="var(--text-3)" />
                                        <input
                                            style={{ flex: 1, padding: '14px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: 15 }}
                                            type="email" placeholder={`yourname@${provider.toLowerCase()}.com`}
                                            value={credentials.email} onChange={e => setCredentials({ ...credentials, email: e.target.value })} required autoFocus
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: 36 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.05em' }}>APP PASSWORD</label>
                                    </div>
                                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '4px 16px' }}>
                                        <KeyRound size={18} color="var(--text-3)" />
                                        <input
                                            style={{ flex: 1, padding: '14px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: 15 }}
                                            type={showPassword ? "text" : "password"} placeholder="16-digit app password"
                                            value={credentials.password} onChange={e => setCredentials({ ...credentials, password: e.target.value })} required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', padding: 8, cursor: 'pointer' }}>
                                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: 15, fontWeight: 700, borderRadius: 12 }}>
                                    Authenticate & Scan <ArrowRight size={18} />
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'scanning' && (
                        <motion.div key="scanning" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '80px 20px' }}>
                            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 30px' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed var(--cyan)', opacity: 0.3 }} />
                                <motion.div animate={{ rotate: -360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px dashed var(--violet)', opacity: 0.3 }} />
                                <Loader2 size={40} color="var(--cyan)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} className="spin-slow" />
                            </div>
                            <h3 style={{ fontSize: 28, marginBottom: 16, fontWeight: 600 }}>Analyzing Target Data</h3>
                            <p style={{ color: 'var(--text-3)', maxWidth: 450, margin: '0 auto', lineHeight: 1.6, fontSize: 16 }}>
                                Extracting components from <span style={{ color: 'var(--cyan)' }}>{provider}</span> stream, identifying IOCs, and passing through LLM security rules.
                            </p>
                        </motion.div>
                    )}

                    {step === 'complete' && emails.length > 0 && selectedEmailIdx !== null && (
                        <motion.div key="complete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 1400, margin: '0 auto' }}>
                            {/* Dashboard Header */}
                            <div className="premium-glass" style={{ padding: '24px 32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.2)' }}>
                                        <Radar size={24} color="var(--violet)" />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 24, margin: '0 0 6px', fontWeight: 700, letterSpacing: '-0.01em' }}>AI Threat Dashboard</h2>
                                        <div style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} /> Stream Analyzed
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 24, marginRight: 24, background: 'rgba(0,0,0,0.2)', padding: '10px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: 2 }}>TOTAL</div><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{emails.length}</div></div>
                                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--red)', letterSpacing: '0.05em', marginBottom: 2 }}>SCAM</div><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>{scamCount}</div></div>
                                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#ff7832', letterSpacing: '0.05em', marginBottom: 2 }}>LINKS</div><div style={{ fontSize: 18, fontWeight: 800, color: '#ff7832' }}>{totalLinks}</div></div>
                                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: 2 }}>AVG RISK</div><div style={{ fontSize: 18, fontWeight: 800, color: averageRisk > 50 ? 'var(--red)' : 'var(--text-1)' }}>{averageRisk}%</div></div>
                                    </div>
                                    <button className="btn-ghost" onClick={() => { setStep('provider'); setCredentials({ email: '', password: '', imap_server: '', is_oauth: false }); setEmails([]); setAgreed(false); }} style={{ fontSize: 14, padding: '12px 24px', borderRadius: 12, borderColor: 'rgba(255,255,255,0.1)' }}>
                                        End Session
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                                {/* Left: Email Master List */}
                                <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: 8, scrollbarWidth: 'thin' }}>
                                    {emails.map((email, idx) => {
                                        const st = getCategoryStyles(email.category, email.risk_score);
                                        const isSelected = selectedEmailIdx === idx;
                                        return (
                                            <div key={idx} onClick={() => setSelectedEmailIdx(idx)} className="premium-glass" style={{ padding: '16px 20px', cursor: 'pointer', borderRadius: 16, border: isSelected ? `2px solid ${st.col}` : '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)', transition: 'all 0.2s', display: 'flex', gap: 16, alignItems: 'center', opacity: isSelected ? 1 : 0.7 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${st.col}40` }}>
                                                    {st.icon}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: st.col, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{email.category}</span>
                                                        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{email.risk_score}% Risk</span>
                                                    </div>
                                                    <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-1)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{email.subject}</h4>
                                                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.from}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Right: Detail View */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {(() => {
                                        const active = emails[selectedEmailIdx];
                                        const st = getCategoryStyles(active.category, active.risk_score);
                                        return (
                                            <AnimatePresence mode="wait">
                                                <motion.div key={selectedEmailIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="premium-glass" style={{ padding: 48, borderRadius: 24, borderTop: `4px solid ${st.col}` }}>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                                                        <div style={{ flex: 1, paddingRight: 40 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                                                <div style={{ padding: '6px 14px', background: st.bg, border: `1px solid ${st.col}40`, borderRadius: 10, color: st.col, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    {st.icon} {active.category}
                                                                </div>
                                                                <div style={{ fontSize: 13, color: 'var(--text-3)', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 10, fontWeight: 500 }}>
                                                                    {active.date || 'Unknown Date'}
                                                                </div>
                                                            </div>
                                                            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.3, margin: '0 0 20px 0', letterSpacing: '-0.02em' }}>{active.subject}</h2>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: 12 }}>
                                                                <span style={{ color: 'var(--text-3)', fontSize: 14 }}>From:</span>
                                                                <span style={{ color: 'var(--cyan)', fontSize: 15, fontWeight: 500 }}>{active.from}</span>
                                                            </div>
                                                        </div>

                                                        <div style={{ width: 120, height: 120, borderRadius: 24, background: 'rgba(0,0,0,0.3)', border: `2px solid ${st.col}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 40px ${st.bg}` }}>
                                                            <span style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Risk Index</span>
                                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                                                                <span style={{ fontSize: 42, fontWeight: 900, color: st.col }}>{active.risk_score}</span>
                                                                <span style={{ fontSize: 16, color: st.col, fontWeight: 600 }}>%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 32, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 40 }}>
                                                        <h4 style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Raw Payload Snippet</h4>
                                                        <p style={{ margin: 0, fontSize: 16, color: 'var(--text-2)', lineHeight: 1.8, fontStyle: 'italic', position: 'relative', paddingLeft: 24, borderLeft: '3px solid rgba(255,255,255,0.08)' }}>
                                                            <span style={{ position: 'absolute', top: -10, left: -6, fontSize: 36, color: 'rgba(255,255,255,0.1)', lineHeight: 1 }}>"</span>
                                                            {active.snippet}
                                                        </p>
                                                    </div>

                                                    <h4 style={{ margin: '0 0 20px 0', fontSize: 13, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>AI Neural Engine Analysis</h4>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '28px', background: active.category === 'Scam' || active.category === 'Spam' ? st.bg : 'rgba(0,245,255,0.03)', borderRadius: 16, border: `1px solid ${active.category === 'Scam' || active.category === 'Spam' ? st.col + '40' : 'rgba(0,245,255,0.15)'}` }}>
                                                            {active.category === 'Scam' || active.category === 'Spam' || active.risk_score >= 80 ? <ShieldAlert size={28} color={st.col} style={{ flexShrink: 0, marginTop: 2 }} /> : <CheckCircle2 size={28} color="var(--cyan)" style={{ flexShrink: 0, marginTop: 2 }} />}
                                                            <div style={{ fontSize: 16, color: 'var(--text-1)', lineHeight: 1.7 }}>
                                                                <span style={{ color: active.category === 'Scam' || active.category === 'Spam' || active.risk_score >= 80 ? st.col : 'var(--cyan)', fontWeight: 800, marginRight: 8, display: 'block', marginBottom: 8, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Threat Engine Breakdown:</span>
                                                                <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>{active.reason}</span>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                                <Zap size={24} color={st.col} />
                                                                <div>
                                                                    <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Recommended Defense Action</div>
                                                                    <div style={{ fontSize: 18, color: 'var(--text-1)', fontWeight: 700 }}>{active.action || 'No Action Needed'}</div>
                                                                </div>
                                                            </div>
                                                            {(active.links_found > 0) && (
                                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 16, background: 'rgba(255,120,50,0.1)', border: '1px solid rgba(255,120,50,0.2)' }}>
                                                                    <Link size={24} color="#ff7832" />
                                                                    <div>
                                                                        <div style={{ fontSize: 12, color: '#ff7832', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, marginBottom: 4, fontWeight: 600 }}>Threat Vectors Detected</div>
                                                                        <div style={{ fontSize: 18, color: '#ff7832', fontWeight: 700 }}>{active.links_found} Malicious Links Blocker</div>
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

                    {step === 'complete' && emails.length === 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-glass" style={{ textAlign: 'center', padding: '80px 40px', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.15)', maxWidth: 600, margin: '0 auto' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Inbox size={32} color="var(--text-3)" />
                            </div>
                            <h3 style={{ fontSize: 20, marginBottom: 10 }}>No recent emails found via API</h3>
                            <p style={{ color: 'var(--text-3)', fontSize: 15, maxWidth: 300, margin: '0 auto', marginBottom: 30 }}>Payload extraction resulted in 0 readable components.</p>
                            <button className="btn-ghost" onClick={() => { setStep('provider'); setCredentials({ email: '', password: '', imap_server: '', is_oauth: false }); setEmails([]); setAgreed(false); }} style={{ fontSize: 14, padding: '10px 20px', borderRadius: 12, borderColor: 'rgba(255,255,255,0.1)' }}>
                                Close Session
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

export default function InboxScanner() {
    /* Hardcoding Google Client ID to remove .env dependency */
    const CLIENT_ID = "959307556734-bs9vcm29194c97hvjg4uf1olhdi6c4ba.apps.googleusercontent.com";

    return (
        <GoogleOAuthProvider clientId={CLIENT_ID}>
            <InboxScannerContent />
        </GoogleOAuthProvider>
    );
}
