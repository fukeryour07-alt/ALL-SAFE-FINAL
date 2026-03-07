import { motion } from 'framer-motion';
import { Shield, Github, ExternalLink, Lock, Globe, Zap } from 'lucide-react';

const LINKS = [
    { label: 'Scanner', section: 'scanner' },
    { label: 'Intel', section: 'dashboard' },
    { label: 'Live Map', section: 'livemap' },
    { label: 'Vault', section: 'crypto' },
    { label: 'News', section: 'news' },
    { label: 'Logs', section: 'history' },
    { label: 'Job Scam Detector', section: 'jobscam' },
];

export default function Footer({ nav }) {
    return (
        <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{
                marginTop: 60, padding: '48px 0 28px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,.5))',
                position: 'relative',
            }}
        >
            {/* Top gradient line */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.25), rgba(124,58,237,0.25), transparent)',
            }} />

            <div className="container">
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <Shield size={22} color="var(--cyan)" />
                            <span className="syne" style={{ fontWeight: 800, fontSize: 18 }}>
                                ALL<span style={{ color: 'var(--cyan)' }}> SAFE</span>
                            </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 220, lineHeight: 1.6, fontWeight: 400 }}>
                            Unified Cyber Defense & Threat Intelligence Platform powered by Core Intelligence API.
                        </p>
                    </div>

                    {/* Navigation links */}
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.2em', marginBottom: 16, textTransform: 'uppercase' }}>
                            Platform
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {LINKS.map(l => (
                                <motion.button
                                    key={l.section}
                                    onClick={() => nav && nav(l.section)}
                                    whileHover={{ x: 4, color: 'var(--cyan)' }}
                                    style={{
                                        background: 'none', border: 'none', padding: 0,
                                        color: 'var(--text-3)', fontSize: 13, fontWeight: 500,
                                        cursor: 'pointer', textAlign: 'left',
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    {l.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Tech stack badges */}
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.2em', marginBottom: 16, textTransform: 'uppercase' }}>
                            Built With
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { icon: Globe, label: 'React + Vite' },
                                { icon: Zap, label: 'FastAPI Backend' },
                                { icon: Lock, label: 'VirusTotal API v3' },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                                    <item.icon size={13} color="var(--text-3)" />
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cyber divider */}
                <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

                {/* Bottom row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        © 2026 ALL SAFE — Built for Cyber Hackathon 2026
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-3)', alignItems: 'center' }}>
                        <span className="mono" style={{ fontSize: 10 }}>v2.0.0</span>
                        <span>•</span>
                        <span>Powered by Core Intelligence</span>
                        <span>•</span>
                        <motion.a
                            whileHover={{ color: 'var(--cyan)' }}
                            href="#" style={{ color: 'var(--text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <Github size={13} /> Source
                        </motion.a>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
}
