"""
ALL SAFE — Chat Router
/chat endpoint with dual AI (Gemini primary, LLaMA fallback).
"""
import json, re
from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import gemini_client, ACTIVE_GEMINI_MODEL, groq_client, get_db
from models import ChatPayload

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
RATE_MSG = "Slow down — rate limit reached. Try again in 60 seconds."

SYSTEM_PROMPT = (
    "You are a cybersecurity AI assistant. "
    "Expertly explain scan results and provide direct, professional advice. "
    "Use markdown for clarity."
)

@router.post("/chat")
@limiter.limit("20/minute", error_message=RATE_MSG)
async def chat_endpoint(request: Request, payload: ChatPayload):
    user_message = payload.messages[-1].content
    model_choice = payload.model

    # ─── Intent Router ────────────────────────────────────────────────────────
    router_prompt = (
        "You are an intent parser for the ALL SAFE cybersecurity platform. "
        "Detect scan intent from the user message.\n"
        "Valid actions: scan_url, scan_ip, scan_domain, scan_hash, scan_phone, "
        "scan_identity, scan_job, scan_unified, get_stats, get_history, none.\n"
        'Respond ONLY with valid JSON: {"action": "<action>", "target": "<target>"}\n'
        f"User message: {user_message}"
    )

    action, target, scan_result = "none", "", None

    try:
        response_text = ""
        if gemini_client:
            r = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=router_prompt)
            response_text = re.sub(r"^```(?:json)?|```$", "", r.text.strip()).strip()
        elif groq_client:
            c = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": router_prompt}],
                temperature=0
            )
            response_text = c.choices[0].message.content.strip()
        if response_text:
            intent = json.loads(response_text)
            action = intent.get("action", "none")
            target = intent.get("target", "")
    except Exception as e:
        print(f"[ALL SAFE Chat] Intent parse error: {e}")

    # ─── Execute action ────────────────────────────────────────────────────────
    if action != "none" and target or action in ("get_stats", "get_history"):
        try:
            from routers.scan import (
                scan_url, scan_ip, scan_domain, scan_hash,
                scan_phone, scan_identity, scan_job_scam, scan_unified
            )
            from routers.stats import get_stats, get_history
            from models import URLPayload, IPPayload, DomainPayload, HashPayload, PhonePayload, EmailPayload, JobScamPayload, UnifiedPayload

            if action == "scan_url": scan_result = await scan_url(request, URLPayload(url=target))
            elif action == "scan_ip": scan_result = await scan_ip(request, IPPayload(ip=target))
            elif action == "scan_domain": scan_result = await scan_domain(request, DomainPayload(domain=target))
            elif action == "scan_hash": scan_result = await scan_hash(request, HashPayload(hash=target))
            elif action == "scan_phone": scan_result = await scan_phone(request, PhonePayload(phone=target))
            elif action == "scan_identity": scan_result = await scan_identity(request, EmailPayload(email=target))
            elif action == "scan_job": scan_result = await scan_job_scam(request, JobScamPayload(text=target))
            elif action == "scan_unified": scan_result = await scan_unified(request, UnifiedPayload(input_text=target))
            elif action == "get_stats": scan_result = await get_stats(request)
            elif action == "get_history": scan_result = await get_history(request, limit=5)
        except Exception as e:
            scan_result = {"error": str(e)}

    context_str = ""
    if scan_result:
        context_str = f"\n[SYSTEM DATA: {action} on '{target}'. Results: {json.dumps(scan_result)}]\n"

    # ─── Generate reply ────────────────────────────────────────────────────────
    def run_gemini():
        if not gemini_client: raise RuntimeError("Gemini offline")
        contents = []
        for i, m in enumerate(payload.messages):
            # Gemini expects 'user' or 'model'; frontend sends 'user' or 'assistant'
            role = "user" if m.role == "user" else "model"
            text = m.content
            if i == len(payload.messages) - 1:
                text = SYSTEM_PROMPT + context_str + "\nUser: " + text
            contents.append({"role": role, "parts": [{"text": text}]})
        return gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=contents).text.strip()

    def run_groq():
        if not groq_client: raise RuntimeError("Groq offline")
        msgs = [{"role": "system", "content": SYSTEM_PROMPT + context_str}]
        for m in payload.messages:
            # Groq expects 'user' or 'assistant'; handle both 'assistant' and 'model' from frontend
            role = "user" if m.role == "user" else "assistant"
            msgs.append({"role": role, "content": m.content})
        return groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile", messages=msgs, temperature=0.3
        ).choices[0].message.content.strip()

    reply = "AI engine unavailable."
    if model_choice == "groq":
        try: reply = run_groq()
        except Exception as ge:
            try: reply = run_gemini()
            except Exception as me:
                reply = f"**Both AI engines unavailable.**\n- Groq: `{ge}`\n- Gemini: `{me}`"
    else:
        try: reply = run_gemini()
        except Exception as ge:
            try: reply = run_groq()
            except Exception as me:
                reply = f"**Both AI engines unavailable.**\n- Gemini: `{ge}`\n- Groq: `{me}`"

    return {"reply": reply, "action": action, "target": target, "result": scan_result}
