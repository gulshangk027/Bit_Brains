"""
PS-01 Backend API Verification Script
Tests all newly implemented services and endpoints:
- Dataset Summary & Metric consistency
- Transaction timeline & indicators
- Multi-hop Money-Trail analysis
- Complaint correlation
- Alerts lifecycle status
- Evidence-based Investigation Report
"""

import sys
import os
import httpx as requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("=" * 60)
    print("TESTING PS-01 ENHANCED API ENDPOINTS")
    print("=" * 60)

    # 1. Dataset Summary
    r = requests.get(f"{BASE_URL}/api/dataset/summary")
    assert r.status_code == 200, f"Summary failed: {r.status_code}"
    summary = r.json()
    print(f"[PASS] GET /api/dataset/summary:")
    print(f"       Records: {summary.get('rows')} | Distinct Accounts: {summary.get('distinct_accounts')}")
    print(f"       Legitimate: {summary.get('legitimate_count')} | Suspicious: {summary.get('suspicious_count')}")
    print(f"       Mule Rate: {summary.get('mule_rate')}% | Active Alerts: {summary.get('active_alerts_count')}")
    assert summary.get("rows") == 500, f"Expected 500 records, got {summary.get('rows')}"
    assert summary.get("distinct_accounts") == 500, f"Expected 500 accounts, got {summary.get('distinct_accounts')}"
    assert summary.get("suspicious_count") > 0, "Suspicious count should be > 0"

    # 2. Account Details & Indicators
    r = requests.get(f"{BASE_URL}/api/accounts/ACC-100099")
    assert r.status_code == 200, f"Account fetch failed: {r.status_code}"
    acc = r.json()
    print(f"\n[PASS] GET /api/accounts/ACC-100099:")
    print(f"       Risk Score: {acc.get('risk_score')}/100 ({acc.get('risk_level')})")
    print(f"       Indicators Count: {len(acc.get('indicators', []))}")
    print(f"       Linked Complaints: {len(acc.get('linked_complaints', []))}")
    print(f"       Concrete Reasons: {len(acc.get('concrete_reasons', []))}")
    assert len(acc.get("concrete_reasons", [])) > 0, "Expected concrete reasons"
    assert len(acc.get("linked_complaints", [])) > 0, "ACC-100099 should be linked to complaints"

    # 3. Transaction Timeline
    r = requests.get(f"{BASE_URL}/api/transactions/ACC-100099")
    assert r.status_code == 200, f"Timeline failed: {r.status_code}"
    tl = r.json()
    print(f"\n[PASS] GET /api/transactions/ACC-100099:")
    print(f"       Timeline Records: {tl.get('timeline_count')}")
    print(f"       Rapid Pass-Through Ratio: {tl.get('summary', {}).get('rapid_passthrough_ratio')}")
    assert tl.get("timeline_count") > 0, "Expected transactions in timeline"

    # 4. Money-Trail Analysis
    trail_payload = {
        "source_account": "ACC-100001",
        "destination_account": "ACC-100035",
        "max_depth": 4
    }
    r = requests.post(f"{BASE_URL}/api/money-trail", json=trail_payload)
    assert r.status_code == 200, f"Money trail failed: {r.status_code}"
    trail = r.json()
    print(f"\n[PASS] POST /api/money-trail:")
    print(f"       Paths Found: {trail.get('paths_found')}")
    if trail.get("paths"):
        p = trail["paths"][0]
        print(f"       Path 1: {' -> '.join(p['account_sequence'])} ({p['hop_count']} hops)")
        print(f"       Transit Latency: {p.get('total_transit_duration_minutes')} minutes")
        print(f"       Intermediaries: {p.get('intermediary_accounts')}")
        assert len(p["intermediary_accounts"]) > 0, "Expected intermediary accounts in trail"

    # 5. Complaints
    r = requests.get(f"{BASE_URL}/api/complaints/ACC-100099")
    assert r.status_code == 200, f"Complaints failed: {r.status_code}"
    cmps = r.json()
    print(f"\n[PASS] GET /api/complaints/ACC-100099:")
    print(f"       Correlated Complaints: {cmps.get('correlated_count')}")
    assert cmps.get("correlated_count") >= 1, "Expected correlated complaints"

    # 6. Alerts & Status Update
    r = requests.get(f"{BASE_URL}/api/alerts")
    assert r.status_code == 200, f"Alerts failed: {r.status_code}"
    alerts_data = r.json()
    alerts = alerts_data.get("alerts", [])
    print(f"\n[PASS] GET /api/alerts:")
    print(f"       Total Alerts: {len(alerts)}")
    assert len(alerts) > 0, "Expected alerts"
    first_alert = alerts[0]
    aid = first_alert["alert_id"]
    
    # Test PATCH status
    patch_r = requests.patch(f"{BASE_URL}/api/alerts/{aid}/status", json={"status": "UNDER_REVIEW", "notes": "Investigator assigned"})
    assert patch_r.status_code == 200, f"Alert patch failed: {patch_r.status_code}"
    print(f"       PATCH Alert {aid} Status -> UNDER_REVIEW: [OK]")

    # 7. Investigation Report
    r = requests.post(f"{BASE_URL}/api/report", json={"account_id": "ACC-100099"})
    assert r.status_code == 200, f"Report failed: {r.status_code}"
    rep = r.json()
    print(f"\n[PASS] POST /api/report for ACC-100099:")
    print(f"       Report ID: {rep.get('report_id')}")
    print(f"       Risk: {rep.get('risk_score')}/100 ({rep.get('risk_level')})")
    print(f"       Timeline sample entries: {len(rep.get('timeline_sample', []))}")
    print(f"       Correlated complaints: {len(rep.get('linked_complaints', []))}")
    print(f"       Money trails attached: {len(rep.get('money_trails', []))}")
    assert len(rep.get("recommended_next_steps", [])) > 0, "Expected recommended steps"

    print("\n" + "=" * 60)
    print("ALL BACKEND ENDPOINTS AND LOGIC FULLY VERIFIED AND PASSING!")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
