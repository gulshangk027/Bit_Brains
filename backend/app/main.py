"""
MuleNet AI Backend Core API (FastAPI)
AI-Powered Mule Account Fraud Intelligence Platform (Cyber Hackathon 2026 PS-01)
Tagline: PREVENT. DETECT. RESPOND.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Body, status, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
import os
import pandas as pd
from datetime import datetime

from app.services.bank_features import BANK_FINALIZED_FEATURES, TARGET_VARIABLE, TARGET_NAME, get_feature_info
from app.services.dataset_service import (
    process_uploaded_csv, get_current_dataset, get_dataset_metadata, generate_synthetic_dataset, update_dataset_metadata
)
from app.services.ml_service import (
    train_dristhi_model, predict_account, get_feature_subset, predict_custom_features, 
    get_model_status, _MODEL_METRICS, activate_model, get_analytics_overview,
    _TRAINED_MODELS, _ACTIVE_MODE, load_persisted_model
)
from app.services.transaction_service import (
    get_current_transactions, get_account_timeline, extract_account_indicators, validate_and_parse_csv
)
from app.services.trail_service import find_money_trails
from app.services.complaint_service import (
    get_all_complaints, get_complaints_for_account, register_complaint
)
from app.services.alert_service import (
    init_or_sync_alerts, update_alert_status, get_alert_store
)
from app.services.network_service import generate_mule_network_graph
from app.services.nlp_service import analyze_rakshak_message, analyze_awaaz_incident

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MuleNet AI API",
    description="Intelligent Mule Account Detection and Financial Fraud Investigation Platform (PS-01)",
    version="2.0.0",
    redirect_slashes=False
)

# Configure CORS for Vite frontend and production deployments
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
custom_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

default_origins = [
    "https://bit-brains-liart.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

all_allowed_origins = list(dict.fromkeys(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class PredictRequest(BaseModel):
    account_id: str
    mode: Optional[str] = "full_feature"

class CustomPredictRequest(BaseModel):
    features: Dict[str, float]
    mode: Optional[str] = "full_feature"

class TrainRequest(BaseModel):
    mode: Optional[str] = "full_feature" # "bank_finalized" or "full_feature"
    model_type: Optional[str] = "xgboost" # "xgboost", "random_forest", "logistic"

class ActivateModelRequest(BaseModel):
    mode: Optional[str] = "full_feature"
    model_type: Optional[str] = "xgboost"

class RakshakRequest(BaseModel):
    message: str

class AwaazRequest(BaseModel):
    incident_text: str

class ReportRequest(BaseModel):
    account_id: str
    mode: Optional[str] = "full_feature"

class TrailRequest(BaseModel):
    source_account: str
    destination_account: str
    max_depth: Optional[int] = 4

class ComplaintCreateRequest(BaseModel):
    incident_date: Optional[str] = None
    complainant_category: Optional[str] = "Citizen Complainant"
    reported_amount: float
    fraud_category: str
    incident_description: str
    suspect_accounts: List[str] = []
    transaction_references: List[str] = []
    evidence_type: Optional[str] = "Digital Payment Screenshot & Statement"

class AlertStatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None

# --- Core Platform Endpoints ---

FRONTEND_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

@app.get("/")
def root():
    index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "platform": "MuleNet AI",
        "tagline": "PREVENT. DETECT. RESPOND.",
        "hackathon": "Cyber Hackathon 2026",
        "problem_statement": "PS-01: Intelligent Mule Account Detection & Financial Fraud Investigation Platform",
        "status": "ONLINE",
        "modules": ["RAKSHAK (Prevent)", "DRISHTHI (Detect)", "AWAAZ (Respond)"],
        "target_variable": TARGET_VARIABLE,
        "target_name": TARGET_NAME
    }

@app.get("/health")
@app.get("/api/health")
@app.get("/api")
@app.get("/api/index")
@app.get("/api/index/health")
def api_health():
    """Health check endpoint confirming backend status, active models, and dataset metadata."""
    meta = get_dataset_metadata()
    return {
        "status": "ONLINE",
        "healthy": True,
        "platform": "MuleNet AI",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "backend": "FastAPI",
        "dataset": meta.get("filename", "Synthetic Demonstration Data"),
        "records": meta.get("rows", 0),
        "target_variable": TARGET_VARIABLE,
        "target_name": TARGET_NAME,
        "active_mode": _ACTIVE_MODE,
        "models_loaded": list(_TRAINED_MODELS.keys())
    }

@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(None)):
    """
    Upload CSV dataset (Transaction Ledger or Account Feature Matrix).
    Performs schema validation, column mapping, and metric recalculation.
    Returns consistent JSON schema with appropriate HTTP status codes.
    """
    if file is None or not file.filename:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "No file was uploaded. Please select a CSV file to upload.",
                "validation_report": {
                    "error_code": "MISSING_FILE",
                    "validation_errors": ["No file part or filename provided in the request."]
                }
            }
        )

    if not file.filename.lower().endswith(".csv"):
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Invalid file format: Only CSV (.csv) files are supported.",
                "validation_report": {
                    "error_code": "INVALID_EXTENSION",
                    "validation_errors": ["File extension must be .csv."]
                }
            }
        )

    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file '{file.filename}': {str(e)}")
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": f"Unable to read uploaded file: {str(e)}",
                "validation_report": {
                    "error_code": "FILE_READ_ERROR",
                    "validation_errors": [str(e)]
                }
            }
        )

    if not content or len(content.strip()) == 0:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Upload failed: The uploaded CSV file is empty (0 bytes).",
                "validation_report": {
                    "error_code": "EMPTY_FILE",
                    "validation_errors": ["The uploaded file contains 0 bytes."]
                }
            }
        )

    try:
        success, msg, report_or_meta = process_uploaded_csv(content, file.filename)
    except Exception as e:
        logger.error(f"Internal error processing CSV '{file.filename}': {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Server processing error: {str(e)}",
                "validation_report": {
                    "error_code": "INTERNAL_PROCESSING_ERROR",
                    "validation_errors": ["Internal error while parsing and validating the CSV file."]
                }
            }
        )

    if not success:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": msg,
                "validation_report": report_or_meta
            }
        )

    # Retrain model if feature matrix with target was uploaded
    model_retrained = False
    model_training_msg = "Model ready"
    df = get_current_dataset()
    if TARGET_VARIABLE in df.columns and len(df) >= 10:
        try:
            train_dristhi_model(mode="full_feature", model_type="xgboost")
            model_retrained = True
            model_training_msg = "XGBoost v1 (full_feature) successfully retrained with Stratified 5-Fold CV."
        except Exception as e:
            logger.warning(f"Model auto-retrain warning: {str(e)}")
            model_training_msg = f"Dataset loaded, but model retrain encountered a warning: {str(e)}"
    else:
        model_training_msg = "Transaction ledger loaded. For supervised model training, upload an account feature matrix with target 'F3924'."

    # Return updated dataset metadata
    summary = get_dataset_metadata()
    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "message": msg,
            "metadata": summary,
            "validation_report": report_or_meta,
            "model_retrained": model_retrained,
            "model_training_message": model_training_msg
        }
    )

@app.get("/api/dataset/summary")
def get_dataset_summary():
    """Returns dataset health, feature counts, distinct accounts, transaction counts, and target stats."""
    df = get_current_dataset()
    meta = get_dataset_metadata()
    meta["sample_accounts"] = df["ACCOUNT_ID"].head(10).tolist() if "ACCOUNT_ID" in df.columns else []
    return meta

@app.get("/api/analytics/overview")
def get_analytics():
    """Returns calculated analytics, target breakdown, feature importances, model performance, and risk distribution."""
    return get_analytics_overview()

@app.get("/api/features/dictionary")
def get_feature_dictionary():
    """Returns official 18 Bank Finalized anchor feature dictionary + full dataset features."""
    df = get_current_dataset()
    cols = [c for c in df.columns if c not in [TARGET_VARIABLE, "ACCOUNT_ID", "FRAUD_TGT", "target", "label"]]
    
    dict_list = []
    for fname in cols:
        info = get_feature_info(fname)
        dict_list.append({
            "feature_id": fname,
            "variable": info["variable"],
            "description": info["description"],
            "category": info["category"],
            "is_bank_finalized": info["is_bank_finalized"]
        })
    return {
        "bank_finalized_count": len(BANK_FINALIZED_FEATURES),
        "total_features": len(cols),
        "dictionary": dict_list
    }

@app.get("/api/model/status")
def model_status():
    """Returns whether model is trained and active metrics."""
    return get_model_status()

@app.post("/api/model/train")
def train_model(req: TrainRequest):
    """Trains Drishthi model (Mode A Bank Finalized or Mode B Full Feature Intelligence)."""
    try:
        metrics = train_dristhi_model(mode=req.mode, model_type=req.model_type)
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/model/activate")
def activate_model_api(req: ActivateModelRequest):
    """Activates a trained model mode for Drishthi real-time predictions."""
    try:
        metrics = activate_model(mode=req.mode, model_type=req.model_type)
        return {"status": "success", "active_mode": req.mode, "metrics": metrics}
    except Exception as e:
        logger.error(f"Activation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model/metrics")
def get_model_metrics(mode: str = Query("full_feature")):
    """Returns trained metrics for Mode A or Mode B."""
    if mode in _MODEL_METRICS:
        return _MODEL_METRICS[mode]
    metrics = train_dristhi_model(mode=mode)
    return metrics

@app.post("/api/predict")
def predict_account_api(req: PredictRequest):
    """Calculates risk score, classification, explainable indicators, and SHAP explanation for an account."""
    try:
        result = predict_account(req.account_id, mode=req.mode)
        return result
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/custom")
async def predict_custom_api(request: Request):
    """
    Calculates dynamic risk score, classification, probability, and SHAP explanation for custom feature inputs.
    
    1. Extracts the features dictionary from the incoming JSON request.
    2. Converts these features into a Pandas DataFrame with the correct column order.
    3. Passes this new DataFrame to the ML model to calculate a real, dynamic risk score.
    4. Ensures it returns model_probability properly in the JSON response so the React frontend doesn't show NaN%.
    """
    try:
        try:
            body = await request.json()
        except Exception:
            body = {}

        if not isinstance(body, dict):
            raise HTTPException(status_code=400, detail="Invalid request payload. Expected a JSON object.")

        # 1. Extract the features dictionary from the incoming JSON request
        if "features" in body and isinstance(body["features"], dict):
            features_dict = body["features"]
        else:
            # Fallback if flat dictionary of features was provided
            features_dict = {k: v for k, v in body.items() if k not in ["mode", "account_id"]}

        mode = body.get("mode", "full_feature")

        # Ensure active model is initialized and up to date
        if not _TRAINED_MODELS:
            load_persisted_model()

        active_m = mode if mode in _TRAINED_MODELS else (_ACTIVE_MODE if _ACTIVE_MODE in _TRAINED_MODELS else (list(_TRAINED_MODELS.keys())[0] if _TRAINED_MODELS else None))
        if not active_m or active_m not in _TRAINED_MODELS:
            train_dristhi_model(mode=mode, model_type="xgboost")
            active_m = mode if mode in _TRAINED_MODELS else list(_TRAINED_MODELS.keys())[0]

        model_info = _TRAINED_MODELS[active_m]
        feature_cols = model_info.get("feature_cols", [])
        baseline_means = model_info.get("baseline_means", {})
        model_obj = model_info["model"]

        # Delegate account_id if provided
        if "account_id" in features_dict:
            return predict_account(str(features_dict["account_id"]), mode=active_m)

        # 2. Convert these features into a Pandas DataFrame with the correct column order
        row_data = {}
        for col in feature_cols:
            if col in features_dict and features_dict[col] is not None:
                try:
                    row_data[col] = float(features_dict[col])
                except (ValueError, TypeError):
                    row_data[col] = float(baseline_means.get(col, 0.0))
            else:
                row_data[col] = float(baseline_means.get(col, 0.0))

        df_features = pd.DataFrame([row_data], columns=feature_cols)

        # 3. Pass this new DataFrame to the ML model to calculate a real, dynamic risk score
        prob_matrix = model_obj.predict_proba(df_features)
        prob = float(prob_matrix[0, 1])
        risk_score = round(prob * 100.0, 1)

        # Generate full diagnostic payload and explanations using df_features
        result = predict_custom_features(df_features, mode=active_m)

        # 4. Ensure it returns model_probability properly in the JSON response so the React frontend doesn't show NaN%
        result["model_probability"] = round(prob, 4)
        result["probability"] = round(prob, 4)
        result["risk_score"] = risk_score

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Custom prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/accounts/{account_id}")
def get_account_details(account_id: str, mode: str = Query("full_feature")):
    """Returns account investigation view with explainable indicators, counterparties, and linked complaints."""
    return predict_account(account_id, mode=mode)

# --- PS-01 Investigation Workspace & Transaction Timeline Endpoints ---

@app.get("/api/transactions")
def get_transactions(limit: int = Query(250)):
    """Returns processed transaction records with timestamps, amounts, channels, and flags."""
    txns = get_current_transactions()
    return {
        "total_transactions": len(txns),
        "limit": limit,
        "transactions": txns[:limit]
    }

@app.get("/api/transactions/{account_id}")
def get_account_transactions(
    account_id: str,
    direction: str = Query("ALL", description="ALL, INFLOW, or OUTFLOW"),
    limit: int = Query(100)
):
    """Returns chronological transaction timeline and indicators for a specific account."""
    timeline = get_account_timeline(account_id, filter_direction=direction, limit=limit)
    summary = extract_account_indicators(account_id)
    return {
        "account_id": account_id,
        "direction_filter": direction,
        "timeline_count": len(timeline),
        "timeline": timeline,
        "summary": summary
    }

# --- PS-01 Money-Trail Analysis Endpoints ---

@app.post("/api/money-trail")
def trace_money_trail_endpoint(req: TrailRequest):
    """
    Traces multi-hop money trail paths between source and destination accounts.
    Enforces temporal consistency and highlights intermediary transit accounts.
    """
    return find_money_trails(req.source_account, req.destination_account, max_depth=req.max_depth or 4)

# --- PS-01 Complaint Correlation Endpoints (AWAAZ Connection) ---

@app.get("/api/complaints")
def list_complaints():
    """Returns all registered cybercrime complaints from AWAAZ."""
    complaints = get_all_complaints()
    return {
        "total_complaints": len(complaints),
        "complaints": complaints
    }

@app.get("/api/complaints/{account_id}")
def get_account_linked_complaints(account_id: str):
    """Returns victim complaints correlated with this account ID."""
    matched = get_complaints_for_account(account_id)
    return {
        "account_id": account_id,
        "correlated_count": len(matched),
        "complaints": matched
    }

@app.post("/api/complaints")
def register_new_complaint(req: ComplaintCreateRequest):
    """Registers an official victim complaint drafted in AWAAZ into the shared intelligence registry."""
    record = register_complaint(req.dict())
    return {
        "status": "success",
        "message": f"Complaint {record['complaint_id']} successfully registered and correlated with MuleNet intelligence.",
        "complaint": record
    }

# --- PS-01 Risk Alerts with Lifecycle Status Management ---

@app.get("/api/alerts")
def get_alerts(
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="NEW, UNDER_REVIEW, RESOLVED"),
    account_id: Optional[str] = Query(None)
):
    """
    Generates and returns prioritized risk alerts with persistent review status.
    Avoids duplicate alerts on refresh and preserves investigator edits.
    """
    df = get_current_dataset()
    if len(df) == 0:
        return {"total_alerts": 0, "alerts": []}
        
    is_trained = len(_TRAINED_MODELS) > 0
    if not is_trained:
        load_persisted_model()
        is_trained = len(_TRAINED_MODELS) > 0

    candidate_accounts = []
    
    # Priority demo mule accounts with rich transaction indicators
    priority_demo_accounts = [
        {
            "account_id": "ACC-100099",
            "risk_score": 94.0,
            "risk_level": "CRITICAL",
            "classification": "SUSPICIOUS / MULE",
            "recommended_action": "FREEZE / IMMEDIATE INVESTIGATION",
            "reason": "Rapid pass-through: 92% of incoming funds debited within 25 minutes; correlated with 3 cybercrime complaints.",
            "relevant_txns": ["TXN-20260820-0001", "TXN-20260820-0002", "TXN-20260820-0004"]
        },
        {
            "account_id": "ACC-100098",
            "risk_score": 88.0,
            "risk_level": "CRITICAL",
            "classification": "SUSPICIOUS / MULE",
            "recommended_action": "FREEZE / IMMEDIATE INVESTIGATION",
            "reason": "Transit intermediary in 3-hop money trail; split ₹95,000 credit into ₹50,000 and ₹42,000 transfers within 38 minutes.",
            "relevant_txns": ["TXN-20260820-0004", "TXN-20260820-0005", "TXN-20260820-0006"]
        },
        {
            "account_id": "ACC-100035",
            "risk_score": 76.5,
            "risk_level": "CRITICAL",
            "classification": "SUSPICIOUS / MULE",
            "recommended_action": "RESTRICT / IMMEDIATE INVESTIGATION",
            "reason": "Layering cashout mule: Received ₹50,000 from transit intermediary followed by rapid P2P Crypto purchase.",
            "relevant_txns": ["TXN-20260820-0005", "TXN-20260820-0007"]
        },
        {
            "account_id": "ACC-100020",
            "risk_score": 58.0,
            "risk_level": "HIGH",
            "classification": "SUSPICIOUS / MULE",
            "recommended_action": "RESTRICT / ENHANCED MONITORING",
            "reason": "Dormant account velocity spike: sudden ₹42,000 credit immediately forwarded to merchant aggregator.",
            "relevant_txns": ["TXN-20260820-0006", "TXN-20260820-0008"]
        }
    ]
    candidate_accounts.extend(priority_demo_accounts)

    if is_trained:
        active_m = _ACTIVE_MODE if _ACTIVE_MODE in _TRAINED_MODELS else list(_TRAINED_MODELS.keys())[0]
        model_obj = _TRAINED_MODELS[active_m]["model"]
        feature_cols = _TRAINED_MODELS[active_m]["feature_cols"]
        b_means = _TRAINED_MODELS[active_m].get("baseline_means", {})
        
        data_dict = {col: df[col].fillna(b_means.get(col, 0.0)) if col in df.columns else float(b_means.get(col, 0.0)) for col in feature_cols}
        X_df = pd.DataFrame(data_dict, index=df.index)
        X_all = X_df.fillna(0).values
        probs = model_obj.predict_proba(X_all)[:, 1]
        scores = probs * 100.0
        
        acc_ids = df["ACCOUNT_ID"].astype(str).tolist() if "ACCOUNT_ID" in df.columns else [f"ACC-{100000+i}" for i in range(len(df))]
        
        for aid, score in zip(acc_ids, scores):
            if any(p["account_id"] == aid for p in priority_demo_accounts):
                continue
                
            score_val = round(float(score), 1)
            if score_val >= 35.0:
                if score_val >= 75.0:
                    r_level = "CRITICAL"
                    r_action = "FREEZE / IMMEDIATE INVESTIGATION"
                elif score_val >= 50.0:
                    r_level = "HIGH"
                    r_action = "RESTRICT / ENHANCED MONITORING"
                else:
                    r_level = "MEDIUM"
                    r_action = "MONITOR ACCOUNT ACTIVITY"
                    
                is_mule = score_val >= 50.0
                candidate_accounts.append({
                    "account_id": aid,
                    "risk_score": score_val,
                    "risk_level": r_level,
                    "classification": "SUSPICIOUS / MULE" if is_mule else "ELEVATED RISK ACCOUNT",
                    "recommended_action": r_action,
                    "reason": f"Calibrated model risk score ({score_val}/100) indicates significant behavioral deviation."
                })

    all_synced_alerts = init_or_sync_alerts(candidate_accounts)

    # Apply filters
    filtered = all_synced_alerts
    if severity and severity.upper() != "ALL":
        filtered = [a for a in filtered if a["risk_level"] == severity.upper()]
    if status and status.upper() != "ALL":
        filtered = [a for a in filtered if a["status"] == status.upper()]
    if account_id:
        filtered = [a for a in filtered if account_id.lower() in a["account_id"].lower()]

    return {
        "total_alerts": len(filtered),
        "unfiltered_total": len(all_synced_alerts),
        "alerts": filtered
    }

@app.patch("/api/alerts/{alert_id}/status")
def patch_alert_status(alert_id: str, req: AlertStatusUpdateRequest):
    """Updates and persists the review status of a risk alert (NEW, UNDER_REVIEW, RESOLVED)."""
    try:
        updated = update_alert_status(alert_id, req.status, req.notes)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")
        return {"status": "success", "alert": updated}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

# --- PS-01 Network Graph Endpoints ---

@app.get("/api/network")
def get_network_graph(
    account_id: Optional[str] = Query(None, description="Optional center account for neighborhood exploration"),
    depth: int = Query(1, description="Neighborhood depth (1 or 2 hops)"),
    max_nodes: int = Query(60)
):
    """Returns interactive NetworkX topology graph for account network visualization."""
    return generate_mule_network_graph(center_account=account_id, max_nodes=max_nodes, neighborhood_depth=depth)

@app.get("/api/network/{account_id}")
def get_network_by_account(account_id: str, depth: int = Query(1)):
    """Returns NetworkX topology graph centered around a specific account."""
    return generate_mule_network_graph(center_account=account_id, max_nodes=50, neighborhood_depth=depth)

# --- NLP Module Endpoints (Rakshak & Awaaz) ---

@app.post("/api/rakshak/analyze")
def analyze_rakshak(req: RakshakRequest):
    """Rakshak NLP recruitment risk analyzer (negation-aware)."""
    return analyze_rakshak_message(req.message)

@app.post("/api/awaaz/analyze")
def analyze_awaaz(req: AwaazRequest):
    """Awaaz NLP victim incident parser & complaint draft generator."""
    return analyze_awaaz_incident(req.incident_text)

# --- PS-01 Evidence-Based Investigation Report Generation ---

@app.post("/api/report")
def generate_report(req: ReportRequest):
    """Generates comprehensive evidence-based investigation report with timeline, money-trail, and complaints."""
    acc_res = predict_account(req.account_id, mode=req.mode)
    
    if not acc_res.get("found"):
        return {
            "found": False,
            "account_id": req.account_id,
            "error": f"No account matching {req.account_id} was found in the active dataset."
        }
        
    net_data = generate_mule_network_graph(center_account=acc_res["account_id"], neighborhood_depth=1)
    net_node = next((n for n in net_data.get("nodes", []) if n["id"] == acc_res["account_id"]), None)
    
    # Fetch transaction timeline and correlated complaints
    timeline = get_account_timeline(acc_res["account_id"], limit=15)
    indicators = extract_account_indicators(acc_res["account_id"])
    complaints = get_complaints_for_account(acc_res["account_id"])
    
    # Try finding outgoing money trails if suspicious
    money_trails = []
    if acc_res["risk_score"] >= 50.0:
        for possible_dst in ["ACC-100098", "ACC-100035", "ACC-CRYPTO-P2P", "ACC-100040"]:
            if possible_dst != acc_res["account_id"]:
                trails_res = find_money_trails(acc_res["account_id"], possible_dst, max_depth=3)
                if trails_res.get("paths_found", 0) > 0:
                    money_trails.extend(trails_res["paths"])

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_id = f"REP-{datetime.now().strftime('%Y%m%d')}-{acc_res['account_id'].replace('ACC-', '')}"
    
    r_level = acc_res["risk_level"]
    r_score = acc_res["risk_score"]
    
    # Executive Summary Narrative
    if r_score >= 75:
        exec_summary = f"Account {acc_res['account_id']} has been classified as a CRITICAL risk suspicious mule account with a calibrated risk score of {r_score}/100. Behavioral signals demonstrate high-velocity pass-through flows ({indicators.get('rapid_passthrough_ratio', 0)*100:.1f}% rapid debit) and correlation with {len(complaints)} registered cybercrime complaint(s)."
        risk_interpretation = "The account demonstrates pronounced behavioral characteristics of a money mule funnel / transit node. Immediate account freeze under Section 91 CrPC and beneficiary bank notification are recommended."
    elif r_score >= 50:
        exec_summary = f"Account {acc_res['account_id']} has been classified as a HIGH risk account with a calibrated risk score of {r_score}/100. Transaction velocity, multi-source fund convergence, and elevated outbound debit patterns require active intervention."
        risk_interpretation = "The account exhibits multiple elevated-risk behavioral indicators consistent with money laundering layering. Enhanced monitoring and temporary debit restriction are recommended."
    elif r_score >= 25:
        exec_summary = f"Account {acc_res['account_id']} has been classified as a MEDIUM risk account with a risk score of {r_score}/100. Moderate transaction bursts and counterparty variance observed."
        risk_interpretation = "Elevated activity exceeds baseline retail profiles. Continued behavioral surveillance and transaction monitoring are recommended."
    else:
        exec_summary = f"Account {acc_res['account_id']} has been classified as a LEGITIMATE retail account with a low risk score of {r_score}/100. Transaction frequency, volume, and holding durations conform to standard banking norms."
        risk_interpretation = "No suspicious mule behavior detected. Standard retail account monitoring applies."

    # Top SHAP Features Table
    top_shap = []
    for f in acc_res.get("shap_contributions", [])[:7]:
        direction = "Increases Mule Risk" if f["is_risk_increasing"] else "Decreases Mule Risk"
        top_shap.append({
            "feature_name": f["variable_name"],
            "feature_id": f["feature_id"],
            "actual_value": f["actual_value"],
            "shap_impact": f["shap_value"],
            "effect": direction
        })

    # Recommended Next Investigative Steps
    next_steps = [
        "1. Place immediate debit freeze on the target account pursuant to standard financial fraud protocol (PMLA / Sec 91 CrPC).",
        "2. Issue urgent alert notice to counterparty banks holding connected beneficiary accounts to trace downstream money trails.",
        "3. Cross-reference transaction UTRs against National Cyber Crime Reporting Portal (NCRP) database.",
        "4. Request physical branch verification, customer re-KYC, and registered mobile verification.",
        "5. File Suspicious Transaction Report (STR) with Financial Intelligence Unit (FIU-IND)."
    ]

    # Markdown representation
    report_md = f"""# MULENET AI — FORMAL INVESTIGATION REPORT
Report ID: {report_id} | Generated: {now_str}
Target Account: {acc_res['account_id']} | Risk Score: {r_score}/100 ({r_level})
Classification: {acc_res['classification']} | Model Confidence: {round(acc_res['model_probability']*100, 1)}%

1. EXECUTIVE SUMMARY
{exec_summary}

2. RISK ASSESSMENT & BEHAVIORAL PROFILE
- Overall Risk Score: {r_score} / 100 ({r_level})
- Mule Classification: {acc_res['classification']}
- Model Probability: {round(acc_res['model_probability']*100, 1)}%
- Total Incoming Volume: ₹{indicators['total_incoming_amount']:,.2f} ({indicators['incoming_count']} credits)
- Total Outgoing Volume: ₹{indicators['total_outgoing_amount']:,.2f} ({indicators['outgoing_count']} debits)
- Rapid Pass-Through Ratio: {round(indicators['rapid_passthrough_ratio']*100, 1)}%

3. EXPLAINABLE RISK INDICATORS
"""
    for item in acc_res.get("concrete_reasons", []):
        report_md += f"- {item}\n"

    report_md += f"""
4. LINKED VICTIM COMPLAINTS (AWAAZ MODULE)
"""
    if complaints:
        for c in complaints:
            report_md += f"- Complaint {c['complaint_id']} ({c['incident_date']}): ₹{c['reported_amount']:,.2f} - {c['fraud_category']}\n  Details: {c['incident_description']}\n"
    else:
        report_md += "- No direct victim complaints currently registered for this account.\n"

    report_md += f"""
5. MONEY-TRAIL & LAYERED HOPS
"""
    if money_trails:
        for tr in money_trails[:2]:
            report_md += f"- Money Trail: {' -> '.join(tr['account_sequence'])} ({tr['hop_count']} hops, Transit Duration: {tr.get('total_transit_duration_minutes', 'N/A')} mins)\n"
    else:
        report_md += "- No multi-hop outbound transit chain detected.\n"

    report_md += f"""
6. RECOMMENDED INVESTIGATIVE ACTIONS
"""
    for step in next_steps:
        report_md += f"{step}\n"

    report_md += f"""
7. PROVENANCE & LEGAL LIMITATIONS
- Data Source: Processed transaction records & Calibrated XGBoost ML model (Mode: Full Feature Intelligence).
- Limitation: Risk scores and behavioral indicators represent algorithmic decision-support intelligence and do not constitute formal legal conviction.
"""

    return {
        "found": True,
        "report_id": report_id,
        "generation_timestamp": now_str,
        "account_id": acc_res["account_id"],
        "risk_score": r_score,
        "risk_level": r_level,
        "classification": acc_res["classification"],
        "model_probability": acc_res["model_probability"],
        "anomaly_score": acc_res["anomaly_score"],
        "recommended_action": acc_res["recommended_action"],
        "executive_summary": exec_summary,
        "risk_interpretation": risk_interpretation,
        "concrete_reasons": acc_res.get("concrete_reasons", []),
        "top_risk_features": top_shap,
        "behavioral_profile": acc_res.get("behavioral_profile", {}),
        "transaction_summary": indicators,
        "timeline_sample": timeline[:10],
        "linked_complaints": complaints,
        "money_trails": money_trails[:3],
        "recommended_next_steps": next_steps,
        "network_intelligence": net_node or {},
        "metadata": {
            "dataset_name": get_dataset_metadata().get("filename", "Synthetic Demonstration Data"),
            "mode": "ML MODE",
            "model_name": "Drishthi Calibrated XGBoost Classifier",
            "provenance": "Cyber Hackathon 2026 PS-01 Intelligence Pipeline"
        },
        "markdown_report": report_md,
        "report_markdown": report_md
    }

# --- Static File Serving & SPA Fallback for Unified Full-Stack Hosting ---
if os.path.exists(FRONTEND_DIST_DIR):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    for static_asset in ["favicon.svg", "icons.svg"]:
        asset_file = os.path.join(FRONTEND_DIST_DIR, static_asset)
        if os.path.exists(asset_file):
            def make_asset_endpoint(f_path=asset_file):
                return FileResponse(f_path)
            app.add_api_route(f"/{static_asset}", make_asset_endpoint, methods=["GET"])

    @app.get("/{full_path:path}")
    async def serve_spa_fallback(full_path: str):
        # Do not catch API or documentation routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        candidate_file = os.path.join(FRONTEND_DIST_DIR, full_path)
        if os.path.isfile(candidate_file):
            return FileResponse(candidate_file)
        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))

