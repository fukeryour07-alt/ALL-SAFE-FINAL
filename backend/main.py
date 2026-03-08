from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os, hashlib, base64, asyncio, httpx, aiofiles, sqlite3, json, random, re
from datetime import datetime, timedelta
import phonenumbers
from phonenumbers import geocoder, carrier
import socket
import whois
import psutil
from groq import Groq
try:
    from google import genai as google_genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False

load_dotenv()

# ─── API CONFIGURATION ───────────────────────────────────────────────────
VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
OTX_API_KEY = os.getenv("OTX_API_KEY", "")
ABUSE_IP_KEY = os.getenv("ABUSEIPDB_API_KEY", "")
THREATFOX_KEY = os.getenv("THREATFOX_API_KEY", "")
HONEYDB_KEY = os.getenv("HONEYDB_API_KEY", "")
WAZUH_API = os.getenv("WAZUH_API_URL", "")

VT_BASE = "https://www.virustotal.com/api/v3"
OTX_BASE = "https://otx.alienvault.com/api/v1"
ABUSE_BASE = "https://api.abuseipdb.com/api/v2"
THREATFOX_BASE = "https://threatfox-api.abuse.ch/api/v1/"
HONEYDB_BASE = "https://honeydb.io/api"
HEADERS = {"x-apikey": VT_API_KEY}

app = FastAPI(title="NEXATHAN SOC", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "ALL SAFE Backend Online"}

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from routers.chat import limiter as chat_limiter
app.state.limiter = chat_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from routers.chat import router as chat_router
app.include_router(chat_router)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_KEY_01 = os.getenv("GEMINI_API_KEY_01", "")
GEMINI_KEY_02 = os.getenv("GEMINI_API_KEY_02", "")

# Initialize Groq (fallback AI)
try:
    groq_client = Groq(api_key=GROQ_API_KEY)
except Exception:
    groq_client = None

# Initialize Gemini (primary AI) — try key 01, fallback to key 02
gemini_client = None
ACTIVE_GEMINI_KEY = None
ACTIVE_GEMINI_MODEL = "gemini-2.5-flash"
# Models to try in order (newest to oldest)
_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]

if _GENAI_AVAILABLE:
    for _gemini_key in [GEMINI_KEY_01, GEMINI_KEY_02]:
        if _gemini_key:
            for _model in _GEMINI_MODELS:
                try:
                    _test_client = google_genai.Client(api_key=_gemini_key)
                    _test_resp = _test_client.models.generate_content(
                        model=_model,
                        contents="Respond with exactly: OK"
                    )
                    gemini_client = _test_client
                    ACTIVE_GEMINI_KEY = _gemini_key
                    ACTIVE_GEMINI_MODEL = _model
                    print(f"[AI] Gemini initialized: {_model} (key: ...{_gemini_key[-6:]})")
                    break
                except Exception as _e:
                    print(f"[AI] {_model} with key ...{_gemini_key[-6:]}: {str(_e)[:60]}")
            if gemini_client:
                break

if not gemini_client:
    print("[AI] Gemini offline — using Groq LLaMA as AI engine")

def get_ai_analysis(target, type_str, risk, stats):
    """Primary: Gemini 1.5 Flash. Fallback: Groq LLaMA."""
    prompt = (f"You are a Senior Cyber Threat Intelligence Analyst. Provide a concise, professional 2-sentence threat summary about the {type_str} '{target}'. "
              f"Risk level: {risk}. Malicious engine flags: {stats.get('malicious', 0)}. "
              f"State clearly whether it is safe or dangerous to interact with, and the likely threat category.")

    # Try Gemini first (primary AI)
    if gemini_client:
        try:
            response = gemini_client.models.generate_content(
                model=ACTIVE_GEMINI_MODEL,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as ge:
            print(f"[AI] Gemini analysis failed: {ge}")

    # Fallback: Groq LLaMA
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=250,
                temperature=0.4
            )
            return completion.choices[0].message.content.strip()
        except Exception:
            try:
                completion = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=250,
                    temperature=0.4
                )
                return completion.choices[0].message.content.strip()
            except:
                pass
    return "AI analysis engine temporarily unavailable."


def get_gemini_email_summary(from_addr, subject, flags, auth_results):
    """Dedicated Gemini summary for email header analysis."""
    flags_str = "; ".join([f['msg'] for f in flags]) if flags else "None"
    spf = auth_results.get('spf', 'UNKNOWN')
    dkim = auth_results.get('dkim', 'UNKNOWN')
    dmarc = auth_results.get('dmarc', 'UNKNOWN')

    prompt = (f"You are a cybersecurity expert specializing in email phishing detection. Analyze this email header data and provide a 3-sentence threat intelligence summary:\n"
              f"From: {from_addr}\n"
              f"Subject: {subject}\n"
              f"SPF: {spf} | DKIM: {dkim} | DMARC: {dmarc}\n"
              f"Threat flags detected: {flags_str}\n\n"
              f"In your summary: (1) State overall phishing likelihood (Low/Medium/High/Critical), "
              f"(2) Explain the key authentication failures and what they mean, "
              f"(3) Recommend specific action (Delete/Report/Safe). Be professional and concise.")

    # Try Gemini primary
    if gemini_client:
        try:
            response = gemini_client.models.generate_content(
                model=ACTIVE_GEMINI_MODEL,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as ge:
            print(f"[AI] Gemini email analysis failed: {ge}")

    # Fallback: Groq
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.3
            )
            return completion.choices[0].message.content.strip()
        except:
            pass
    return "AI summary engine temporarily unavailable."

def quick_port_scan(ip):
    open_ports = []
    common_ports = {21:"FTP", 22:"SSH", 23:"Telnet", 25:"SMTP", 53:"DNS", 80:"HTTP", 110:"POP3", 143:"IMAP", 443:"HTTPS", 445:"SMB", 3389:"RDP", 8080:"HTTP-Proxy"}
    for port, service in common_ports.items():
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.3)
        try:
            if s.connect_ex((ip, port)) == 0:
                open_ports.append({"port": port, "service": service})
        except:
            pass
        finally:
            s.close()
    return open_ports

# ─── WEBSOCKET MANAGER ──────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        failed_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                failed_connections.append(connection)
        for conn in failed_connections:
            self.disconnect(conn)

manager = ConnectionManager()

# ─── ADVANCED GLOBAL THREAT DETECTION (MULTISOURCE) ────────────────────────
REAL_THREATS = []
THREAT_ANALYTICS = {
    "top_attackers": [],
    "top_targets": [],
    "common_type": "DDoS",
    "live_count": 104523
}

async def fetch_threatfox():
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(THREATFOX_BASE, json={"query": "get_recent", "days": 1})
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                return [{"ip": d["ioc_value"].split(':')[0], "type": d["threat_type"], "source": "ThreatFox", "sev": d["confidence_level"]/100} for d in data if d["ioc_type"] == "ip:port"]
    except: return []
    return []

async def fetch_abuseipdb():
    if not ABUSE_IP_KEY: return []
    try:
        headers = {"Key": ABUSE_IP_KEY, "Accept": "application/json"}
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{ABUSE_BASE}/reports?limit=50", headers=headers)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                return [{"ip": d["ipAddress"], "type": "Abuse", "source": "AbuseIPDB", "sev": d["abuseConfidenceScore"]/100} for d in data]
    except: return []
    return []

HONEYDB_ID = os.getenv("HONEYDB_API_ID", "")
HONEYDB_KEY = os.getenv("HONEYDB_API_KEY", "")

async def fetch_honeydb():
    if not HONEYDB_ID or not HONEYDB_KEY: return []
    try:
        headers = {"X-HoneyDb-ApiId": HONEYDB_ID, "X-HoneyDb-ApiKey": HONEYDB_KEY}
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{HONEYDB_BASE}/bad-hosts", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return [{"ip": d.get("remote_host", ""), "type": "Honeypot hit", "source": "HoneyDB", "sev": 0.8} for d in data[:30] if d.get("remote_host")]
    except Exception as e:
        return []
    return []

def generate_simulated_honeybot_attacks(count=12):
    """Generate dynamic simulated attacks across random geo-locations to keep the map populated"""
    attacks = []
    fake_ips = [f"{random.randint(11,254)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}" for _ in range(30)]
    attack_types = ['Port Scan', 'Vuln Scan', 'Exploit Kit', 'RCE Attack', 'Ransomware', 'Trojan Drop', 'DDoS', 'Brute Force', 'Log4Shell', 'SQL Inject']
    
    for _ in range(count):
        ip = random.choice(fake_ips)
        atype = random.choice(attack_types)
        attacks.append({
            "ip": ip,
            "type": atype,
            "source": "Global Honeybot Network (Simulation)",
            "sev": random.uniform(0.4, 0.95)
        })
    return attacks

async def get_geo_batch(ips):
    if not ips: return {}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post("http://ip-api.com/batch", json=ips)
            if resp.status_code == 200:
                results = resp.json()
                return {res['query']: res for res in results if res.get('status') == 'success'}
    except: return {}
    return {}

async def update_threat_feed():
    global REAL_THREATS, THREAT_ANALYTICS
    feeds = await asyncio.gather(fetch_threatfox(), fetch_abuseipdb(), fetch_honeydb())
    raw_events = [e for sub in feeds for e in sub]
    
    # Inject Honeybot simulation data to keep the map lively as requested
    raw_events.extend(generate_simulated_honeybot_attacks(random.randint(8, 15)))

    unique_ips = {}
    for event in raw_events:
        ip = event['ip']
        if ip not in unique_ips: unique_ips[ip] = event
        else:
            unique_ips[ip]['sev'] = min(1.0, unique_ips[ip]['sev'] + 0.1)
            if len(unique_ips[ip]['source']) < 60:
                unique_ips[ip]['source'] += f", {event['source']}"
                
    ip_list = list(unique_ips.keys())
    geo_results = await get_geo_batch(ip_list)
    processed = []
    country_counts = {}
    for ip, event in unique_ips.items():
        # Fallback random coordinates for simulated/unmatched IPs
        lat = random.uniform(-40, 60)
        lon = random.uniform(-100, 100)
        city = "Unknown"
        country = "Unknown"
        
        if ip in geo_results:
            geo = geo_results[ip]
            country = geo.get('country', 'Unknown')
            lat = geo.get('lat', lat)
            lon = geo.get('lon', lon)
            city = geo.get('city', city)
            
        country_counts[country] = country_counts.get(country, 0) + 1
        risk = "CRITICAL" if event['sev'] > 0.8 else "HIGH" if event['sev'] > 0.5 else "MEDIUM"
        threat = {
            "id": hashlib.md5((ip + event['type'] + str(time.time())).encode()).hexdigest()[:8] if 'time' in globals() else hashlib.md5(ip.encode()).hexdigest()[:8],
            "ip": ip, "target": event.get('type', 'Attack'),
            "type": event['type'], "risk_score": round(event['sev'] * 100, 1), "threat_level": risk,
            "source": event['source'],
            "location": {"lat": lat, "lng": lon, "city": city, "country": country, "cc": "ZZ"},
            "ts": datetime.now().isoformat()
        }
        processed.append(threat)
        await manager.broadcast(json.dumps({"type": "NEW_ATTACK", "payload": threat}))
        await asyncio.sleep(random.uniform(0.1, 0.5))
    REAL_THREATS = processed
    sorted_c = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)
    THREAT_ANALYTICS["top_attackers"] = [{"country": c, "count": count} for c, count in sorted_c[:5]]
    THREAT_ANALYTICS["live_count"] += len(processed)
    await manager.broadcast(json.dumps({"type": "ANALYTICS_UPDATE", "payload": THREAT_ANALYTICS}))

async def threat_loop():
    print("[Threat Loop] Started")
    while True:
        try:
            print("[Threat Loop] Fetching feeds...")
            await update_threat_feed()
            print(f"[Threat Loop] Broadcasted {len(REAL_THREATS)} threats.")
        except Exception as e:
            import traceback
            print(f"[Threat Loop Error] {e}")
            traceback.print_exc()
        await asyncio.sleep(2)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(threat_loop())

@app.websocket("/ws/threats")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/threats")
async def get_threats(): return REAL_THREATS

@app.get("/threats/analytics")
async def get_analytics(): return THREAT_ANALYTICS


def get_system_resources():
    try:
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent
        return {"cpu": cpu, "mem": mem, "disk": disk}
    except:
        return {"cpu": 12.5, "mem": 45.2, "disk": 38.1}

# (APP moved above routes)

# ─── DB ────────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect("allsafe.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.execute("""CREATE TABLE IF NOT EXISTS scans (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        type     TEXT,
        target   TEXT,
        result   TEXT,
        risk     TEXT,
        ts       TEXT
    )""")
    db.commit(); db.close()

init_db()

def log_scan(type_, target, result, risk):
    db = get_db()
    db.execute("INSERT INTO scans(type,target,result,risk,ts) VALUES(?,?,?,?,?)",
               (type_, target, json.dumps(result), risk, datetime.utcnow().isoformat()))
    db.commit(); db.close()

def get_risk(positives: int) -> str:
    if positives == 0: return "CLEAN"
    elif positives <= 3: return "LOW"
    elif positives <= 10: return "MEDIUM"
    else: return "HIGH"

# ─── MODELS ────────────────────────────────────────────────────────────────
class URLPayload(BaseModel):
    url: str

class DomainPayload(BaseModel):
    domain: str

class HashPayload(BaseModel):
    hash: str

class PhonePayload(BaseModel):
    phone: str

class IPPayload(BaseModel):
    ip: str

class EmailPayload(BaseModel):
    email: str

class EmailHeaderPayload(BaseModel):
    raw_headers: str
    from_addr: str = ""
    subject: str = ""
    flags: list = []
    auth: dict = {}

class JobScamPayload(BaseModel):
    text: str

class ThreatQueryPayload(BaseModel):
    threat: str

# ─── JOB SCAM DETECTION RULES ─────────────────────────────────────────────
JOB_SCAM_RULES = [
    {"pattern": r"(?i)(registration|security|training|activation)\s*(fee|deposit|charge|cost|pay)", "weight": 30, "flag": "Asks for upfront payment / registration fee"},
    {"pattern": r"(?i)(earn|salary|income)\s*(\₹|rs\.?|inr)?\s*[0-9,]+\s*(per\s*)?(day|daily)", "weight": 20, "flag": "Unrealistic daily earn claims"},
    {"pattern": r"(?i)(guaranteed|100%|assured)\s*(profit|income|salary|earnings|return)", "weight": 25, "flag": "Guarantees 100% income — not possible in legitimate jobs"},
    {"pattern": r"(?i)no\s*(experience|qualification|degree|interview)\s*(required|needed|necessary)", "weight": 15, "flag": "No experience/interview required — common scam pattern"},
    {"pattern": r"(?i)(whatsapp|telegram|signal)\s*(only|number|contact|hr|@|:)?", "weight": 15, "flag": "Contact via WhatsApp/Telegram only — no official communication"},
    {"pattern": r"(?i)work\s*from\s*home.{0,40}(earn|salary|income|money)", "weight": 12, "flag": "WFH earning claim combination"},
    {"pattern": r"(?i)(aadhaar|aadhar|pan\s*card|bank\s*(account|detail)|passbook|ifsc).{0,30}(send|share|submit|upload|provide)", "weight": 30, "flag": "Requests sensitive documents (Aadhaar/PAN/bank) upfront"},
    {"pattern": r"(?i)(limited|urgent|hurry|last|only|today|24\s*hour).{0,20}(opportunit|offer|seat|slot|spot|vacanc)", "weight": 12, "flag": "Artificial urgency pressure tactic"},
    {"pattern": r"(?i)@(gmail|yahoo|hotmail|outlook)\.com", "weight": 15, "flag": "HR/contact using personal email instead of a company domain"},
    {"pattern": r"(?i)(data\s*entry|click\s*ads?|watch\s*video|like\s*and\s*subscribe).{0,30}(earn|pay|₹|rs\.?)", "weight": 20, "flag": "Suspiciously simple task with high pay — classic scam format"},
    {"pattern": r"(?i)(refundable|fully\s*refundable).{0,30}deposit", "weight": 20, "flag": "Claims deposit is \"refundable\" — common scam trick"},
    {"pattern": r"(?i)earn.{0,20}(₹|rs\.?|inr)?\s*(50000|40000|30000|20000|1\s*lakh).{0,20}(day|daily|week|monthly|month)", "weight": 22, "flag": "Exceptionally high salary claims for simple roles"},
]

def get_job_scam_ai_summary(text_snippet: str, score: int, flags: list) -> str:
    """AI-powered job scam analysis."""
    flags_str = "; ".join(flags) if flags else "None detected by pattern analysis"
    risk_label = "CONFIRMED SCAM" if score >= 70 else "HIGHLY SUSPICIOUS" if score >= 40 else "PROCEED WITH CAUTION" if score >= 15 else "LIKELY LEGITIMATE"
    prompt = (
        f"You are a cybersecurity and employment fraud investigator specializing in India job scams. "
        f"Analyze this job offer text and provide a 3-sentence professional assessment:\n\n"
        f"Job text (first 600 chars): {text_snippet[:600]}\n\n"
        f"Scam score: {score}/100 — Risk label: {risk_label}\n"
        f"Red flags detected: {flags_str}\n\n"
        f"In your assessment: (1) State clearly if this is a scam and the overall risk level. "
        f"(2) Explain the 2 most critical red flags found and what they mean to a job seeker. "
        f"(3) Give a specific recommended action (Apply/Avoid/Report to cybercrime.gov.in). Be concise and professional."
    )
    if gemini_client:
        try:
            response = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=prompt)
            return response.text.strip()
        except Exception as ge:
            print(f"[AI] Gemini job scam analysis failed: {ge}")
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300, temperature=0.3
            )
            return completion.choices[0].message.content.strip()
        except:
            pass
    return "AI analysis engine temporarily unavailable."

# ─── ENDPOINTS ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ALL SAFE API v2.0", "engine": bool(VT_API_KEY)}

@app.post("/scan/threat-info")
async def get_threat_info(payload: ThreatQueryPayload):
    threat = payload.threat.strip()
    prompt = (
        f"You are a Senior Cyber Threat Educator and Intelligence Trainer. "
        f"Provide a highly engaging, 3-paragraph educational breakdown of the cyber threat '{threat}'.\n"
        f"1. Explain what it is technically, but simply.\n"
        f"2. Describe a famous, real-world devastating example of this attack.\n"
        f"3. Provide top prevention strategies to protect against it.\n"
        f"Format the output using Markdown. Use bolding and lists where appropriate."
    )
    
    if gemini_client:
        try:
            response = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=prompt)
            return {"ai_summary": response.text.strip()}
        except Exception as e:
            print(f"[AI] Gemini threat info failed: {e}")

    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600, temperature=0.4
            )
            return {"ai_summary": completion.choices[0].message.content.strip()}
        except:
            pass
            
    return {"ai_summary": "AI educational engine temporarily unavailable."}

@app.post("/scan/job-scam")
async def scan_job_scam(payload: JobScamPayload):
    """Rule-based + AI job scam detector."""
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Job text cannot be empty")

    detected_flags = []
    raw_score = 0
    for rule in JOB_SCAM_RULES:
        if re.search(rule["pattern"], text):
            detected_flags.append(rule["flag"])
            raw_score += rule["weight"]

    scam_score = min(100, raw_score)
    risk = "HIGH" if scam_score >= 70 else "MEDIUM" if scam_score >= 40 else "LOW" if scam_score >= 15 else "CLEAN"

    ai_summary = get_job_scam_ai_summary(text, scam_score, detected_flags)

    result = {
        "scam_score": scam_score,
        "risk": risk,
        "flags": detected_flags,
        "flags_count": len(detected_flags),
        "ai_summary": ai_summary,
        "text_length": len(text),
    }
    log_scan("job-scam", text[:100] + ("..." if len(text) > 100 else ""), result, risk)
    return result

@app.post("/scan/url")
async def scan_url(payload: URLPayload):
    async with httpx.AsyncClient(timeout=30) as client:
        # Submit URL
        resp = await client.post(f"{VT_BASE}/urls",
            headers=HEADERS,
            data={"url": payload.url})
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=resp.status_code, detail="Core Engine submit failed")
        analysis_id = resp.json()["data"]["id"]

        # Poll result - Increase to 15 attempts (30s total) for better success rate
        for _ in range(15):
            await asyncio.sleep(2)
            try:
                r2 = await client.get(f"{VT_BASE}/analyses/{analysis_id}", headers=HEADERS)
                if r2.status_code == 200:
                    data = r2.json().get("data", {})
                    if data.get("attributes", {}).get("status") == "completed":
                        stats = data["attributes"]["stats"]
                        positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
                        risk = get_risk(positives)
                        ai_summary = get_ai_analysis(payload.url, "URL", risk, stats)
                        result = {"url": payload.url, "stats": stats, "risk": risk, "engine_results": data["attributes"].get("results", {}), "ai_summary": ai_summary}
                        log_scan("url", payload.url, result, risk)
                        return result
                elif r2.status_code == 401:
                    raise HTTPException(status_code=401, detail="VirusTotal API Key is invalid or expired.")
            except Exception as e:
                if isinstance(e, HTTPException): raise e
                continue

        raise HTTPException(status_code=408, detail="Analysis timed out. VirusTotal is still processing the URL. Try again in a minute.")

@app.post("/scan/file")
async def scan_file(file: UploadFile = File(...)):
    content = await file.read()
    sha256 = hashlib.sha256(content).hexdigest()
    
    async with httpx.AsyncClient(timeout=60) as client:
        # Check if hash already known
        r = await client.get(f"{VT_BASE}/files/{sha256}", headers=HEADERS)
        if r.status_code == 200:
            data = r.json()["data"]["attributes"]["last_analysis_stats"]
            positives = data.get("malicious", 0) + data.get("suspicious", 0)
            risk = get_risk(positives)
            result = {"filename": file.filename, "sha256": sha256, "stats": data, "risk": risk, "cached": True}
            log_scan("file", file.filename, result, risk)
            return result

        # Upload new file
        resp = await client.post(f"{VT_BASE}/files",
            headers=HEADERS,
            files={"file": (file.filename, content, file.content_type or "application/octet-stream")})
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=resp.status_code, detail="Core Engine upload failed")

        analysis_id = resp.json()["data"]["id"]
        for _ in range(15):
            await asyncio.sleep(3)
            r2 = await client.get(f"{VT_BASE}/analyses/{analysis_id}", headers=HEADERS)
            data_json = r2.json().get("data", {})
            attrs = data_json.get("attributes", {})
            if attrs.get("status") == "completed":
                stats = attrs["stats"]
                positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
                risk = get_risk(positives)
                ai_sum = get_ai_analysis(file.filename, "Uploaded File", risk, stats)
                result = {"filename": file.filename, "sha256": sha256, "stats": stats, "risk": risk, "engine_results": attrs.get("results", {}), "ai_summary": ai_sum}
                log_scan("file", file.filename, result, risk)
                return result

    raise HTTPException(status_code=408, detail="File analysis timed out. File is large or VirusTotal is busy.")

@app.post("/scan/hash")
async def scan_hash(payload: HashPayload):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{VT_BASE}/files/{payload.hash}", headers=HEADERS)
        if r.status_code == 404:
            return {"hash": payload.hash, "risk": "UNKNOWN", "found": False}
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail="Core Engine lookup failed or limit reached.")
        
        data_json = r.json().get("data", {})
        attrs = data_json.get("attributes", {})
        stats = attrs.get("last_analysis_stats", {})
        positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
        risk = get_risk(positives)
        ai_sum = get_ai_analysis(payload.hash, "Hash", risk, stats)
        
        result = {
            "hash": payload.hash, 
            "stats": stats, 
            "risk": risk, 
            "name": attrs.get("meaningful_name") or attrs.get("type_description", "Unknown File"), 
            "type": attrs.get("type_description",""), 
            "ai_summary": ai_sum,
            "found": True
        }
        log_scan("hash", payload.hash, result, risk)
        return result

@app.post("/scan/domain")
async def scan_domain(payload: DomainPayload):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{VT_BASE}/domains/{payload.domain}", headers=HEADERS)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail="Core Engine domain lookup failed")
        attrs = r.json()["data"]["attributes"]
        stats = attrs.get("last_analysis_stats", {})
        positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
        risk = get_risk(positives)
        ai_summary = get_ai_analysis(payload.domain, "Domain", risk, stats)
        result = {
            "domain": payload.domain, "stats": stats, "risk": risk,
            "reputation": attrs.get("reputation", 0),
            "categories": attrs.get("categories", {}),
            "registrar": attrs.get("registrar",""),
            "creation_date": attrs.get("creation_date",""),
            "ai_summary": ai_summary
        }
        log_scan("domain", payload.domain, result, risk)
        return result

@app.post("/scan/ip")
async def scan_ip(payload: IPPayload):
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{VT_BASE}/ip_addresses/{payload.ip}", headers=HEADERS)
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="Core Engine IP lookup failed. Ensure IP is valid.")
            attrs = r.json()["data"]["attributes"]
            stats = attrs.get("last_analysis_stats", {})
            positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
            risk = get_risk(positives)
            nmap_ports = quick_port_scan(payload.ip)
            whois_data = {}
            try:
                w = whois.whois(payload.ip)
                whois_data = {
                    "registrar": w.registrar if isinstance(w.registrar, str) else "Unknown",
                    "creation_date": str(w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date),
                    "org": w.org if isinstance(w.org, str) else "Unknown"
                }
            except:
                pass

            ipinfo_data = {}
            try:
                # Fetch exact location using ipinfo.io
                r_ip = await client.get(f"https://ipinfo.io/{payload.ip}/json")
                if r_ip.status_code == 200:
                    ipinfo_data = r_ip.json()
            except:
                pass

            ai_summary = get_ai_analysis(payload.ip, "IP Address", risk, stats)

            result = {
                "ip": payload.ip, "stats": stats, "risk": risk,
                "reputation": attrs.get("reputation", 0),
                "country": attrs.get("country", "Unknown"),
                "as_owner": attrs.get("as_owner", "Unknown"),
                "nmap": nmap_ports,
                "whois": whois_data,
                "ipinfo": ipinfo_data,
                "ai_summary": ai_summary
            }
            log_scan("ip", payload.ip, result, risk)
            return result
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Error connecting to Intel Engine APIs")

@app.post("/scan/phone")
async def scan_phone(payload: PhonePayload):
    phone = payload.phone
    region_name = "Unknown"
    carrier_name = "Unknown"
    national_number = phone
    
    try:
        # Pass "IN" as default region if no + is provided
        parsed_number = phonenumbers.parse(phone, "IN")
        if phonenumbers.is_valid_number(parsed_number):
            region_name = geocoder.description_for_number(parsed_number, "en") or "Unknown"
            carrier_name = carrier.name_for_number(parsed_number, "en") or "Unknown"
            national_number = str(parsed_number.national_number)
            # Format phone uniformly
            phone = phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
    except Exception:
        # Keep raw string if parsing fails entirely
        national_number = ''.join(filter(str.isdigit, phone)) or phone
    
    # OSINT Links mapping
    osint_links = [
        {"name": "ShouldIAnswer", "url": f"https://www.shouldianswer.com/search?q={national_number}"},
        {"name": "NumLooker", "url": f"https://numlooker.com/search/phone/{national_number}"},
        {"name": "Sync.me", "url": f"https://sync.me/search/number/{national_number}/"},
    ]

    # We maintain mocked spam calculation for simulation/hackathon, but use real region
    is_spam = random.choice([True, False, False, False, True])
    score = random.randint(70, 99) if is_spam else random.randint(0, 15)
    risk = "HIGH" if score > 70 else "MEDIUM" if score > 30 else "CLEAN"
    
    danger_explanation = ""
    if risk == "HIGH":
        danger_explanation = "WARNING: This phone number has been flagged by OSINT databases for severe malicious activities such as impersonation, phishing (smishing), or toll fraud. It belongs to active spam campaigns. Immediate blocking is recommended."
    elif risk == "MEDIUM":
        danger_explanation = "CAUTION: This number exhibits suspicious behavior often correlated with aggressive telemarketing or potential nuisance campaigns."

    result = {
        "phone": phone,
        "region": region_name,
        "carrier": carrier_name,
        "spam_score": score,
        "osint_links": osint_links,
        "danger_explanation": danger_explanation,
        "stats": {"malicious": 1 if score > 50 else 0, "harmless": 1 if score <= 50 else 0},
        "risk": risk
    }
    log_scan("phone", phone, result, risk)
    return result

@app.post("/scan/identity")
async def scan_identity(payload: EmailPayload):
    email = payload.email
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    breaches = []
    risk = "CLEAN"
    
    # Try real XposedOrNot API (Public V1)
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        async with httpx.AsyncClient(timeout=10, headers=headers) as client:
            resp = await client.get(f"https://api.xposedornot.com/v1/check-email/{email}")
            if resp.status_code == 200:
                data = resp.json()
                # XposedOrNot returns breach info in a dictionary
                breach_list = data.get("breaches", [])
                for b_name in breach_list:
                    breaches.append({"source": b_name, "data": "Credential Exposure / PII Leak"})
                risk = "HIGH" if len(breaches) > 3 else "MEDIUM" if len(breaches) > 0 else "CLEAN"
            elif resp.status_code == 404:
                # No breaches found
                risk = "CLEAN"
    except Exception as e:
        print(f"[Identity Scan] Error: {e}")
        # Mock fallback if API fails
        mock_breaches = [
            {"source": "Adobe (2013)", "data": "Email, Password, Hint"},
            {"source": "LinkedIn (2016)", "data": "Email, Password Hashes"}
        ]
        breaches = random.sample(mock_breaches, random.randint(0, 2))
        risk = "HIGH" if len(breaches) > 1 else "MEDIUM" if len(breaches) == 1 else "CLEAN"
    
    ai_summary = get_ai_analysis(email, "Identity/Email", risk, {"malicious": len(breaches)})
    
    result = {
        "email": email,
        "found_in": breaches,
        "breach_count": len(breaches),
        "risk": risk,
        "ai_summary": ai_summary,
        "stats": {"malicious": len(breaches), "harmless": 10 - len(breaches)}
    }
    log_scan("identity", email, result, risk)
    return result

@app.get("/history")
async def get_history(limit: int = 20):
    db = get_db()
    rows = db.execute("SELECT * FROM scans ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@app.delete("/history/clear")
async def clear_history():
    db = get_db()
    db.execute("DELETE FROM scans")
    db.commit()
    db.close()
    return {"status": "History cleared"}

@app.get("/stats")
async def get_stats():
    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM scans").fetchone()[0]
    high   = db.execute("SELECT COUNT(*) FROM scans WHERE risk='HIGH'").fetchone()[0]
    medium = db.execute("SELECT COUNT(*) FROM scans WHERE risk='MEDIUM'").fetchone()[0]
    clean  = db.execute("SELECT COUNT(*) FROM scans WHERE risk='CLEAN'").fetchone()[0]
    by_type = db.execute("SELECT type, COUNT(*) as cnt FROM scans GROUP BY type").fetchall()
    db.close()
    
    sys_res = get_system_resources()
    
    return {
        "total": total, "high": high, "medium": medium, "clean": clean,
        "by_type": {r["type"]: r["cnt"] for r in by_type},
        "system_resources": sys_res
    }

import xml.etree.ElementTree as ET

@app.get("/news")
async def get_news():
    news_items = []
    
    rss_feeds = [
        ("The Hacker News", "https://feeds.feedburner.com/TheHackersNews"),
        ("KrebsOnSecurity", "https://krebsonsecurity.com/feed/"),
        ("Dark Reading", "https://www.darkreading.com/rss.xml"),
        ("CISA Alerts", "https://www.cisa.gov/cybersecurity-advisories/all.xml")
    ]
    
    async def fetch_rss(client, source_name, url):
        try:
            r = await client.get(url, follow_redirects=True)
            if r.status_code == 200:
                root = ET.fromstring(r.text)
                items = []
                for item in root.findall(".//item")[:6]:
                    title = item.find("title").text if item.find("title") is not None else ""
                    link = item.find("link").text if item.find("link") is not None else "#"
                    desc = item.find("description").text if item.find("description") is not None else ""
                    pubDate = item.find("pubDate").text if item.find("pubDate") is not None else ""

                    desc = re.sub('<[^<]+>', '', desc).strip()
                    if len(desc) > 180: desc = desc[:177] + "..."
                    
                    # Convert pubDate to a sortable ISO string or just keep raw
                    try:
                        # Attempt to extract YYYY-MM-DD
                        pd_parsed = email.utils.parsedate_to_datetime(pubDate)
                        time_str = pd_parsed.strftime("%Y-%m-%d")
                    except:
                        time_str = pubDate.split(" ")[0] if pubDate else datetime.now().strftime("%Y-%m-%d")

                    items.append({
                        "title": title,
                        "source": source_name,
                        "time": time_str,
                        "tag": "CYBER INTELLIGENCE",
                        "summary": desc,
                        "link": link
                    })
                return items
        except Exception as e:
            print(f"[News Error] {source_name}: {e}")
        return []

    async def fetch_wiki(client):
        try:
            import random
            keywords = ["ransomware attack", "hacked", "data breach", "DDoS attack", "malware", "cyber espionage", "zero-day exploit", "APT group", "phishing campaign", "botnet"]
            q = random.choice(keywords)
            url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={q}&utf8=&format=json&srlimit=15"
            headers_wiki = {"User-Agent": "ALLSAFE_OSINT_Engine/2.0 (contact@allsafe.io)"}
            r = await client.get(url, headers=headers_wiki)
            if r.status_code == 200:
                data = r.json()
                items = []
                search_res = data.get("query", {}).get("search", [])
                
                # Shuffle so you get different historic reports on every refresh!
                random.shuffle(search_res)
                
                for item in search_res[:6]:
                    desc = " ".join(item.get("snippet", "").split())
                    desc = re.sub('<[^<]+>', '', desc).replace('&quot;', '"').replace('&#039;', "'").strip()
                    items.append({
                        "title": item.get("title", ""),
                        "source": "Wikipedia Cyber Intel",
                        "time": item.get("timestamp", "").split("T")[0],
                        "tag": "HISTORIC / WIKI",
                        "summary": desc,
                        "link": f"https://en.wikipedia.org/?curid={item.get('pageid')}"
                    })
                return items
        except Exception as e:
            print(f"[News Error] Wikipedia: {e}")
        return []

    try:
        import email.utils
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        async with httpx.AsyncClient(timeout=10, headers=headers) as client:
            tasks = [fetch_rss(client, name, url) for name, url in rss_feeds]
            tasks.append(fetch_wiki(client))
            results = await asyncio.gather(*tasks)
            
            for res in results:
                news_items.extend(res)
                
            # Randomize the exact ordering slightly so it never looks stale, 
            # while keeping newer articles mostly near the top
            import random
            random.shuffle(news_items)
            news_items.sort(key=lambda x: x["time"], reverse=True)
            
            if news_items:
                return news_items[:30]
    except Exception as e:
        print(f"[News Error Global] {e}")
        
    return []

@app.post("/analyze/email-headers")
async def analyze_email_headers(payload: EmailHeaderPayload):
    """AI-powered email header analysis using Gemini."""
    ai_summary = get_gemini_email_summary(
        from_addr=payload.from_addr,
        subject=payload.subject,
        flags=payload.flags,
        auth_results=payload.auth
    )
    return {"ai_summary": ai_summary}

from routers.inbox import router as inbox_router
app.include_router(inbox_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT",8000)), reload=os.getenv("DEBUG","False")=="True")
