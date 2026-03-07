# ALL SAFE — Unified Cyber Defense & Threat Intelligence Platform

**ALL SAFE** is a futuristic, comprehensive cybersecurity web platform designed to provide a premium, dark-themed UI/UX with glassmorphism and neon accents. It offers a suite of advanced security utilities, threat intelligence, and a real-time live attack visualization.

## 🚀 Key Features

*   **🌐 Real-Time Live Attack Map:** Visualize global cyber attacks on a 3D Earth using `react-globe.gl` with dynamic animations.
*   **🔍 Core Scanning Modules:**
    *   **URL/Link Scanning** for malware and phishing.
    *   **File Upload Scanning** utilizing 70+ AV engines (via VirusTotal API).
    *   **Phone Number Scanning** for scam intelligence.
    *   **Domain Intelligence & Reputation** lookups.
*   **🔐 Cryptographic Utilities:**
    *   Hash Generation (SHA-256 / MD5).
    *   Base64 Encoder / Decoder.
    *   Data Encrypt / Decrypt Vault.
*   **🛡️ Security Operations Center (SOC):**
    *   Live Dashboard with real-time statistics.
    *   SOC Logs & Scan History tracking.
    *   Live Cyber News feed.
*   **🛠️ Extra Enhancements:**
    *   **Command Palette** for quick navigation (similar to Spotlight).
    *   **Password Strength Analyzer** to validate strong passwords.
    *   **Email Header Analyzer** to trace email origins.
    *   **Toast Notification System** for sleek UI alerts.
*   **📄 Reports:** Downloadable PDF threat reports and JSON raw view toggle.

---

## 💻 Tech Stack

### Frontend (React + Vite)
*   **Framework:** React 19 + Vite
*   **Styling & UI:** Custom CSS (Dark Theme, Glassmorphism, Neon UI)
*   **Animations:** Framer Motion, GSAP, Lenis (Smooth Scrolling)
*   **Visualizations:** React Globe GL (`react-globe.gl`)
*   **Icons:** Lucide React

### Backend (Python FastAPI)
*   **Framework:** FastAPI with Uvicorn
*   **Database:** SQLite
*   **Integration:** VirusTotal API v3 (for file and URL scanning), OSINT utilities.
*   **Utilities:** `python-dotenv`, `httpx`

---

## 🛠️ Installation & Setup Guide

### Prerequisites
*   **Python** 3.9+
*   **Node.js** 18+

### 1. Backend Setup (FastAPI)

1. Navigate to the `backend` directory:
   ```powershell
   cd backend
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate   # On Windows
   # source venv/bin/activate # On macOS/Linux
   ```
3. Install the dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Set up Environment Variables:
   Create a `.env` file inside the `backend` folder and add any necessary API keys (e.g., `VIRUSTOTAL_API_KEY=your_key`).
5. Run the FastAPI development server:
   ```powershell
   python main.py
   # OR: uvicorn main:app --reload
   ```
   **Backend URL:** `http://localhost:8000`
   **API Documentation (Swagger UI):** `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the `frontend` directory:
   ```powershell
   cd frontend
   ```
2. Install Node modules:
   ```powershell
   npm install
   ```
3. Run the Vite development server:
   ```powershell
   npm run dev
   ```
   **Frontend URL:** `http://localhost:5173`

---

## 🏗️ Project Structure

```text
NEXATHAN/
├── backend/                  # Python FastAPI application
│   ├── main.py               # Main entry point for the FastAPI server
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables (Add your API keys)
│   └── venv/                 # Python Virtual Environment
│
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components (UI, Map, Tools)
│   │   ├── App.jsx           # Main application view and routing
│   │   └── main.jsx          # React DOM entry point
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite bundler configuration
│
├── RUN_INSTRUCTIONS.md       # Quick start guide
└── README.md                 # Project documentation (this file)
```

## 🔒 Security Best Practices
- Never commit the `.env` file containing API keys to a public repository.
- Ensure CORS configurations in the backend `main.py` only allow trusted frontend domains in production.
- Keep dependencies updated to prevent vulnerabilities.
