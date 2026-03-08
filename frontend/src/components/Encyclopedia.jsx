import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ShieldAlert, Cpu, Network, Key, MailX, Globe, FileWarning, EyeOff, Loader2, X, Bot } from 'lucide-react';
import axios from 'axios';

const THREATS = [
    { title: 'Phishing', icon: MailX, color: '#f59e0b', desc: 'Fraudulent attempts to obtain sensitive information such as usernames, passwords, and credit card details by disguising as a trustworthy entity.' },
    { title: 'Ransomware', icon: FileWarning, color: '#ef4444', desc: 'Malicious software that threatens to publish the victim’s data or perpetually block access to it unless a ransom is paid.' },
    { title: 'DDoS Attack', icon: Network, color: '#3b82f6', desc: 'Distributed Denial of Service attacks overwhelm a target server, service, or network with a flood of Internet traffic, disrupting normal traffic.' },
    { title: 'Social Engineering', icon: EyeOff, color: '#8b5cf6', desc: 'The psychological manipulation of people into performing actions or divulging confidential information, often relying on human error.' },
    { title: 'Zero-Day Exploit', icon: Cpu, color: '#10b981', desc: 'A cyber attack that occurs on the same day a weakness is discovered in software, meaning developers have zero days to fix the flaw.' },
    { title: 'Man-In-The-Middle (MITM)', icon: Globe, color: '#f97316', desc: 'An attacker secretly relays and possibly alters the communication between two parties who believe they are directly communicating with each other.' },
    { title: 'SQL Injection', icon: ShieldAlert, color: '#06b6d4', desc: 'A code injection technique used to attack data-driven applications, inserting malicious SQL statements into entry fields for execution.' },
    { title: 'Credential Stuffing', icon: Key, color: '#ec4899', desc: 'Cybercriminals use automated injection of breached username/password pairs in order to fraudulently gain access to user accounts.' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } }
};

export default function Encyclopedia() {
    const [activeThreat, setActiveThreat] = useState(null);
    const [aiData, setAiData] = useState('');
    const [loading, setLoading] = useState(false);

    const openThreat = async (threat) => {
        setActiveThreat(threat);
        setLoading(true);
        setAiData('');

        try {
            const res = await axios.post('https://all-safe-final-j8mc.onrender.com/scan/threat-info', {
                threat: threat.title
            });
            setAiData(res.data.ai_summary || 'Error retrieving data.');
        } catch (e) {
            setAiData('Failed to communicate with AI Engine.');
        } finally {
            setLoading(false);
        }
    };

    const formatAIText = (text) => {
        if (!text) return null;
        return text.split('\n').filter(t => t.trim()).map((line, i) => {
            let fmt = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-1)">$1</strong>');
            fmt = fmt.replace(/\*(.*?)\*/g, '<em style="color:var(--violet)">$1</em>');
            if (fmt.match(/^(\d+\.|-|\*)\s/)) {
                return (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <span style={{ color: 'var(--violet)' }}>•</span>
                        <div dangerouslySetInnerHTML={{ __html: fmt.replace(/^(\d+\.|-|\*)\s/, '') }} style={{ lineHeight: 1.6 }} />
                    </div>
                );
            }
            return <p key={i} dangerouslySetInnerHTML={{ __html: fmt }} style={{ marginBottom: 16, lineHeight: 1.6 }} />;
        });
    };

    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '30%', left: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,.1) 0%, transparent 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48, textAlign: 'center' }}>
                    <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
                        <BookOpen size={12} style={{ color: 'var(--violet)' }} />
                        Educational Hub
                    </div>
                    <h1 className="syne" style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, marginTop: 16 }}>
                        Threat <span style={{ color: 'var(--violet)', textShadow: '0 0 30px rgba(139,92,246,.3)' }}>Encyclopedia</span>
                    </h1>
                    <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 16, maxWidth: 600, margin: '16px auto 0' }}>
                        Learn about the most common attack vectors. Click on any threat for an AI-powered breakdown.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}
                >
                    {THREATS.map((t, i) => (
                        <motion.button
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openThreat(t)}
                            className="glass"
                            style={{
                                padding: 24, borderRadius: 16, borderTop: `4px solid ${t.color}`,
                                textAlign: 'left', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', border: '1px solid var(--border)',
                                color: 'inherit', width: '100%', display: 'block'
                            }}
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <t.icon size={24} color={t.color} />
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>{t.title}</h3>
                            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>{t.desc}</p>
                            <div style={{ marginTop: 20, fontSize: 12, fontWeight: 700, color: t.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Bot size={14} /> AI Analysis
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            {/* AI Modal Overlay */}
            <AnimatePresence>
                {activeThreat && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                        onClick={() => setActiveThreat(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="glass"
                            style={{ width: '100%', maxWidth: 700, maxHeight: '85vh', borderRadius: 24, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${activeThreat.color}40`, boxShadow: `0 0 80px ${activeThreat.color}20` }}
                        >
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${activeThreat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <activeThreat.icon size={20} color={activeThreat.color} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{activeThreat.title}</h2>
                                        <div style={{ fontSize: 12, color: 'var(--violet)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Bot size={12} /> ALL SAFE AI Breakdown
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setActiveThreat(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-2)', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={{ padding: 32, overflowY: 'auto', color: 'var(--text-2)' }}>
                                {loading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
                                        <Loader2 size={32} color={activeThreat.color} style={{ animation: 'spin-slow 1s linear infinite' }} />
                                        <div style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 600, letterSpacing: '.1em' }}>GENERATING REPORT...</div>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 15 }}>
                                        {formatAIText(aiData)}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
