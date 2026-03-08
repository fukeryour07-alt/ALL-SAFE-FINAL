# 📋 ALL SAFE 2.0 — Task Division & Roadmap

> This document outlines the breakdown of responsibilities and the development roadmap for the ALL SAFE 2.0 platform.

---

## Phase 1: Planning & System Design
- **System Architecture:** Define the 3-tier architecture (React Frontend, FastAPI Backend, External APIs).
- **UI/UX Prototypes:** Design dark-theme wireframes, glassmorphism UI components, and the overall cyberpunk aesthetic.
- **Tech Stack Selection:** Finalize tools (React 19, Vite, FastAPI, SQLite, Gemini, VirusTotal).

## Phase 2: Frontend Development (React + Vite)
- **App Shell & Routing:** Build `App.jsx`, Navigation Bar, Footer, and Command Palette.
- **Core Views:**
  - **Scanner UI:** Build input forms and glassmorphism result cards.
  - **Dashboard/Live Map:** Integrate `react-globe.gl` and WebSocket listeners for real-time attack arcs.
  - **AI Chatbot UI:** Create scrolling conversation canvas and inline scan-result cards.
  - **Job Scam & Email Tools:** Build text input interfaces and severity rating displays.
- **Animations & CSS:** Implement Framer Motion transitions, custom scrollbars, glowing borders, and the global dark theme.

## Phase 3: Backend Development (Python FastAPI)
- **API Setup:** Initialize FastAPI router, CORS middleware, and Uvicorn server.
- **Threat Intelligence Integrations:** Integrate VirusTotal v3, AbuseIPDB, WhoIs, and ThreatFox via `httpx.AsyncClient`.
- **WebSocket Server:** Implement the continuous `Threat Loop` to broadcast global attack data to connected clients.
- **Database & Persistence:** Setup SQLite `allsafe.db` with tables for `scans` and `shared_reports`. Create logging logic.

## Phase 4: AI Engine Integration
- **Intent Router:** Build the NLP parser to determine if a user query requires an OSINT scan.
- **AI Models:** Integrate Google GenAI SDK (Gemini Flash) as primary and Groq Cloud (LLaMA 3.3) as fallback.
- **Failover Logic:** Implement the API key rotation and model fallback chain to ensure 99.9% uptime.
- **Analytics Parsing:** Feed raw VirusTotal JSON telemetry into Gemini for translating numeric risks into readable summaries.

## Phase 5: Testing, QA & Deployment
- **Unit Testing:** Validate Python API endpoints and OSINT error handling (rate limits).
- **UI Testing:** Verify React component responsiveness across desktop and mobile devices.
- **Security Audit:** Ensure `.env` protection, secure API key handling, and sanitization of user inputs.
- **Documentation:** Create README, System Design, Flow Diagrams, UI Wireframes, and RUN INSTRUCTIONS.

---

## 👥 Suggested Team Roles (If working in a team)

If you are working with a group, here is how the modules cleanly divide:

| Role | Responsibilities | Relevant Files |
| :--- | :--- | :--- |
| **Frontend Engineer** | React components, CSS (Glassmorphism), Globe.gl mapping, animations. | `frontend/src/components/*` |
| **Backend Engineer** | FastAPI routes, OSINT API integrations, WebSockets, DB operations. | `backend/main.py`, `backend/routers/*` |
| **AI/Data Engineer** | Gemini/Groq SDKs, Intent Parser, AI summary prompt engineering. | `backend/services/ai_service.py` |
| **UI/UX Designer** | Wireframing, flowchart creation, color palette definitions. | `docs/diagrams/*` |
