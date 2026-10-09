# BRANDTRACE

> **Tagline:** Follow the Identity. Find the Risk.  
> **Product Category:** Digital Risk Protection — Social & App Monitoring  
> **Architecture:** Decoupled Full-Stack Web Application (React + Vite, Node/Express, Python FastAPI, MongoDB)

---

## 1. Product Overview

BRANDTRACE is an enterprise-grade Digital Risk Protection (DRP) web application designed for organization security teams and digital threat analysts. It helps organizations:
* Register and govern official brand identities, logos, and trademark aliases.
* Establish an **Official Asset Registry** to exclude legitimate corporate accounts and prevent false positive alerts.
* Detect look-alike social profiles across Twitter/X, Instagram, LinkedIn, and Telegram.
* Uncover copycat mobile applications, package identifier typosquatting, and untrusted publisher listings.
* Execute an **explainable 100-point risk scoring algorithm** backed by RapidFuzz string comparison, homoglyph unmasking, and perceptual logo difference hashing (`dhash`).
* Manage auditable investigation workflows with mandatory justification notes for false-positive declarations.
* Export sanitized CSV threat briefings protected against spreadsheet formula injection (`CWE-1236`).

---

## 2. Technology Stack

* **Frontend:** React (v18), Vite, JavaScript (ES6+ JSX), React Router (v6), Tailwind CSS, Recharts, Lucide React, Axios.
* **Backend:** Node.js, Express.js (ES Modules), Mongoose ODM, JWT authentication, bcryptjs password hashing, Multer file upload handling.
* **Database:** MongoDB (supports local MongoDB and MongoDB Atlas).
* **Detection Service:** Python 3, FastAPI, Pydantic, Uvicorn, RapidFuzz, Pillow, ImageHash.
* **Testing:** Pytest (Python microservice), Node built-in test runner with Supertest (Backend API), Vitest & React Testing Library (Frontend).

---

## 3. Seed Credentials & Test Environment

A rich, deterministic dataset is pre-configured for instant demonstration:

* **Analyst Email:** `analyst@brandtrace.local`
* **Analyst Password:** `Analyst@1234`
* **Tenant Organization:** `Global Risk Corp`
* **Pre-seeded Brands:**
  1. **ApexPay Technologies Inc.** (Fintech, mobile wallet)
  2. **NovaCloud Systems International** (Enterprise cloud infrastructure)
  3. **AeroVanguard Cargo & Logistics Corp** (Global air freight)
* **Pre-seeded Datasets:** 12 Official Assets, 32 Social Candidates, 22 App Listings, and 30+ Evaluated Threat Findings across Low, Medium, High, and Critical bands.

---

## 4. Setup & Running the Application

### Prerequisites
* **Node.js:** v18.0.0 or later (v20+ recommended)
* **Python:** 3.10, 3.11, 3.12, or 3.13
* **MongoDB:** Local MongoDB Community Server running on `localhost:27017` or a MongoDB Atlas URI

---

### Step 1: Environment Setup
Copy the configuration template:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux / Bash:**
```bash
cp .env.example .env
```

---

### Step 2: Detection Service (Python FastAPI)

1. Navigate to `detection-service`:
   ```bash
   cd detection-service
   ```
2. Create and activate a Python virtual environment:
   * **Windows PowerShell:**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows Command Prompt (cmd):**
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```
   * **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI microservice on port 8001:
   ```bash
   uvicorn app.main:app --port 8001 --reload
   ```
   *Health endpoint available at:* `http://localhost:8001/health`

---

### Step 3: Backend Server (Node.js & Express)

1. Open a new terminal and navigate to `server`:
   ```bash
   cd server
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Seed the database with sample brands, candidates, and detections:
   ```bash
   npm run seed
   ```
4. Start the Express API server on port 5000:
   ```bash
   npm run dev
   ```
   *API root endpoint available at:* `http://localhost:5000/api/health`

---

### Step 4: Frontend Client (React & Vite)

1. Open a new terminal and navigate to `client`:
   ```bash
   cd client
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server on port 5173:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   Log in with `analyst@brandtrace.local` / `Analyst@1234`.

---

## 5. Running Automated Tests

All tests have been validated in the repository environment.

### A. Python Detection Tests (Pytest)
```bash
cd detection-service
.\venv\Scripts\pytest.exe -v
# or on mac/linux:
pytest -v
```
*Covers name spacing, homoglyph substitution, extra characters, official exclusions, and score boundaries.*

### B. Backend API & Security Tests
```bash
cd server
npm test
```
*Covers JWT auth, multi-tenant isolation, official exclusions, duplicate prevention, and CSV injection safety.*

### C. Frontend Production Build
```bash
cd client
npm run build
```
*Verifies all JSX components, Tailwind styles, and production bundle generation.*

---

## 6. Project Structure

```
brandtrace/
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── components/         # Badges, Modals, Shared UI
│   │   ├── context/            # AuthContext (JWT & Tenant state)
│   │   ├── layouts/            # Sidebar, Navbar, AppLayout
│   │   ├── pages/              # 10 Integrated Application Pages
│   │   ├── services/           # Axios API Client
│   │   ├── App.jsx             # React Router hierarchy
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                     # Backend API Server
│   ├── src/
│   │   ├── adapters/           # SampleDataAdapter, ImportAdapter, ExternalMock
│   │   ├── config/             # DB & Environment config
│   │   ├── controllers/        # REST route controllers
│   │   ├── middleware/         # Auth, ErrorHandler, Multer, RateLimiter
│   │   ├── models/             # Mongoose schemas (8 collections)
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # ScanEngine, DetectionClient, ReportService
│   │   └── utils/              # CSV sanitizer, normalizers
│   ├── tests/                  # API test suite
│   └── package.json
├── detection-service/          # Python Detection Microservice
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint
│   │   ├── name_matcher.py     # RapidFuzz & Homoglyph unmasking
│   │   ├── logo_matcher.py     # ImageHash difference hash (dhash)
│   │   ├── official_asset_checker.py # Exclusion gate
│   │   ├── risk_scorer.py      # 100-point explainable scoring
│   │   └── schemas.py          # Pydantic models
│   ├── tests/                  # Pytest test cases
│   └── requirements.txt
├── sample-data/                # Deterministic seed datasets
│   ├── brands.json
│   ├── official-assets.json
│   ├── social-candidates.json
│   └── app-candidates.json
├── docs/                       # Technical Documentation
│   ├── architecture.md         # System architecture & Mermaid diagrams
│   ├── demo-script.md          # 3-minute hackathon presentation script
│   ├── detection-methodology.md# Explainable scoring formula & limits
│   └── api-reference.md        # Comprehensive REST API reference
├── scripts/                    # Database Utilities
│   ├── seed.js                 # Seed database with sample records
│   ├── reset.js                # Safe database reset utility
│   └── package-zip.js          # Project ZIP packaging utility
├── package.json                # Root orchestration manifest
├── .env.example                # Template configuration
├── .gitignore
└── README.md
```

---

## 7. Troubleshooting

* **MongoDB Connection Refused (`ECONNREFUSED 127.0.0.1:27017`):**  
  Ensure MongoDB service is running:  
  *Windows:* Open Services (`services.msc`) and verify `MongoDB Server` is Running, or run `net start MongoDB`.  
  *Atlas:* Replace `MONGODB_URI` in `.env` with your MongoDB Atlas cluster URI.
* **Python Microservice Shows Degraded in Settings:**  
  Verify the FastAPI service is running on port 8001 (`http://127.0.0.1:8001/health`). If stopped, the backend automatically fails over to its embedded Node.js detection engine.
* **External Adapters Labeled as Unconfigured:**  
  By design, BRANDTRACE discloses when live platform API keys (`TWITTER_BEARER_TOKEN`, `GOOGLE_PLAY_API_KEY`) are not provided, falling back safely to deterministic DEMO DATA fixtures.
