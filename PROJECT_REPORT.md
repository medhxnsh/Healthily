# Healthify — Comprehensive Project Report

> **Version:** 0.1.0 | **Stack:** Python 3.11, FastAPI, scikit-learn, XGBoost, SHAP, React, Vite
> **Servers:** Backend → `http://127.0.0.1:8000` | Frontend → served at `/` from FastAPI

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [System Architecture](#3-system-architecture)
4. [Backend — Core Parsing Pipeline](#4-backend--core-parsing-pipeline)
   - 4.1 [CSV Parser](#41-csv-parser)
   - 4.2 [PDF Parser](#42-pdf-parser)
   - 4.3 [Image Parser (Vision AI)](#43-image-parser-vision-ai)
   - 4.4 [Validator](#44-validator)
   - 4.5 [Simplifier (LLM Narrative)](#45-simplifier-llm-narrative)
5. [Backend — ML & Analytics Pipeline](#5-backend--ml--analytics-pipeline)
   - 5.1 [Reference Ranges Database](#51-reference-ranges-database)
   - 5.2 [Phase 2 — Z-Score Anomaly Detector](#52-phase-2--z-score-anomaly-detector)
   - 5.3 [Phase 3 — Isolation Forest Anomaly Detector](#53-phase-3--isolation-forest-anomaly-detector)
   - 5.4 [Phase 4 — Rule-Based Risk Engine](#54-phase-4--rule-based-risk-engine)
   - 5.5 [Phase 5 — XGBoost Multi-Class Classifier](#55-phase-5--xgboost-multi-class-classifier)
   - 5.6 [Phase 6 — SHAP Explainability](#56-phase-6--shap-explainability)
6. [Model Training](#6-model-training)
   - 6.1 [Training Datasets](#61-training-datasets)
   - 6.2 [Data Preparation Pipeline](#62-data-preparation-pipeline)
   - 6.3 [Isolation Forest Training](#63-isolation-forest-training)
   - 6.4 [Classifier Training (XGBoost + SMOTE)](#64-classifier-training-xgboost--smote)
7. [Backend API Reference](#7-backend-api-reference)
   - 7.1 [POST /api/v1/reports/upload](#71-post-apiv1reportsupload)
   - 7.2 [POST /api/v1/analysis/zscore](#72-post-apiv1analysiszscore)
   - 7.3 [POST /api/v1/analysis/isolation-forest](#73-post-apiv1analysisisolation-forest)
   - 7.4 [POST /api/v1/analysis/compare](#74-post-apiv1analysiscompare)
   - 7.5 [POST /api/v1/analysis/predict](#75-post-apiv1analysispredict)
   - 7.6 [POST /api/v1/analysis/explain](#76-post-apiv1analysisexplain)
   - 7.7 [POST /api/v1/risk/assess](#77-post-apiv1riskassess)
   - 7.8 [GET /api/v1/risk/symptoms](#78-get-apiv1risksymptoms)
8. [Frontend Architecture](#8-frontend-architecture)
   - 8.1 [Technology Stack](#81-technology-stack)
   - 8.2 [Application Pages & Flow](#82-application-pages--flow)
   - 8.3 [API Client Layer](#83-api-client-layer)
   - 8.4 [Design System](#84-design-system)
9. [Data Layer](#9-data-layer)
10. [Configuration & Environment](#10-configuration--environment)
11. [Running Locally](#11-running-locally)
12. [Key Technical Decisions](#12-key-technical-decisions)
13. [Conditions & Diseases Supported](#13-conditions--diseases-supported)
14. [Safety & Medical Disclaimer System](#14-safety--medical-disclaimer-system)

---

## 1. Project Overview

**Healthify** is a full-stack blood report analysis system designed to translate clinical laboratory data into actionable, patient-friendly insights. It accepts blood reports in multiple formats (images, PDFs, CSV), extracts and normalises all recognised parameters, and runs them through a multi-layer ML analysis pipeline to detect anomalies, predict disease risk, and generate natural-language explanations.

### Goals

- Allow any user to upload a blood report and instantly understand what it means.
- Apply clinical-grade statistical analysis (Z-scores, reference ranges with age/sex stratification).
- Apply unsupervised ML (Isolation Forest) for holistic pattern anomaly detection.
- Apply supervised ML (XGBoost trained on 5 real Kaggle datasets) for disease classification.
- Provide SHAP-based feature attribution so users can understand *why* the model flagged a condition.
- Generate plain-English narrative summaries via an LLM (Groq / Llama).
- Flag critical values and request immediate medical attention where warranted.

### What It Is Not

Healthify does **not** diagnose, prescribe, or replace medical advice. All outputs include a mandatory disclaimer. It is an informational tool intended to help users prepare informed conversations with their doctors.

---

## 2. Repository Structure

```
Healthify/
├── backend/                  # FastAPI application
│   ├── main.py               # App factory + CORS + SPA serving
│   ├── config.py             # Pydantic-settings config (reads .env)
│   ├── api/
│   │   ├── schemas/          # Pydantic request/response models
│   │   └── v1/
│   │       ├── router.py     # Aggregates all sub-routers
│   │       ├── reports.py    # File upload endpoint
│   │       ├── analysis.py   # Z-score, IF, predict, explain endpoints
│   │       ├── risk.py       # Risk assessment + symptom list endpoints
│   │       └── health.py     # Health check endpoint
│   ├── core/
│   │   ├── parser.py         # CSV parser + canonical name alias map
│   │   ├── pdf_parser.py     # PDF table & text extraction (pdfplumber)
│   │   ├── image_parser.py   # Vision LLM extraction (Groq / Llama-4-Scout)
│   │   ├── validator.py      # Physical plausibility validation
│   │   ├── simplifier.py     # LLM plain-English interpretation (Groq / Llama-3.3-70b)
│   │   └── disclaimer.py     # Dynamic medical disclaimer generator
│   └── ml/
│       ├── reference_ranges.py   # Age/sex-stratified reference range DB lookup
│       ├── zscore_detector.py    # Z-score anomaly detection (Phase 2)
│       ├── isolation_forest.py   # Isolation Forest scoring (Phase 3)
│       ├── risk_engine.py        # Rule-based risk scoring (Phase 4)
│       ├── classifier.py         # XGBoost multi-class classifier (Phase 5)
│       └── explainer.py          # SHAP feature attribution (Phase 6)
├── scripts/
│   ├── prepare_training_data.py      # Prepares IF training data (NHANES)
│   ├── prepare_classifier_data.py    # Merges 5 Kaggle datasets → classifier CSV
│   ├── merge_hcv_data.py             # Merges HCV auxiliary data
│   ├── train_isolation_forest.py     # Trains & saves IsolationForest artifact
│   └── train_classifier.py           # Trains & saves XGBoost artifact
├── models/
│   ├── isolation_forest.joblib  # Trained IF model + scaler + feature metadata (~942 KB)
│   └── classifier.joblib        # Trained XGBoost + scaler + class list (~2.3 MB)
├── data/
│   ├── reference_ranges.json      # Clinical reference ranges database
│   ├── symptom_condition_map.json # Condition → blood_markers + symptoms knowledge base
│   ├── safety_conditions.json     # Critical value thresholds for emergency flagging
│   ├── training_data.csv          # Processed IF training data
│   ├── classifier_training_data.csv # Merged classifier training data + ratio features
│   └── kaggle/                    # Raw Kaggle datasets (5 files)
├── frontend/                  # Built React/Vite SPA (served by FastAPI)
│   └── dist/                  # Production build artifacts
├── pyproject.toml             # Python packaging + dev dependencies
├── requirements.txt           # Pip install list
└── .env                       # API keys (gitignored)
```

---

## 3. System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                 │
│  React SPA (frontend/dist)  served from FastAPI at :8000              │
│  Pages: Upload → Report → Insights                                    │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │ HTTP (fetch API)
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (:8000)                             │
│                                                                       │
│  /api/v1/reports/upload  ──►  Parsers ──►  Validator ──►  Simplifier │
│                                                                       │
│  /api/v1/analysis/*      ──►  ML Pipeline:                            │
│    ├── /zscore               Z-Score Detector (statistical)           │
│    ├── /isolation-forest     Isolation Forest (unsupervised ML)       │
│    ├── /compare              Side-by-side comparison                  │
│    ├── /predict              XGBoost Classifier + Rule Engine         │
│    └── /explain              SHAP Feature Attribution                 │
│                                                                       │
│  /api/v1/risk/*          ──►  Risk Engine (knowledge base)            │
│    ├── /assess               Symptom + blood marker scoring           │
│    └── /symptoms             List all known symptoms                  │
└───────────────┬───────────────────────────────────────────────────────┘
                │
       ┌────────┴────────┐
       │                 │
  ┌────▼─────┐    ┌──────▼──────────────────────────────────┐
  │ Groq API │    │ Trained Models (local .joblib)           │
  │ Llama-4  │    │  • isolation_forest.joblib (~942 KB)    │
  │  (image) │    │  • classifier.joblib (~2.3 MB)          │
  │ Llama-70b│    └──────────────────────────────────────────┘
  │ (text)   │
  └──────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| FastAPI serves the built SPA directly | Eliminates cross-origin complexity; single deployment unit |
| All ML models loaded with `@lru_cache` | Models are loaded once per process, never on each request |
| Stateless ML modules | All ML functions are pure — no shared mutable state |
| Pydantic v2 for all I/O schemas | Compile-time validation, automatic OpenAPI docs |
| Groq for LLM calls | Free-tier access to Llama 3.3-70b and Llama-4-Scout with vision |
| joblib artifacts | Compact, fast serialization for numpy arrays and sklearn objects |

---

## 4. Backend — Core Parsing Pipeline

Every uploaded file goes through the same normalisation pipeline before any ML analysis occurs.

### 4.1 CSV Parser

**File:** `backend/core/parser.py`

Handles two CSV layouts automatically:

**Multi-row layout** (most lab exports):
```
Test Name  | Value  | Unit
Hemoglobin | 14.5   | g/dL
WBC        | 7200   | /uL
```

**Single-row layout** (spreadsheet-style):
```
Hemoglobin | WBC  | Platelets
14.5       | 7200 | 250000
```

**Canonical Name Normalisation:** The parser maintains an alias map of 38 recognised blood parameters, each with dozens of synonyms. For example, `hemoglobin` is also recognised as `Hb`, `HGB`, `haemoglobin`. Fuzzy word-boundary matching (`re.search(r'\b...\b')`) is used as a fallback to catch partial matches.

**Auto-scaling:** Some lab reports use shorthand units (e.g., `6.5` for WBC meaning 6,500 /uL). The parser detects these cases:
- WBC: if value < 200 → multiply ×1000
- Platelets: if value < 2000 → multiply ×1000
- RBC: if value > 10,000 → divide ÷1,000,000

### 4.2 PDF Parser

**File:** `backend/core/pdf_parser.py` | **Library:** `pdfplumber`

Strategy:
1. **Table extraction** (primary): Iterates over all pages and extracts all tables. Auto-detects column layout from header keywords (test, parameter, analyte, value, result, unit). Falls back to positional guessing (col 0 = name, col 1 = value).
2. **Text line extraction** (fallback): If table extraction yields nothing, raw text is extracted and a regex pattern matches lines like `Hemoglobin   14.5   g/dL`.

> Note: Scanned PDFs are handled by converting to image and using the image parser instead.

### 4.3 Image Parser (Vision AI)

**File:** `backend/core/image_parser.py` | **Model:** `meta-llama/llama-4-scout-17b-16e-instruct` via Groq

Accepts JPG, JPEG, PNG, WEBP images. Flow:

1. Image bytes → Base64 encoded
2. Sent to Groq's OpenAI-compatible endpoint with a structured system prompt instructing the model to return **only** a raw JSON array
3. Model response is stripped of any markdown code fences and parsed
4. Each extracted item is normalised through the same alias map as the CSV parser

**Supported MIME types:** `image/jpeg`, `image/png`, `image/webp`

The system prompt explicitly forbids explanations, summaries, or any non-JSON output. A fallback regex strips markdown code fences in case the model wraps the output anyway.

### 4.4 Validator

**File:** `backend/core/validator.py`

After parsing, every parameter is checked against physical plausibility limits before analysis. For example:
- Hemoglobin: 0–25 g/dL
- WBC: 0–500,000 /µL
- HbA1c: 0–20%

Parameters that fall outside their physical limits are removed from the analysis to prevent ML models from being influenced by data entry errors or unit mismatches.

### 4.5 Simplifier (LLM Narrative)

**File:** `backend/core/simplifier.py` | **Model:** `llama-3.3-70b-versatile` via Groq

After successful parsing and reference range lookup, each validated parameter is sent to Llama 3.3-70b with a structured prompt that includes the parameter value, unit, status (low/normal/high), and reference range. The model generates a flowing, plain-English explanation suitable for a non-medical audience.

**Design constraints enforced via system prompt:**
- No bullet points, no markdown, no em dashes, no emojis
- Clinical but accessible tone
- No diagnoses, no medication recommendations
- Must include advisory sentence for out-of-range values
- Fixed concluding disclaimer sentence

**Caching:** Results are cached in-memory using a SHA-256 hash of the parameter inputs. Identical uploads return instantly from cache.

---

## 5. Backend — ML & Analytics Pipeline

The pipeline has 6 phases, each layered on the previous.

### 5.1 Reference Ranges Database

**File:** `data/reference_ranges.json` | **Loaded by:** `backend/ml/reference_ranges.py`

A JSON database of clinical reference ranges for 38 blood parameters, stratified by:
- Age group: `child` (<18), `adult_male`, `adult_female`, `elderly` (≥65)
- Each entry has: `low`, `high`, `unit`, `source`, `critical_low`, `critical_high`

Fallback chain: exact group → adult_male → adult_female → first available

Critical low/high thresholds trigger the emergency safety layer regardless of ML results.

### 5.2 Phase 2 — Z-Score Anomaly Detector

**File:** `backend/ml/zscore_detector.py`

For each recognised parameter, computes a Z-score relative to the age/sex-specific reference range:

```
mean = (ref_high + ref_low) / 2
std  = (ref_high - ref_low) / 4    ← assumes 95% of healthy values within range
z    = (value - mean) / std
```

**Severity scale:**

| |z| range | Severity |
|---|---|
| < 1.5 | Normal |
| 1.5 – 2.0 | Borderline |
| 2.0 – 3.0 | Moderate |
| ≥ 3.0 | Severe |

Output is a `ZScoreResult` containing:
- `scores`: dict mapping parameter name → `ParameterScore` (value, z_score, status, severity, is_critical)
- `summary`: total, anomaly_count, severe_count, has_critical

### 5.3 Phase 3 — Isolation Forest Anomaly Detector

**File:** `backend/ml/isolation_forest.py` | **Artifact:** `models/isolation_forest.joblib`

An unsupervised anomaly detection model trained on healthy blood panel data (NHANES + other sources). Rather than checking parameters individually, it evaluates the **holistic pattern** of all blood values together.

**How it works:**
1. The patient's parameters are mapped to the model's fixed feature vector (missing features filled with training-set medians)
2. Features are scaled with the same `StandardScaler` used during training
3. `decision_function()` returns a score: positive = inlier (normal), negative = anomaly
4. Threshold: `-0.1` — scores below this are classified as anomalous

**Confidence levels:**
- `high`: ≥50% of expected features present in the report
- `medium`: 20–50% present
- `low`: <20% present

Output: `IFResult` (anomaly_score, is_anomalous, confidence)

### 5.4 Phase 4 — Rule-Based Risk Engine

**File:** `backend/ml/risk_engine.py` | **Knowledge base:** `data/symptom_condition_map.json`

A weighted scoring engine that combines two independent signals:

```
risk_score = 0.6 × blood_score + 0.4 × symptom_score
risk_percent = min(round(risk_score × 100), 100)
```

**Blood score** for each condition: sum of marker weights where the anomaly direction matches the condition's expected direction (e.g., for iron deficiency anemia: hemoglobin low ×0.30 + ferritin low ×0.25 + ...).

**Symptom score:** sum of weights for user-selected symptoms that match the condition's symptom map, normalised to [0,1].

**Safety layer:** `data/safety_conditions.json` defines hard thresholds (e.g., hemoglobin < 7, glucose > 400). If any raw value crosses a threshold, `requires_immediate_attention=True` is set regardless of the risk score.

**11 conditions modelled in the knowledge base:** Iron Deficiency Anemia, Type 2 Diabetes, Prediabetes, Hypothyroidism, Hyperthyroidism, Vitamin D Deficiency, Vitamin B12 Deficiency, High Cholesterol, Liver Disease, Chronic Kidney Disease, Gout.

### 5.5 Phase 5 — XGBoost Multi-Class Classifier

**File:** `backend/ml/classifier.py` | **Artifact:** `models/classifier.joblib`

A supervised multi-class classification model trained on 5 real Kaggle clinical datasets. Predicts probability of 13 distinct conditions from blood parameters.

**13 classes:**
1. Healthy
2. Iron Deficiency Anemia
3. Normocytic Hypochromic Anemia
4. Normocytic Normochromic Anemia
5. Microcytic Anemia
6. Macrocytic Anemia
7. Thrombocytopenia
8. Leukemia
9. Type 2 Diabetes
10. Chronic Kidney Disease
11. Liver Disease
12. Hypothyroidism
13. Heart Disease

**25 input features (21 base + 4 derived ratios):**

| Feature Group | Features |
|---|---|
| CBC (Complete Blood Count) | hemoglobin, rbc, wbc, platelets, hematocrit, mcv, mch, mchc |
| Metabolic | glucose, hba1c |
| Renal | creatinine, bun |
| Hepatic | alt, ast, alp, bilirubin_total, albumin |
| Thyroid | tsh, t3, t4 |
| Lipid | cholesterol |
| Derived Ratios | bun_creatinine_ratio, ast_alt_ratio, mch_mcv_ratio, hemoglobin_rbc_ratio |

**Feature vector construction:** Missing features are filled with clinically validated healthy-midpoint defaults (not random or zero) so partial panels produce meaningful predictions.

Output: `ClassifierResult` (top_condition, top_probability, all class probabilities sorted descending)

### 5.6 Phase 6 — SHAP Explainability

**File:** `backend/ml/explainer.py` | **Library:** SHAP 0.45+

Uses `shap.LinearExplainer` on the underlying XGBoost model to compute per-feature SHAP values for a specific target condition class.

**What SHAP values tell us:** Each feature's contribution to the prediction score, with direction (`increases_risk` or `decreases_risk`) and a percentage of total attribution.

**Output:** Top 5 features sorted by |SHAP value| descending, with:
- Feature name
- Raw SHAP contribution
- Direction (increases/decreases risk)
- Percentage of total absolute contribution (e.g., "32%")

If no specific condition is requested, the SHAP explanation defaults to the top predicted class.

---

## 6. Model Training

### 6.1 Training Datasets

Five Kaggle clinical datasets were used, each contributing complementary panels:

| Dataset | File | Rows | Conditions | Features |
|---|---|---|---|---|
| CBC Blood Count | `diagnosed_cbc_data_v4.csv` | 1,281 | 9 (Iron Deficiency Anemia, Thrombocytopenia, Leukemia, etc.) | HGB, HCT, RBC, WBC, PLT, MCV, MCH, MCHC |
| Pima Diabetes | `diabetes.csv` | 768 | Type 2 Diabetes, Healthy | Glucose |
| Kidney Disease | `kidney_disease.csv` | 400 | Chronic Kidney Disease, Healthy | BUN, Creatinine, Hgb, WBC, RBC |
| Indian Liver Patient | `indian_liver_patient.csv` | 583 | Liver Disease, Healthy | Bilirubin, ALT, AST, ALP, Albumin |
| Thyroid Dataset | `cleaned_dataset_Thyroid1.csv` | 3,771 | Hypothyroidism, Healthy | TSH, T3, T4 |

**Total training rows (after merging):** ~6,800 with significant class imbalance, addressed by SMOTE.

### 6.2 Data Preparation Pipeline

**Script:** `scripts/prepare_classifier_data.py`

Steps:
1. Load each dataset with its dedicated loader function
2. Map raw column names → canonical parameter names
3. Map raw condition labels → canonical condition strings
4. Reindex all datasets to the full 21-column feature matrix (missing features → NaN)
5. Apply physical limits (clip outliers to physiological plausible ranges)
6. Drop rows where ALL features are NaN
7. Compute 4 derived ratio features:
   - `bun_creatinine_ratio = bun / creatinine`
   - `ast_alt_ratio = ast / alt`
   - `mch_mcv_ratio = mch / mcv`
   - `hemoglobin_rbc_ratio = hemoglobin / rbc`
8. Output: `data/classifier_training_data.csv` (25 features + label column)

For the Isolation Forest, `scripts/prepare_training_data.py` uses NHANES (National Health and Nutrition Examination Survey) data from `data/DEMO_J.XPT` and other sources to build a healthy-cohort reference dataset.

### 6.3 Isolation Forest Training

**Script:** `scripts/train_isolation_forest.py`

```python
IsolationForest(
    n_estimators=200,
    contamination=0.05,   # assume ~5% of training rows are anomalous
    max_samples="auto",
    random_state=42,
    n_jobs=-1,
)
```

Steps:
1. Load `data/training_data.csv`
2. Select features with ≥50 non-null values (coverage filter)
3. Compute column-median midpoints for inference-time imputation
4. Fill NaN with midpoints, fit `StandardScaler`
5. Train IsolationForest on scaled data
6. Evaluate: prints decision function range and predicted anomaly fraction
7. Save artifact: `{model, scaler, feature_names, midpoints}` → `models/isolation_forest.joblib`

**Artifact size:** ~942 KB

### 6.4 Classifier Training (XGBoost + SMOTE)

**Script:** `scripts/train_classifier.py`

**Step 1 — SMOTE oversampling:**
Class imbalance is severe (e.g., Leukemia has far fewer rows than Healthy). SMOTE is applied to oversample minority classes to at least 150 rows. To avoid NaN propagation, medians are used as temporary imputation just for SMOTE, then removed.

```python
SMOTE(
    sampling_strategy={cls: min(200, max(cnt, 150)) for cls with cnt < 150},
    k_neighbors=3,
    random_state=42,
)
```

**Step 2 — XGBoost training:**
```python
XGBClassifier(
    objective="multi:softprob",
    num_class=13,
    eval_metric="mlogloss",
    n_estimators=150,
    max_depth=4,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    random_state=42,
    n_jobs=1,            # single thread to prevent memory explosion
    tree_method="hist",
)
```

> **Why not CalibratedClassifierCV?** XGBoost's `multi:softprob` already produces calibrated probabilities. Wrapping with CalibratedClassifierCV would break SHAP compatibility, as `LinearExplainer` requires direct access to model coefficients.

**Step 3 — Save artifact:**
`{model, scaler, feature_names, classes, midpoints}` → `models/classifier.joblib`

**Artifact size:** ~2.3 MB

---

## 7. Backend API Reference

All endpoints are versioned under `/api/v1`. All responses use a consistent envelope:

```json
{
  "success": true | false,
  "data": { ... },
  "error": null | "error message",
  "disclaimer": "medical disclaimer text"
}
```

### 7.1 POST /api/v1/reports/upload

Upload a blood report file for parsing and initial analysis.

**Request:** `multipart/form-data`
- `file`: Blood report (CSV, PDF, JPG, JPEG, PNG, WEBP; max 10 MB)
- `age`: Integer (0–120, default 30)
- `sex`: String (`male` | `female`, default `male`)

**Processing chain:**
1. Detect file type by extension
2. Route to CSV / PDF / Image parser
3. Run physical validator — remove implausible values
4. Look up age/sex-specific reference ranges
5. Classify each parameter: low / normal / high
6. Flag critical values
7. Async call to Groq/Llama-3.3-70b for plain-English simplification
8. Return full response

**Response data:**
```json
{
  "parameters": [
    {
      "name": "hemoglobin",
      "raw_name": "Hb",
      "value": 10.2,
      "unit": "g/dL",
      "status": "low",
      "is_critical": false,
      "ref_low": 13.5,
      "ref_high": 17.5,
      "ref_unit": "g/dL"
    }
  ],
  "unrecognized": ["ESR", "CRP"],
  "validation_errors": [],
  "simplification": "Hemoglobin measures the protein in red blood cells...",
  "parameter_count": 12,
  "anomaly_count": 3
}
```

### 7.2 POST /api/v1/analysis/zscore

Run Z-score anomaly detection on pre-extracted parameters.

**Request body:**
```json
{
  "parameters": [{"name": "hemoglobin", "value": 10.2, "unit": "g/dL"}],
  "age": 35,
  "sex": "male"
}
```

**Response data:** Per-parameter Z-scores, severity classifications, and summary counts.

### 7.3 POST /api/v1/analysis/isolation-forest

Run Isolation Forest holistic anomaly detection.

**Request body:** Same as /zscore

**Response data:**
```json
{
  "anomaly_score": -0.15,
  "is_anomalous": true,
  "confidence": "high"
}
```

### 7.4 POST /api/v1/analysis/compare

Run both Z-score and Isolation Forest simultaneously for comparison. Includes `agreement` field indicating whether both methods reach the same conclusion.

### 7.5 POST /api/v1/analysis/predict

Run XGBoost classifier + Rule-based risk engine side-by-side.

**Additional request fields:** `symptoms: list[str]` (optional)

**Response data:**
```json
{
  "ml_prediction": {
    "top_condition": "iron_deficiency_anemia",
    "top_probability": 0.73,
    "probabilities": [...]
  },
  "rule_based": {
    "top_condition": "iron_deficiency_anemia",
    "risk_percent": 68
  },
  "agreement": true,
  "confidence": "high"
}
```

### 7.6 POST /api/v1/analysis/explain

Run SHAP feature attribution for the top (or specified) condition.

**Additional request fields:** `condition: str | null` (optional canonical condition name)

**Response data:**
```json
{
  "prediction": { ... },
  "explained_condition": "iron_deficiency_anemia",
  "explanations": [
    {
      "feature": "hemoglobin",
      "contribution": -0.42,
      "direction": "increases_risk",
      "percentage": "34%"
    }
  ]
}
```

### 7.7 POST /api/v1/risk/assess

Rule-based risk scoring combining blood markers and user-reported symptoms.

**Request body:**
```json
{
  "parameters": [...],
  "age": 35,
  "sex": "male",
  "symptoms": ["fatigue", "dizziness"]
}
```

**Response data:** All conditions sorted by risk_percent descending, with lifestyle tips for non-critical conditions.

### 7.8 GET /api/v1/risk/symptoms

Returns a sorted list of all symptom names understood by the risk engine. Use these exact strings in the `symptoms` field of `/risk/assess`.

---

## 8. Frontend Architecture

### 8.1 Technology Stack

| Technology | Version | Role |
|---|---|---|
| React | 19.x | UI component framework |
| TypeScript | 5.5 | Type safety |
| Vite | 6.x | Build tool & dev server |
| (built & served statically) | — | Production: served via FastAPI |

> **Important:** The production frontend (`frontend/dist`) is served directly by the FastAPI backend at `http://localhost:8000`. No separate frontend server is needed. All API calls use relative paths (`/api/v1/...`), so they automatically hit the correct backend.

### 8.2 Application Pages & Flow

The app is a single-page application with 4 views managed by a state machine:

```
loader → upload → report → insights
```

**1. Loader Screen (`x` component)**
- Animated loading screen with an SVG botanical illustration
- Progress ring animation that fills over ~8 seconds
- Transitions to the Upload page automatically on completion

**2. Upload Page (`S` component)**
- Drag-and-drop or file browser for report upload
- Personal profile form: age, sex, weight
- Client-side validation before submission
- Simultaneous API calls on submit:
  - `POST /api/v1/reports/upload` — parse + simplify
  - `POST /api/v1/analysis/compare` — Z-score + IF comparison
  - `POST /api/v1/risk/assess` — rule-based risk scoring
- Inline loading state with status messages

**3. Report Page (`C` component)**
- Sticky navigation bar with tab switching
- **Five analysis tabs:**
  - **Narrative** — LLM-generated plain-English summary
  - **Parameters** — Table of all extracted parameters with reference ranges and status badges
  - **Z-Score** — Visual Z-score breakdown with per-parameter severity bars and Isolation Forest card
  - **Risk** — Condition risk bars, lifestyle tips, doctor referral flags
  - **ML Insights** — Symptom selector, XGBoost probability bars, SHAP waterfall (run on demand)
- Summary statistics banner: parameter count, anomaly count, IF agreement, IF score

**4. Insights Page (`te` component)**
- Magazine-style layout with featured top anomaly and expandable cards for remaining anomalies
- Category icons (HEMATOLOGY, METABOLIC, LIPID, RENAL, HEPATIC, THYROID, etc.)
- Z-score, value, and reference range visible in expanded view

### 8.3 API Client Layer

A clean client module (`m` object in the built bundle) handles all API calls:

```typescript
const m = {
  upload(file, age, sex) → Promise<APIResponse<UploadReportResponse>>,
  compare(params, age, sex) → Promise<APIResponse<CompareResultOut>>,
  riskAssess(params, age, sex, symptoms) → Promise<APIResponse<RiskResultOut>>,
  predict(params, age, sex, symptoms) → Promise<APIResponse<PredictResultOut>>,
  explain(params, age, sex, symptoms, condition?) → Promise<APIResponse<ExplainResultOut>>,
  symptoms() → Promise<APIResponse<string[]>>,
}
```

Base URL is `"/api/v1"` (relative), which resolves correctly whether accessed via the FastAPI-served build at `localhost:8000` or a reverse proxy.

### 8.4 Design System

The frontend uses an editorial, botanical-inspired design aesthetic:

- **Color palette:** Warm off-whites (`#f0ebe0`), deep forest greens (`#2a3a2a`), muted earth tones
- **Typography:** Georgia (serif) for headings and body; creates a clinical journal feel
- **Cards:** Frosted glass-like with `rgba` fills and subtle borders
- **Status badges:** Color-coded (red = critical/high, blue = low, green = normal)
- **Severity indicators:** 4-dot visual bar (green → yellow → orange → red)
- **Animations:** `fadeUp` keyframe, `spin` loader, ring pulse

---

## 9. Data Layer

### Reference Ranges (`data/reference_ranges.json`)

38 parameters with clinical reference ranges from established medical literature. Each entry:

```json
"hemoglobin": {
  "unit": "g/dL",
  "source": "WHO",
  "critical_low": 7.0,
  "critical_high": 20.0,
  "ranges": {
    "adult_male":   {"low": 13.5, "high": 17.5},
    "adult_female": {"low": 12.0, "high": 15.5},
    "child":        {"low": 11.0, "high": 16.0},
    "elderly":      {"low": 11.5, "high": 17.0}
  }
}
```

### Safety Conditions (`data/safety_conditions.json`)

Hard-coded critical value thresholds. Any match → `requires_immediate_attention=True`:
- Hemoglobin < 7.0 g/dL
- Glucose > 400 mg/dL or < 40 mg/dL
- Platelets < 20,000 /µL
- Sodium > 155 mmol/L or < 120 mmol/L
- Potassium > 6.5 mmol/L
- etc.

### Symptom-Condition Knowledge Base (`data/symptom_condition_map.json`)

11 conditions, each with:
- Blood marker directions and weights (sum to 1.0)
- Symptom weights (sum to 1.0)
- Severity classification
- `requires_doctor` flag
- Lifestyle tips (for mild, non-doctor conditions)

---

## 10. Configuration & Environment

Configuration is managed via `pydantic-settings` reading from `.env`:

| Variable | Purpose | Required? |
|---|---|---|
| `GROQ_API_KEY` | For image parsing (Llama-4-Scout) and text simplification (Llama-3.3-70b) | Yes |
| `GEMINI_API_KEY` | Reserved for future use | No |
| `DATABASE_URL` | SQLite async URL (not actively used in current version) | No |
| `DEBUG` | FastAPI debug mode | No |
| `APP_VERSION` | Reported in logs and API metadata | No |

The config has a validation guard: Groq API keys must start with `gsk_`. Environment variable override detection handles edge cases where shell env vars shadow `.env` file values.

---

## 11. Running Locally

### Prerequisites

- Python 3.11+
- Node.js 18+ (only needed if rebuilding the frontend)
- A Groq API key from `console.groq.com`

### Setup

```bash
# 1. Clone and enter the project
cd /Users/medhanshvibhu/Developer/Healthify

# 2. Install Python dependencies
pip install -e ".[dev]"

# 3. Set environment variables
cp .env.example .env
# Edit .env: add GROQ_API_KEY=gsk_...

# 4. (Already done) Models must exist at:
#    models/isolation_forest.joblib
#    models/classifier.joblib
#
# If they don't exist, run:
#    python scripts/prepare_training_data.py
#    python scripts/prepare_classifier_data.py
#    python scripts/train_isolation_forest.py
#    python scripts/train_classifier.py
```

### Running

```bash
# Start backend (also serves the frontend at http://localhost:8000)
uvicorn backend.main:app --reload

# The frontend at frontend/dist is automatically served by FastAPI
# Open: http://localhost:8000
```

> **Note:** The `frontend/dist` directory already contains a pre-built production build. Uploading and using the app works entirely through `http://localhost:8000`. No separate frontend server is needed.

### Rebuilding the Frontend (if needed)

```bash
cd frontend
npm install
npm run build
# Output goes to frontend/dist/ which FastAPI serves
```

---

## 12. Key Technical Decisions

### Why XGBoost instead of Logistic Regression?

An earlier version used `LogisticRegression`. XGBoost was chosen for:
1. **Native NaN handling** — XGBoost learns optimal split directions for missing values during training, making it naturally robust to partial blood panels
2. **Non-linear interactions** — Captures composite biomarker patterns (e.g., MCV + MCH + RBC jointly indicating microcytic anemia) that logistic regression cannot
3. **`multi:softprob` output** — Produces well-calibrated probabilities without a separate calibration wrapper

### Why SMOTE instead of class weighting?

Class weighting produced poor recall on minority classes (Leukemia, Macrocytic Anemia) in validation. SMOTE oversampling to at least 150 rows per minority class produced significantly better precision-recall balance.

### Why two separate anomaly methods (Z-score + Isolation Forest)?

- **Z-score:** Interpretable, parameter-by-parameter, works with published reference ranges, explains *which specific value* is abnormal
- **Isolation Forest:** Holistic, catches abnormal *combinations* that might not flag individually, unsupervised (no labels needed)
- **Agreement field:** Provides a confidence signal — when both methods agree, the finding is more reliable

### Why `lru_cache` on model loading?

Models are large (942 KB + 2.3 MB) and contain numpy arrays. Loading them from disk on every request would add 50–200ms latency and create excessive GC pressure. `@lru_cache(maxsize=1)` loads them once into process memory and keeps them there.

### Why serve the frontend from FastAPI?

- **No CORS issues**: All `/api/v1/...` calls are same-origin
- **Single deployment**: One process, one port, one service to manage
- **Production-ready**: Works with Railway, Render, or any single-dyno PaaS directly via `Procfile: web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

---

## 13. Conditions & Diseases Supported

### ML Classifier (13 classes)

| Condition | Panel Used |
|---|---|
| Healthy | All |
| Iron Deficiency Anemia | CBC + Iron markers |
| Normocytic Hypochromic Anemia | CBC |
| Normocytic Normochromic Anemia | CBC |
| Microcytic Anemia | CBC |
| Macrocytic Anemia | CBC |
| Thrombocytopenia | CBC (Platelets) |
| Leukemia | CBC (WBC + Platelets) |
| Type 2 Diabetes | Glucose, HbA1c |
| Chronic Kidney Disease | BUN, Creatinine, RBC |
| Liver Disease | ALT, AST, ALP, Bilirubin, Albumin |
| Hypothyroidism | TSH, T3, T4 |
| Heart Disease | Cholesterol + derived risk factors |

### Rule-Based Risk Engine (11 conditions)

Iron Deficiency Anemia, Type 2 Diabetes, Prediabetes, Hypothyroidism, Hyperthyroidism, Vitamin D Deficiency, Vitamin B12 Deficiency, High Cholesterol, Liver Disease, Chronic Kidney Disease, Gout.

---

## 14. Safety & Medical Disclaimer System

### Dynamic Disclaimers

The backend generates context-sensitive disclaimers at every API endpoint:

- **Normal results:** Standard informational disclaimer
- **Anomalies present:** Advisory to consult a clinician
- **Critical values detected:** Urgent advisory for immediate medical attention

### Critical Threshold Safety Layer

Independent of all ML models, the safety layer in the risk engine checks raw parameter values against hard-coded critical thresholds (e.g., hemoglobin < 7 g/dL). If any threshold is crossed:
- `requires_immediate_attention = true` is set in the response
- The frontend displays a prominent red banner: "CRITICAL VALUES DETECTED — Please seek medical attention promptly."

### LLM Output Guardrails

The Groq simplification system prompt includes:
- Explicit prohibition of diagnosis or medication recommendations
- Mandatory advisory sentence for any out-of-range value
- Fixed concluding disclaimer required in every response

---

*This report was generated from the live codebase at `/Users/medhanshvibhu/Developer/Healthify`. All module descriptions, training parameters, and API contracts accurately reflect the current implementation as of March 2026.*
