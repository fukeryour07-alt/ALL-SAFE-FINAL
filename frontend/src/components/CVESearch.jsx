import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Server, ShieldAlert, ExternalLink, Loader2, Activity } from 'lucide-react';
import axios from 'axios';

export default function CVESearch() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const searchCVE = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');

        try {
            // Using NVD API for keyword search
            const res = await axios.get(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query)}&resultsPerPage=10`);
            if (res.data?.vulnerabilities) {
                setResults(res.data.vulnerabilities.map(v => v.cve));
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch CVE data. The NVD API might be rate-limiting. Try searching a specific CVE ID.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,.1) 0%, transparent 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

            <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40, textAlign: 'center' }}>
                    <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
                        <Server size={12} style={{ color: 'var(--green)' }} />
                        Global Vulnerability Database
                    </div>
                    <h1 className="syne" style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, marginTop: 16 }}>
                        CVE <span style={{ color: 'var(--green)', textShadow: '0 0 30px rgba(16,185,129,.3)' }}>Search</span>
                    </h1>
                    <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 16, maxWidth: 600, margin: '16px auto 0' }}>
                        Search the National Vulnerability Database (NVD) for Common Vulnerabilities and Exposures (CVEs) by keyword, product, or CVE ID.
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onSubmit={searchCVE}
                    className="glass"
                    style={{ padding: 8, borderRadius: 'var(--r-full)', display: 'flex', gap: 8, marginBottom: 40, border: '1px solid rgba(16,185,129,.2)' }}
                >
                    <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                        <Search size={20} color="var(--green)" />
                    </div>
                    <input
                        type="text"
                        placeholder="e.g. Log4j, Windows 10, CVE-2021-44228..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-1)', fontSize: 16, outline: 'none' }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !query}
                        style={{
                            padding: '12px 24px', borderRadius: 'var(--r-full)', background: 'rgba(16,185,129,.1)',
                            color: 'var(--green)', fontWeight: 700, border: '1px solid rgba(16,185,129,.3)',
                            cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
                        }}
                    >
                        {loading ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : 'Search'}
                    </button>
                </motion.form>

                {error && (
                    <div style={{ padding: 16, background: 'rgba(239,68,68,.1)', color: '#ef4444', borderRadius: 8, border: '1px solid rgba(239,68,68,.2)', marginBottom: 24, textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'grid', gap: 16 }}>
                    {results.map((cve, i) => {
                        const score = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || cve.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore || cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || 'N/A';
                        const isHigh = score !== 'N/A' && parseFloat(score) >= 7.0;

                        return (
                            <motion.div
                                key={cve.id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="glass"
                                style={{ padding: 24, borderRadius: 12, borderLeft: `4px solid ${isHigh ? '#ef4444' : 'var(--green)'}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ShieldAlert size={20} color={isHigh ? '#ef4444' : 'var(--green)'} />
                                        {cve.id}
                                    </h3>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,.05)', borderRadius: 20, fontSize: 12, color: 'var(--text-2)' }}>
                                            Published: {cve.published ? cve.published.split('T')[0] : 'Unknown'}
                                        </span>
                                        {score !== 'N/A' && (
                                            <span style={{ padding: '4px 12px', background: isHigh ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)', borderRadius: 20, fontSize: 13, fontWeight: 700, color: isHigh ? '#ef4444' : 'var(--green)' }}>
                                                CVSS: {score}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
                                    {cve.descriptions?.[0]?.value || 'No description provided.'}
                                </p>
                                <a
                                    href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                                    target="_blank" rel="noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}
                                >
                                    View full details on NVD <ExternalLink size={14} />
                                </a>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
