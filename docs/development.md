# Sentinel Fusion Development & Operations Guide

## 1. Prerequisites
- Python 3.9+
- Node.js 18+ and npm
- Optional: Tesseract OCR (if local image OCR binary is desired)
- Optional: Ollama (if local LLM provider is desired)

---

## 2. Quick Local Start

### Step 1: Clone & Configure
```bash
cd sentinel-fusion
cp .env.example .env
```

### Step 2: Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run initial database seeder (populates Operation Northstar)
PYTHONPATH=. python app/seed.py

# Run tests
PYTHONPATH=. pytest -v

# Start FastAPI server
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at `http://localhost:8000/docs`.

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend workspace will be live at `http://localhost:3000`.

---

## 3. Seed Accounts
Pre-seeded demo credentials:
- **Lead Investigator:** `lead.investigator@sentinel.local` / `Password123!`
- **Senior Intelligence Analyst:** `analyst@sentinel.local` / `Password123!`
- **System Administrator:** `admin@sentinel.local` / `Password123!`

---

## 4. Docker Deployment
```bash
docker-compose up --build
```
This builds and launches both the backend container on port 8000 and the Next.js frontend container on port 3000.
