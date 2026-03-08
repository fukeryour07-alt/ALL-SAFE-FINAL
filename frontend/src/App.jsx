import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import LiveMap from './components/LiveMap';
import Crypto from './components/Crypto';
import News from './components/News';
import History from './components/History';
import JobScam from './components/JobScam';
import CVESearch from './components/CVESearch';
import Encyclopedia from './components/Encyclopedia';
import ReportCybercrime from './components/ReportCybercrime';
import InboxScanner from './components/InboxScanner';
import Footer from './components/Footer';
import BgCanvas from './components/BgCanvas';
import Chatbot from './components/Chatbot';
import { MessageSquare, X } from 'lucide-react';
import Cursor from './components/Cursor';
import CommandPalette from './components/CommandPalette';
import { ToastProvider, toast } from './components/Toast';
import './index.css';

const pageVariants = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: .55, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -16, filter: 'blur(6px)', transition: { duration: .35, ease: [0.7, 0, 0.8, 1] } },
};

// Global keyboard shortcuts
const SHORTCUTS = [
  { key: 'h', page: 'hero' },
  { key: 's', page: 'scanner' },
  { key: 'm', page: 'livemap' },
  { key: 'i', page: 'dashboard' },
  { key: 'c', page: 'aichat' },
  { key: 'v', page: 'crypto' },
  { key: 'n', page: 'news' },
  { key: 'l', page: 'history' },
  { key: 'j', page: 'jobscam' },
  { key: 'd', page: 'cve' },
  { key: 'e', page: 'encyclopedia' },
  { key: 'r', page: 'report' },
];

export default function App() {
  const [page, setPage] = useState('hero');
  const [scrolled, setScrolled] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [threatScore, setThreatScore] = useState(0);
  const [demoInput, setDemoInput] = useState(null);

  // Connect to backend WebSocket to get live threat count
  useEffect(() => {
    let ws;
    const connect = () => {
      try {
        ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/threats`);
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'ANALYTICS_UPDATE') {
              setThreatScore(msg.payload?.live_count || 0);
            }
          } catch { /* ignore */ }
        };
        ws.onerror = () => { /* ignore */ };
      } catch { /* ignore */ }
    };
    connect();
    return () => { if (ws) ws.close(); };
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const nav = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+K or Cmd+K → Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(p => !p);
        return;
      }
      // Ignore if typing in input / textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const sc = SHORTCUTS.find(s => s.key === e.key);
      if (sc) { nav(sc.page); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nav]);

  // Show welcome toast on load
  useEffect(() => {
    const t = setTimeout(() => {
      toast.info('ALL SAFE v2.0', 'Ctrl+K = Command Palette · Shortcuts: H=Home S=Scan M=Map J=Job Scams');
    }, 1500);
    return () => clearTimeout(t);
  }, []);


  return (
    <ToastProvider>
      <BgCanvas />
      <div className="noise-overlay" />
      <Cursor />

      <CommandPalette
        nav={nav}
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onScan={(val, mode) => setDemoInput({ val, mode })}
      />

      <div className={`app-shell${page === 'aichat' ? ' aichat-mode' : ''}`}>
        <Navbar
          page={page}
          nav={nav}
          scrolled={scrolled}
          cmdOpen={() => setCmdOpen(true)}
          threatScore={threatScore}
        />

        <main>
          <AnimatePresence mode="wait">
            {page === 'hero' && (
              <motion.div key="hero" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Hero nav={nav} />
              </motion.div>
            )}
            {page === 'scanner' && (
              <motion.div key="scanner" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Scanner demoInput={demoInput} onDemoConsumed={() => setDemoInput(null)} />
              </motion.div>
            )}
            {page === 'dashboard' && (
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Dashboard />
              </motion.div>
            )}
            {page === 'aichat' && (
              <motion.div key="aichat" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ width: '100%', height: '100%', display: 'flex', flex: 1 }}>
                <Chatbot />
              </motion.div>
            )}
            {page === 'livemap' && (
              <motion.div key="livemap" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <LiveMap />
              </motion.div>
            )}
            {page === 'crypto' && (
              <motion.div key="crypto" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Crypto />
              </motion.div>
            )}
            {page === 'news' && (
              <motion.div key="news" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <News />
              </motion.div>
            )}
            {page === 'history' && (
              <motion.div key="history" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <History />
              </motion.div>
            )}
            {page === 'jobscam' && (
              <motion.div key="jobscam" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <JobScam />
              </motion.div>
            )}
            {page === 'inbox' && (
              <motion.div key="inbox" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <InboxScanner />
              </motion.div>
            )}
            {page === 'cve' && (
              <motion.div key="cve" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <CVESearch />
              </motion.div>
            )}
            {page === 'encyclopedia' && (
              <motion.div key="encyclopedia" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Encyclopedia />
              </motion.div>
            )}
            {page === 'report' && (
              <motion.div key="report" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ReportCybercrime />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {page !== 'aichat' && <Footer nav={nav} />}

        {/* Floating Chatbot Button */}
        <motion.button
          onClick={() => page === 'aichat' ? nav('hero') : nav('aichat')}
          style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999, width: 62, height: 62, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,100,255,0.1))', border: '1px solid rgba(0,245,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(0,245,255,0.25), inset 0 0 15px rgba(0,245,255,0.4)', backdropFilter: 'blur(10px)' }}
          whileHover={{ scale: 1.08, boxShadow: '0 0 40px rgba(0,245,255,0.4), inset 0 0 20px rgba(0,245,255,0.5)' }}
          whileTap={{ scale: 0.92 }}
        >
          {page === 'aichat' ? <X size={28} color="#e2e8f0" /> : <MessageSquare size={26} color="#00f5ff" fill="var(--cyan)" fillOpacity="0.2" />}
          {page !== 'aichat' && (
            <span style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: '50%', background: 'var(--red)', border: '2px solid rgba(5,10,28,1)' }} />
          )}
        </motion.button>

      </div>
    </ToastProvider>
  );
}
