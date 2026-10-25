"""
Alert Management Service for MuleNet AI (Cyber Hackathon 2026 PS-01).
Maintains persistent risk alerts with lifecycle status tracking (NEW, UNDER_REVIEW, RESOLVED),
concrete indicator-backed reasons, and transaction references.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

# Global persistent store for alerts: keyed by alert_id or account_id
_PERSISTENT_ALERTS: Dict[str, Dict[str, Any]] = {}

def get_alert_store() -> Dict[str, Dict[str, Any]]:
    return _PERSISTENT_ALERTS

def init_or_sync_alerts(scored_accounts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Syncs alerts based on current scored accounts while strictly preserving
    investigator review statuses (UNDER_REVIEW, RESOLVED) and investigator notes.
    """
    global _PERSISTENT_ALERTS
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for item in scored_accounts:
        aid = item["account_id"]
        score = item["risk_score"]
        
        # Only create alerts for accounts with elevated risk (>= 25)
        if score < 25.0:
            continue

        existing_alert = next((a for a in _PERSISTENT_ALERTS.values() if a["account_id"] == aid), None)
        
        if existing_alert:
            # Update score and level while preserving status
            existing_alert["risk_score"] = score
            existing_alert["risk_level"] = item.get("risk_level", existing_alert["risk_level"])
            existing_alert["classification"] = item.get("classification", existing_alert["classification"])
            existing_alert["recommended_action"] = item.get("recommended_action", existing_alert["recommended_action"])
            if "reason" in item and item["reason"]:
                existing_alert["reason"] = item["reason"]
            if "relevant_txns" in item and item["relevant_txns"]:
                existing_alert["relevant_txns"] = item["relevant_txns"]
        else:
            alert_seq = len(_PERSISTENT_ALERTS) + 1
            alert_id = f"ALT-2026-{alert_seq:03d}"
            
            _PERSISTENT_ALERTS[alert_id] = {
                "alert_id": alert_id,
                "account_id": aid,
                "timestamp": item.get("timestamp", now_str),
                "risk_score": score,
                "risk_level": item.get("risk_level", "HIGH"),
                "classification": item.get("classification", "SUSPICIOUS / MULE"),
                "recommended_action": item.get("recommended_action", "MONITOR ACCOUNT ACTIVITY"),
                "reason": item.get("reason", f"Risk score ({score}/100) exceeded banking monitoring threshold."),
                "relevant_txns": item.get("relevant_txns", []),
                "status": "NEW",  # NEW, UNDER_REVIEW, RESOLVED
                "assigned_to": "Fraud Investigation Team",
                "notes": "",
                "created_at": now_str,
                "updated_at": now_str
            }

    # Return alerts sorted by risk score descending
    alerts_list = list(_PERSISTENT_ALERTS.values())
    return sorted(alerts_list, key=lambda x: x["risk_score"], reverse=True)

def update_alert_status(alert_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Updates the workflow status (NEW, UNDER_REVIEW, RESOLVED) for an alert."""
    global _PERSISTENT_ALERTS
    if alert_id not in _PERSISTENT_ALERTS:
        return None

    valid_statuses = ["NEW", "UNDER_REVIEW", "RESOLVED"]
    normalized_status = new_status.upper().strip()
    if normalized_status not in valid_statuses:
        raise ValueError(f"Invalid status '{new_status}'. Must be one of: {', '.join(valid_statuses)}")

    alert = _PERSISTENT_ALERTS[alert_id]
    alert["status"] = normalized_status
    alert["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if notes is not None:
        alert["notes"] = notes

    logger.info(f"Updated Alert {alert_id} status to {normalized_status}")
    return alert
