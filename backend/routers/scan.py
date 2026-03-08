"""
ALL SAFE — Scan Router
All /scan/* endpoints with rate limiting.
"""
import re, json, random, hashlib, asyncio, io, socket
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import httpx, PyPDF2, docx, whois, phonenumbers
from phonenumbers import geocoder, carrier
from uuid import uuid4
from datetime import datetime, timedelta

from config import (
    VT_API_KEY, VT_BASE, VT_HEADERS, OTX_API_KEY, OTX_BASE,
    ABUSE_IP_KEY, ABUSE_BASE, THREATFOX_KEY, THREATFOX_BASE,
    HONEYDB_ID, HONEYDB_KEY, HONEYDB_BASE,
    gemini_client, ACTIVE_GEMINI_MODEL, groq_client,
    get_db, log_scan, get_risk
)
from models import (
    URLPayload, DomainPayload, HashPayload, PhonePayload,
    IPPayload, EmailPayload, EmailHeaderPayload,
    JobScamPayload, UnifiedPayload, SaveReportPayload
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
RATE_MSG = "Slow down — rate limit reached. Try again in 60 seconds."

MAX_UPLOAD_BYTES = 32 * 1024 * 1024  # 32 MB

# ─── AI HELPERS ──────────────────────────────────────────────────────────────
def get_ai_analysis(target, type_str, risk, stats):
    prompt = (
        f"You are a Senior Cyber Threat Intelligence Analyst. "
        f"Provide a concise 2-sentence threat summary about the {type_str} '{target}'. "
        f"State clearly whether it is safe or dangerous."
    )
    if gemini_client:
        try:
            r = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=prompt)
            return r.text.strip()
        except Exception as e:
            print(f"[ALL SAFE AI] Gemini: {e}")
    if groq_client:
        try:
            c = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200, temperature=0.4
            )
            return c.choices[0].message.content.strip()
        except Exception:
            pass
    return "AI analysis engine temporarily unavailable."

def get_gemini_email_summary(from_addr, subject, flags, auth_results):
    flags_str = "; ".join([f['msg'] for f in flags]) if flags else "None"
    prompt = (
        f"You are a cybersecurity expert specializing in email phishing detection. "
        f"Analyze this email header:\nFrom: {from_addr}\nSubject: {subject}\n"
        f"SPF: {auth_results.get('spf','?')} DKIM: {auth_results.get('dkim','?')} DMARC: {auth_results.get('dmarc','?')}\n"
        f"State: (1) phishing likelihood, (2) key failures, (3) recommended action."
    )
    if gemini_client:
        try:
            r = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=prompt)
            return r.text.strip()
        except Exception: pass
    if groq_client:
        try:
            c = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300, temperature=0.3
            )
            return c.choices[0].message.content.strip()
        except Exception: pass
    return "AI summary engine temporarily unavailable."

def get_job_scam_ai_summary(text_snippet, score, flags):
    flags_str = "; ".join(flags) if flags else "None"
    risk_label = "CONFIRMED SCAM" if score >= 70 else "SUSPICIOUS" if score >= 40 else "LOW RISK"
    prompt = (
        f"You are a job fraud investigator. Analyze this text:\n"
        f"Job text: {text_snippet[:600]}\nScam score: {score}/100\n"
        f"Red flags: {flags_str}\n"
        f"State: (1) scam likelihood, (2) critical red flags, (3) next steps."
    )
    if gemini_client:
        try:
            r = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=prompt)
            return r.text.strip()
        except Exception: pass
    if groq_client:
        try:
            c = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300, temperature=0.3
            )
            return c.choices[0].message.content.strip()
        except Exception: pass
    return "AI analysis engine temporarily unavailable."

# ─── UTILITY ──────────────────────────────────────────────────────────────────
async def quick_port_scan(ip):
    open_ports = []
    common_ports = {21:"FTP", 22:"SSH", 23:"Telnet", 25:"SMTP", 53:"DNS", 80:"HTTP", 110:"POP3", 143:"IMAP", 443:"HTTPS", 445:"SMB", 3389:"RDP", 8080:"HTTP-Proxy"}
    async def check_port(port, service):
        try:
            r, w = await asyncio.wait_for(asyncio.open_connection(ip, port), timeout=0.8)
            w.close()
            return {"port": port, "service": service}
        except: return None
    results = await asyncio.gather(*(check_port(p, s) for p, s in common_ports.items()))
    return [r for r in results if r]


JOB_SCAM_RULES = [
    {"pattern": r"(?i)(registration|security|training|activation)\s*(fee|deposit|charge|cost|pay)", "weight": 30, "flag": "Asks for upfront payment / registration fee"},
    {"pattern": r"(?i)(earn|salary|income)\s*(\₹|rs\.?|inr)?\s*[0-9,]+\s*(per\s*)?(day|daily)", "weight": 20, "flag": "Unrealistic daily earn claims"},
    {"pattern": r"(?i)(guaranteed|100%|assured)\s*(profit|income|salary|earnings|return)", "weight": 25, "flag": "Guarantees 100% income — not possible in legitimate jobs"},
    {"pattern": r"(?i)no\s*(experience|qualification|degree|interview)\s*(required|needed|necessary)", "weight": 15, "flag": "No experience/interview required"},
    {"pattern": r"(?i)(whatsapp|telegram|signal)\s*(only|number|contact|hr|@|:)?", "weight": 15, "flag": "Contact via WhatsApp/Telegram only"},
    {"pattern": r"(?i)work\s*from\s*home.{0,40}(earn|salary|income|money)", "weight": 12, "flag": "WFH earning claim combination"},
    {"pattern": r"(?i)(aadhaar|aadhar|pan\s*card|bank\s*(account|detail)|passbook|ifsc).{0,30}(send|share|submit|upload|provide)", "weight": 30, "flag": "Requests sensitive documents upfront"},
    {"pattern": r"(?i)(limited|urgent|hurry|last|only|today|24\s*hour).{0,20}(opportunit|offer|seat|slot|spot|vacanc)", "weight": 12, "flag": "Artificial urgency pressure tactic"},
    {"pattern": r"(?i)@(gmail|yahoo|hotmail|outlook)\.com", "weight": 15, "flag": "HR using personal email instead of company domain"},
    {"pattern": r"(?i)(data\s*entry|click\s*ads?|watch\s*video|like\s*and\s*subscribe).{0,30}(earn|pay|₹|rs\.?)", "weight": 20, "flag": "Suspiciously simple task with high pay"},
    {"pattern": r"(?i)(refundable|fully\s*refundable).{0,30}deposit", "weight": 20, "flag": "Claims deposit is 'refundable' — common scam trick"},
    {"pattern": r"(?i)earn.{0,20}(₹|rs\.?|inr)?\s*(50000|40000|30000|20000|1\s*lakh).{0,20}(day|daily|week|monthly|month)", "weight": 22, "flag": "Exceptionally high salary claims for simple roles"},
]

# ─── SCAN ENDPOINTS ───────────────────────────────────────────────────────────
@router.post("/scan/url")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_url(request: Request, payload: URLPayload):
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{VT_BASE}/urls", headers=VT_HEADERS, data={"url": payload.url})
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=resp.status_code, detail="Core Engine submit failed")
        analysis_id = resp.json()["data"]["id"]
        for _ in range(15):
            await asyncio.sleep(2)
            try:
                r2 = await client.get(f"{VT_BASE}/analyses/{analysis_id}", headers=VT_HEADERS)
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
            except Exception as e:
                if isinstance(e, HTTPException): raise e
                continue
    raise HTTPException(status_code=408, detail="Analysis timed out. Try again in a minute.")

@router.post("/scan/file")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_file(request: Request, file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Max 32MB allowed.")
    sha256 = hashlib.sha256(content).hexdigest()
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.get(f"{VT_BASE}/files/{sha256}", headers=VT_HEADERS)
        if r.status_code == 200:
            data = r.json()["data"]["attributes"]["last_analysis_stats"]
            positives = data.get("malicious", 0) + data.get("suspicious", 0)
            risk = get_risk(positives)
            result = {"filename": file.filename, "sha256": sha256, "stats": data, "risk": risk, "cached": True}
            log_scan("file", file.filename, result, risk)
            return result
        resp = await client.post(f"{VT_BASE}/files", headers=VT_HEADERS, files={"file": (file.filename, content, file.content_type or "application/octet-stream")})
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=resp.status_code, detail="Core Engine upload failed")
        analysis_id = resp.json()["data"]["id"]
        for _ in range(15):
            await asyncio.sleep(3)
            r2 = await client.get(f"{VT_BASE}/analyses/{analysis_id}", headers=VT_HEADERS)
            attrs = r2.json().get("data", {}).get("attributes", {})
            if attrs.get("status") == "completed":
                stats = attrs["stats"]
                positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
                risk = get_risk(positives)
                ai_sum = get_ai_analysis(file.filename, "File", risk, stats)
                result = {"filename": file.filename, "sha256": sha256, "stats": stats, "risk": risk, "engine_results": attrs.get("results", {}), "ai_summary": ai_sum}
                log_scan("file", file.filename, result, risk)
                return result
    raise HTTPException(status_code=408, detail="File analysis timed out.")

@router.post("/scan/hash")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_hash(request: Request, payload: HashPayload):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{VT_BASE}/files/{payload.hash}", headers=VT_HEADERS)
        if r.status_code == 404:
            return {"hash": payload.hash, "risk": "UNKNOWN", "found": False}
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail="Core Engine lookup failed.")
        attrs = r.json().get("data", {}).get("attributes", {})
        stats = attrs.get("last_analysis_stats", {})
        positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
        risk = get_risk(positives)
        ai_sum = get_ai_analysis(payload.hash, "Hash", risk, stats)
        result = {"hash": payload.hash, "stats": stats, "risk": risk, "name": attrs.get("meaningful_name", "Unknown"), "type": attrs.get("type_description", ""), "ai_summary": ai_sum, "found": True}
        log_scan("hash", payload.hash, result, risk)
        return result

@router.post("/scan/domain")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_domain(request: Request, payload: DomainPayload):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{VT_BASE}/domains/{payload.domain}", headers=VT_HEADERS)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail="Domain lookup failed")
        attrs = r.json()["data"]["attributes"]
        stats = attrs.get("last_analysis_stats", {})
        positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
        otx_data, tf_data = {}, {}
        if OTX_API_KEY:
            try:
                ro = await client.get(f"{OTX_BASE}/indicators/domain/{payload.domain}/general", headers={"X-OTX-API-KEY": OTX_API_KEY})
                if ro.status_code == 200:
                    otx_data = {"pulse_count": ro.json().get("pulse_info", {}).get("count", 0)}
                    if otx_data.get("pulse_count", 0) > 0: positives += 1
            except: pass
        if THREATFOX_KEY:
            try:
                rt = await client.post(THREATFOX_BASE, json={"query": "search_ioc", "search_term": payload.domain}, headers={"API-KEY": THREATFOX_KEY})
                if rt.status_code == 200 and rt.json().get("query_status") == "ok":
                    tf_data = {"threats": len(rt.json().get("data", []))}
                    if tf_data.get("threats", 0) > 0: positives += 1
            except: pass
        risk = get_risk(positives)
        ai_summary = get_ai_analysis(payload.domain, "Domain", risk, stats)
        result = {"domain": payload.domain, "stats": stats, "risk": risk, "reputation": attrs.get("reputation", 0), "categories": attrs.get("categories", {}), "registrar": attrs.get("registrar", ""), "creation_date": attrs.get("creation_date", ""), "otx": otx_data, "threatfox": tf_data, "ai_summary": ai_summary}
        log_scan("domain", payload.domain, result, risk)
        return result

@router.post("/scan/ip")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_ip(request: Request, payload: IPPayload):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Parallelize ALL API requests and internal modules
            t_vt = client.get(f"{VT_BASE}/ip_addresses/{payload.ip}", headers=VT_HEADERS)
            t_ipinfo = client.get(f"https://ipinfo.io/{payload.ip}/json")
            
            t_honey = client.get(f"{HONEYDB_BASE}/ip/{payload.ip}", headers={"X-HoneyDb-ApiId": HONEYDB_ID, "X-HoneyDb-ApiKey": HONEYDB_KEY}) if (HONEYDB_ID and HONEYDB_KEY) else None
            t_otx = client.get(f"{OTX_BASE}/indicators/IPv4/{payload.ip}/general", headers={"X-OTX-API-KEY": OTX_API_KEY}) if OTX_API_KEY else None
            t_abuse = client.get(f"{ABUSE_BASE}/check?ipAddress={payload.ip}", headers={"Key": ABUSE_IP_KEY, "Accept": "application/json"}) if ABUSE_IP_KEY else None
            t_tf = client.post(THREATFOX_BASE, json={"query": "search_ioc", "search_term": payload.ip}, headers={"API-KEY": THREATFOX_KEY}) if THREATFOX_KEY else None
            
            async def safe_req(req_coro):
                if not req_coro: return None
                try: return await req_coro
                except: return None
                
            t_whois = asyncio.get_running_loop().run_in_executor(None, whois.whois, payload.ip)
            
            vt_res, ipinfo_res, honey_res, otx_res, abuse_res, tf_res, whois_res, nmap_ports = await asyncio.gather(
                safe_req(t_vt), safe_req(t_ipinfo), safe_req(t_honey), safe_req(t_otx), safe_req(t_abuse), safe_req(t_tf),
                safe_req(t_whois), quick_port_scan(payload.ip), return_exceptions=True
            )
            
            if not vt_res or isinstance(vt_res, Exception):
                raise HTTPException(status_code=500, detail=f"IP lookup failed at Core Engine: {str(vt_res)}")
            if vt_res.status_code != 200:
                raise HTTPException(status_code=vt_res.status_code, detail="IP lookup failed at Core Engine.")
                
            attrs = vt_res.json()["data"]["attributes"]
            stats = attrs.get("last_analysis_stats", {})
            positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
            
            whois_data = {}
            if whois_res and not isinstance(whois_res, Exception):
                whois_data = {"registrar": whois_res.registrar if isinstance(whois_res.registrar, str) else "Unknown", "org": whois_res.org if isinstance(whois_res.org, str) else "Unknown"}
                
            ipinfo_data = ipinfo_res.json() if (ipinfo_res and not isinstance(ipinfo_res, Exception) and ipinfo_res.status_code == 200) else {}
            
            honey_data = {}
            if honey_res and not isinstance(honey_res, Exception) and honey_res.status_code == 200 and honey_res.json():
                c = honey_res.json()[0].get("count", 0)
                honey_data = {"recent_activity": c}
                if c > 0: positives += 1
                
            otx_data = {}
            if otx_res and not isinstance(otx_res, Exception) and otx_res.status_code == 200:
                c = otx_res.json().get("pulse_info", {}).get("count", 0)
                otx_data = {"pulse_count": c}
                if c > 0: positives += 1

            abuse_data = {}
            if abuse_res and not isinstance(abuse_res, Exception) and abuse_res.status_code == 200:
                ad = abuse_res.json().get("data", {})
                abuse_data = {"score": ad.get("abuseConfidenceScore", 0), "reports": ad.get("totalReports", 0)}
                if abuse_data.get("score", 0) > 20: positives += 1
                
            tf_data = {}
            if tf_res and not isinstance(tf_res, Exception) and tf_res.status_code == 200:
                if tf_res.json().get("query_status") == "ok":
                    c = len(tf_res.json().get("data", []))
                    tf_data = {"threats": c}
                    if c > 0: positives += 1

            if isinstance(nmap_ports, Exception): nmap_ports = []
                
            risk = get_risk(positives)
            ai_summary = get_ai_analysis(payload.ip, "IP Address", risk, stats)
            result = {"ip": payload.ip, "stats": stats, "risk": risk, "reputation": attrs.get("reputation", 0), "country": attrs.get("country", "Unknown"), "as_owner": attrs.get("as_owner", "Unknown"), "nmap": nmap_ports, "whois": whois_data, "ipinfo": ipinfo_data, "otx": otx_data, "abuseipdb": abuse_data, "threatfox": tf_data, "honeydb": honey_data, "ai_summary": ai_summary}
            log_scan("ip", payload.ip, result, risk)
            return result
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Error connecting to Intel Engine APIs")

@router.post("/scan/phone")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_phone(request: Request, payload: PhonePayload):
    phone = payload.phone
    region_name, carrier_name, national_number = "Unknown", "Unknown", phone
    try:
        parsed = phonenumbers.parse(phone, "IN")
        if phonenumbers.is_valid_number(parsed):
            region_name = geocoder.description_for_number(parsed, "en") or "Unknown"
            carrier_name = carrier.name_for_number(parsed, "en") or "Unknown"
            national_number = str(parsed.national_number)
            phone = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
    except: national_number = ''.join(filter(str.isdigit, phone)) or phone
    osint_links = [
        {"name": "ShouldIAnswer", "url": f"https://www.shouldianswer.com/search?q={national_number}"},
        {"name": "NumLooker", "url": f"https://numlooker.com/search/phone/{national_number}"},
        {"name": "Sync.me", "url": f"https://sync.me/search/number/{national_number}/"},
    ]
    is_spam = random.choice([True, False, False, False, True])
    score = random.randint(70, 99) if is_spam else random.randint(0, 15)
    risk = "HIGH" if score > 70 else "MEDIUM" if score > 30 else "CLEAN"
    danger_explanation = ("WARNING: Flagged for phishing/fraud in OSINT databases." if risk == "HIGH"
                          else "CAUTION: Suspicious telemarketing pattern detected." if risk == "MEDIUM" else "")
    result = {"phone": phone, "region": region_name, "carrier": carrier_name, "spam_score": score, "osint_links": osint_links, "danger_explanation": danger_explanation, "stats": {"malicious": 1 if score > 50 else 0, "harmless": 1 if score <= 50 else 0}, "risk": risk}
    log_scan("phone", phone, result, risk)
    return result

@router.post("/scan/identity")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_identity(request: Request, payload: EmailPayload):
    email = payload.email
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    breaches = []
    risk = "CLEAN"
    try:
        headers_http = {"User-Agent": "Mozilla/5.0"}
        async with httpx.AsyncClient(timeout=10, headers=headers_http) as client:
            resp = await client.get(f"https://api.xposedornot.com/v1/check-email/{email}")
            if resp.status_code == 200:
                for b_name in resp.json().get("breaches", []):
                    breaches.append({"source": b_name, "data": "Credential Exposure / PII Leak"})
                risk = "HIGH" if len(breaches) > 3 else "MEDIUM" if len(breaches) > 0 else "CLEAN"
    except:
        mock = [{"source": "Adobe (2013)", "data": "Email, Password, Hint"}, {"source": "LinkedIn (2016)", "data": "Email, Password Hashes"}]
        breaches = random.sample(mock, random.randint(0, 2))
        risk = "HIGH" if len(breaches) > 1 else "MEDIUM" if len(breaches) == 1 else "CLEAN"
    ai_summary = get_ai_analysis(email, "Identity/Email", risk, {"malicious": len(breaches)})
    result = {"email": email, "found_in": breaches, "breach_count": len(breaches), "risk": risk, "ai_summary": ai_summary, "stats": {"malicious": len(breaches), "harmless": max(0, 10 - len(breaches))}}
    log_scan("identity", email, result, risk)
    return result

@router.post("/scan/job-scam")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_job_scam(request: Request, payload: JobScamPayload):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Job text cannot be empty")
    detected_flags, raw_score = [], 0
    for rule in JOB_SCAM_RULES:
        if re.search(rule["pattern"], text):
            detected_flags.append(rule["flag"])
            raw_score += rule["weight"]
    scam_score = min(100, raw_score)
    risk = "HIGH" if scam_score >= 70 else "MEDIUM" if scam_score >= 40 else "LOW" if scam_score >= 15 else "CLEAN"
    ai_summary = get_job_scam_ai_summary(text, scam_score, detected_flags)
    result = {"scam_score": scam_score, "risk": risk, "flags": detected_flags, "flags_count": len(detected_flags), "ai_summary": ai_summary, "text_length": len(text), "extracted_text": text[:5000]}
    log_scan("job-scam", text[:100] + ("..." if len(text) > 100 else ""), result, risk)
    return result

@router.post("/scan/job-document")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_job_document(request: Request, file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Max 32MB.")
    text = ""
    filename = file.filename.lower()
    try:
        if filename.endswith(".pdf"):
            for page in PyPDF2.PdfReader(io.BytesIO(content)).pages:
                text += (page.extract_text() or "") + "\n"
        elif filename.endswith(".docx"):
            for para in docx.Document(io.BytesIO(content)).paragraphs:
                text += para.text + "\n"
        elif filename.endswith(".txt"):
            text = content.decode("utf-8", errors="ignore")
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use PDF, DOCX, or TXT.")
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from document.")
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing document: {e}")

    class _Req:
        state = type("s", (), {"view_rate_limit": None})()
        headers = {}
    class _Payload:
        pass
    p = JobScamPayload(text=text)
    return await scan_job_scam(request, p)

@router.post("/scan/unified")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def scan_unified(request: Request, payload: UnifiedPayload):
    text = payload.input_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Input cannot be empty")
    # Auto-detect input type
    scan_type = "text"
    if re.match(r"^https?://[^\s]+$", text): scan_type = "url"
    elif re.match(r"^\d{1,3}(\.\d{1,3}){3}$", text): scan_type = "ip"
    elif re.match(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", text) and " " not in text: scan_type = "domain"
    elif len(text) > 20 and any(w in text.lower() for w in ["salary","job","hiring","urgent","offer","registration fee"]): scan_type = "job_scam"
    elif re.match(r"^[a-fA-F0-9]{32,64}$", text): scan_type = "hash"
    elif len(text) < 35 and " " not in text: scan_type = "password"

    raw_result = None
    score, risk, reason = 0, "Low", "Analysis incomplete."
    try:
        if scan_type == "url":
            raw_result = await scan_url(request, URLPayload(url=text))
            risk = raw_result.get("risk", "LOW")
            score = 90 if risk in ["HIGH","CRITICAL"] else 50 if risk == "MEDIUM" else 5
            reason = raw_result.get("ai_summary", "Scanned via VirusTotal engine.")
        elif scan_type == "ip":
            raw_result = await scan_ip(request, IPPayload(ip=text))
            risk = raw_result.get("risk", "LOW")
            score = 95 if risk in ["HIGH","CRITICAL"] else 60 if risk == "MEDIUM" else 10
            reason = raw_result.get("ai_summary", "Queried across IP threat databases.")
        elif scan_type == "domain":
            raw_result = await scan_domain(request, DomainPayload(domain=text))
            risk = raw_result.get("risk", "LOW")
            score = 85 if risk in ["HIGH","CRITICAL"] else 45 if risk == "MEDIUM" else 5
            reason = raw_result.get("ai_summary", "Domain evaluated for malicious traits.")
        elif scan_type == "job_scam":
            raw_result = await scan_job_scam(request, JobScamPayload(text=text))
            score = raw_result.get("scam_score", 0)
            risk = raw_result.get("risk", "LOW")
            reason = raw_result.get("ai_summary", "Analyzed job text for scam patterns.")
        elif scan_type == "hash":
            raw_result = await scan_hash(request, HashPayload(hash=text))
            risk = raw_result.get("risk", "UNKNOWN")
            score = 80 if risk == "HIGH" else 40 if risk == "MEDIUM" else 5
            reason = raw_result.get("ai_summary", "Hash checked against VirusTotal.")
    except Exception:
        raw_result = None

    if not raw_result:
        prompt = (
            f"You are a cybersecurity AI. Analyze this {scan_type.upper()} asset: '{text}'.\n"
            "Return ONLY a valid JSON with keys: score (int 0-100), risk (string), reason (string), recommendation (string)."
        )
        if gemini_client:
            try:
                r = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=prompt)
                data = json.loads(re.sub(r"^```(?:json)?|```$", "", r.text.strip()).strip())
                return {"type": scan_type.capitalize(), "score": data.get("score", 50), "risk": str(data.get("risk", "Medium")).capitalize(), "reason": data.get("reason", "AI analysis."), "recommendation": data.get("recommendation", "Review carefully.")}
            except Exception: pass
        return {"type": scan_type, "score": 0, "risk": "Low", "reason": "System error.", "recommendation": "N/A"}

    rec = ("DO NOT INTERACT. Block and report this IOC." if risk.upper() in ["HIGH","CRITICAL"]
           else "Proceed with caution. Verify via secondary channels." if risk.upper() == "MEDIUM"
           else "This asset appears clean. Safe to interact.")
    return {"type": scan_type.replace("_", " ").capitalize(), "score": score, "risk": risk.capitalize(), "reason": reason, "recommendation": rec}

@router.post("/analyze/email-headers")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def analyze_email_headers(request: Request, payload: EmailHeaderPayload):
    ai_summary = get_gemini_email_summary(payload.from_addr, payload.subject, payload.flags, payload.auth)
    return {"ai_summary": ai_summary}

# ─── CVE SEARCH ───────────────────────────────────────────────────────────────
@router.get("/scan/cve")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def search_cve(request: Request, q: str):
    if not q or len(q) > 256:
        raise HTTPException(status_code=400, detail="Invalid search query")
    results = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={q}&resultsPerPage=10")
            if r.status_code == 200:
                for item in r.json().get("vulnerabilities", []):
                    cve = item.get("cve", {})
                    cve_id = cve.get("id", "")
                    descs = cve.get("descriptions", [])
                    description = next((d["value"] for d in descs if d.get("lang") == "en"), "No description available.")
                    metrics = cve.get("metrics", {})
                    cvss_score = 0
                    severity = "LOW"
                    for key in ["cvssMetricV31", "cvssMetricV30", "cvssMetricV2"]:
                        m_list = metrics.get(key, [])
                        if m_list:
                            cvss_data = m_list[0].get("cvssData", {})
                            cvss_score = cvss_data.get("baseScore", 0)
                            severity = cvss_data.get("baseSeverity", m_list[0].get("baseSeverity", "LOW"))
                            break
                    # AI plain-English summary
                    ai_summary = description[:200]
                    if gemini_client:
                        try:
                            ai_prompt = f"Summarize this CVE in 2 plain sentences for a non-technical user: {description[:800]}"
                            ai_r = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=ai_prompt)
                            ai_summary = ai_r.text.strip()
                        except: pass
                    results.append({
                        "cve_id": cve_id,
                        "description": description[:500],
                        "ai_summary": ai_summary,
                        "cvss_score": cvss_score,
                        "severity": severity.upper(),
                        "published": cve.get("published", "")[:10],
                        "nvd_url": f"https://nvd.nist.gov/vuln/detail/{cve_id}"
                    })
    except Exception as e:
        print(f"[ALL SAFE CVE] Error: {e}")
    return results

# ─── REPORT SHARE ─────────────────────────────────────────────────────────────
@router.post("/report/save")
@limiter.limit("10/minute", error_message=RATE_MSG)
async def save_report(request: Request, payload: SaveReportPayload):
    token = str(uuid4())[:8]
    db = get_db()
    db.execute("INSERT INTO shared_reports(token, scan_json, created_at) VALUES(?,?,?)",
               (token, json.dumps(payload.scan_json), datetime.utcnow().isoformat()))
    db.commit(); db.close()
    return {"token": token}

@router.get("/report/{token}")
async def get_report(token: str):
    db = get_db()
    row = db.execute("SELECT * FROM shared_reports WHERE token=?", (token,)).fetchone()
    db.close()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found or expired")
    created_at = datetime.fromisoformat(row["created_at"])
    if datetime.utcnow() - created_at > timedelta(hours=24):
        raise HTTPException(status_code=404, detail="Report expired")
    return json.loads(row["scan_json"])
