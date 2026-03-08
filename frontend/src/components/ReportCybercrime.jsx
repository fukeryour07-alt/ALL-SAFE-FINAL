import { motion } from 'framer-motion';
import { ShieldCheck, PhoneCall, AlertTriangle, ExternalLink, Siren, Hand } from 'lucide-react';

export default function ReportCybercrime() {
    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '15%', right: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(239,68,68,.1) 0%, transparent 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

            <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48, textAlign: 'center' }}>
                    <div className="section-eyebrow" style={{ justifyContent: 'center', color: '#ef4444' }}>
                        <Siren size={12} style={{ animation: 'blink 1s infinite step-end' }} />
                        Emergency Response (India)
                    </div>
                    <h1 className="syne" style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, marginTop: 16 }}>
                        Report A <span style={{ color: '#ef4444', textShadow: '0 0 30px rgba(239,68,68,.4)' }}>Cybercrime</span>
                    </h1>
                    <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 16, maxWidth: 650, margin: '16px auto 0' }}>
                        If you are a victim of financial fraud, job scams, or identity theft in India, act instantly immediately to maximize your chances of recovering lost assets.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gap: 24, marginBottom: 48 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                        className="glass" style={{ padding: 32, borderRadius: 16, border: '2px solid rgba(239,68,68,.4)', background: 'linear-gradient(45deg, rgba(239,68,68,.05), transparent)' }}
                    >
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <PhoneCall color="#ef4444" size={28} />
                            Step 1: Dial 1930 Immediately
                        </h2>
                        <p style={{ color: 'var(--text-2)', fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
                            Call the National Cyber Crime Helpline <strong style={{ color: '#fff', fontSize: 18 }}>1930</strong>. Calling within the <b>"Golden Hour"</b> (first 1-2 hours of the crime) allows cyber police to freeze the fraudulently transferred funds in the attacker’s bank account before they withdraw it.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        className="glass" style={{ padding: 32, borderRadius: 16 }}
                    >
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <ShieldCheck color="var(--violet)" size={28} />
                            Step 2: File an Official FIR
                        </h2>
                        <p style={{ color: 'var(--text-2)', fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>
                            Log in to the official portal established by the Ministry of Home Affairs to officially register your complaint with digital evidence, screenshots, and transaction IDs.
                        </p>
                        <a
                            href="https://cybercrime.gov.in"
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: 'var(--violet)', color: 'white', fontWeight: 700, borderRadius: 'var(--r-full)', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 0 20px rgba(124,58,237,.4)' }}
                        >
                            Visit Cybercrime.gov.in <ExternalLink size={18} />
                        </a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                        className="glass" style={{ padding: 32, borderRadius: 16 }}
                    >
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <Hand color="#f59e0b" size={28} />
                            Step 3: Freeze Your Assets
                        </h2>
                        <ul style={{ color: 'var(--text-2)', fontSize: 16, lineHeight: 1.8, paddingLeft: 20 }}>
                            <li>Contact your bank's customer support and instruct them to block your compromised credit/debit cards.</li>
                            <li>Change the passwords of your internet banking, Gmail, and social media accounts instantly.</li>
                            <li>Enable Two-Factor Authentication (2FA) on all critical accounts using an Authenticator app (not SMS).</li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
