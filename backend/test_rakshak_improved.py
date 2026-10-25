"""
Comprehensive Automated Test Suite for RAKSHAK Engine
Tests Cases A through G as specified in Task Requirements:
- Case A: Generic Reward (No fabricated mule/transfer signals)
- Case B: Explicit Money-Mule Recruitment
- Case C: Credential Harvesting & OTP Theft
- Case D: Negated Safety Educational Advisory
- Case E: Benign Ordinary Message
- Case F: Stale-Result Regression Simulation
- Case G: Input/Result Consistency State Transitions
- Evidence Integrity: Exact verbatim substring validation
"""

import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.nlp_service import analyze_rakshak_message

def test_case_a_generic_reward():
    """Case A: Generic reward offer must NOT invent mule recruitment or fund-transfer evidence."""
    msg = "Congratulations! You have been selected for a special reward. Review the offer details to learn more."
    res = analyze_rakshak_message(msg)

    print("Running test_case_a_generic_reward...")
    assert res["classification"] != "MULE_RECRUITMENT", \
        f"Case A Failed: Expected non-MULE classification, got {res['classification']}"
    assert res["classification"] in ["FINANCIAL_SCAM_REWARD", "SUSPICIOUS_UNVERIFIED"], \
        f"Case A Failed: Expected FINANCIAL_SCAM_REWARD or SUSPICIOUS_UNVERIFIED, got {res['classification']}"
    assert res["risk_score"] < 50, \
        f"Case A Failed: Generic reward should have low/moderate score, got {res['risk_score']}"
    assert res["needs_review"] is True, \
        "Case A Failed: Inconclusive reward should flag needs_review=True"

    # Verify no fabricated phrases
    for sig in res["detected_signals"]:
        sig_name_lower = sig["name"].lower()
        assert "transfer" not in sig_name_lower and "commission" not in sig_name_lower and "mule" not in sig_name_lower, \
            f"Case A Failed: Signal '{sig['name']}' fabricated mule/transfer mechanics!"
        assert sig["evidence"].lower() in msg.lower(), \
            f"Case A Failed: Evidence '{sig['evidence']}' is not a verbatim substring of message!"
    print("  [PASS] Case A: Generic reward correctly assessed without mule fabrication.")

def test_case_b_explicit_mule_recruitment():
    """Case B: Explicit money-mule recruitment must detect fund forwarding, account usage, commission."""
    msg = "Earn ₹75,000 daily from home. Let us use your bank account to receive payments and forward the money to our clients. You will earn a commission for each transfer."
    res = analyze_rakshak_message(msg)

    print("Running test_case_b_explicit_mule_recruitment...")
    assert res["classification"] == "MULE_RECRUITMENT", \
        f"Case B Failed: Expected MULE_RECRUITMENT, got {res['classification']}"
    assert res["risk_score"] >= 90, \
        f"Case B Failed: Expected critical score >= 90, got {res['risk_score']}"
    assert res["risk_level"] == "CRITICAL", \
        f"Case B Failed: Expected CRITICAL risk level, got {res['risk_level']}"
    assert len(res["detected_signals"]) >= 2, \
        f"Case B Failed: Expected multiple detected signals, got {len(res['detected_signals'])}"

    for sig in res["detected_signals"]:
        assert sig["evidence"].lower() in msg.lower(), \
            f"Case B Failed: Evidence '{sig['evidence']}' is not a substring of input!"
    print("  [PASS] Case B: Explicit mule recruitment detected with verified evidence.")

def test_case_c_credential_harvesting():
    """Case C: Credential harvesting with account suspension threat and OTP/PIN request."""
    msg = "Your bank account will be suspended. Send your OTP and internet banking PIN to verify your account."
    res = analyze_rakshak_message(msg)

    print("Running test_case_c_credential_harvesting...")
    assert res["classification"] == "CREDENTIAL_HARVESTING", \
        f"Case C Failed: Expected CREDENTIAL_HARVESTING, got {res['classification']}"
    assert res["risk_score"] >= 90, \
        f"Case C Failed: Expected score >= 90, got {res['risk_score']}"
    assert res["risk_level"] == "CRITICAL", \
        f"Case C Failed: Expected CRITICAL level, got {res['risk_level']}"

    for sig in res["detected_signals"]:
        assert sig["evidence"].lower() in msg.lower(), \
            f"Case C Failed: Evidence '{sig['evidence']}' is not a substring of input!"
    print("  [PASS] Case C: Credential harvesting detected with verified evidence.")

def test_case_d_negated_safety_advisory():
    """Case D: Negated bank safety advisory must be recognized as protective context."""
    msg = "Bank security warning: Never share your OTP, PIN, or banking password with anyone."
    res = analyze_rakshak_message(msg)

    print("Running test_case_d_negated_safety_advisory...")
    assert res["classification"] == "SAFETY_ADVISORY", \
        f"Case D Failed: Expected SAFETY_ADVISORY, got {res['classification']}"
    assert res["negation_detected"] is True, \
        "Case D Failed: Expected negation_detected=True"
    assert res["risk_level"] == "LOW", \
        f"Case D Failed: Expected LOW level, got {res['risk_level']}"
    assert res["risk_score"] <= 15, \
        f"Case D Failed: Expected score <= 15, got {res['risk_score']}"
    print("  [PASS] Case D: Negated safety advisory recognized as LOW risk.")

def test_case_e_benign_ordinary_message():
    """Case E: Benign routine statement message must return low risk with no invented threats."""
    msg = "Your monthly account statement is ready. Open your official banking app to review it."
    res = analyze_rakshak_message(msg)

    print("Running test_case_e_benign_ordinary_message...")
    assert res["risk_level"] == "LOW", \
        f"Case E Failed: Expected LOW risk, got {res['risk_level']}"
    assert res["risk_score"] <= 10, \
        f"Case E Failed: Expected score <= 10, got {res['risk_score']}"
    assert len(res["detected_signals"]) == 0, \
        f"Case E Failed: Expected 0 threat signals for benign statement, got {len(res['detected_signals'])}"
    print("  [PASS] Case E: Benign statement returned low risk and 0 threat signals.")

def test_case_f_stale_result_regression():
    """Case F: Simulates analyzing a high-risk message followed by switching to generic reward."""
    print("Running test_case_f_stale_result_regression...")
    high_risk_msg = "Earn ₹75,000 daily from home. Let us use your bank account to receive payments and forward the money to our clients. You will earn a commission for each transfer."
    res_high = analyze_rakshak_message(high_risk_msg)
    assert res_high["classification"] == "MULE_RECRUITMENT"
    assert res_high["risk_score"] >= 90

    # User now selects Case A generic reward
    generic_reward_msg = "Congratulations! You have been selected for a special reward. Review the offer details to learn more."
    res_generic = analyze_rakshak_message(generic_reward_msg)

    # Verify state isolation: Case A result MUST NOT reuse Case B's score, classification, or signals
    assert res_generic["classification"] != res_high["classification"], \
        "Case F Failed: Generic reward incorrectly inherited MULE_RECRUITMENT classification!"
    assert res_generic["risk_score"] != res_high["risk_score"], \
        "Case F Failed: Generic reward incorrectly inherited critical risk score!"
    assert res_generic["risk_score"] < 50, \
        f"Case F Failed: Generic reward score should be < 50, got {res_generic['risk_score']}"
    
    # Check that high risk signal names do not leak into generic response
    high_signal_names = {s["name"] for s in res_high["detected_signals"]}
    generic_signal_names = {s["name"] for s in res_generic["detected_signals"]}
    assert not (high_signal_names & generic_signal_names), \
        f"Case F Failed: Threat signals leaked across evaluations: {high_signal_names & generic_signal_names}"
    print("  [PASS] Case F: Stale results regression test passed — results are strictly isolated.")

def test_case_g_input_result_consistency():
    """Case G: Tests that evaluated snippet and response schema maintain strict consistency."""
    print("Running test_case_g_input_result_consistency...")
    custom_msg = "Urgent SBI KYC Update required. Send your OTP and NetBanking PIN immediately to activate your account and claim bonus points."
    res = analyze_rakshak_message(custom_msg)

    # Verify valid output schema
    required_keys = [
        "risk_score", "risk_level", "classification", "classification_label",
        "confidence", "threat_severity", "detected_signals", "negation_detected",
        "explanation", "recommended_action", "needs_review", "evaluated_text_snippet"
    ]
    for key in required_keys:
        assert key in res, f"Case G Failed: Missing required schema key '{key}' in response!"

    assert isinstance(res["risk_score"], int) and 0 <= res["risk_score"] <= 100
    assert isinstance(res["confidence"], (int, float)) and 0.0 <= res["confidence"] <= 1.0
    assert isinstance(res["detected_signals"], list)
    assert res["evaluated_text_snippet"].startswith(custom_msg[:30])

    for sig in res["detected_signals"]:
        assert "evidence" in sig and "explanation" in sig and "severity" in sig and "category" in sig
        assert sig["evidence"].lower() in custom_msg.lower()

    print("  [PASS] Case G: Output schema and evidence consistency strictly validated.")

if __name__ == "__main__":
    print("=" * 80)
    print("EXECUTING RAKSHAK AUTOMATED TEST SUITE (CASES A - G)")
    print("=" * 80)
    test_case_a_generic_reward()
    test_case_b_explicit_mule_recruitment()
    test_case_c_credential_harvesting()
    test_case_d_negated_safety_advisory()
    test_case_e_benign_ordinary_message()
    test_case_f_stale_result_regression()
    test_case_g_input_result_consistency()
    print("=" * 80)
    print("ALL TESTS PASSED SUCCESSFULLY! (7/7)")
    print("=" * 80)
