"""
Transaction Service for MuleNet AI (Cyber Hackathon 2026 PS-01).
Handles transaction data management, timeline tracking, behavioral feature aggregation,
strict CSV upload validation, and synthetic scenario generation.
"""

import pandas as pd
import numpy as np
import io
import re
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple, Set

logger = logging.getLogger(__name__)

# Global in-memory storage for transactions
_CURRENT_TRANSACTIONS: List[Dict[str, Any]] = []

COLUMN_ALIASES = {
    "sender_account": ["sender_account", "sender", "from_account", "source_account", "src_acc", "sender_id", "from_acc", "payer_account", "debited_account"],
    "receiver_account": ["receiver_account", "receiver", "to_account", "destination_account", "dest_acc", "receiver_id", "to_acc", "payee_account", "credited_account"],
    "amount": ["amount", "txn_amount", "transaction_amount", "amt", "value", "transfer_amount"],
    "timestamp": ["timestamp", "txn_timestamp", "date", "time", "datetime", "transaction_date", "created_at"],
    "transaction_id": ["transaction_id", "txn_id", "id", "reference_id", "ref_no", "utr", "transaction_reference"],
    "channel": ["channel", "payment_channel", "mode", "payment_mode", "method", "type", "transfer_type"],
    "label": ["label", "is_mule", "fraud_label", "is_fraud", "fraud_tgt", "target"]
}

def map_column_names(df_columns: List[str]) -> Dict[str, str]:
    """Maps arbitrary incoming CSV column headers to standardized internal schema."""
    mapping = {}
    normalized = {re.sub(r'[^a-z0-9_]', '', col.lower().strip()): col for col in df_columns}
    
    for canonical_name, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            norm_alias = re.sub(r'[^a-z0-9_]', '', alias.lower())
            if norm_alias in normalized:
                mapping[normalized[norm_alias]] = canonical_name
                break
    return mapping

def generate_synthetic_transactions(seed: int = 42) -> List[Dict[str, Any]]:
    """
    Generates a realistic, internally consistent transaction ledger demonstrating:
    - Legitimate retail transactions (salary, utility bills, shopping, P2P transfers).
    - Multi-hop suspicious mule ring scenario:
        Victims (ACC-100001, ACC-100002, ACC-100003) 
        --> Funnel Mule (ACC-100099) 
        --> Layering Transit Mule (ACC-100098) 
        --> Layering / Cashout Mule (ACC-100035 & ACC-100020)
    - Specific timestamps showing rapid pass-through (inflow followed shortly by outflow).
    """
    np.random.seed(seed)
    base_time = datetime(2026, 8, 20, 9, 0, 0)
    txns: List[Dict[str, Any]] = []
    txn_seq = 1

    def make_txn(sender: str, receiver: str, amt: float, dt: datetime, channel: str, status: str = "COMPLETED", note: str = "") -> Dict[str, Any]:
        nonlocal txn_seq
        tid = f"TXN-{dt.strftime('%Y%m%d')}-{txn_seq:04d}"
        txn_seq += 1
        return {
            "transaction_id": tid,
            "sender_account": sender,
            "receiver_account": receiver,
            "amount": round(float(amt), 2),
            "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "channel": channel,
            "status": status,
            "notes": note
        }

    # ---------------------------------------------------------
    # SCENARIO 1: SUSPICIOUS MULTI-HOP MULE LAUNDERING RING
    # ---------------------------------------------------------
    # Victims transfer stolen funds to ACC-100099 (Funnel / Collector Mule)
    t1 = base_time + timedelta(hours=1, minutes=10)
    txns.append(make_txn("ACC-100001", "ACC-100099", 25000.0, t1, "UPI", note="Task job security deposit"))
    
    t2 = base_time + timedelta(hours=1, minutes=25)
    txns.append(make_txn("ACC-100002", "ACC-100099", 35000.0, t2, "IMPS", note="Customer care refund claim"))
    
    t3 = base_time + timedelta(hours=1, minutes=45)
    txns.append(make_txn("ACC-100003", "ACC-100099", 40000.0, t3, "UPI", note="KYC unblock verification fee"))

    # Rapid Outflow (Pass-Through): ACC-100099 drains funds to ACC-100098 within 25 minutes of last credit!
    t4 = base_time + timedelta(hours=2, minutes=10)
    txns.append(make_txn("ACC-100099", "ACC-100098", 95000.0, t4, "IMPS", note="Rapid fund transit (layering)"))

    # Layering Hop 2: ACC-100098 immediately splits and forwards to ACC-100035 and ACC-100020
    t5 = base_time + timedelta(hours=2, minutes=35)
    txns.append(make_txn("ACC-100098", "ACC-100035", 50000.0, t5, "IMPS", note="Split transfer hop 2"))

    t6 = base_time + timedelta(hours=2, minutes=48)
    txns.append(make_txn("ACC-100098", "ACC-100020", 42000.0, t6, "RTGS", note="Split transfer hop 2"))

    # Final Cashout: ACC-100035 executes rapid ATM and P2P Crypto withdrawals
    t7 = base_time + timedelta(hours=3, minutes=15)
    txns.append(make_txn("ACC-100035", "ACC-CRYPTO-P2P", 48000.0, t7, "UPI", note="USDT P2P Crypto purchase"))

    t8 = base_time + timedelta(hours=3, minutes=40)
    txns.append(make_txn("ACC-100020", "ACC-100040", 40000.0, t8, "NET_BANKING", note="Forward to merchant aggregator"))

    # Additional Second Wave for ACC-100099 next day
    next_day = base_time + timedelta(days=1)
    txns.append(make_txn("ACC-100004", "ACC-100099", 50000.0, next_day + timedelta(hours=2), "UPI", note="Part-time commission"))
    txns.append(make_txn("ACC-100099", "ACC-100098", 48000.0, next_day + timedelta(hours=2, minutes=30), "IMPS", note="Rapid sweep"))
    txns.append(make_txn("ACC-100098", "ACC-100035", 45000.0, next_day + timedelta(hours=3), "UPI", note="Crypto off-ramp"))

    # ---------------------------------------------------------
    # SCENARIO 2: LEGITIMATE RETAIL & SALARY BEHAVIOR
    # ---------------------------------------------------------
    # Legitimate account ACC-100005: Salary credit, normal bills, groceries, holding balance
    txns.append(make_txn("CORP-PAYROLL", "ACC-100005", 85000.0, base_time - timedelta(days=5), "NEFT", note="Monthly Salary Credit"))
    txns.append(make_txn("ACC-100005", "BESCOM-UTILITY", 2400.0, base_time - timedelta(days=4), "UPI", note="Electricity Bill"))
    txns.append(make_txn("ACC-100005", "SWIGGY-DELIVERY", 450.0, base_time - timedelta(days=3), "UPI", note="Food Delivery"))
    txns.append(make_txn("ACC-100005", "APOLLO-PHARMACY", 1250.0, base_time - timedelta(days=2), "CARD", note="Medical expenses"))
    txns.append(make_txn("ACC-100005", "ACC-100012", 5000.0, base_time - timedelta(days=1), "UPI", note="Friend dinner share"))

    # Legitimate account ACC-100012: Student allowance, stationery, tuition fee
    txns.append(make_txn("ACC-100015", "ACC-100012", 20000.0, base_time - timedelta(days=6), "IMPS", note="Family monthly maintenance"))
    txns.append(make_txn("ACC-100012", "COLLEGE-FEE", 12000.0, base_time - timedelta(days=4), "NET_BANKING", note="Tuition Fee Installment"))
    txns.append(make_txn("ACC-100012", "BOOKSTORE-XYZ", 850.0, base_time - timedelta(days=2), "UPI", note="Academic books"))

    # ---------------------------------------------------------
    # SCENARIO 3: OTHER NETWORK BACKGROUND TRANSACTIONS (60 Accounts)
    # ---------------------------------------------------------
    other_accounts = [f"ACC-{100000 + i}" for i in range(10, 60)]
    channels = ["UPI", "IMPS", "NEFT", "RTGS", "NET_BANKING"]
    
    for i in range(len(other_accounts) - 1):
        src = other_accounts[i]
        dst = other_accounts[(i + 1) % len(other_accounts)]
        amt = round(float(np.random.uniform(500, 15000)), 2)
        d_offset = timedelta(days=int(np.random.randint(0, 10)), hours=int(np.random.randint(0, 24)), minutes=int(np.random.randint(0, 60)))
        t_sample = base_time - d_offset
        ch = np.random.choice(channels)
        txns.append(make_txn(src, dst, amt, t_sample, ch, note="Regular retail transfer"))

    # Sort all transactions chronologically
    txns = sorted(txns, key=lambda x: x["timestamp"])
    return txns

def get_current_transactions() -> List[Dict[str, Any]]:
    """Returns currently loaded transaction ledger or initializes synthetic default."""
    global _CURRENT_TRANSACTIONS
    if not _CURRENT_TRANSACTIONS:
        _CURRENT_TRANSACTIONS = generate_synthetic_transactions()
    return _CURRENT_TRANSACTIONS

from app.services.bank_features import BANK_FINALIZED_FEATURES, TARGET_VARIABLE

def set_current_transactions(txns: List[Dict[str, Any]]) -> None:
    """Updates in-memory transaction store."""
    global _CURRENT_TRANSACTIONS
    _CURRENT_TRANSACTIONS = sorted(txns, key=lambda x: x.get("timestamp", ""))

def validate_and_parse_csv(file_bytes: bytes, filename: str) -> Tuple[bool, str, Dict[str, Any], Optional[List[Dict[str, Any]]], Optional[pd.DataFrame]]:
    """
    Strict CSV validation pipeline:
    - Validates file extension, non-empty content, and encoding (UTF-8, Latin-1).
    - Parses CSV safely into DataFrame without code execution.
    - Detects whether it is a Transaction Ledger or an Account Feature Matrix.
    - For Transaction Ledgers: validates required fields (sender, receiver, positive numeric amounts, timestamps).
    - For Account Feature Matrices: checks mandatory target column F3924 (or supported target aliases),
      validates binary labels (0/1), verifies class balance for Stratified 5-Fold CV (min 5 samples per class),
      coerces numeric feature columns, handles missing values, and checks bank anchor alignment.
    - Returns: (success, message, validation_report, transactions_list, features_df)
    """
    if not filename.lower().endswith(".csv"):
        return False, "Invalid file format: Only CSV (.csv) files are supported.", {
            "error_code": "INVALID_EXTENSION",
            "validation_errors": ["File extension must be .csv."]
        }, None, None

    if len(file_bytes) == 0:
        return False, "Upload failed: The uploaded CSV file is empty.", {
            "error_code": "EMPTY_FILE",
            "validation_errors": ["The uploaded file contains 0 bytes."]
        }, None, None

    # Safe CSV parsing with multi-encoding fallback
    df = None
    parse_errors = []
    for enc in ["utf-8-sig", "utf-8", "latin1", "cp1252"]:
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding=enc)
            break
        except Exception as e:
            parse_errors.append(f"{enc}: {str(e)}")

    if df is None:
        return False, f"CSV parsing error: Unable to parse file as valid CSV. Details: {parse_errors[0]}", {
            "error_code": "PARSE_ERROR",
            "validation_errors": parse_errors
        }, None, None

    # Clean empty rows
    df = df.dropna(how="all")

    if len(df) == 0:
        return False, "Validation error: CSV contains headers but zero data rows.", {
            "error_code": "ZERO_ROWS",
            "validation_errors": ["The CSV contains column headers but zero data rows."]
        }, None, None

    if len(df.columns) < 2:
        return False, "Validation error: CSV must contain at least 2 columns.", {
            "error_code": "INSUFFICIENT_COLUMNS",
            "validation_errors": ["The CSV contains fewer than 2 columns."]
        }, None, None

    col_map = map_column_names(df.columns.tolist())
    is_txn_csv = "sender_account" in col_map.values() and "receiver_account" in col_map.values() and "amount" in col_map.values()
    
    validation_report = {
        "filename": filename,
        "total_rows_read": len(df),
        "total_columns": len(df.columns),
        "detected_schema_type": "TRANSACTION_LEDGER" if is_txn_csv else "ACCOUNT_FEATURE_MATRIX",
        "column_mappings": {orig: canon for orig, canon in col_map.items()},
        "validation_errors": [],
        "validation_warnings": []
    }

    # Check for duplicate column headers
    dup_cols = [c for c in df.columns if df.columns.tolist().count(c) > 1]
    if dup_cols:
        unique_dups = list(set(dup_cols))
        validation_report["validation_warnings"].append(f"Found duplicate column headers: {unique_dups}. Automatically deduplicated.")
        # Deduplicate column names
        seen = {}
        new_cols = []
        for c in df.columns:
            if c in seen:
                seen[c] += 1
                new_cols.append(f"{c}_{seen[c]}")
            else:
                seen[c] = 0
                new_cols.append(c)
        df.columns = new_cols

    if is_txn_csv:
        # Standardize transaction columns
        rename_dict = {orig: canon for orig, canon in col_map.items()}
        txn_df = df.rename(columns=rename_dict)
        
        # Verify required fields
        required = ["sender_account", "receiver_account", "amount"]
        for req in required:
            if req not in txn_df.columns:
                validation_report["validation_errors"].append(f"Missing mandatory transaction column: '{req}'")

        if validation_report["validation_errors"]:
            return False, f"Validation failed: {len(validation_report['validation_errors'])} schema error(s).", validation_report, None, None

        # Clean amounts
        try:
            txn_df["amount"] = pd.to_numeric(txn_df["amount"].astype(str).str.replace(r"[^\d.]", "", regex=True), errors="coerce")
        except Exception:
            pass

        invalid_amounts = txn_df[txn_df["amount"].isnull() | (txn_df["amount"] <= 0)]
        if len(invalid_amounts) > 0:
            if len(invalid_amounts) == len(txn_df):
                validation_report["validation_errors"].append("All records in the 'amount' column contain invalid or non-positive values.")
                return False, "Validation failed: Amount column contains no positive numeric values.", validation_report, None, None
            else:
                validation_report["validation_warnings"].append(f"Found {len(invalid_amounts)} record(s) with non-positive or unparseable amount values. Dropped invalid rows.")
                txn_df = txn_df[~txn_df.index.isin(invalid_amounts.index)]

        # Check timestamp
        if "timestamp" in txn_df.columns:
            invalid_dates = pd.to_datetime(txn_df["timestamp"], errors="coerce").isnull()
            if invalid_dates.sum() > 0:
                validation_report["validation_warnings"].append(f"Found {invalid_dates.sum()} record(s) with unparseable timestamps; default timestamps assigned.")
                txn_df.loc[invalid_dates, "timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        else:
            txn_df["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            validation_report["validation_warnings"].append("No timestamp column found; automatically assigned ingestion timestamps.")

        # Check transaction IDs
        if "transaction_id" not in txn_df.columns:
            txn_df["transaction_id"] = [f"TXN-{datetime.now().strftime('%Y%m%d')}-{i+1:04d}" for i in range(len(txn_df))]
        else:
            dups = txn_df["transaction_id"].duplicated().sum()
            if dups > 0:
                validation_report["validation_warnings"].append(f"Found {dups} duplicate transaction ID(s). Deduplication applied.")
                txn_df["transaction_id"] = [f"{tid}_{i}" if is_dup else tid for i, (tid, is_dup) in enumerate(zip(txn_df["transaction_id"], txn_df["transaction_id"].duplicated()))]

        if "channel" not in txn_df.columns:
            txn_df["channel"] = "UPI"

        if "status" not in txn_df.columns:
            txn_df["status"] = "COMPLETED"

        if "notes" not in txn_df.columns:
            txn_df["notes"] = ""

        # Convert to transaction list
        clean_txns = txn_df[["transaction_id", "sender_account", "receiver_account", "amount", "timestamp", "channel", "status", "notes"]].to_dict(orient="records")
        for item in clean_txns:
            item["amount"] = round(float(item["amount"]), 2)
            item["sender_account"] = str(item["sender_account"]).strip()
            item["receiver_account"] = str(item["receiver_account"]).strip()

        validation_report["valid_records_count"] = len(clean_txns)
        senders = set(t["sender_account"] for t in clean_txns)
        receivers = set(t["receiver_account"] for t in clean_txns)
        validation_report["distinct_accounts_count"] = len(senders.union(receivers))
        validation_report["target_found"] = False
        
        return True, f"Transaction CSV successfully validated and parsed: {len(clean_txns)} records across {validation_report['distinct_accounts_count']} distinct accounts.", validation_report, clean_txns, None

    else:
        # Account-level feature matrix CSV for DRISHTHI ML Training
        feat_df = df.copy()

        # 1. Standardize or detect ACCOUNT_ID
        if "ACCOUNT_ID" not in feat_df.columns:
            id_col = next((c for c in feat_df.columns if any(k in re.sub(r'[^a-z0-9]', '', c.lower()) for k in ["accountid", "accid", "accountno", "accountnumber", "account", "custid", "customerid"])), None)
            if id_col:
                feat_df = feat_df.rename(columns={id_col: "ACCOUNT_ID"})
                validation_report["column_mappings"][id_col] = "ACCOUNT_ID"
            else:
                feat_df.insert(0, "ACCOUNT_ID", [f"ACC-{100000 + i}" for i in range(len(feat_df))])
                validation_report["validation_warnings"].append("No account ID column found; automatically assigned sequential 'ACC-100xxx' account identifiers.")
        
        feat_df["ACCOUNT_ID"] = feat_df["ACCOUNT_ID"].astype(str).str.strip()

        # 2. Detect and validate target column F3924
        target_col_found = None
        target_aliases = ["f3924", "target", "label", "is_mule", "fraud_tgt", "mule_tag", "is_fraud", "mule_label", "mule"]
        
        # Direct check
        if TARGET_VARIABLE in feat_df.columns:
            target_col_found = TARGET_VARIABLE
        else:
            for c in feat_df.columns:
                norm_c = re.sub(r'[^a-z0-9]', '', c.lower())
                if norm_c in target_aliases:
                    target_col_found = c
                    break

        if not target_col_found:
            validation_report["validation_errors"].append(
                f"Missing mandatory target column '{TARGET_VARIABLE}' (or 'target'/'label'/'is_mule'/'fraud_tgt'). "
                "DRISHTHI ML supervised training requires binary mule tags (0 for Legitimate, 1 for Suspicious Mule)."
            )
            return False, (
                f"Validation failed: Target column '{TARGET_VARIABLE}' is missing. "
                "DRISHTHI supervised ML training requires a binary target column (0 for Legitimate, 1 for Suspicious Mule)."
            ), validation_report, None, None

        if target_col_found != TARGET_VARIABLE:
            feat_df = feat_df.rename(columns={target_col_found: TARGET_VARIABLE})
            validation_report["column_mappings"][target_col_found] = TARGET_VARIABLE
            validation_report["validation_warnings"].append(f"Mapped column '{target_col_found}' to standardized target variable '{TARGET_VARIABLE}'.")

        # 3. Clean and validate target labels
        # Convert string labels or booleans to 0 and 1
        raw_target = feat_df[TARGET_VARIABLE]
        mapped_target = []
        invalid_target_indices = []

        for idx, val in raw_target.items():
            if pd.isnull(val):
                invalid_target_indices.append(idx)
                continue
            str_val = str(val).strip().lower()
            if str_val in ["0", "0.0", "false", "legit", "legitimate", "no", "n", "normal"]:
                mapped_target.append(0)
            elif str_val in ["1", "1.0", "true", "mule", "suspicious", "yes", "y", "fraud"]:
                mapped_target.append(1)
            else:
                try:
                    num_val = float(str_val)
                    if num_val == 0.0:
                        mapped_target.append(0)
                    elif num_val == 1.0:
                        mapped_target.append(1)
                    else:
                        invalid_target_indices.append(idx)
                except ValueError:
                    invalid_target_indices.append(idx)

        if len(invalid_target_indices) > 0:
            sample_invalids = list(set(raw_target.loc[invalid_target_indices].dropna().astype(str).tolist()))[:5]
            validation_report["validation_errors"].append(
                f"Found {len(invalid_target_indices)} row(s) with invalid, missing, or non-binary target values {sample_invalids}. "
                "Target values must strictly be 0 (Legitimate) or 1 (Suspicious Mule)."
            )
            return False, f"Validation failed: Target column '{TARGET_VARIABLE}' contains invalid or non-binary labels.", validation_report, None, None

        feat_df[TARGET_VARIABLE] = np.array(mapped_target, dtype=int)

        # 4. Validate class distribution & minimum sample size for Stratified 5-Fold CV
        n_zeros = int((feat_df[TARGET_VARIABLE] == 0).sum())
        n_ones = int((feat_df[TARGET_VARIABLE] == 1).sum())
        total_valid = len(feat_df)

        if n_zeros == 0:
            validation_report["validation_errors"].append("Dataset contains only suspicious mule records (class 1) and zero legitimate records (class 0). Both classes are required.")
            return False, "Validation failed: Dataset requires both Legitimate (0) and Suspicious Mule (1) records.", validation_report, None, None

        if n_ones == 0:
            validation_report["validation_errors"].append("Dataset contains only legitimate records (class 0) and zero suspicious mule records (class 1). Both classes are required.")
            return False, "Validation failed: Dataset requires both Legitimate (0) and Suspicious Mule (1) records.", validation_report, None, None

        if n_zeros < 5 or n_ones < 5:
            validation_report["validation_errors"].append(
                f"Stratified 5-Fold cross-validation requires at least 5 records of each class. "
                f"Found Legitimate (0): {n_zeros}, Suspicious Mule (1): {n_ones}."
            )
            return False, (
                f"Validation failed: Insufficient class samples for Stratified 5-Fold cross-validation. "
                f"Found {n_zeros} legitimate and {n_ones} suspicious records (minimum required: 5 for each class)."
            ), validation_report, None, None

        if total_valid < 10:
            validation_report["validation_errors"].append(f"Dataset has only {total_valid} rows. Minimum required for model training is 10 records.")
            return False, f"Validation failed: Dataset contains {total_valid} rows; minimum required is 10 records.", validation_report, None, None

        # 5. Validate and clean numeric feature columns
        feature_cols = [c for c in feat_df.columns if c not in ["ACCOUNT_ID", TARGET_VARIABLE]]
        if len(feature_cols) == 0:
            validation_report["validation_errors"].append("No feature columns found in dataset besides Account ID and Target.")
            return False, "Validation failed: No feature variables found in dataset.", validation_report, None, None

        cleaned_features = []
        for col in feature_cols:
            feat_df[col] = pd.to_numeric(feat_df[col], errors="coerce")
            null_count = int(feat_df[col].isnull().sum())
            if null_count == len(feat_df):
                validation_report["validation_warnings"].append(f"Feature column '{col}' contained no valid numeric values and was filled with 0.")
                feat_df[col] = 0.0
            elif null_count > 0:
                med_val = float(feat_df[col].median(skipna=True))
                if np.isnan(med_val):
                    med_val = 0.0
                feat_df[col] = feat_df[col].fillna(med_val)
                validation_report["validation_warnings"].append(f"Feature column '{col}' had {null_count} missing value(s) that were median-imputed.")
            cleaned_features.append(col)

        # 6. Check Bank Finalized Feature Coverage
        matched_bank = [c for c in cleaned_features if c in BANK_FINALIZED_FEATURES]
        validation_report["bank_finalized_features_matched"] = len(matched_bank)
        validation_report["total_features_count"] = len(cleaned_features)
        
        if len(matched_bank) < len(BANK_FINALIZED_FEATURES):
            validation_report["validation_warnings"].append(
                f"Matched {len(matched_bank)} of {len(BANK_FINALIZED_FEATURES)} official Bank Finalized anchor features. "
                "Mode B (Full Feature Intelligence) will utilize all available numeric variables."
            )

        # 7. Finalize report metrics
        mule_rate = round((n_ones / total_valid) * 100, 2)
        imbalance_ratio = f"1:{round(n_zeros / n_ones, 1)}" if n_ones > 0 else "N/A"
        distinct_accs = int(len(feat_df["ACCOUNT_ID"].unique()))

        validation_report["valid_records_count"] = total_valid
        validation_report["distinct_accounts_count"] = distinct_accs
        validation_report["legitimate_count"] = n_zeros
        validation_report["suspicious_count"] = n_ones
        validation_report["mule_rate"] = mule_rate
        validation_report["imbalance_ratio"] = imbalance_ratio
        validation_report["target_found"] = True
        validation_report["target_column"] = TARGET_VARIABLE

        return (
            True,
            f"Feature dataset '{filename}' successfully validated: {total_valid} records with {len(cleaned_features)} features and target '{TARGET_VARIABLE}' ({n_zeros} Legitimate, {n_ones} Suspicious).",
            validation_report,
            None,
            feat_df
        )

def extract_account_indicators(account_id: str, txns: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Computes explainable transaction-level behavioral indicators for a specific account:
    - Rapid pass-through ratio (% of funds transferred out within 60 minutes of credit).
    - Inflow count and total incoming volume.
    - Outflow count and total outgoing volume.
    - Unique incoming senders (fan-in) and unique outgoing receivers (fan-out).
    - Velocity spikes (transfers within short intervals).
    - Layering risk indicators.
    """
    if txns is None:
        txns = get_current_transactions()

    in_txns = [t for t in txns if t.get("receiver_account") == account_id]
    out_txns = [t for t in txns if t.get("sender_account") == account_id]

    total_in = sum(t["amount"] for t in in_txns)
    total_out = sum(t["amount"] for t in out_txns)
    in_count = len(in_txns)
    out_count = len(out_txns)

    unique_senders = sorted(list(set(t["sender_account"] for t in in_txns)))
    unique_receivers = sorted(list(set(t["receiver_account"] for t in out_txns)))

    # Compute rapid pass-through: outgoing transfers within 60 minutes after an incoming transfer
    rapid_passthrough_amts = 0.0
    rapid_events = []

    for in_t in in_txns:
        try:
            in_time = datetime.strptime(in_t["timestamp"], "%Y-%m-%d %H:%M:%S")
        except Exception:
            continue

        for out_t in out_txns:
            try:
                out_time = datetime.strptime(out_t["timestamp"], "%Y-%m-%d %H:%M:%S")
            except Exception:
                continue

            delta_mins = (out_time - in_time).total_seconds() / 60.0
            if 0 < delta_mins <= 60.0:
                rapid_passthrough_amts += out_t["amount"]
                rapid_events.append({
                    "in_txn": in_t["transaction_id"],
                    "out_txn": out_t["transaction_id"],
                    "delta_minutes": round(delta_mins, 1),
                    "amount": out_t["amount"]
                })

    rapid_ratio = min(1.0, rapid_passthrough_amts / max(total_in, 1.0)) if total_in > 0 else 0.0
    drain_ratio = (total_out / total_in) if total_in > 0 else 0.0

    # Indicator checks with documented thresholds
    indicators = []
    
    # 1. Rapid Pass-Through Indicator
    if rapid_ratio >= 0.5 and total_out >= 20000.0:
        indicators.append({
            "code": "IND_RAPID_PASSTHROUGH",
            "name": "Rapid Pass-Through Outflow",
            "severity": "CRITICAL" if rapid_ratio >= 0.8 else "HIGH",
            "description": f"{round(rapid_ratio * 100, 1)}% of incoming funds were debited within 60 minutes of credit.",
            "impact_score": 35 if rapid_ratio >= 0.8 else 25
        })

    # 2. Funnel Fan-In from multiple counterparties
    if len(unique_senders) >= 3 and in_count >= 3:
        indicators.append({
            "code": "IND_FAN_IN_CONVERGENCE",
            "name": "Multi-Source Fund Convergence (Fan-In)",
            "severity": "HIGH",
            "description": f"Received funds from {len(unique_senders)} distinct sender accounts across {in_count} transactions.",
            "impact_score": 25
        })

    # 3. High Debit Drain
    if drain_ratio >= 0.85 and total_in >= 25000.0 and out_count >= 1:
        indicators.append({
            "code": "IND_HIGH_DRAIN_RATIO",
            "name": "Near-Total Balance Drain",
            "severity": "HIGH",
            "description": f"Account drained {round(drain_ratio * 100, 1)}% of total credit volume (In: ₹{total_in:,.2f}, Out: ₹{total_out:,.2f}).",
            "impact_score": 20
        })

    # 4. Fan-Out Disbursement
    if len(unique_receivers) >= 3 and out_count >= 3:
        indicators.append({
            "code": "IND_FAN_OUT_DISPERSION",
            "name": "Rapid Fund Dispersion (Fan-Out)",
            "severity": "MEDIUM",
            "description": f"Dispersed outbound transfers to {len(unique_receivers)} distinct recipient accounts.",
            "impact_score": 15
        })

    # 5. Short interval transactions
    if len(rapid_events) >= 2:
        indicators.append({
            "code": "IND_BURST_VELOCITY",
            "name": "High-Frequency Burst Transfers",
            "severity": "HIGH",
            "description": f"Detected {len(rapid_events)} rapid transfer bursts with intermediary latency under 45 minutes.",
            "impact_score": 20
        })

    return {
        "account_id": account_id,
        "total_incoming_amount": total_in,
        "total_outgoing_amount": total_out,
        "net_balance_change": round(total_in - total_out, 2),
        "incoming_count": in_count,
        "outgoing_count": out_count,
        "total_transactions": in_count + out_count,
        "unique_senders": unique_senders,
        "unique_receivers": unique_receivers,
        "rapid_passthrough_ratio": round(rapid_ratio, 3),
        "drain_ratio": round(drain_ratio, 3),
        "rapid_events_count": len(rapid_events),
        "indicators": indicators,
        "total_indicator_impact": sum(ind["impact_score"] for ind in indicators)
    }

def get_account_timeline(account_id: str, filter_direction: str = "ALL", limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieves chronological transaction timeline for a specific account with enrichment."""
    txns = get_current_transactions()
    timeline = []
    
    for t in txns:
        is_in = t["receiver_account"] == account_id
        is_out = t["sender_account"] == account_id
        
        if not is_in and not is_out:
            continue
            
        direction = "INFLOW" if is_in else "OUTFLOW"
        if filter_direction != "ALL" and direction != filter_direction:
            continue
            
        counterparty = t["sender_account"] if is_in else t["receiver_account"]
        
        # Enrich transaction flags
        flags = []
        if is_out and "layering" in t.get("notes", "").lower():
            flags.append("LAYERING_HOP")
        if is_in and "deposit" in t.get("notes", "").lower():
            flags.append("VICTIM_DEPOSIT")
        if t["amount"] >= 50000.0:
            flags.append("HIGH_VALUE")

        timeline.append({
            "transaction_id": t["transaction_id"],
            "timestamp": t["timestamp"],
            "direction": direction,
            "amount": t["amount"],
            "counterparty": counterparty,
            "channel": t.get("channel", "UPI"),
            "status": t.get("status", "COMPLETED"),
            "notes": t.get("notes", ""),
            "flags": flags
        })

    # Sort descending by timestamp (newest first)
    timeline = sorted(timeline, key=lambda x: x["timestamp"], reverse=True)
    return timeline[:limit]
