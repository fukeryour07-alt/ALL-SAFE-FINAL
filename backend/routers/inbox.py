import imaplib
import email
from email.header import decode_header
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re
import asyncio
from config import gemini_client, ACTIVE_GEMINI_MODEL, groq_client
import json
import httpx

router = APIRouter()

class InboxAuth(BaseModel):
    email: str = ""
    password: str = ""
    imap_server: str = "imap.gmail.com"
    is_oauth: bool = False

def __clean_text(text):
    if not text: return ""
    text = re.sub(r'<[^>]+>', '', text)
    return text[:800]

async def get_email_classification_chunk(emails_chunk):
    prompt = (
        "You are an Advanced Email Security AI.\n"
        "Analyze the following list of recent emails. For each email, determine if it is 'Scam', 'Spam', 'Company', 'Personal', or 'Newsletter'.\n"
        "Assign a 'risk_score' (0-100), where 100 means high probability of phishing/scam/malware.\n"
        "Also determine an 'action' (e.g., 'Quarantine', 'Block Sender', 'Delete Immediately', 'Safe to Read').\n"
        "Count the number of suspicious/malicious links found in the snippet and return as 'links_found' (integer).\n"
        "Return ONLY a valid JSON array of objects, corresponding EXACTLY to the input IDs.\n"
        "Format: [{\"id\": 1, \"category\": \"Company\", \"risk_score\": 5, \"reason\": \"Looks safe.\", \"action\": \"Safe to Read\", \"links_found\": 0}...]\n\n"
        f"EMAILS TO ANALYZE:\n{json.dumps(emails_chunk, indent=2)}"
    )
    
    def _call_ai():
        def _parse_res(text):
            # Clean markdown codeblocks
            text = text.strip()
            if text.startswith('```json'): text = text[7:]
            elif text.startswith('```'): text = text[3:]
            if text.endswith('```'): text = text[:-3]
            return json.loads(text.strip())

        if gemini_client:
            try:
                r = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=prompt)
                return _parse_res(r.text)
            except Exception as e:
                print(f"[Inbox AI] Gemini failed: {e}")
            
        if groq_client:
            try:
                c = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    response_format={"type": "json_object"} if False else None # Optional if prompt enforces it well
                )
                return _parse_res(c.choices[0].message.content)
            except Exception as e:
                print(f"[Inbox AI] Groq failed: {e}")
                
        return [{"id": e["id"], "category": "Unknown", "risk_score": 50, "reason": "AI engines failed to classify.", "action": "Manual Review", "links_found": 0} for e in emails_chunk]

    return await asyncio.to_thread(_call_ai)

async def get_email_classification(emails_data):
    # Batch emails into chunks of 10 to ensure JSON output doesn't get truncated by LLM
    chunk_size = 10
    chunks = [emails_data[i:i + chunk_size] for i in range(0, len(emails_data), chunk_size)]
    tasks = [get_email_classification_chunk(chunk) for chunk in chunks]
    results = await asyncio.gather(*tasks)
    
    # Flatten the list of lists
    flattened = []
    for res in results:
        flattened.extend(res)
    return flattened

async def fetch_gmail_oauth(token: str, max_results: int = 20):
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        # Get message list
        list_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={max_results}"
        resp = await client.get(list_url, headers=headers)
        if resp.status_code != 200:
            raise Exception("Failed to fetch from Gmail API: " + resp.text)
        
        messages = resp.json().get("messages", [])
        if not messages:
            return []
            
        async def fetch_msg(msg_id):
            m_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date"
            m_resp = await client.get(m_url, headers=headers)
            if m_resp.status_code == 200:
                return m_resp.json()
            return None
            
        tasks = [fetch_msg(m["id"]) for m in messages]
        results = await asyncio.gather(*tasks)
        
        emails_list = []
        valid_results = [r for r in results if r]
        for idx, res in enumerate(valid_results):
            headers_list = res.get("payload", {}).get("headers", [])
            headers_dict = {h['name'].lower(): h['value'] for h in headers_list}
            snippet = res.get("snippet", "")
            
            emails_list.append({
                "id": idx + 1,
                "from": headers_dict.get("from", "Unknown"),
                "subject": headers_dict.get("subject", "No Subject"),
                "date": headers_dict.get("date", "Unknown Date"),
                "snippet": __clean_text(snippet)
            })
            
        return emails_list

@router.post("/scan/inbox")
async def scan_inbox(payload: InboxAuth):
    try:
        emails_list = []
        if payload.is_oauth:
            # Pass the OAuth token exactly via powerful concurrent HTTPX script
            emails_list = await fetch_gmail_oauth(payload.password, max_results=40)
            if not emails_list:
                return {"status": "success", "emails": []}
        else:
            # 1. Connect to IMAP (Fallback for Microsoft etc)
            try:
                mail = imaplib.IMAP4_SSL(payload.imap_server)
                mail.login(payload.email, payload.password)
            except Exception as e:
                raise HTTPException(status_code=401, detail="Authentication failed. Ensure you are using an App Password and IMAP is enabled.")
            
            mail.select("inbox")
            status, messages = mail.search(None, "ALL")
            email_ids = messages[0].split()[-40:] # get last 40 emails
            
            for index, e_id in enumerate(reversed(email_ids)):
                status, msg_data = mail.fetch(e_id, "(RFC822)")
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        subject, encoding = decode_header(msg.get("Subject", "No Subject"))[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8", "ignore")
                            
                        sender, encoding = decode_header(msg.get("From", "Unknown Sender"))[0]
                        if isinstance(sender, bytes):
                            sender = sender.decode(encoding if encoding else "utf-8", "ignore")
                            
                        date = msg.get("Date")
                        
                        body = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                if part.get_content_type() == "text/plain":
                                    try:
                                        body = part.get_payload(decode=True).decode("utf-8", "ignore")
                                        break
                                    except: pass
                        else:
                            try:
                                body = msg.get_payload(decode=True).decode("utf-8", "ignore")
                            except: pass
                            
                        emails_list.append({
                            "id": len(emails_list) + 1,
                            "from": sender,
                            "subject": subject,
                            "date": date,
                            "snippet": __clean_text(body)[:400]
                        })
            mail.logout()
            
        # 3. Request LLM Classification
        try:
            ai_classifications = await get_email_classification(emails_list)
        except Exception as e:
            ai_classifications = [{"id": e_item["id"], "category": "Unknown", "risk_score": 50, "reason": f"AI Error: {str(e)}"} for e_item in emails_list]
            
        # 4. Merge results
        final_results = []
        for e in emails_list:
            cls = next((c for c in ai_classifications if isinstance(c, dict) and c.get("id") == e["id"]), {})
            final_results.append({
                "from": e["from"],
                "subject": e["subject"],
                "date": e["date"],
                "category": cls.get("category", "Unknown"),
                "risk_score": cls.get("risk_score", 50),
                "reason": cls.get("reason", "No analysis available."),
                "action": cls.get("action", "Manual Review"),
                "links_found": cls.get("links_found", 0),
                "snippet": e["snippet"] if len(e["snippet"]) <= 500 else e["snippet"][:500] + "..."
            })
            
        # Optional sorting by risk score highest first
        final_results.sort(key=lambda x: x["risk_score"], reverse=True)
            
        return {"status": "success", "emails": final_results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ManualScanRequest(BaseModel):
    raw_text: str

@router.post("/scan/manual")
async def scan_manual(payload: ManualScanRequest):
    try:
        # We will parse the raw text as a single email. Let's try to parse headers if any, or just use it as body.
        msg = email.message_from_string(payload.raw_text)
        
        subject = msg.get("Subject", "Manual Upload")
        sender = msg.get("From", "Unknown Sender")
        date = msg.get("Date", "Unknown Date")
        
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        body = part.get_payload(decode=True).decode("utf-8", "ignore")
                        break
                    except: pass
        else:
            try:
                # payload might not be base64, so just get payload
                body = msg.get_payload(decode=True)
                if body:
                    body = body.decode("utf-8", "ignore")
                else:
                    body = msg.get_payload()
            except: 
                body = str(msg.get_payload())
                
        # If body is completely empty (e.g., they just pasted a plain paragraph with no headers)
        if not body.strip():
            body = payload.raw_text
            subject = "Raw Text Snippet"

        single_email = {
            "id": 1,
            "from": str(sender),
            "subject": str(subject),
            "date": str(date),
            "snippet": __clean_text(body)[:600]
        }
        
        # Request LLM Classification
        try:
            ai_classifications = await get_email_classification([single_email])
        except:
            ai_classifications = [{"id": 1, "category": "Unknown", "risk_score": 50, "reason": "AI Error"}]
            
        cls = next((c for c in ai_classifications if isinstance(c, dict) and c.get("id") == 1), {})
        
        final_result = {
            "from": single_email["from"],
            "subject": single_email["subject"],
            "date": single_email["date"],
            "category": cls.get("category", "Unknown"),
            "risk_score": cls.get("risk_score", 50),
            "reason": cls.get("reason", "No analysis available."),
            "action": cls.get("action", "Manual Review"),
            "links_found": cls.get("links_found", 0),
            "snippet": single_email["snippet"] if len(single_email["snippet"]) <= 500 else single_email["snippet"][:500] + "..."
        }
        
        return {"status": "success", "emails": [final_result]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
