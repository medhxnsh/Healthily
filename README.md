# Healthify

AI-powered blood report analysis. Upload a blood report (CSV, PDF, or image) and get instant plain-English summaries, anomaly detection, condition predictions, and risk assessments — all powered by XGBoost, Isolation Forest, and Groq LLM.

---

## Features

- **Report parsing** — CSV, PDF, and image uploads; extracts and normalises blood parameters
- **AI simplification** — converts raw values into plain-language summaries via Groq LLM
- **Z-score anomaly detection** — per-parameter scoring with age/sex-adjusted reference ranges
- **Isolation Forest detection** — multivariate ML anomaly scoring across 24 blood parameters
- **XGBoost classifier** — 13-class condition prediction with SMOTE balancing and calibrated probabilities
- **Rule-based risk engine** — weighted condition scoring from blood markers and symptoms
- **SHAP explanations** — top-5 feature contributions per prediction

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI, Pydantic v2 |
| ML | XGBoost, scikit-learn, SHAP, imbalanced-learn |
| LLM | Groq (llama-3.3-70b) |
| Parsing | pdfplumber, Pillow |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Runtime | Python 3.11+ / Node 18+ |

---

## Setup — Mac

### Step 1 — Prerequisites

Open Terminal and check you have the required tools:

```bash
python3 --version   # needs 3.11+
node --version      # needs 18+
git --version
```

If Python is missing: https://www.python.org/downloads/
If Node is missing: https://nodejs.org/

---

### Step 2 — Clone the repo

```bash
git clone https://github.com/manikapathak/healthify.git
cd healthify
```

---

### Step 3 — Create a Python virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal prompt.

---

### Step 4 — Install Python dependencies

```bash
pip install -r requirements.txt
```

---

### Step 5 — Set up environment variables

```bash
cp .env.example .env
```

Open `.env` in any text editor and fill in your API keys:

```
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

**Where to get the keys (both are free):**
- Groq: https://console.groq.com → API Keys → Create new key (starts with `gsk_`)
- Gemini: https://aistudio.google.com/apikey → Create API key

> **Important:** Never export these keys in your shell profile (`.zshrc`, `.bashrc`). Only put them in `.env`. Shell exports override `.env` and cause 401 errors.

---

### Step 6 — Train the ML models

The model files are not included in the repo. You need to train them once.

First download these datasets from Kaggle and place them in `data/kaggle/`:

| File | Download from |
|------|--------------|
| `diagnosed_cbc_data_v4.csv` | https://www.kaggle.com/datasets/ehababoelnaga/multiple-disease-prediction |
| `cbc information.xlsx` | https://www.kaggle.com/datasets/ehababoelnaga/multiple-disease-prediction |
| `diabetes.csv` | https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database |
| `kidney_disease.csv` | https://www.kaggle.com/datasets/mansoordaku/ckdisease |
| `indian_liver_patient.csv` | https://www.kaggle.com/datasets/uciml/indian-liver-patient-records |
| `thyroid_dataset.csv` | https://www.kaggle.com/datasets/yasserhessein/thyroid-disease-data |
| `heart.csv` | https://www.kaggle.com/datasets/fedesoriano/heart-failure-prediction |

Then run (takes ~2–3 minutes, uses max 2GB RAM):

```bash
python scripts/prepare_training_data.py
python scripts/train_isolation_forest.py
python scripts/prepare_classifier_data.py
python scripts/train_classifier.py
```

---

### Step 7 — Start the backend

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend running at: http://localhost:8000
API docs: http://localhost:8000/docs

---

### Step 8 — Start the frontend

Open a new terminal tab:

```bash
cd frontend-v2
npm install
npm run dev
```

Frontend running at: http://localhost:5174

---

## Setup — Windows

### Step 1 — Prerequisites

Download and install:
- Python 3.11+: https://www.python.org/downloads/ (**tick "Add Python to PATH"** during install)
- Node 18+: https://nodejs.org/
- Git: https://git-scm.com/download/win

Open **Command Prompt** or **PowerShell** and verify:

```cmd
python --version
node --version
git --version
```

---

### Step 2 — Clone the repo

```cmd
git clone https://github.com/manikapathak/healthify.git
cd healthify
```

---

### Step 3 — Create a Python virtual environment

```cmd
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` at the start of your prompt.

If you get a permissions error in PowerShell, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Step 4 — Install Python dependencies

```cmd
pip install -r requirements.txt
```

---

### Step 5 — Set up environment variables

```cmd
copy .env.example .env
```

Open `.env` in Notepad or VS Code and fill in your API keys:

```
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

**Where to get the keys (both are free):**
- Groq: https://console.groq.com → API Keys → Create new key (starts with `gsk_`)
- Gemini: https://aistudio.google.com/apikey → Create API key

> **Important:** Do not set these as Windows System Environment Variables (Control Panel → System → Environment Variables). Only keep them in `.env`. System env vars override `.env` and cause 401 errors.

---

### Step 6 — Train the ML models

Download the same Kaggle datasets listed in the Mac section above and place them in `data\kaggle\`.

Then run:

```cmd
python scripts\prepare_training_data.py
python scripts\train_isolation_forest.py
python scripts\prepare_classifier_data.py
python scripts\train_classifier.py
```

---

### Step 7 — Start the backend

```cmd
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend: http://localhost:8000
API docs: http://localhost:8000/docs

---

### Step 8 — Start the frontend

Open a new Command Prompt window:

```cmd
cd frontend-v2
npm install
npm run dev
```

Frontend: http://localhost:5174

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Groq API 401 Invalid API Key` | Wrong/expired key in `.env`, or key set in shell/system env | Check `.env` has the correct `gsk_...` key. Remove any `GROQ_API_KEY` from `.zshrc`/`.bashrc` (Mac) or System Env Variables (Windows) |
| `ModuleNotFoundError` | venv not activated | `source venv/bin/activate` (Mac) or `venv\Scripts\activate` (Windows) |
| `Port 8000 already in use` | Old server still running | Mac: `lsof -ti:8000 \| xargs kill -9` / Windows: `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` |
| `Model file not found` | Models not trained yet | Run the 4 training scripts in Step 6 |
| `npm: command not found` | Node not installed | Install from https://nodejs.org/ |
| `key looks wrong` error at startup | Key has wrong prefix (e.g. `ggsk_`) | Re-copy the key from console.groq.com carefully |

---

## API Overview

All responses use a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/reports/upload` | Upload CSV/PDF/image |
| POST | `/api/v1/analysis/zscore` | Z-score anomaly detection |
| POST | `/api/v1/analysis/isolation-forest` | Isolation Forest anomaly detection |
| POST | `/api/v1/analysis/predict` | XGBoost condition prediction |
| POST | `/api/v1/analysis/explain` | SHAP explanations |
| GET | `/api/v1/risk/symptoms` | List symptoms |
| POST | `/api/v1/risk/assess` | Rule-based risk scoring |

---

## Project Structure

```
healthify/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── api/v1/          # Route handlers
│   ├── core/            # Parsing, simplification, validation
│   └── ml/              # Models: classifier, IF, z-score, SHAP
├── frontend-v2/         # React + Vite frontend
├── scripts/             # Data prep + model training
├── data/                # Reference ranges, symptom maps
├── models/              # Trained .joblib files (not committed)
└── .env.example         # Copy this to .env and fill in your keys
```
