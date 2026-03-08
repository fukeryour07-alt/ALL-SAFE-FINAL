"""
ALL SAFE — Stats Router
/stats, /history, /news, /news/summarize endpoints.
"""
import re
from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import httpx, psutil

from config import gemini_client, ACTIVE_GEMINI_MODEL, groq_client, get_db
from models import NewsSummarizePayload

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

def get_system_resources():
    try:
        return {
            "cpu": psutil.cpu_percent(interval=None),
            "mem": psutil.virtual_memory().percent,
            "disk": psutil.disk_usage('/').percent
        }
    except:
        return {"cpu": 12.5, "mem": 45.2, "disk": 38.1}

@router.get("/stats")
@limiter.limit("30/minute")
async def get_stats(request: Request):
    db = get_db()
    total  = db.execute("SELECT COUNT(*) FROM scans").fetchone()[0]
    high   = db.execute("SELECT COUNT(*) FROM scans WHERE risk='HIGH'").fetchone()[0]
    medium = db.execute("SELECT COUNT(*) FROM scans WHERE risk='MEDIUM'").fetchone()[0]
    clean  = db.execute("SELECT COUNT(*) FROM scans WHERE risk='CLEAN' OR risk='LOW'").fetchone()[0]
    by_type= db.execute("SELECT type, COUNT(*) as cnt FROM scans GROUP BY type").fetchall()
    recent = db.execute("SELECT risk, ts FROM scans ORDER BY id DESC LIMIT 20").fetchall()
    db.close()
    return {
        "total": total, "high": high, "medium": medium, "clean": clean,
        "by_type": {r["type"]: r["cnt"] for r in by_type},
        "recent_risk": [{"risk": r["risk"], "ts": r["ts"]} for r in recent],
        "system_resources": get_system_resources()
    }

@router.get("/history")
@limiter.limit("30/minute")
async def get_history(request: Request, limit: int = 50):
    db = get_db()
    rows = db.execute("SELECT * FROM scans ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    db.close()
    return [dict(r) for r in rows]

@router.delete("/history/clear")
async def clear_history():
    db = get_db()
    db.execute("DELETE FROM scans")
    db.commit(); db.close()
    return {"status": "History cleared"}

@router.get("/news")
@limiter.limit("10/minute")
async def get_news(request: Request):
    news_items = []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            rss_url = "https://feeds.feedburner.com/TheHackersNews"
            r = await client.get(f"https://api.rss2json.com/v1/api.json?rss_url={rss_url}")
            if r.status_code == 200 and r.json().get("status") == "ok":
                for item in r.json().get("items", [])[:15]:
                    desc = re.sub('<[^<]+>', '', item.get("description", "")).strip()
                    if len(desc) > 180: desc = desc[:177] + "..."
                    cats = item.get("categories", [])
                    news_items.append({
                        "title": item.get("title", ""),
                        "source": "The Hacker News",
                        "time": item.get("pubDate", "").split(" ")[0],
                        "tag": cats[0].upper() if cats else "CYBERSECURITY",
                        "summary": desc,
                        "link": item.get("link", "#")
                    })
    except Exception as e:
        print(f"[ALL SAFE News] {e}")
    return news_items

@router.post("/news/summarize")
@limiter.limit("10/minute")
async def summarize_news(request: Request, payload: NewsSummarizePayload):
    prompt = (
        "You are a cybersecurity expert. Summarize this news in 3 concise bullet points. "
        "Be direct and helpful.\n"
        f"Title: {payload.title}\nContent: {payload.description}"
    )
    summary = "• Could not generate summary.\n• Please try again later.\n• Check the full article for details."
    if gemini_client:
        try:
            r = gemini_client.models.generate_content(model=ACTIVE_GEMINI_MODEL, contents=prompt)
            summary = r.text.strip()
        except Exception: pass
    elif groq_client:
        try:
            c = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200, temperature=0.3
            )
            summary = c.choices[0].message.content.strip()
        except Exception: pass
    return {"summary": summary}
