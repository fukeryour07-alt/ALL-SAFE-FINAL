import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Zap, Copy, Check, Key, Shield, Mail } from 'lucide-react';
import CryptoJS from 'crypto-js';
import PasswordStrength from './PasswordStrength';
import EmailHeaderAnalyzer from './EmailHeaderAnalyzer';

const VAULT_TABS = [
    { id: 'crypto', label: 'Crypto Tools', icon: Lock },
    { id: 'password', label: 'Pwd Strength', icon: Shield },
    { id: 'email', label: 'Email Analyzer', icon: Mail },
];

const MODES = [
    { id: 'b64e', label: 'Base64 Enc', type: 'encode' },
    { id: 'b64d', label: 'Base64 Dec', type: 'decode' },
    { id: 'hexe', label: 'Hex Enc', type: 'encode' },
    { id: 'hexd', label: 'Hex Dec', type: 'decode' },
    { id: 'urle', label: 'URL Enc', type: 'encode' },
    { id: 'urld', label: 'URL Dec', type: 'decode' },
    { id: 'md5', label: 'MD5 Hash', type: 'hash' },
    { id: 'sha1', label: 'SHA-1 Hash', type: 'hash' },
    { id: 'sha256', label: 'SHA-256', type: 'hash' },
    { id: 'sha512', label: 'SHA-512', type: 'hash' },
    { id: 'aes_e', label: 'AES Enc', type: 'symmetric', reqKey: true },
    { id: 'aes_d', label: 'AES Dec', type: 'symmetric', reqKey: true },
    { id: 'des_e', label: 'DES Enc', type: 'symmetric', reqKey: true },
    { id: 'des_d', label: 'DES Dec', type: 'symmetric', reqKey: true },
    { id: 'rc4_e', label: 'RC4 Enc', type: 'symmetric', reqKey: true },
    { id: 'rc4_d', label: 'RC4 Dec', type: 'symmetric', reqKey: true },
    { id: 'caesar_e', label: 'Caesar Enc', type: 'shift', reqKey: true, keyPh: 'Shift number (e.g. 3)' },
    { id: 'caesar_d', label: 'Caesar Dec', type: 'shift', reqKey: true, keyPh: 'Shift number (e.g. 3)' },
];

const caesarShift = (text, shift) => {
    return text.split('').map(c => {
        if (c.match(/[a-z]/i)) {
            const charCode = c.charCodeAt(0);
            const shiftAmnt = shift % 26;
            let shifted = charCode + shiftAmnt;
            // Handle wrap around
            if (c >= 'a' && c <= 'z') { if (shifted > 122) shifted -= 26; if (shifted < 97) shifted += 26; }
            else if (c >= 'A' && c <= 'Z') { if (shifted > 90) shifted -= 26; if (shifted < 65) shifted += 26; }
            return String.fromCharCode(shifted);
        }
        return c;
    }).join('');
};

export default function Crypto() {
    const [mode, setMode] = useState('b64e');
    const [input, setInput] = useState('');
    const [secret, setSecret] = useState('');
    const [output, setOutput] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const process = (val, mCode, keyVal) => {
        setInput(val); setSecret(keyVal); setError('');
        if (!val.trim()) { setOutput(''); return; }

        try {
            let res = '';
            if (mCode === 'b64e') res = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(val));
            if (mCode === 'b64d') res = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(val));

            if (mCode === 'hexe') res = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(val));
            if (mCode === 'hexd') res = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Hex.parse(val));

            if (mCode === 'urle') res = encodeURIComponent(val);
            if (mCode === 'urld') res = decodeURIComponent(val);

            if (mCode === 'md5') res = CryptoJS.MD5(val).toString();
            if (mCode === 'sha1') res = CryptoJS.SHA1(val).toString();
            if (mCode === 'sha256') res = CryptoJS.SHA256(val).toString();
            if (mCode === 'sha512') res = CryptoJS.SHA512(val).toString();

            // Symmetric
            const conf = MODES.find(x => x.id === mCode);
            if (conf?.reqKey && conf.type !== 'shift' && !keyVal) { setError('Secret Key is required'); setOutput(''); return; }

            if (mCode === 'aes_e') res = CryptoJS.AES.encrypt(val, keyVal).toString();
            if (mCode === 'aes_d') res = CryptoJS.AES.decrypt(val, keyVal).toString(CryptoJS.enc.Utf8);
            if (mCode === 'des_e') res = CryptoJS.DES.encrypt(val, keyVal).toString();
            if (mCode === 'des_d') res = CryptoJS.DES.decrypt(val, keyVal).toString(CryptoJS.enc.Utf8);
            if (mCode === 'rc4_e') res = CryptoJS.RC4.encrypt(val, keyVal).toString();
            if (mCode === 'rc4_d') res = CryptoJS.RC4.decrypt(val, keyVal).toString(CryptoJS.enc.Utf8);

            // Caesar
            if (mCode.startsWith('caesar_')) {
                const s = parseInt(keyVal, 10);
                if (isNaN(s)) { setError('Key must be a valid number'); setOutput(''); return; }
                res = caesarShift(val, mCode.endsWith('_e') ? s : -s);
            }

            setOutput(res || '');
            if (conf?.type === 'symmetric' && !res) throw new Error();
        } catch (e) {
            setError('Invalid input, key, or unsupported format for selected method.');
            setOutput('');
        }
    };

    const copyOut = () => {
        navigator.clipboard.writeText(output);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const activeModeConf = MODES.find(x => x.id === mode);

    const [vaultTab, setVaultTab] = useState('crypto');

    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80 }}>
            <div className="container" style={{ maxWidth: 1000 }}>
                {/* Vault top-level tab switcher */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
                    <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: 4 }}>
                        {VAULT_TABS.map(t => {
                            const Icon = t.icon;
                            return (
                                <motion.button key={t.id} onClick={() => setVaultTab(t.id)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                    style={{
                                        padding: '8px 20px', borderRadius: 'var(--r-full)', border: 'none', display: 'flex', alignItems: 'center', gap: 7,
                                        background: vaultTab === t.id ? 'var(--cyan)' : 'transparent',
                                        color: vaultTab === t.id ? '#000' : 'var(--text-2)',
                                        fontSize: 12, fontWeight: 700, letterSpacing: '.05em', cursor: 'pointer', transition: 'all 0.2s'
                                    }}>
                                    <Icon size={13} /> {t.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Vault sub-tools */}
                {vaultTab === 'password' && (<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><PasswordStrength /></motion.div>)}
                {vaultTab === 'email' && (<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><EmailHeaderAnalyzer /></motion.div>)}

                {vaultTab === 'crypto' && (<>
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} style={{ textAlign: 'center', marginBottom: 48 }}>
                        <div className="section-eyebrow" style={{ display: 'inline-flex' }}>
                            <Zap size={12} />
                            Offline Cryptography Utility
                        </div>
                        <h1 className="syne" style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, letterSpacing: '-.02em' }}>
                            Data <span className="glow-text">Vault</span>
                        </h1>
                        <p style={{ color: 'var(--text-2)', marginTop: 12, fontSize: 15.5 }}>
                            Securely encrypt, decrypt, and hash data right in your browser. Supports AES, DES, Base64, MD5, SHA-256 and more.
                        </p>
                    </motion.div>

                    {/* Mode selector */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
                        style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}
                    >
                        {MODES.map(m => {
                            const active = mode === m.id;
                            let Icon = Lock;
                            if (m.type === 'decode') Icon = Unlock;
                            if (m.type === 'hash') Icon = Zap;
                            if (m.type === 'symmetric') Icon = m.id.endsWith('_d') ? Unlock : Lock;

                            return (
                                <motion.button
                                    key={m.id}
                                    onClick={() => { setMode(m.id); process(input, m.id, secret); }}
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '6px 14px', borderRadius: 'var(--r-full)',
                                        background: active ? 'var(--cyan)' : 'rgba(255,255,255,.04)',
                                        border: active ? 'none' : '1px solid var(--border)',
                                        color: active ? '#000' : 'var(--text-2)',
                                        fontWeight: 600, fontSize: 12, letterSpacing: '.04em',
                                        transition: 'all .2s ease',
                                    }}
                                >
                                    <Icon size={12} />
                                    {m.label}
                                </motion.button>
                            );
                        })}
                    </motion.div>

                    {/* Work Area */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

                        {/* Input Side */}
                        <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: 16, textTransform: 'uppercase' }}>Payload Input</div>
                            <textarea
                                className="nx-input mono"
                                style={{ flex: 1, minHeight: 160, resize: 'vertical', padding: 16, fontSize: 14, lineHeight: 1.6 }}
                                placeholder="Paste raw text or cipher here..."
                                value={input}
                                onChange={e => process(e.target.value, mode, secret)}
                            />

                            <AnimatePresence>
                                {activeModeConf?.reqKey && (
                                    <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 16 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} style={{ overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
                                            <Key size={16} color="var(--cyan)" />
                                            <input
                                                type="text"
                                                className="mono"
                                                style={{ flex: 1, background: 'none', border: 'none', color: 'var(--cyan)', fontSize: 14, outline: 'none' }}
                                                placeholder={activeModeConf.keyPh || "Secret Key or Password..."}
                                                value={secret}
                                                onChange={e => process(input, mode, e.target.value)}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Output Side */}
                        <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', borderColor: error ? 'var(--red)' : output ? 'var(--cyan)' : 'var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Computed Result</div>
                                {output && (
                                    <button onClick={copyOut} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11, background: 'rgba(255,255,255,.05)' }}>
                                        {copied ? <><Check size={12} /> COPIED</> : <><Copy size={12} /> COPY</>}
                                    </button>
                                )}
                            </div>

                            <div className="mono" style={{ flex: 1, minHeight: 160, padding: 16, fontSize: 14, lineHeight: 1.6, background: 'rgba(0,0,0,.3)', borderRadius: 'var(--r-md)', wordBreak: 'break-all', overflowY: 'auto' }}>
                                {error ? <span style={{ color: 'var(--red)' }}>⚠ {error}</span> : output ? <span style={{ color: 'var(--green)' }}>{output}</span> : <span style={{ color: 'var(--text-3)' }}>Result will appear here...</span>}
                            </div>
                        </div>

                    </motion.div>
                </>)}
            </div>
        </section>
    );
}
