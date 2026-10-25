# MULENET AI — Bit Brains
### Intelligent Mule Account Detection & Financial Fraud Investigation Platform
> **Cyber Hackathon 2026 | Problem Statement: PS-01**  
> *PREVENT. DETECT. RESPOND.*

---

## 🌟 Executive Overview
**MULENET AI** is an end-to-end AI-powered financial fraud intelligence system engineered for rapid identification, risk scoring, network tracing, and investigation of mule bank accounts. Built for law enforcement, fraud intelligence units, and financial institutions to dismantle organized money laundering networks.

---

## 🛡️ Core System Modules

### 1. DRISHTHI (ML Intelligence & Risk Engine)
- **Model Pipeline**: Stratified 5-Fold Cross-Validated **Calibrated XGBoost** with Sigmoidal calibration.
- **Explainability**: Integrated **SHAP (SHapley Additive exPlanations)** attributing exact feature contributions (positive and negative risk drivers).
- **Dual Operating Modes**:
  - `bank_finalized`: 18 mission-critical bank-vetted behavioral indicators.
  - `full_feature`: 118-feature deep inspection pipeline with correlation pruning and variance filtering.
- **Dynamic Sandbox**: Interactive feature sliders for real-time model inference via `/api/predict/custom`.

### 2. RAKSHAK (Automated Defense & Rule Engine)
- High-velocity transaction anomaly detection.
- Rapid credit-drain pattern recognition and account freezing recommendations.
- Mule behavior alerts with real-time status management.

### 3. AWAAZ (Complaint Correlation Engine)
- Citizen and victim cybercrime incident analysis.
- Automatic correlation between reported incidents, beneficiary accounts, and suspect mule accounts.

### 4. Interactive Money-Trail & Network Graphs
- Multi-hop transaction pathfinding enforcing temporal consistency.
- Interactive graph visualization mapping money laundering rings, intermediary transit accounts, and high-risk clusters.

### 5. Automated Forensic Reporting
- Instant case report compilation with one-click PDF export, transaction timelines, counterparty summaries, and behavioral profiles.

---

## 🏗️ Architecture & Technology Stack

```
MULENET AI
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── main.py           # Core FastAPI API Routes
│   │   ├── services/
│   │   │   ├── ml_service.py          # Calibrated XGBoost + SHAP engine
│   │   │   ├── dataset_service.py     # CSV parsing, validation, synthetic generator
│   │   │   ├── transaction_service.py # Money trails & timeline extraction
│   │   │   ├── bank_features.py       # Feature dictionaries & bank definitions
│   │   │   ├── alert_service.py       # Threat alert store
│   │   │   ├── complaint_service.py   # AWAAZ cybercrime complaints
│   │   │   ├── network_service.py     # NetworkX mule network graph generator
│   │   │   └── nlp_service.py         # Incident text classification
│   │   └── models/           # Persisted active model artifacts (.joblib, .json)
│   └── tests/                # Verification benchmarks
└── frontend/                 # React 18 + Vite Web Application
    ├── src/
    │   ├── components/       # DrishthiView, RakshakView, AwaazView, NetworksView, etc.
    │   ├── utils/            # Forensic PDF generator
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ & **npm**

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt  # Or: pip install fastapi uvicorn scikit-learn xgboost shap pandas networkx joblib httpx
python -m uvicorn app.main:app --reload --port 8000
```
Backend API documentation is available at `http://localhost:8000/docs`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web application runs at `http://localhost:5173`.

---

## 👥 Team
**Bit Brains** — Cyber Hackathon 2026 (PS-01)
