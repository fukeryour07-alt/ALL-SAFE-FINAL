import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, User, Send, ShieldCheck, ShieldAlert, AlertTriangle,
    Search, Globe, Hash, Lock, Activity, Plus,
    Shield, Trash2, MessageSquare, Sparkles,
    Copy, Check, RotateCcw, ChevronRight,
    WifiOff, RefreshCw, Server, PanelLeft,
    Cpu, Terminal, SquarePen,
} from 'lucide-react';

const API = 'http://localhost:8000';

/* ── Internal model (NOT user-facing) ── */
const MODEL_ID = 'gemini';

const QUICK = [
    { icon: <Activity size={15} />, label: 'Scan IP', prompt: 'scan ip 8.8.8.8', desc: 'IP reputation & geolocation' },
    { icon: <Globe size={15} />, label: 'Scan URL', prompt: 'scan url google.com', desc: 'Phishing & threat analysis' },
    { icon: <Hash size={15} />, label: 'File Hash', prompt: 'check hash d41d8cd98f00b204e9800998ecf8427e', desc: 'Malware hash lookup' },
    { icon: <Lock size={15} />, label: 'Email Breach', prompt: 'check email test@example.com for breaches', desc: 'Data leak exposure' },
    { icon: <Shield size={15} />, label: 'CVE Lookup', prompt: 'explain CVE-2024-3400', desc: 'Vulnerability intel' },
    { icon: <Search size={15} />, label: 'Job Scam', prompt: 'is this a job scam: Work from home earn Rs 50000 daily', desc: 'Scam detection' },
];

const RC = { HIGH: '#ff2e5b', MEDIUM: '#ffb830', LOW: '#ffb830', CLEAN: '#00ff88', UNKNOWN: '#64748b' };
const RI = { HIGH: <ShieldAlert size={13} />, MEDIUM: <AlertTriangle size={13} />, CLEAN: <ShieldCheck size={13} />, LOW: <AlertTriangle size={13} /> };

/* ── Markdown renderer ── */
function md(text) {
    if (!text) return '';
    return String(text)
        .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
            `<div style="margin:12px 0;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
                ${lang ? `<div style="display:flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(0,0,0,0.5);font-family:'JetBrains Mono',monospace;font-size:10px;color:#475569;letter-spacing:.1em;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.05)"><span>⬡</span>${lang}</div>` : ''}
                <pre style="margin:0;padding:14px 16px;background:rgba(0,0,0,0.45);overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.75;color:#94a3b8">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()}</pre>
            </div>`)
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f0f4ff;font-weight:700">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="color:#94a3b8">$1</em>')
        .replace(/`([^`\n]+)`/g, '<code style="background:rgba(0,245,255,0.07);border:1px solid rgba(0,245,255,0.15);padding:2px 7px;border-radius:5px;font-family:\'JetBrains Mono\',monospace;font-size:12px;color:#7dd3fc">$1</code>')
        .replace(/^### (.+)$/gm, '<div style="font-size:13.5px;font-weight:700;color:#e2e8f0;margin:18px 0 6px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:6px">$1</div>')
        .replace(/^## (.+)$/gm, '<div style="font-size:16px;font-weight:800;color:#f0f4ff;margin:20px 0 8px">$1</div>')
        .replace(/^# (.+)$/gm, '<div style="font-size:19px;font-weight:900;color:#f0f4ff;margin:22px 0 10px">$1</div>')
        .replace(/^\d+\. (.+)$/gm, '<div style="display:flex;gap:10px;margin:6px 0;line-height:1.7"><span style="color:var(--cyan);font-weight:800;min-width:18px;font-size:11px;padding-top:3px;flex-shrink:0">●</span><span>$1</span></div>')
        .replace(/^[-•] (.+)$/gm, '<div style="display:flex;gap:9px;margin:6px 0;line-height:1.7"><span style="color:var(--cyan);font-size:10px;padding-top:5px;flex-shrink:0">▸</span><span>$1</span></div>')
        .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:18px 0"/>')
        .replace(/\n\n/g, '<div style="height:10px"></div>')
        .replace(/\n/g, '<br/>');
}

/* ── Typing dots ── */
function Dots() {
    return (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
                <motion.span key={i}
                    animate={{ scale: [1, 1.45, 1], opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }}
                />
            ))}
        </div>
    );
}

/* ── Scan result card ── */
function ScanCard({ result }) {
    if (!result || result.error) return null;
    const risk = result.risk || 'UNKNOWN';
    const color = RC[risk] || '#64748b';
    const target = result.target || result.url || result.domain || result.ip || result.hash || result.email || '—';
    return (
        <div style={{ marginBottom: 14, borderRadius: 14, overflow: 'hidden', border: `1px solid ${color}22`, background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 15px', background: `${color}09`, borderBottom: `1px solid ${color}12` }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{RI[risk] || <Shield size={12} />}</div>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color }}>THREAT LEVEL: {risk}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 9.5, color: '#475569', fontFamily: 'JetBrains Mono,monospace' }}>{result.stats?.malicious ?? 0} malicious engines</span>
            </div>
            <div style={{ padding: '12px 15px 14px' }}>
                <div style={{ fontSize: 12, color: '#7dd3fc', wordBreak: 'break-all', marginBottom: result.stats ? 12 : 0, fontFamily: 'JetBrains Mono,monospace' }}>{target}</div>
                {result.stats && (
                    <div style={{ display: 'flex', gap: 22, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        {[['malicious', '#ff2e5b'], ['suspicious', '#ffb830'], ['harmless', '#00ff88']]
                            .filter(([k]) => result.stats[k] !== undefined)
                            .map(([key, col]) => (
                                <div key={key} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4, fontFamily: 'JetBrains Mono,monospace' }}>{key}</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: result.stats[key] > 0 && key !== 'harmless' ? col : key === 'harmless' && result.stats[key] > 0 ? col : '#334155', lineHeight: 1 }}>{result.stats[key]}</div>
                                </div>
                            ))}
                    </div>
                )}
                {result.ai_summary && (
                    <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}
                        dangerouslySetInnerHTML={{ __html: md(result.ai_summary) }} />
                )}
            </div>
        </div>
    );
}

/* ── User bubble ── */
function UserBubble({ content }) {
    return (
        <motion.div initial={{ opacity: 0, y: 14, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ maxWidth: '72%' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', letterSpacing: '.05em', textTransform: 'uppercase' }}>You</span>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg,rgba(0,245,255,0.12),rgba(0,153,255,0.09))',
                    border: '1px solid rgba(0,245,255,0.22)',
                    borderRadius: '20px 4px 20px 20px',
                    padding: '13px 18px', color: '#e2e8f0', fontSize: 15,
                    lineHeight: 1.75, wordBreak: 'break-word',
                    boxShadow: '0 4px 24px rgba(0,245,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                    {content}
                </div>
            </div>
            <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,rgba(0,245,255,0.15),rgba(0,90,200,0.15))',
                border: '2px solid rgba(0,245,255,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--cyan)', boxShadow: '0 0 0 4px rgba(0,245,255,0.05)',
            }}>
                <User size={15} />
            </div>
        </motion.div>
    );
}

/* ── AI bubble ── */
function AIBubble({ msg }) {
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(typeof msg.content === 'string' ? msg.content : '');
        setCopied(true); setTimeout(() => setCopied(false), 2200);
    };
    return (
        <motion.div initial={{ opacity: 0, y: 14, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0, marginTop: 2,
                background: 'linear-gradient(135deg,rgba(0,245,255,0.14),rgba(0,245,255,0.04))',
                border: '2px solid rgba(0,245,255,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--cyan)', boxShadow: '0 0 22px rgba(0,245,255,0.15), 0 0 0 4px rgba(0,245,255,0.04)',
            }}>
                <Shield size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#e2e8f0' }}>ALL SAFE AI</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, padding: '2px 9px', borderRadius: 6, background: 'rgba(0,245,255,0.07)', color: 'var(--cyan)', border: '1px solid rgba(0,245,255,0.18)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '.07em' }}>
                        <Sparkles size={9} /> CYBER AI
                    </span>
                    {msg.action && msg.action !== 'none' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,245,255,0.05)', color: '#64748b', border: '1px solid rgba(0,245,255,0.1)', fontFamily: 'JetBrains Mono,monospace' }}>
                            <Terminal size={8} /> {msg.action.replace(/_/g, ' ')}{msg.target ? ` → ${String(msg.target).slice(0, 24)}` : ''}
                        </span>
                    )}
                </div>
                {msg.scan_result && !msg.scan_result.error && <ScanCard result={msg.scan_result} />}
                <div style={{
                    background: 'rgba(5,10,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
                    borderLeft: '3px solid rgba(0,245,255,0.4)', borderRadius: '4px 18px 18px 18px',
                    padding: '16px 20px', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}>
                    <div style={{ fontSize: 15, lineHeight: 1.85, color: '#cbd5e1' }}
                        dangerouslySetInnerHTML={{ __html: md(msg.content) }} />
                </div>
                <AnimatePresence>
                    {hovered && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }} style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                            <button onClick={copy} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px',
                                borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.13s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

/* ── Typing bubble ── */
function TypingBubble() {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: 'rgba(0,245,255,0.08)', border: '2px solid rgba(0,245,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)',
            }}>
                <Cpu size={16} style={{ animation: 'spin-slow 3s linear infinite' }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 9 }}>ALL SAFE AI</div>
                <div style={{
                    background: 'rgba(5,10,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
                    borderLeft: '3px solid rgba(0,245,255,0.4)', borderRadius: '4px 18px 18px 18px',
                    padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                    <Dots />
                    <motion.span animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
                        style={{ fontSize: 10.5, color: '#1e3a5f', fontFamily: 'JetBrains Mono,monospace' }}>
                        Analyzing threat intelligence…
                    </motion.span>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Conversation item ── */
function ConvItem({ conv, active, onClick, onDelete }) {
    const [hover, setHover] = useState(false);
    const ago = (() => {
        const d = Date.now() - conv.ts;
        if (d < 60000) return 'now';
        if (d < 3600000) return `${Math.floor(d / 60000)}m`;
        return `${Math.floor(d / 3600000)}h`;
    })();
    return (
        <div onClick={onClick}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 10, cursor: 'pointer',
                background: active ? 'rgba(0,245,255,0.07)' : hover ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: active ? '1px solid rgba(0,245,255,0.16)' : '1px solid transparent',
                transition: 'all 0.15s', marginBottom: 2,
            }}>
            <MessageSquare size={12} style={{ color: active ? 'var(--cyan)' : '#334155', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12.5, color: active ? '#e2e8f0' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: active ? 600 : 400 }}>
                {conv.title}
            </span>
            {hover ? (
                <button onClick={e => { e.stopPropagation(); onDelete(); }}
                    style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', borderRadius: 5, display: 'flex', alignItems: 'center', color: '#334155', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff4d72'; e.currentTarget.style.background = 'rgba(255,77,114,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'none'; }}
                ><Trash2 size={11} /></button>
            ) : (
                <span style={{ fontSize: 9, color: '#1e3a5f', fontFamily: 'JetBrains Mono,monospace' }}>{ago}</span>
            )}
        </div>
    );
}

/* ── Offline banner ── */
function OfflineBanner({ onRetry }) {
    return (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(255,46,91,0.06)', border: '1px solid rgba(255,46,91,0.18)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,46,91,0.08)', border: '1px solid rgba(255,46,91,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WifiOff size={18} color="#ff4d72" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ff6b8a', marginBottom: 3 }}>AI Offline</div>
                <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                    The AI backend is not responding. Please start the server.
                </div>
            </div>
            <button onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: 'rgba(255,46,91,0.1)', border: '1px solid rgba(255,46,91,0.22)', color: '#ff6b8a', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,46,91,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,46,91,0.1)'}
            ><RefreshCw size={13} /> Retry</button>
        </motion.div>
    );
}

/* ── Welcome screen ── */
function WelcomeScreen({ onPrompt }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 32px 20px', overflowY: 'auto' }}>
            {/* Hero */}
            <motion.div initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'relative', marginBottom: 28 }}>
                <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.14) 0%, transparent 70%)', filter: 'blur(14px)', pointerEvents: 'none' }} />
                <div style={{
                    width: 88, height: 88, borderRadius: 26, position: 'relative',
                    background: 'linear-gradient(135deg,rgba(0,245,255,0.14),rgba(0,245,255,0.04))',
                    border: '2px solid rgba(0,245,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 10px rgba(0,245,255,0.05), 0 0 0 20px rgba(0,245,255,0.025), 0 20px 60px rgba(0,245,255,0.2)',
                }}>
                    <Shield size={38} color="var(--cyan)" />
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={{ textAlign: 'center', marginBottom: 10 }}>
                <h2 className="syne" style={{ fontSize: 30, fontWeight: 900, color: '#f0f4ff', margin: '0 0 10px', letterSpacing: '-.03em' }}>
                    How can I help you?
                </h2>
                <p style={{ fontSize: 14.5, color: '#64748b', margin: '0 auto', maxWidth: 420, lineHeight: 1.8 }}>
                    Scan IPs, check URLs, analyze threats, detect scams — ask me anything about cybersecurity.
                </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 36 }}>
                {['🔍 IP & URL Scanner', '🦠 Malware Lookup', '📧 Breach Detection', '🐛 CVE Intel', '⚠️ Scam Detector'].map(t => (
                    <span key={t} style={{ padding: '5px 13px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.13)', color: '#64748b' }}>{t}</span>
                ))}
            </motion.div>

            {/* Quick action cards: 3-col grid */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.38 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, width: '100%', maxWidth: 620 }}>
                {QUICK.map(({ icon, label, prompt, desc }) => (
                    <motion.button key={label} onClick={() => onPrompt(prompt)}
                        whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                            padding: '16px 15px', borderRadius: 14, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                            textAlign: 'left', transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,245,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,245,255,0.22)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,245,255,0.07)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
                            {icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{label}</div>
                            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
                        </div>
                        <ChevronRight size={11} color="var(--cyan)" style={{ opacity: 0.4, alignSelf: 'flex-end' }} />
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
let _id = Date.now();
function mkConv() { return { id: _id++, title: 'New conversation', messages: [], ts: Date.now() }; }

export default function Chatbot() {
    const [lazyInit] = useState(() => {
        let initialConvs = [mkConv()];
        let initialId = initialConvs[0].id;
        try {
            const saved = localStorage.getItem('allsafe_chat_history');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    initialConvs = parsed;
                    initialId = parsed[0].id;
                }
            }
            const savedId = localStorage.getItem('allsafe_active_chat_id');
            if (savedId) {
                const id = parseInt(savedId, 10);
                if (initialConvs.some(c => c.id === id)) {
                    initialId = id;
                }
            }
        } catch { }
        return { initialConvs, initialId };
    });

    const [convs, setConvs] = useState(lazyInit.initialConvs);
    const [activeId, setActiveId] = useState(lazyInit.initialId);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebar, setSidebar] = useState(true);
    const [backendOk, setBackendOk] = useState(null);

    const endRef = useRef(null);
    const taRef = useRef(null);

    const activeConv = convs.find(c => c.id === activeId);
    const messages = activeConv?.messages || [];

    /* ── health check ── */
    const checkBackend = useCallback(async () => {
        try {
            const ctrl = new AbortController();
            setTimeout(() => ctrl.abort(), 5000);
            const res = await fetch(`${API}/`, { signal: ctrl.signal });
            setBackendOk(res.ok || res.status < 500);
        } catch {
            try {
                const ctrl2 = new AbortController();
                setTimeout(() => ctrl2.abort(), 4000);
                await fetch(`${API}/`, { mode: 'no-cors', signal: ctrl2.signal });
                setBackendOk(true);
            } catch { setBackendOk(false); }
        }
    }, []);

    useEffect(() => { checkBackend(); const iv = setInterval(checkBackend, 30000); return () => clearInterval(iv); }, [checkBackend]);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('allsafe_chat_history', JSON.stringify(convs));
    }, [convs]);

    useEffect(() => {
        localStorage.setItem('allsafe_active_chat_id', activeId.toString());
    }, [activeId]);

    const updConv = useCallback((id, fn) => {
        setConvs(prev => prev.map(c => c.id === id ? { ...c, ...fn(c) } : c));
    }, []);

    const newConv = useCallback(() => {
        const c = mkConv();
        setConvs(prev => [c, ...prev]);
        setActiveId(c.id);
        setInput('');
    }, []);

    const delConv = useCallback((id) => {
        setConvs(prev => {
            const next = prev.filter(c => c.id !== id);
            if (!next.length) { const c = mkConv(); setActiveId(c.id); return [c]; }
            if (activeId === id) setActiveId(next[0].id);
            return next;
        });
    }, [activeId]);

    /* ── send ── */
    const send = useCallback(async (override) => {
        const text = override ?? input;
        if (!text.trim() || loading) return;

        const userMsg = { role: 'user', content: text };
        const currentMessages = convs.find(c => c.id === activeId)?.messages || [];
        const newMsgs = [...currentMessages, userMsg];

        setConvs(prev => prev.map(c =>
            c.id === activeId
                ? { ...c, messages: newMsgs, title: newMsgs.length <= 2 ? text.slice(0, 46) + (text.length > 46 ? '…' : '') : c.title }
                : c
        ));
        setInput('');
        if (taRef.current) taRef.current.style.height = 'auto';
        setLoading(true);

        try {
            const payload = newMsgs.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.slice(0, 2200) : '' }));
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 65000);

            const res = await fetch(`${API}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: MODEL_ID, messages: payload }),
                signal: ctrl.signal,
            });
            clearTimeout(timer);

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw Object.assign(new Error(errBody?.detail || `HTTP ${res.status}`), { isHttpError: true, status: res.status });
            }

            const data = await res.json();
            updConv(activeId, c => ({
                messages: [...c.messages, {
                    role: 'assistant', content: data.reply || 'No response.',
                    scan_result: data.result, action: data.action, target: data.target,
                }]
            }));
            setBackendOk(true);
        } catch (err) {
            const isNetwork = !err.isHttpError && (err.name === 'AbortError' || err.name === 'TypeError' || err.message === 'Failed to fetch');
            if (isNetwork) setBackendOk(false);
            updConv(activeId, c => ({
                messages: [...c.messages, {
                    role: 'assistant',
                    content: isNetwork
                        ? '**Connection Failed** — The AI backend is not running.\n\nStart it with:\n```bash\ncd backend\npython -m uvicorn main:app --port 8000 --reload\n```'
                        : `**Error ${err.status || ''}** — ${err.message}`,
                }]
            }));
        } finally { setLoading(false); }
    }, [input, loading, activeId, updConv, convs]);

    const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    const onTaChange = e => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 190) + 'px';
    };

    const statusColor = backendOk === true ? '#00ff88' : backendOk === false ? '#ff4d72' : '#ffb830';

    /* ══ RENDER — NO internal top bar, just sidebar + chat ══ */
    return (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>

            {/* ═══════ SIDEBAR ═══════ */}
            <AnimatePresence initial={false}>
                {sidebar && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        style={{ flexShrink: 0, overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(1,4,16,0.75)', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ width: 260, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                            {/* New chat button */}
                            <div style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                <button onClick={newConv} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 12, background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.16)', color: 'var(--cyan)', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.16s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,245,255,0.12)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,245,255,0.06)'}
                                >
                                    <SquarePen size={14} /> New Chat
                                </button>
                            </div>

                            {/* History */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                                <div style={{ fontSize: 9.5, fontWeight: 800, color: '#1e3a5f', letterSpacing: '.18em', textTransform: 'uppercase', padding: '2px 8px 10px', fontFamily: 'JetBrains Mono,monospace' }}>
                                    History
                                </div>
                                {convs.map(c => (
                                    <ConvItem key={c.id} conv={c} active={c.id === activeId}
                                        onClick={() => setActiveId(c.id)}
                                        onDelete={() => delConv(c.id)} />
                                ))}
                            </div>

                            {/* Footer status */}
                            <div style={{ padding: '12px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 11, background: backendOk === true ? 'rgba(0,255,136,0.04)' : backendOk === false ? 'rgba(255,46,91,0.04)' : 'rgba(255,184,48,0.04)', border: `1px solid ${statusColor}15` }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${statusColor}0d`, border: `1px solid ${statusColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Server size={12} color={statusColor} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11.5, fontWeight: 700, color: statusColor }}>{backendOk === null ? 'Connecting…' : backendOk ? 'AI Ready' : 'AI Offline'}</div>
                                        <div style={{ fontSize: 9, color: '#334155' }}>localhost:8000</div>
                                    </div>
                                    {backendOk === true && (
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff88', display: 'inline-block', animation: 'pulse-dot 2s ease-out infinite', flexShrink: 0 }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ═══════ MAIN CHAT PANEL — no top bar ═══════ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                {/* Minimal toolbar — just sidebar toggle */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', flexShrink: 0,
                }}>
                    <button onClick={() => setSidebar(o => !o)} style={{
                        width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: sidebar ? 'rgba(0,245,255,0.07)' : 'rgba(255,255,255,0.04)',
                        border: sidebar ? '1px solid rgba(0,245,255,0.16)' : '1px solid rgba(255,255,255,0.07)',
                        color: sidebar ? 'var(--cyan)' : '#475569', cursor: 'pointer', transition: 'all 0.18s',
                    }}>
                        <PanelLeft size={14} />
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={newConv} style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        color: '#475569', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    ><Plus size={12} /> New Chat</button>
                </div>

                {/* ── MESSAGES / WELCOME ── */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {messages.length === 0 ? (
                        <WelcomeScreen onPrompt={send} />
                    ) : (
                        <div style={{ maxWidth: 840, width: '100%', margin: '0 auto', padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                            {backendOk === false && <OfflineBanner onRetry={checkBackend} />}
                            {messages.map((msg, i) =>
                                msg.role === 'user'
                                    ? <UserBubble key={i} content={msg.content} />
                                    : <AIBubble key={i} msg={msg} />
                            )}
                            <AnimatePresence>
                                {loading && <TypingBubble key="typing" />}
                            </AnimatePresence>
                            <div ref={endRef} />
                        </div>
                    )}
                </div>

                {/* ── INPUT BAR ── */}
                <div style={{
                    padding: '12px 20px 16px', flexShrink: 0,
                    background: 'rgba(1,4,16,0.92)', backdropFilter: 'blur(24px)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <div style={{ maxWidth: 840, margin: '0 auto' }}>
                        {/* Input box */}
                        <div id="chat-input-box" style={{
                            display: 'flex', alignItems: 'flex-end', gap: 10,
                            background: 'rgba(255,255,255,0.035)',
                            border: '1.5px solid rgba(255,255,255,0.09)',
                            borderRadius: 20, padding: '11px 14px',
                            transition: 'border-color 0.22s, box-shadow 0.22s',
                        }}
                            onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,245,255,0.06)'; }}
                            onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'none'; } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: 'rgba(0,245,255,0.07)', border: '1px solid rgba(0,245,255,0.16)', flexShrink: 0 }}>
                                <Shield size={14} color="var(--cyan)" />
                            </div>
                            <textarea ref={taRef} rows={1} value={input} onChange={onTaChange} onKeyDown={onKey}
                                placeholder="Ask about cybersecurity, scan an IP, check a URL…"
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 15, lineHeight: 1.7, resize: 'none', minHeight: 28, maxHeight: 190, padding: 0, fontFamily: 'inherit', overflowY: 'auto' }}
                            />
                            <motion.button onClick={() => send()} disabled={!input.trim() || loading}
                                whileHover={input.trim() && !loading ? { scale: 1.08 } : {}}
                                whileTap={input.trim() && !loading ? { scale: 0.9 } : {}}
                                style={{
                                    width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                                    background: input.trim() && !loading ? 'var(--cyan)' : 'rgba(255,255,255,0.05)',
                                    border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                    color: input.trim() && !loading ? '#000' : '#334155',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.18s',
                                    boxShadow: input.trim() && !loading ? '0 0 28px rgba(0,245,255,0.5)' : 'none',
                                }}>
                                {loading ? <RotateCcw size={15} style={{ animation: 'spin-slow 1.2s linear infinite' }} /> : <Send size={15} />}
                            </motion.button>
                        </div>

                        {/* Footer hints */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, padding: '0 4px' }}>
                            <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: '#1e3a5f' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <kbd style={{ padding: '1px 6px', borderRadius: 4, border: '1px solid #1e3a5f', fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: '#334155' }}>↵</kbd> Send
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <kbd style={{ padding: '1px 6px', borderRadius: 4, border: '1px solid #1e3a5f', fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: '#334155' }}>⇧↵</kbd> New line
                                </span>
                            </div>
                            <div style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono,monospace', color: '#1e3a5f' }}>
                                Powered by Gemini AI
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
