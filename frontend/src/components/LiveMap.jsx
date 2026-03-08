import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, ShieldAlert, Zap, Cpu, HardDrive, Shield,
    AlertTriangle, Globe2, Bug, Mail, Search, Radiation,
    Lock, Eye, Wifi, Server, Code2, Crosshair
} from 'lucide-react';
import Globe from 'react-globe.gl';

// ── 32 World-wide threat nodes ────────────────────────────────────────────────
const NODES = [
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: 'USA' },
    { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'USA' },
    { name: 'Dallas', lat: 32.7767, lng: -96.7970, country: 'USA' },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298, country: 'USA' },
    { name: 'London', lat: 51.5074, lng: -0.1278, country: 'UK' },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, country: 'Germany' },
    { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France' },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173, country: 'Russia' },
    { name: 'St. Petersburg', lat: 59.9311, lng: 30.3609, country: 'Russia' },
    { name: 'Beijing', lat: 39.9042, lng: 116.4074, country: 'China' },
    { name: 'Shanghai', lat: 31.2304, lng: 121.4737, country: 'China' },
    { name: 'Shenzhen', lat: 22.5431, lng: 114.0579, country: 'China' },
    { name: 'Tokyo', lat: 35.6895, lng: 139.6917, country: 'Japan' },
    { name: 'Seoul', lat: 37.5665, lng: 126.9780, country: 'South Korea' },
    { name: 'Pyongyang', lat: 39.0392, lng: 125.7625, country: 'N. Korea' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'India' },
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090, country: 'India' },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, country: 'India' },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, country: 'India' },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707, country: 'India' },
    { name: 'São Paulo', lat: -23.5505, lng: -46.6333, country: 'Brazil' },
    { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, country: 'Argentina' },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241, country: 'South Africa' },
    { name: 'Lagos', lat: 6.5244, lng: 3.3792, country: 'Nigeria' },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore' },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia' },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'Canada' },
    { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, country: 'UAE' },
    { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, country: 'Israel' },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, country: 'Turkey' },
    { name: 'Bucharest', lat: 44.4268, lng: 26.1025, country: 'Romania' },
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456, country: 'Indonesia' },
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018, country: 'Thailand' },
    { name: 'Kyiv', lat: 50.4501, lng: 30.5234, country: 'Ukraine' },
    { name: 'Tehran', lat: 35.6892, lng: 51.3890, country: 'Iran' },
];

// ── Rich attack taxonomy ──────────────────────────────────────────────────────
const ATTACK_TYPES = [
    // Scanning / Reconnaissance
    {
        type: 'Port Scan', category: 'RECON', color: '#38bdf8', severity: 'LOW', icon: Search,
        desc: 'Automated port enumeration sweep detected'
    },
    {
        type: 'Vuln Scan', category: 'RECON', color: '#7dd3fc', severity: 'LOW', icon: Eye,
        desc: 'Vulnerability scanner fingerprinting services'
    },
    {
        type: 'OS Fingerprint', category: 'RECON', color: '#93c5fd', severity: 'LOW', icon: Crosshair,
        desc: 'Operating system fingerprinting attempt'
    },
    // Exploitation
    {
        type: 'Exploit Kit', category: 'EXPLOIT', color: '#c084fc', severity: 'CRITICAL', icon: Code2,
        desc: 'Drive-by exploit kit deployment via compromised domain'
    },
    {
        type: 'RCE Attack', category: 'EXPLOIT', color: '#a855f7', severity: 'CRITICAL', icon: Zap,
        desc: 'Remote code execution payload delivered'
    },
    {
        type: 'Log4Shell', category: 'EXPLOIT', color: '#e879f9', severity: 'CRITICAL', icon: Bug,
        desc: 'Log4j JNDI injection attempt (CVE-2021-44228)'
    },
    {
        type: 'SQL Inject', category: 'EXPLOIT', color: '#ec4899', severity: 'HIGH', icon: Code2,
        desc: 'SQL injection payload targeting user database'
    },
    {
        type: 'XSS Payload', category: 'EXPLOIT', color: '#f472b6', severity: 'MEDIUM', icon: Code2,
        desc: 'Cross-site scripting payload injected'
    },
    {
        type: 'Zero-Day', category: 'EXPLOIT', color: '#ff2e5b', severity: 'CRITICAL', icon: Radiation,
        desc: 'Unknown CVE weaponized before patch availability'
    },
    // Malware
    {
        type: 'Ransomware', category: 'MALWARE', color: '#fb923c', severity: 'CRITICAL', icon: Lock,
        desc: 'File-encrypting ransomware beacon detected'
    },
    {
        type: 'Trojan Drop', category: 'MALWARE', color: '#f97316', severity: 'HIGH', icon: Bug,
        desc: 'Trojan dropper payload staged in memory'
    },
    {
        type: 'Rootkit', category: 'MALWARE', color: '#ea580c', severity: 'CRITICAL', icon: Bug,
        desc: 'Kernel-level rootkit persistence established'
    },
    {
        type: 'Spyware', category: 'MALWARE', color: '#dc2626', severity: 'HIGH', icon: Eye,
        desc: 'Spyware exfiltrating clipboard & keystrokes'
    },
    {
        type: 'Worm Spread', category: 'MALWARE', color: '#b91c1c', severity: 'HIGH', icon: Wifi,
        desc: 'Self-replicating worm propagating over LAN'
    },
    {
        type: 'Cryptominer', category: 'MALWARE', color: '#fbbf24', severity: 'MEDIUM', icon: Cpu,
        desc: 'Unauthorized cryptomining process spawned'
    },
    {
        type: 'Keylogger', category: 'MALWARE', color: '#f59e0b', severity: 'HIGH', icon: Eye,
        desc: 'Keylogger capturing credentials in session'
    },
    // Phishing
    {
        type: 'Phishing', category: 'PHISHING', color: '#00f5ff', severity: 'MEDIUM', icon: Mail,
        desc: 'Credential harvesting email campaign active'
    },
    {
        type: 'Spear-Phish', category: 'PHISHING', color: '#22d3ee', severity: 'HIGH', icon: Mail,
        desc: 'Targeted spear-phishing against executive accounts'
    },
    {
        type: 'Smishing', category: 'PHISHING', color: '#06b6d4', severity: 'MEDIUM', icon: Mail,
        desc: 'SMS phishing campaign intercepted'
    },
    {
        type: 'Vishing', category: 'PHISHING', color: '#0891b2', severity: 'MEDIUM', icon: Mail,
        desc: 'Voice phishing call spoofing bank IVR'
    },
    // Network Attacks
    {
        type: 'DDoS', category: 'NETWORK', color: '#facc15', severity: 'HIGH', icon: Wifi,
        desc: 'Volumetric DDoS: 42Gbps traffic flood'
    },
    {
        type: 'Slowloris', category: 'NETWORK', color: '#eab308', severity: 'MEDIUM', icon: Server,
        desc: 'Low-and-slow HTTP connection exhaustion'
    },
    {
        type: 'DNS Amp', category: 'NETWORK', color: '#ca8a04', severity: 'HIGH', icon: Globe2,
        desc: 'DNS amplification reflection attack'
    },
    {
        type: 'ARP Spoof', category: 'NETWORK', color: '#a16207', severity: 'MEDIUM', icon: Wifi,
        desc: 'ARP cache poisoning on local subnet'
    },
    {
        type: 'MITM', category: 'NETWORK', color: '#78350f', severity: 'HIGH', icon: Eye,
        desc: 'Man-in-the-middle TLS stripping intercepted'
    },
    {
        type: 'BGP Hijack', category: 'NETWORK', color: '#d97706', severity: 'CRITICAL', icon: Globe2,
        desc: 'BGP route hijacking diverting traffic'
    },
    // Brute Force / Credential
    {
        type: 'Brute Force', category: 'CREDENTIAL', color: '#00ff88', severity: 'MEDIUM', icon: Lock,
        desc: '4,200 login attempts/min on SSH endpoint'
    },
    {
        type: 'Cred Stuffing', category: 'CREDENTIAL', color: '#10b981', severity: 'HIGH', icon: Lock,
        desc: 'Leaked credential pairs replayed against API'
    },
    {
        type: 'Pass-the-Hash', category: 'CREDENTIAL', color: '#059669', severity: 'HIGH', icon: Lock,
        desc: 'NTLM hash captured and replayed laterally'
    },
];

// ── High-value defended targets ───────────────────────────────────────────────
const TARGETS = [
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
];

// Category color map for sidebar
const CAT_COLORS = {
    RECON: '#38bdf8', EXPLOIT: '#c084fc', MALWARE: '#fb923c',
    PHISHING: '#00f5ff', NETWORK: '#facc15', CREDENTIAL: '#00ff88',
};

export default function LiveMap() {
    const globeRef = useRef();
    const containerRef = useRef();

    const [arcsData, setArcsData] = useState([]);
    const [ringsData, setRingsData] = useState([]);
    const [attackLogs, setAttackLogs] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [stats, setStats] = useState({ total: 0, blocked: 0, critical: 0 });
    const [dimensions, setDimensions] = useState({ width: 900, height: 680 });
    const [countriesData, setCountriesData] = useState([]);
    const [defconLevel, setDefconLevel] = useState(5);
    const [isGlobeReady, setGlobeReady] = useState(false);
    const [catCounts, setCatCounts] = useState({ RECON: 0, EXPLOIT: 0, MALWARE: 0, PHISHING: 0, NETWORK: 0, CREDENTIAL: 0 });
    const [filter, setFilter] = useState('ALL');
    const [highlight, setHighlight] = useState(null); // last attack to flash

    // ── GeoJSON ───────────────────────────────────────────────────────────────
    useEffect(() => {
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(r => r.json())
            .then(d => setCountriesData(d.features))
            .catch(() => { });
    }, []);

    // ── Globe camera & auto-rotate ────────────────────────────────────────────
    useEffect(() => {
        if (!globeRef.current || !isGlobeReady) return;
        globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 2.0 }, 1200);
        const ctrl = globeRef.current.controls();
        if (ctrl) {
            ctrl.autoRotate = true;
            ctrl.autoRotateSpeed = 0.35;
            ctrl.enableZoom = true;
        }
    }, [isGlobeReady]);

    // ── Responsive resize ─────────────────────────────────────────────────────
    useEffect(() => {
        const update = () => {
            if (!containerRef.current) return;
            setDimensions({
                width: containerRef.current.clientWidth,
                height: Math.max(480, Math.min(700, window.innerHeight * 0.68)),
            });
        };
        update();
        const t = setTimeout(update, 400);
        window.addEventListener('resize', update);
        return () => { clearTimeout(t); window.removeEventListener('resize', update); };
    }, []);

    // ── Real WebSockets feed (backend) ────────────────────────────────────────────
    useEffect(() => {
        let ws;
        let reconnectTimeout;

        const connect = () => {
            ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/threats`);

            ws.onopen = () => setIsConnected(true);
            ws.onclose = () => {
                setIsConnected(false);
                reconnectTimeout = setTimeout(connect, 5000);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'NEW_ATTACK') {
                        const threat = data.payload;

                        let atk = ATTACK_TYPES.find(a => a.type.toLowerCase().includes((threat.type || '').toLowerCase()))
                            || ATTACK_TYPES.find(a => a.category.toLowerCase().includes((threat.type || '').toLowerCase()))
                            || ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];

                        const isCritical = threat.risk_score > 80 || threat.threat_level === 'CRITICAL';
                        const isHigh = threat.threat_level === 'HIGH';

                        const src = {
                            lat: threat.location?.lat || 0,
                            lng: threat.location?.lng || 0,
                            name: threat.location?.city && threat.location.city !== 'Unknown' ? threat.location.city : (threat.location?.country ? threat.location.country : 'Unknown Host'),
                            country: threat.location?.country || ''
                        };

                        const tgtPool = TARGETS;
                        const tgt = tgtPool[Math.floor(Math.random() * tgtPool.length)];

                        const uid = Date.now() + Math.random();
                        const dur = isCritical ? 3500 : isHigh ? 2800 : 2000;

                        const arc = {
                            id: uid,
                            startLat: src.lat, startLng: src.lng,
                            endLat: tgt.lat, endLng: tgt.lng,
                            color: [`${atk.color}00`, atk.color],
                            stroke: isCritical ? 2.5 : isHigh ? 1.5 : 0.8,
                            dashLen: isCritical ? 0.9 : 0.5,
                            dashGap: 0.1,
                            animTime: dur,
                            altitude: isCritical ? 0.55 : isHigh ? 0.4 : 0.25,
                        };

                        const ring = {
                            id: uid,
                            lat: tgt.lat, lng: tgt.lng,
                            color: atk.color,
                            maxR: isCritical ? 9 : isHigh ? 5.5 : 3.5,
                            speed: isCritical ? 3.0 : 1.8,
                            repeat: 700,
                        };

                        const blocked = threat.risk_score > 50;
                        const log = {
                            id: uid,
                            srcName: src.name,
                            srcCountry: src.country,
                            tgtName: tgt.name,
                            type: threat.type || atk.type,
                            category: atk.category,
                            severity: threat.threat_level || atk.severity,
                            color: atk.color,
                            isCritical,
                            desc: threat.source ? `Threat intel from ${threat.source}` : atk.desc,
                            srcIP: threat.ip || 'Unknown IP',
                            cve: null,
                            time: new Date(),
                            blocked: blocked,
                        };

                        setArcsData(prev => [...prev.slice(-80), arc]);
                        setRingsData(prev => [...prev.slice(-30), ring]);
                        setAttackLogs(prev => [log, ...prev.slice(0, 49)]);
                        setHighlight(uid);

                        setStats(s => ({
                            total: s.total + 1,
                            blocked: s.blocked + (log.blocked ? 1 : 0),
                            critical: s.critical + (isCritical ? 1 : 0),
                        }));
                        setCatCounts(prev => ({ ...prev, [atk.category]: (prev[atk.category] || 0) + 1 }));

                        setTimeout(() => {
                            setArcsData(prev => prev.filter(a => a.id !== uid));
                            setRingsData(prev => prev.filter(r => r.id !== uid));
                        }, dur + 1000);
                    }
                } catch (e) { console.error('WS Error:', e); }
            };
        };

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            if (ws) ws.close();
        };
    }, []);

    // ── DEFCON level ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (stats.total === 0) {
            setDefconLevel(5);
            return;
        }
        const pct = (stats.critical / stats.total) * 100;
        if (pct > 5) setDefconLevel(1);
        else if (pct > 3) setDefconLevel(2);
        else if (pct > 1.5) setDefconLevel(3);
        else if (pct > 0) setDefconLevel(4);
        else setDefconLevel(5);
    }, [stats]);

    const defconColor = { 1: '#ff2e5b', 2: '#f97316', 3: '#facc15', 4: '#00ff88', 5: '#0ea5e9' }[defconLevel];

    // ── Filtered log ──────────────────────────────────────────────────────────
    const filteredLogs = filter === 'ALL'
        ? attackLogs.slice(0, 18)
        : attackLogs.filter(l => l.category === filter).slice(0, 18);

    const totalAllCats = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;

    return (
        <section style={{ minHeight: '100vh', paddingTop: 96, paddingBottom: 60, position: 'relative' }}>
            <div className="map-bg-glow" />
            <div className="container" style={{ maxWidth: '1440px' }}>

                {/* ── HEADER ── */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div className="section-eyebrow">
                            <Activity size={12} className="blink" />
                            LIVE OPERATIONS CENTER — THREAT DETECTION ENGINE
                        </div>
                        <h1 className="syne" style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 900, letterSpacing: '-.03em' }}>
                            Global <span className="glow-text">Threat Matrix</span>
                        </h1>
                    </div>

                    {/* DEFCON badge */}
                    <motion.div
                        animate={{ boxShadow: [`0 0 12px ${defconColor}50`, `0 0 28px ${defconColor}90`, `0 0 12px ${defconColor}50`] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        style={{ padding: '10px 24px', borderRadius: 'var(--r-md)', background: `${defconColor}0d`, border: `1px solid ${defconColor}45`, textAlign: 'center' }}
                    >
                        <div style={{ fontSize: 9, color: defconColor, letterSpacing: '.2em', fontWeight: 800, marginBottom: 2 }}>THREAT LEVEL</div>
                        <div className="syne" style={{ fontSize: 24, fontWeight: 900, color: defconColor }}>DEFCON-{defconLevel}</div>
                        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 5 }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ width: 12, height: 3, borderRadius: 2, background: i <= (5 - defconLevel) ? defconColor : 'rgba(255,255,255,0.08)', transition: 'background 0.5s' }} />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ── THREE-COLUMN LAYOUT: Sidebar | Globe | Log ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', gap: 16, alignItems: 'start' }}>

                    {/* ── LEFT SIDEBAR: Category breakdown ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="glass" style={{ padding: 16, background: 'rgba(3,8,20,0.85)' }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--cyan)', letterSpacing: '.2em', marginBottom: 14 }}>ATTACK CATEGORIES</div>
                            {Object.entries(CAT_COLORS).map(([cat, col]) => {
                                const count = catCounts[cat] || 0;
                                const pct = Math.round((count / totalAllCats) * 100);
                                const isActive = filter === cat;
                                return (
                                    <motion.div
                                        key={cat}
                                        onClick={() => setFilter(isActive ? 'ALL' : cat)}
                                        whileHover={{ x: 3 }}
                                        style={{
                                            marginBottom: 12, cursor: 'pointer',
                                            padding: '8px 10px', borderRadius: 8,
                                            background: isActive ? `${col}12` : 'transparent',
                                            border: `1px solid ${isActive ? col + '40' : 'transparent'}`,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: col, letterSpacing: '.05em' }}>{cat}</span>
                                            <span className="mono" style={{ fontSize: 10, color: col }}>{count}</span>
                                        </div>
                                        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                            <motion.div
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.8 }}
                                                style={{ height: '100%', background: col, borderRadius: 2 }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>


                        {/* Live attack type legend */}
                        <div className="glass" style={{ padding: 14, background: 'rgba(3,8,20,0.85)' }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '.2em', marginBottom: 10 }}>ATTACK TYPES</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {ATTACK_TYPES.slice(0, 12).map(a => (
                                    <div key={a.type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0, boxShadow: `0 0 4px ${a.color}` }} />
                                        <span style={{ color: 'var(--text-2)', flex: 1 }}>{a.type}</span>
                                        <span style={{
                                            fontSize: 8, padding: '1px 5px', borderRadius: 'var(--r-full)',
                                            background: a.severity === 'CRITICAL' ? 'rgba(255,46,91,0.15)' : a.severity === 'HIGH' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.06)',
                                            color: a.severity === 'CRITICAL' ? '#ff2e5b' : a.severity === 'HIGH' ? '#f97316' : 'var(--text-3)',
                                        }}>{a.severity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── CENTER: Globe ── */}
                    <div className="premium-glass glow-border soc-grid" style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'radial-gradient(ellipse at center, #020c1a 0%, #00000f 75%)' }}>
                        <div className="scanline-overlay" style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }} />

                        {/* Top bar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 38, background: 'rgba(2,6,20,0.92)', borderBottom: '1px solid rgba(0,245,255,0.07)', zIndex: 20, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span className="status-dot dot-green" />
                                <span className="mono" style={{ fontSize: 9, color: 'var(--cyan)' }}>
                                    SATELLITE: ACTIVE • FEED: {isConnected ? 'REAL-TIME (WS)' : 'DISCONNECTED'} • NODE: {NODES.length}
                                </span>
                            </div>
                            <span className="mono" style={{ fontSize: 9, color: 'var(--text-3)' }}>
                                {new Date().toUTCString().split(' ').slice(0, 5).join(' ')} UTC
                            </span>
                        </div>

                        {/* Globe render */}
                        <div ref={containerRef} style={{ width: '100%', height: dimensions.height }}>
                            {useMemo(() => (
                                <Globe
                                    ref={globeRef}
                                    onGlobeReady={() => setGlobeReady(true)}
                                    width={dimensions.width}
                                    height={dimensions.height}
                                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                                    atmosphereColor="#00f5ff"
                                    atmosphereAltitude={0.12}
                                    hexPolygonsData={countriesData}
                                    hexPolygonResolution={3}
                                    hexPolygonMargin={0.7}
                                    hexPolygonColor={() => 'rgba(0,245,255,0.02)'}
                                    arcsData={arcsData}
                                    arcColor={d => d.color}
                                    arcDashLength={d => d.dashLen ?? 0.7}
                                    arcDashGap={d => d.dashGap ?? 0.2}
                                    arcDashAnimateTime={d => d.animTime ?? 2000}
                                    arcStroke={d => d.stroke ?? 0.8}
                                    arcAltitude={d => d.altitude ?? 0.3}
                                    ringsData={ringsData}
                                    ringColor={d => `${d.color}cc`}
                                    ringMaxRadius={d => d.maxR ?? 4}
                                    ringPropagationSpeed={d => d.speed ?? 2}
                                    ringRepeatPeriod={d => d.repeat ?? 800}
                                />
                            ), [dimensions.width, dimensions.height, countriesData, arcsData, ringsData])}
                        </div>
                    </div>

                    {/* ── RIGHT SIDEBAR: Live Detection Feed ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: dimensions.height + 80, overflow: 'hidden' }}>
                        {/* Feed header + filter */}
                        <div className="glass" style={{ padding: '12px 14px', background: 'rgba(3,8,20,0.85)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className="status-dot dot-red" style={{ width: 6, height: 6 }} />
                                    <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--red)', letterSpacing: '.15em' }}>LIVE DETECTION FEED</span>
                                </div>
                                <span className="mono" style={{ fontSize: 9, color: 'var(--text-3)' }}>{filteredLogs.length} events</span>
                            </div>
                            {/* Category filter pills */}
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {['ALL', ...Object.keys(CAT_COLORS)].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setFilter(c)}
                                        style={{
                                            fontSize: 8, padding: '2px 7px', borderRadius: 'var(--r-full)',
                                            background: filter === c ? (CAT_COLORS[c] || 'var(--cyan)') : 'rgba(255,255,255,0.05)',
                                            color: filter === c ? '#000' : 'var(--text-3)',
                                            border: `1px solid ${filter === c ? (CAT_COLORS[c] || 'var(--cyan)') : 'rgba(255,255,255,0.08)'}`,
                                            cursor: 'pointer', fontWeight: 700,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable feed */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: dimensions.height - 80 }}>
                            <AnimatePresence>
                                {filteredLogs.map(log => {
                                    const Icon = ATTACK_TYPES.find(a => a.type === log.type)?.icon || AlertTriangle;
                                    return (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: 30, scale: 0.97 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: 30 }}
                                            transition={{ duration: 0.25 }}
                                            className="glass"
                                            style={{
                                                padding: '10px 12px',
                                                background: log.isCritical
                                                    ? `rgba(${log.isCritical ? '255,46,91' : '3,8,20'},0.15)`
                                                    : 'rgba(3,8,20,0.6)',
                                                borderColor: log.isCritical ? `${log.color}40` : undefined,
                                                borderLeft: `3px solid ${log.color}`,
                                            }}
                                        >
                                            {/* Top row: type + severity + status */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Icon size={10} color={log.color} />
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: log.color }}>{log.type}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span style={{
                                                        fontSize: 8, padding: '1px 5px', borderRadius: 'var(--r-full)',
                                                        background: log.severity === 'CRITICAL' ? 'rgba(255,46,91,0.2)' : log.severity === 'HIGH' ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.07)',
                                                        color: log.severity === 'CRITICAL' ? '#ff2e5b' : log.severity === 'HIGH' ? '#f97316' : 'var(--text-3)',
                                                        fontWeight: 700, letterSpacing: '.05em',
                                                    }}>{log.severity}</span>
                                                    <span style={{
                                                        fontSize: 8, padding: '1px 5px', borderRadius: 'var(--r-full)',
                                                        background: log.blocked ? 'rgba(0,255,136,0.1)' : 'rgba(255,46,91,0.1)',
                                                        color: log.blocked ? 'var(--green)' : 'var(--red)',
                                                        fontWeight: 700,
                                                    }}>{log.blocked ? 'BLOCKED' : 'ACTIVE'}</span>
                                                </div>
                                            </div>

                                            {/* Route */}
                                            <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 4 }}>
                                                {log.srcName} → {log.tgtName}
                                            </div>

                                            {/* Description */}
                                            <div style={{ fontSize: 9, color: 'var(--text-2)', lineHeight: 1.4, marginBottom: 5 }}>
                                                {log.desc}
                                            </div>

                                            {/* IP + CVE row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="mono" style={{ fontSize: 8, color: 'var(--text-3)' }}>SRC: {log.srcIP}</span>
                                                {log.cve && (
                                                    <span style={{
                                                        fontSize: 8, padding: '1px 5px', borderRadius: 'var(--r-full)',
                                                        background: 'rgba(168,85,247,0.15)', color: '#c084fc', fontWeight: 700,
                                                    }}>{log.cve}</span>
                                                )}
                                                <span className="mono" style={{ fontSize: 8, color: 'var(--text-3)' }}>
                                                    {log.time.toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}
                >
                    {[
                        { label: 'Total Detected', val: stats.total, color: 'var(--cyan)', icon: Activity },
                        { label: 'Blocked', val: stats.blocked, color: 'var(--green)', icon: Shield },
                        { label: 'Critical', val: stats.critical, color: 'var(--red)', icon: ShieldAlert },
                        { label: 'Exploits', val: catCounts.EXPLOIT || 0, color: '#c084fc', icon: Code2 },
                        { label: 'Malware', val: catCounts.MALWARE || 0, color: '#fb923c', icon: Bug },
                        { label: 'Phishing', val: catCounts.PHISHING || 0, color: '#00f5ff', icon: Mail },
                    ].map(s => {
                        const Icon = s.icon;
                        return (
                            <motion.div
                                key={s.label}
                                whileHover={{ scale: 1.04, borderColor: s.color + '40' }}
                                style={{
                                    textAlign: 'center', padding: '14px 10px',
                                    background: 'rgba(5,10,25,0.6)', borderRadius: 'var(--r-md)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(12px)', transition: 'all 0.3s',
                                }}
                            >
                                <Icon size={14} color={s.color} style={{ margin: '0 auto 6px' }} />
                                <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
                                    {s.val.toLocaleString()}
                                </div>
                                <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, marginTop: 3, letterSpacing: '.05em' }}>
                                    {s.label.toUpperCase()}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

            </div>
        </section>
    );
}
