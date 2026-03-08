import os, sqlite3, json
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# ─── API KEYS & ENDPOINTS ───────────────────────────────────────────────────
VT_API_KEY   = os.getenv("VIRUSTOTAL_API_KEY", "")
OTX_API_KEY  = os.getenv("OTX_API_KEY", "")
ABUSE_IP_KEY = os.getenv("ABUSEIPDB_API_KEY", "")
THREATFOX_KEY= os.getenv("THREATFOX_API_KEY", "")
HONEYDB_ID   = os.getenv("HONEYDB_API_ID", "")
HONEYDB_KEY  = os.getenv("HONEYDB_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_KEY_01= os.getenv("GEMINI_API_KEY_01", "")
GEMINI_KEY_02= os.getenv("GEMINI_API_KEY_02", "")

VT_BASE       = "https://www.virustotal.com/api/v3"
OTX_BASE      = "https://otx.alienvault.com/api/v1"
ABUSE_BASE    = "https://api.abuseipdb.com/api/v2"
THREATFOX_BASE= "https://threatfox-api.abuse.ch/api/v1/"
HONEYDB_BASE  = "https://honeydb.io/api"
VT_HEADERS    = {"x-apikey": VT_API_KEY}

# Database path inside backend/ folder
DB_PATH = os.path.join(os.path.dirname(__file__), "allsafe.db")

# ─── AI CLIENTS ─────────────────────────────────────────────────────────────
try:
    groq_client = Groq(api_key=GROQ_API_KEY)
except Exception:
    groq_client = None

gemini_client = None
ACTIVE_GEMINI_MODEL = "gemini-2.0-flash"

try:
    from google import genai as google_genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False

_GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"]

if _GENAI_AVAILABLE:
    for _key in [GEMINI_KEY_01, GEMINI_KEY_02]:
        if _key and not gemini_client:
            for _model in _GEMINI_MODELS:
                try:
                    _c = google_genai.Client(api_key=_key)
                    _c.models.generate_content(model=_model, contents="Respond with exactly: OK")
                    gemini_client = _c
                    ACTIVE_GEMINI_MODEL = _model
                    print(f"[ALL SAFE AI] Gemini ready: {_model} (key ...{_key[-6:]})")
                    break
                except Exception as _e:
                    print(f"[ALL SAFE AI] {_model}: {str(_e)[:60]}")
            if gemini_client:
                break

if not gemini_client:
    print("[ALL SAFE AI] Gemini offline — LLaMA 3.3 via Groq active as primary")

# ─── DATABASE ────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.execute("""CREATE TABLE IF NOT EXISTS scans (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        type    TEXT,
        target  TEXT,
        result  TEXT,
        risk    TEXT,
        ts      TEXT
    )""")
    db.execute("""CREATE TABLE IF NOT EXISTS shared_reports (
        token       TEXT PRIMARY KEY,
        scan_json   TEXT,
        created_at  TEXT
    )""")
    db.commit()
    db.close()

init_db()

def log_scan(type_: str, target: str, result: dict, risk: str):
    db = get_db()
    db.execute(
        "INSERT INTO scans(type,target,result,risk,ts) VALUES(?,?,?,?,?)",
        (type_, target, json.dumps(result), risk, datetime.utcnow().isoformat())
    )
    db.commit()
    db.close()

def get_risk(positives: int) -> str:
    if positives == 0: return "CLEAN"
    elif positives <= 3: return "LOW"
    elif positives <= 10: return "MEDIUM"
    else: return "HIGH"
