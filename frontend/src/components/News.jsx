import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Radio, Loader2, ExternalLink } from 'lucide-react';

const API = 'http://localhost:8000';

const itemV = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } } };

export default function News() {
    const [news, setNews] = useState([]);
    const [loading, setLoad] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const r = await axios.get(`${API}/news`);
                setNews(r.data);
            } catch { setNews([]); }
            finally { setLoad(false); }
        };
        fetchNews();
    }, []);

    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80, position: 'relative' }}>
            {/* Glow orb */}
            <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,.1) 0%, transparent 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} style={{ marginBottom: 48 }}>
                    <div className="section-eyebrow">
                        <Radio size={12} style={{ animation: 'blink 2s infinite step-end' }} />
                        Cyber Intelligence Feed
                    </div>
                    <h1 className="syne" style={{ fontSize: 'clamp(36px,5vw,52px)', fontWeight: 800, letterSpacing: '-.02em' }}>
                        Global <span className="glow-text">News</span> Feed
                    </h1>
                    <p style={{ color: 'var(--text-2)', marginTop: 8, fontSize: 15 }}>Latest cybersecurity threats, breaches, and industry updates.</p>
                </motion.div>

                {loading && (
                    <div style={{ textAlign: 'center', color: 'var(--violet)', padding: '80px 0' }}>
                        <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin-slow .8s linear infinite' }} />
                    </div>
                )}

                {!loading && news.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ padding: 60, textAlign: 'center' }}>
                        <Radio size={48} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
                        <div style={{ color: 'var(--text-2)', fontSize: 15 }}>No news available at the moment.</div>
                    </motion.div>
                )}

                {!loading && news.length > 0 && (
                    <motion.div
                        initial="hidden" animate="show"
                        variants={{ show: { transition: { staggerChildren: .1 } } }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}
                    >
                        {news.map((n, i) => (
                            <motion.div key={i} variants={itemV} whileHover={{ borderColor: 'rgba(124,58,237,.3)', boxShadow: '0 0 30px rgba(124,58,237,.1)', transform: 'translateY(-4px)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', color: 'inherit' }} className="glass">
                                    <div style={{ padding: 24, flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: 'var(--r-full)',
                                                background: 'rgba(124,58,237,.1)', color: 'var(--violet)',
                                                fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                                            }}>
                                                {n.tag}
                                            </span>
                                            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{n.time}</span>
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: 'var(--text-1)', marginBottom: 12 }}>{n.title}</h3>
                                        {n.summary && (
                                            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
                                                {n.summary}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', borderTop: '1px solid var(--border)', paddingTop: 16, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{n.source}</span>
                                            <a href={n.link || '#'} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '6px 12px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                                                Reference <ExternalLink size={12} color="var(--violet)" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
