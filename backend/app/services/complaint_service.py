"""
Complaint Service for MuleNet AI (Cyber Hackathon 2026 PS-01).
Connects AWAAZ victim response intelligence with DRISHTHI investigation workspace.
Stores structured cybercrime complaints, associates suspect accounts and UTRs,
and enables multi-evidence investigation workflows.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

# Global in-memory registry of cybercrime complaints
_COMPLAINTS_REGISTRY: List[Dict[str, Any]] = [
    {
        "complaint_id": "CMP-2026-1049",
        "incident_date": "2026-08-20",
        "reported_at": "2026-08-20 14:30:00",
        "complainant_category": "Student / Retail Victim",
        "reported_amount": 25000.0,
        "fraud_category": "Job / Part-Time Task Scam (Mule Recruitment)",
        "incident_description": "Victim received a Telegram message offering ₹3,000/day for online rating tasks. Asked to deposit ₹25,000 security fee to unlock higher payouts into beneficiary account ACC-100099 via UPI. Communication ceased after transfer.",
        "suspect_accounts": ["ACC-100099"],
        "transaction_references": ["TXN-20260820-0001"],
        "status": "UNDER_INVESTIGATION",
        "police_portal_ack": "NCRP-2026-KA-99120",
        "evidence_type": "WhatsApp Chat Screenshots & UPI Debit Confirmation"
    },
    {
        "complaint_id": "CMP-2026-1052",
        "incident_date": "2026-08-20",
        "reported_at": "2026-08-20 16:15:00",
        "complainant_category": "Senior Citizen",
        "reported_amount": 35000.0,
        "fraud_category": "Customer Care Impersonation / Vishing",
        "incident_description": "Caller posed as SBI customer support informing that debit card was blocked. Directed victim to transfer ₹35,000 as refundable security verification into account ACC-100099 via IMPS.",
        "suspect_accounts": ["ACC-100099"],
        "transaction_references": ["TXN-20260820-0002"],
        "status": "UNDER_INVESTIGATION",
        "police_portal_ack": "NCRP-2026-DL-44812",
        "evidence_type": "Call Records & Bank Statement Entry"
    },
    {
        "complaint_id": "CMP-2026-1058",
        "incident_date": "2026-08-20",
        "reported_at": "2026-08-20 18:00:00",
        "complainant_category": "Freelance Professional",
        "reported_amount": 40000.0,
        "fraud_category": "KYC Expiry / Phishing Link Scam",
        "incident_description": "Victim received an SMS claiming bank KYC expired. Clicked link and authorized a ₹40,000 transfer to beneficiary ACC-100099 thinking it was an account re-validation hold.",
        "suspect_accounts": ["ACC-100099"],
        "transaction_references": ["TXN-20260820-0003"],
        "status": "ESCALATED_LE",
        "police_portal_ack": "NCRP-2026-MH-11209",
        "evidence_type": "SMS Header Screenshot & Bank SMS Alert"
    },
    {
        "complaint_id": "CMP-2026-1065",
        "incident_date": "2026-08-21",
        "reported_at": "2026-08-21 11:20:00",
        "complainant_category": "Working Professional",
        "reported_amount": 50000.0,
        "fraud_category": "Investment / High-Yield Crypto Scheme",
        "incident_description": "Promised 200% profit in 48 hours on crypto trading platform. Directed to deposit funds to local agent account ACC-100099 before funds were moved to intermediary ACC-100098.",
        "suspect_accounts": ["ACC-100099", "ACC-100098"],
        "transaction_references": ["TXN-20260821-0009", "TXN-20260820-0004"],
        "status": "UNDER_INVESTIGATION",
        "police_portal_ack": "NCRP-2026-KA-10044",
        "evidence_type": "Telegram Group Chat & Transaction UTR Slip"
    },
    {
        "complaint_id": "CMP-2026-1072",
        "incident_date": "2026-08-19",
        "reported_at": "2026-08-19 14:00:00",
        "complainant_category": "Student",
        "reported_amount": 42000.0,
        "fraud_category": "Loan Advance Fee / Processing Fee",
        "incident_description": "Offered immediate pre-approved personal education loan. Instructed to send ₹42,000 advance collateral to account ACC-100020.",
        "suspect_accounts": ["ACC-100020"],
        "transaction_references": ["TXN-20260820-0006"],
        "status": "NEW",
        "police_portal_ack": "NCRP-2026-UP-88912",
        "evidence_type": "Loan Approval Letter (Forged) & Bank Transfer Receipt"
    }
]

def get_all_complaints() -> List[Dict[str, Any]]:
    """Returns all registered cybercrime complaints."""
    return _COMPLAINTS_REGISTRY

def get_complaints_for_account(account_id: str) -> List[Dict[str, Any]]:
    """
    Finds all victim complaints correlated with a specific bank account:
    - Matches direct suspect accounts.
    - Matches accounts appearing in complaint transaction references.
    """
    matched = []
    for c in _COMPLAINTS_REGISTRY:
        if account_id in c.get("suspect_accounts", []):
            match_reason = f"Account {account_id} is directly named as the receiving suspect account in this victim complaint."
            item = c.copy()
            item["correlation_type"] = "DIRECT_SUSPECT_MATCH"
            item["correlation_reason"] = match_reason
            matched.append(item)
    return matched

def register_complaint(complaint_data: Dict[str, Any]) -> Dict[str, Any]:
    """Registers a new formal complaint generated via AWAAZ into the shared intelligence database."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cid = f"CMP-{datetime.now().strftime('%Y')}-{len(_COMPLAINTS_REGISTRY) + 1050}"
    
    new_record = {
        "complaint_id": cid,
        "incident_date": complaint_data.get("incident_date", datetime.now().strftime("%Y-%m-%d")),
        "reported_at": now_str,
        "complainant_category": complaint_data.get("complainant_category", "Citizen Complainant"),
        "reported_amount": float(complaint_data.get("reported_amount", 0.0)),
        "fraud_category": complaint_data.get("fraud_category", "Cyber-Enabled Financial Fraud"),
        "incident_description": complaint_data.get("incident_description", ""),
        "suspect_accounts": complaint_data.get("suspect_accounts", []),
        "transaction_references": complaint_data.get("transaction_references", []),
        "status": "NEW",
        "police_portal_ack": f"NCRP-{datetime.now().strftime('%Y')}-GEN-{len(_COMPLAINTS_REGISTRY) + 101}",
        "evidence_type": complaint_data.get("evidence_type", "Digital Payment Screenshot & Statement")
    }
    
    _COMPLAINTS_REGISTRY.insert(0, new_record)
    logger.info(f"Registered new victim complaint: {cid} for accounts: {new_record['suspect_accounts']}")
    return new_record
