from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# ─── ALL SAFE REQUEST MODELS ─────────────────────────────────────────────────
MAX_TEXT = 2048  # Max input chars for text/URL fields

class URLPayload(BaseModel):
    url: str = Field(..., max_length=MAX_TEXT)

class DomainPayload(BaseModel):
    domain: str = Field(..., max_length=512)

class HashPayload(BaseModel):
    hash: str = Field(..., max_length=128)

class PhonePayload(BaseModel):
    phone: str = Field(..., max_length=32)

class IPPayload(BaseModel):
    ip: str = Field(..., max_length=64)

class EmailPayload(BaseModel):
    email: str = Field(..., max_length=256)

class EmailHeaderPayload(BaseModel):
    raw_headers: str = Field("", max_length=MAX_TEXT)
    from_addr: str = ""
    subject: str = ""
    flags: List[Dict] = []
    auth: Dict[str, str] = {}

class JobScamPayload(BaseModel):
    text: str = Field(..., max_length=MAX_TEXT)

class UnifiedPayload(BaseModel):
    input_text: str = Field(..., max_length=MAX_TEXT)

class ChatMessage(BaseModel):
    role: str
    content: str = Field(..., max_length=MAX_TEXT)

class ChatPayload(BaseModel):
    messages: List[ChatMessage]
    model: str = "gemini"

class NewsSummarizePayload(BaseModel):
    title: str = Field(..., max_length=512)
    description: str = Field(..., max_length=MAX_TEXT)

class SaveReportPayload(BaseModel):
    scan_json: Dict[str, Any]

class CVESearchPayload(BaseModel):
    q: str = Field(..., max_length=256)
