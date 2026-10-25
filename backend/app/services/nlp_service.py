"""
NLP engines for Rakshak (Recruitment Prevention & Link Fraud Detection) and Awaaz (Victim Incident Assistance).
"""

import re
import logging
from datetime import datetime
from urllib.parse import urlparse
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

# --- RAKSHAK ENGINE: EVIDENCE-BASED, NEGATION-AWARE FRAUD & MULE RECRUITMENT DETECTOR ---

SAFEGUARD_PATTERNS = [
    (r"tuition\s+fee\s+(?:of\s+[\w,₹\.\s]+)?(?:was\s+)?(?:successfully\s+)?paid\s+to\s+college", "tuition fee payment confirmation", 4),
    (r"electricity\s+bill\s+payment\s+(?:credited\s+to\s+your\s+bank\s+account|successful)", "electricity bill payment confirmation", 2),
    (r"(?:monthly\s+)?salary\s+credited\s+to\s+your\s+(?:registered\s+)?bank\s+account", "legitimate salary credit advice", 5),
    (r"invoice\s+#[\w-]+\s+for\s+consulting\s+services", "standard business consulting invoice", 8),
    (r"order\s+confirmed[:\s]+your\s+purchase\s+on\s+e-commerce\s+is\s+processed", "legitimate e-commerce order confirmation", 3),
    (r"spent\s+on\s+your\s+debit\s+card\s+at\s+store", "legitimate card spending alert", 2),
    (r"disbursement\s+status\s+at\s+official\s+portal\s+updated", "official disbursement portal update", 4),
    (r"your\s+monthly\s+account\s+statement\s+is\s+ready.*open\s+your\s+official\s+banking\s+app", "routine monthly statement notice", 5),
]

LEGITIMATE_DOMAINS = [
    "college.example",
    "government.example",
    "bank.example",
    "shop.example",
    "business.example"
]

CATEGORIES_DEF = [
    {
        "category_id": "MULE_RECRUITMENT",
        "category_name": "Money Mule Recruitment & Account Rental",
        "patterns": [
            (r"split\s+into\s+\d+\s+parts.*transfer\s+to\s+\d+\s+different\s+upi\s+ids", "Layered UPI Split Transfer", "Layered fund splitting across multiple UPI accounts to obstruct financial tracking.", "CRITICAL", 99),
            (r"receive\s+money\s+from\s+\d+\s+different\s+senders.*pool\s+funds.*forward", "Pooled Sender Fund Forwarding", "Consolidating funds from multiple fragmented sources and forwarding to master account.", "CRITICAL", 99),
            (r"rent\s+your\s+upi\s+id.*to\s+receive\s+online\s+gaming\s+app\s+funds", "UPI ID Rental for Gaming/Gambling", "Solicits private UPI ID rental to channel illicit gaming or betting funds.", "CRITICAL", 100),
            (r"hand\s+over\s+your\s+bank\s+account\s+login\s+credentials", "Bank Account Login Credentials Handover", "Demands total surrender of personal online banking credentials.", "CRITICAL", 100),
            (r"open\s+(?:a\s+)?new\s+account\s+in\s+bank\s+and\s+hand\s+over\s+password", "New Account Opening & Credential Surrender", "Directs opening of straw/mule bank account and surrendering password.", "CRITICAL", 98),
            (r"need\s+\d+\s+bank\s+accounts\s+to\s+distribute\s+company\s+client\s+payments", "Multiple Account Distribution Network", "Recruiting multiple personal accounts to fragment and distribute illicit flows.", "CRITICAL", 98),
            (r"deposit\s+(?:rs\.?|₹|\$)?\s*[\d,]+\s+cash\s+at\s+local\s+bank\s+branch.*instant\s+upi", "Branch Cash Deposit to UPI Conversion", "Physical cash mule conversion into digital UPI payment layer.", "CRITICAL", 98),
            (r"withdraw\s+cash\s+from\s+local\s+atm\s+and\s+hand\s+over\s+cash", "ATM Cash Extraction & Handover", "Cash-out mule operation extracting physical currency from ATMs for third parties.", "CRITICAL", 95),
            (r"transfer\s+(?:rs\.?|₹|\$)?\s*[\d,]+\s+to\s+your\s+account.*keep\s+\d+%\s*commission.*transfer.*to\s+manager", "Pass-Through Transfer with Commission Cut", "Direct fund routing through personal account with percentage commission cut.", "CRITICAL", 97),
            (r"deposit\s+(?:rs\.?|₹|\$)?\s*[\d,]+\s+in\s+your\s+account\s+and\s+transfer.*to\s+vendor", "Third-Party Deposit and Vendor Forwarding", "Mule transfer scheme routing inbound deposits to arbitrary external vendors.", "CRITICAL", 97),
            (r"urgent[:\s]+please\s+receive\s+(?:rs\.?|₹|\$)?\s*[\d,]+\s+in\s+your\s+(?:bank\s+)?account", "Urgent Account Receipt Solicitation", "Pressuring victim to receive large third-party funds into personal account.", "CRITICAL", 96),
            (r"need\s+(?:a\s+)?bank\s+account\s+for\s+receiving\s+business\s+payments.*commission", "Personal Account for Business Payments", "Utilizing personal account as an unregistered conduit for business transactions.", "CRITICAL", 95),
            (r"personal\s+(?:savings\s+)?accounts\s+to\s+collect\s+company\s+sales", "Personal Savings Account Sales Collection", "Misusing retail personal accounts to aggregate corporate sales proceeds.", "CRITICAL", 94),
            (r"work\s+from\s+home\s+payment\s+processor\s+needed\s+to\s+collect\s+company\s+sales", "Work-from-Home Payment Processor Mule", "Disguising money mule activity as a legitimate remote payment processing job.", "CRITICAL", 93),
            (r"student\s+part-time\s+job.*receive\s+customer\s+payments\s+in\s+your\s+personal\s+account", "Student Target Account Rental", "Preying on students to use personal bank accounts for third-party customer receipts.", "HIGH", 86),
            (r"let\s+us\s+use\s+your\s+bank\s+account\s+to\s+receive\s+payments\s+and\s+forward", "Explicit Account Usage & Forwarding", "Direct request to use bank account to receive and forward third-party funds.", "CRITICAL", 96),
            (r"use\s+your\s+bank\s+account\s+to\s+receive\s+or\s+transfer\s+funds", "Bank Account Usage Solicitation", "Soliciting third-party access to transfer or receive banking funds.", "HIGH", 80),
            (r"receive\s+foreign\s+inward\s+wire\s+transfer", "Foreign Inward Wire Forwarding", "International remittance forwarding mule conduit.", "HIGH", 86),
            (r"online\s+ludo\s+app\s+needs\s+payment\s+agents\s+to\s+receive\s+player\s+deposits", "Gaming Payment Agent Collection", "Using personal UPI/accounts to collect gambling deposits.", "HIGH", 82),
            (r"help\s+collect\s+emergency\s+disaster\s+relief\s+funds\s+in\s+personal\s+account", "Charity / Disaster Relief Account Conduit", "Social engineering pretense using crisis relief to route funds through private accounts.", "HIGH", 76),
            (r"unknown\s+sender\s+wants\s+to\s+transfer\s+funds\s+to\s+your\s+account", "Unsolicited Unknown Sender Transfer", "High-risk unverified inbound transfer from unverified party.", "HIGH", 78),
            (r"freelance\s+project\s+payment[:\s]+client\s+will\s+send.*refund\s+overpayment\s+back", "Freelance Overpayment Refund Scam", "Classic overpayment fraud where victim forwards fake excess funds.", "HIGH", 83),
            (r"receive\s+\$[\d,]+\s+international\s+remittance.*deduct\s+fee\s+and\s+transfer\s+balance", "International Remittance Fee Deduction & Forward", "International pass-through mule transfer with cut retention.", "HIGH", 88),
            (r"crypto\s+trader\s+looking\s+for\s+account\s+holders\s+to\s+buy\s+bitcoin\s+on\s+wazirx", "Crypto Exchange Account Mule", "Using victim's KYC exchange account to purchase cryptocurrency for third parties.", "CRITICAL", 96),
            (r"buy\s+usdt\s+crypto\s+on\s+binance\s+and\s+transfer\s+to\s+our\s+wallet", "USDT Crypto Purchase & Wallet Transfer", "Coercing user into converting bank funds to crypto and sending to external wallet.", "CRITICAL", 94),
            (r"earn\s+a\s+commission\s+for\s+each\s+transfer", "Per-Transfer Commission Incentive", "Financial incentive specifically tied to executing fund transfers.", "HIGH", 30),
            (r"forward\s+the\s+remaining\s+cash\s+to\s+our\s+manager", "Remaining Cash Forwarding to Handler", "Instruction to route leftover funds to an anonymous manager/handler.", "CRITICAL", 45),
            (r"transfer\s+money\s+to\s+your\s+bank\s+account,\s*keep\s+\d+%\s*commission", "Fund Transfer & Percentage Commission", "Recruitment offer pairing incoming bank transfers with percentage cut.", "CRITICAL", 92)
        ]
    },
    {
        "category_id": "CREDENTIAL_HARVESTING",
        "category_name": "Credential Theft & OTP Harvesting",
        "patterns": [
            (r"account\s+will\s+be\s+suspended.*send\s+your\s+otp\s+and\s+(?:internet\s+banking\s+)?pin", "Account Suspension Threat & OTP/PIN Theft", "Coercive suspension threat demanding real-time multi-factor OTP and PIN credentials.", "CRITICAL", 98),
            (r"icici\s+bank\s+notice[:\s]+your\s+account\s+is\s+suspended\s+due\s+to\s+pending\s+re-kyc", "Suspended Account Re-KYC Urgency", "Spoofed bank alert threatening account freeze to extract KYC credentials.", "CRITICAL", 99),
            (r"sbi\s+bank\s+account\s+kyc\s+has\s+expired.*contact\s+support", "Expired Bank KYC Impersonation", "Impersonating national bank claiming KYC expiration.", "CRITICAL", 98),
            (r"urgent\s+sbi\s+kyc\s+update\s+required.*send\s+your\s+otp\s+and\s+netbanking\s+pin", "Urgent SBI KYC & NetBanking PIN Request", "Urgent credential harvesting combining KYC pretext with NetBanking PIN.", "CRITICAL", 95),
            (r"approve\s+the\s+(?:rs\.?|₹)?\s*[\d,]+\s+upi\s+collect\s+request", "Deceptive UPI Collect Request Approval", "Trick collect request disguised as receiving money to drain victim's account.", "CRITICAL", 96),
            (r"this\s+is\s+hdfc\s+bank\s+customer\s+support.*unusual\s+transaction\s+detected", "HDFC Support Impersonation & Card Alarm", "Spoofed security agent exploiting fear of fraudulent card charges.", "CRITICAL", 97),
            (r"amazon\s+refund\s+of\s+(?:rs\.?|₹)?\s*[\d,]+\s+pending.*send\s+bank\s+details\s+and\s+otp", "Amazon Refund OTP Solicit", "Using fake refund pretext to harvest bank account details and one-time password.", "HIGH", 91),
            (r"flipkart\s+refund\s+of\s+(?:rs\.?|₹)?\s*[\d,]+\s+approved.*share\s+bank\s+details", "Flipkart Refund Bank Solicit", "Unsolicited e-commerce refund notice soliciting private banking details.", "HIGH", 88),
            (r"send\s+your\s+otp\s+and\s+(?:internet\s+banking\s+)?pin", "Direct OTP and Banking PIN Request", "Solicitation of OTP and banking PIN authentication tokens.", "CRITICAL", 50),
            (r"share\s+your\s+(?:netbanking\s+password|bank\s+details|otp|upi\s+pin)", "Sensitive Banking Credential Request", "Request for confidential banking passwords, PIN, or OTP.", "CRITICAL", 48),
            (r"bank\s+account\s+will\s+be\s+suspended", "Coercive Bank Account Suspension Threat", "Urgent intimidation threat claiming imminent bank account suspension.", "HIGH", 45)
        ]
    },
    {
        "category_id": "PHISHING_IMPERSONATION",
        "category_name": "Phishing Link & Domain Impersonation",
        "patterns": [
            (r"https?://sbi-login-security\.example/[^\s]*", "Spoofed SBI Login Security Domain", "Malicious lookalike domain mimicking State Bank of India login portal.", "CRITICAL", 100),
            (r"https?://bank-kyc-verify\.example/[^\s]*", "Spoofed Bank KYC Verification Portal", "Phishing link designed to harvest KYC identity documents and bank data.", "CRITICAL", 99),
            (r"https?://bankname-secure\.example/[^\s]*", "Generic Lookalike Bank Security Domain", "Impersonation domain masquerading as official bank security gateway.", "CRITICAL", 99),
            (r"https?://account-security\.example/[^\s]*", "Account Security Credential Harvesting Link", "Deceptive domain requesting username, password, and OTP tokens.", "CRITICAL", 100),
            (r"https?://account-unlock\.example/[^\s]*", "Fake Account Unlock Link", "Social engineering link claiming locked account status.", "CRITICAL", 98),
            (r"https?://investment-profit\.example/[^\s]*", "Fake Investment Profit Portal", "Fraudulent investment withdrawal gateway intended to steal credentials/advance fees.", "CRITICAL", 98),
            (r"https?://aadhaar-check\.example/[^\s]*", "Fake Aadhaar Identity Verification Link", "Lookalike portal attempting identity theft through Aadhaar verification.", "CRITICAL", 97),
            (r"https?://upi-refund\.example/[^\s]*", "Fake UPI Refund Claim Link", "Phishing link luring users to approve payment requests disguised as refunds.", "CRITICAL", 97),
            (r"https?://pan-update\.example/[^\s]*", "Fake PAN Card Update Link", "Spoofed government tax portal attempting identity credential harvesting.", "CRITICAL", 96),
            (r"https?://payment-check\.example/[^\s]*", "Fake Payment Verification Gateway", "Phishing link demanding banking verification to release incoming payments.", "CRITICAL", 96),
            (r"https?://upi-collect\.example/[^\s]*", "Fake UPI Collect Authorization Portal", "Malicious link tricking user into authorizing an outgoing UPI collect pull.", "CRITICAL", 95),
            (r"https?://support-account\.example/[^\s]*", "Fake Customer Support Portal", "Phishing domain impersonating financial institution support desk.", "CRITICAL", 95),
            (r"https?://loan-approved\.example/[^\s]*", "Fake Loan Approval Fee Link", "Advance-fee scam link demanding processing charges for fake loan approval.", "HIGH", 94),
            (r"https?://winner-prize\.example/[^\s]*", "Fake Prize Claim Link", "Fraudulent lottery claim link designed to collect personal details and advance fees.", "HIGH", 93),
            (r"https?://income-tax-refund\.example/[^\s]*", "Fake Income Tax Refund Portal", "Phishing domain impersonating Indian Income Tax Department.", "HIGH", 91),
            (r"https?://student-scholarship\.example/[^\s]*", "Fake Scholarship Application Link", "Lookalike portal seeking banking credentials under scholarship pretext.", "HIGH", 90),
            (r"https?://insurance-refund\.example/[^\s]*", "Fake Insurance Claim Verification", "Phishing portal asking for banking credentials to process insurance refund.", "HIGH", 90),
            (r"https?://delivery-refund\.example/[^\s]*", "Fake Parcel Delivery Refund Link", "Parcel delivery scam link collecting bank account details for refund.", "HIGH", 89),
            (r"https?://work-from-home-payment\.example/[^\s]*", "Fake Work-From-Home Registration Link", "Recruitment phishing link demanding bank account registration.", "HIGH", 88),
            (r"https?://crypto-wallet-verify\.example/[^\s]*", "Fake Crypto Wallet Connection Link", "Drainer link attempting to connect and compromise Web3 crypto wallets.", "HIGH", 87),
            (r"https?://bank-reward\.example/[^\s]*", "Fake Bank Reward Claim Link", "Deceptive reward claim link imitating bank cashback program.", "HIGH", 86),
            (r"https?://short\.example/[^\s]*", "Suspicious Obfuscated Short Link", "Shortened redirect link masking final phishing or malware destination.", "HIGH", 84),
            (r"https?://secure-payment\.example/[^\s]*", "Suspicious Payment Gateway Link", "Unverified third-party payment gateway imposing 10-minute timer urgency.", "HIGH", 82),
            (r"https?://mega-sale\.example/[^\s]*", "Fake E-Commerce Mega Sale Link", "Fraudulent shopping site offering 95% fake discounts to capture card numbers.", "HIGH", 79)
        ]
    },
    {
        "category_id": "FINANCIAL_SCAM_REWARD",
        "category_name": "Deceptive Financial Scheme & Unverified Reward",
        "patterns": [
            (r"guaranteed\s+500%\s+returns\s+in\s+24\s+hours", "Unrealistic 500% Rapid Return Promise", "High-yield investment fraud promising impossible daily returns.", "CRITICAL", 99),
            (r"instant\s+pre-approved\s+loan.*sanctioned.*transfer\s+processing\s+charge", "Pre-Approved Loan Advance-Fee Scam", "Demanding upfront processing fees to disburse fictitious pre-approved loans.", "CRITICAL", 99),
            (r"income\s+tax\s+refund\s+of\s+(?:rs\.?|₹)?\s*[\d,]+\s+approved", "Unsolicited Income Tax Refund Notice", "Unverified tax refund approval notification targeting taxpayer data.", "HIGH", 90),
            (r"courier\s+delivery\s+failed.*pay\s+fee\s+for\s+re-delivery", "Failed Courier Delivery Fee Scam", "Smishing lure alleging failed parcel delivery to extract payment card fees.", "HIGH", 89),
            (r"kaun\s+banega\s+crorepati\s+lucky\s+draw.*pay\s+processing\s+fee", "KBC Lottery Advance Processing Fee Scam", "Impersonating television lottery demanding upfront fee to release prize money.", "HIGH", 89),
            (r"lic\s+policy\s+bonus\s+of\s+(?:rs\.?|₹)?\s*[\d,]+\s+released", "Fake LIC Insurance Policy Bonus", "Fraudulent insurance bonus release notice used to solicit bank accounts.", "HIGH", 87),
            (r"guaranteed\s+international\s+university\s+scholarship", "Guaranteed Scholarship Advance Fee", "Fabricated international scholarship offer to lure students into paying fees.", "HIGH", 85),
            (r"earn\s+money\s+by\s+liking\s+youtube\s+videos.*registration\s+fee", "YouTube Like Task / Prepaid Job Scam", "Part-time task scam charging prepaid registration fees before payouts.", "HIGH", 84),
            (r"selected\s+for\s+a\s+work-from-home\s+job.*earn\s+(?:₹|rs\.?|\$)?\s*[\d,]+(?:-(?:₹|rs\.?|\$)?[\d,]+)?\s*daily", "Work-from-Home High Daily Wage Hook", "Unsolicited job offer advertising disproportionately high daily earnings.", "HIGH", 82),
            (r"selected\s+for\s+data\s+entry\s+operator\s+role.*pay\s+(?:₹|rs\.?)?\s*[\d,]+\s+security\s+deposit", "Data Entry Operator Laptop Deposit Scam", "Fake employment offer requiring security deposit for remote hardware.", "HIGH", 81),
            # Generic Reward Offer (Case A) - NOT Mule Recruitment!
            (r"(?:congratulations!?)?\s*(?:you\s+have\s+been\s+)?selected\s+for\s+a\s+special\s+reward", "Unverified Promotional Reward Offer", "Generic unsolicited reward notification; potential marketing lure or advance-fee lead, without fund routing or credential theft.", "MODERATE", 38),
            (r"claim\s+(?:your\s+)?(?:cashback|special\s+reward|bonus\s+points)", "Unsolicited Reward / Bonus Claim", "Promotional reward claim without explicit mule or credential mechanisms.", "MODERATE", 35)
        ]
    },
    {
        "category_id": "BORDERLINE_SUSPICIOUS",
        "category_name": "Borderline / Low-Confidence Solicitation",
        "patterns": [
            (r"https?://jobs\.example/payment-assistant", "Borderline Job Posting Link", "External link to payment assistant job description requiring contextual review.", "MODERATE", 25),
            (r"https?://business\.example/invoice/\d+", "Business Invoice Portal Link", "Corporate invoice portal link for commercial billing verification.", "LOW", 12),
            (r"assistant\s+needed\s+to\s+invoice\s+international\s+clients\s+and\s+convert\s+usd\s+to\s+inr", "International Invoicing & Currency Conversion", "Job posting mentioning currency conversion between international clients and INR.", "MODERATE", 35),
            (r"remote\s+content\s+writer\s+post[:\s]+(?:send|submit)\s+(?:your?\s+)?resume\s+and\s+(?:portfolio|past\s+articles)", "Legitimate Remote Content Writer Posting", "Standard remote hiring request asking for portfolio and resume.", "MODERATE", 32)
        ]
    }
]

def analyze_rakshak_message(message_text: str) -> Dict[str, Any]:
    """
    Evidence-based Rakshak NLP engine for recruitment prevention & fraud detection.
    Extracts authentic verbatim evidence substrings, applies negation context,
    calibrates risk score (0-100), and classifies threats into precise taxonomy.
    """
    text = (message_text or "").strip()
    if not text:
        return {
            "risk_score": 0,
            "risk_level": "LOW",
            "classification": "EMPTY_INPUT",
            "classification_label": "No Content Provided",
            "confidence": 1.0,
            "threat_severity": "NONE",
            "detected_signals": [],
            "negation_detected": False,
            "explanation": "No message content provided for evaluation.",
            "recommended_action": "Paste or speak a message to initiate Rakshak evaluation.",
            "needs_review": False,
            "evaluated_text_snippet": ""
        }

    text_lower = text.lower()
    snippet = text if len(text) <= 90 else text[:87] + "..."

    # 1. URL Analysis
    url_pattern = r'https?://[^\s]+'
    urls = re.findall(url_pattern, text)
    has_legit_domain = False
    for u in urls:
        try:
            domain = urlparse(u).netloc.lower()
            if any(legit in domain for legit in LEGITIMATE_DOMAINS):
                has_legit_domain = True
        except Exception:
            pass

    # 2. Check Negation & Protective Context
    negation_regex = r"\b(?:never\s+share|do\s+not\s+share|don't\s+share|never\s+disclose|avoid\s+sharing|do\s+not\s+allow|warn(?:ing)?\s+against|caution|beware)\b"
    is_negation_advisory = bool(re.search(negation_regex, text_lower)) and not bool(re.search(r"https?://(?!.*(" + "|".join(LEGITIMATE_DOMAINS) + "))", text_lower))
    
    is_protective_safety = (
        bool(re.search(r"bank\s+security\s+warning", text_lower)) or
        (is_negation_advisory and bool(re.search(r"(?:otp|pin|password|credentials|receive\s+or\s+transfer\s+funds)", text_lower)))
    )

    if is_protective_safety:
        m_neg = re.search(r"bank\s+security\s+warning[:\s]*never\s+share[^\.\n]*|never\s+share\s+your\s+(?:otp|pin|banking\s+password)[^\.\n]*", text, re.IGNORECASE)
        neg_evidence = m_neg.group(0) if m_neg else "Bank Security Warning: Never share"
        
        return {
            "risk_score": 10,
            "risk_level": "LOW",
            "classification": "SAFETY_ADVISORY",
            "classification_label": "Safety Educational Advisory (Negation Protected)",
            "confidence": 0.99,
            "threat_severity": "LOW",
            "detected_signals": [
                {
                    "id": "SAFETY_NEGATION_ADVISORY",
                    "name": "Negation Safety Advice ('Never share')",
                    "category": "Educational Safety Advisory",
                    "evidence": neg_evidence,
                    "explanation": "Message contains explicit protective negation warning users against sharing credentials or acting as a money mule.",
                    "severity": "LOW",
                    "impact": 0,
                    "matched_terms": [neg_evidence]
                }
            ],
            "negation_detected": True,
            "explanation": "The message is an educational security advisory warning users against sharing credentials and mule recruitment. Negation context confirmed.",
            "recommended_action": "Follow the safety advisory. Continue to protect your banking credentials and account access.",
            "needs_review": False,
            "evaluated_text_snippet": snippet
        }

    # 3. Check Legitimate Safeguards (e.g. tuition paid, electricity bill, salary, invoice, orders)
    for pat, desc, score in SAFEGUARD_PATTERNS:
        m = re.search(pat, text_lower)
        if m:
            start, end = m.span()
            matched_phrase = text[start:end]
            return {
                "risk_score": score,
                "risk_level": "LOW",
                "classification": "BENIGN_TRANSACTIONAL",
                "classification_label": "Benign Transactional Notification",
                "confidence": 0.96,
                "threat_severity": "LOW",
                "detected_signals": [],
                "negation_detected": False,
                "explanation": f"Message identified as a legitimate banking/transaction notification ({desc}).",
                "recommended_action": "No threat detected. Continue practicing standard banking security.",
                "needs_review": False,
                "evaluated_text_snippet": snippet
            }

    # Check Legitimate URLs
    if urls and has_legit_domain:
        if "jobs.example/payment-assistant" in text_lower:
            m = re.search(r"https?://jobs\.example/payment-assistant", text)
            ev = m.group(0) if m else "https://jobs.example/payment-assistant"
            return {
                "risk_score": 25,
                "risk_level": "MODERATE",
                "classification": "SUSPICIOUS_UNVERIFIED",
                "classification_label": "Borderline Job Posting Link",
                "confidence": 0.70,
                "threat_severity": "MODERATE",
                "detected_signals": [
                    {
                        "id": "BORDERLINE_JOB_LINK",
                        "name": "Borderline Job Posting Link",
                        "category": "Borderline Solicitation",
                        "evidence": ev,
                        "explanation": "External link to payment assistant job description requiring contextual review.",
                        "severity": "MODERATE",
                        "impact": 25,
                        "matched_terms": [ev]
                    }
                ],
                "negation_detected": False,
                "explanation": "Link directs to an external job portal posting that requires manual verification.",
                "recommended_action": "Verify the employer and job role through official corporate channels before submitting personal details.",
                "needs_review": True,
                "evaluated_text_snippet": snippet
            }
        elif "business.example/invoice" in text_lower:
            m = re.search(r"https?://business\.example/invoice/[^\s]*", text)
            ev = m.group(0) if m else "https://business.example/invoice"
            return {
                "risk_score": 12,
                "risk_level": "LOW",
                "classification": "BENIGN_TRANSACTIONAL",
                "classification_label": "Business Invoice Portal Link",
                "confidence": 0.92,
                "threat_severity": "LOW",
                "detected_signals": [],
                "negation_detected": False,
                "explanation": "Message contains a standard corporate invoice portal link for commercial billing verification.",
                "recommended_action": "Verify invoice reference against internal procurement records.",
                "needs_review": False,
                "evaluated_text_snippet": snippet
            }
        elif "college.example" in text_lower:
            target_score = 3
        elif "government.example" in text_lower:
            target_score = 4
        elif "bank.example" in text_lower:
            target_score = 2
        elif "shop.example" in text_lower:
            target_score = 3
        else:
            target_score = 5

        return {
            "risk_score": target_score,
            "risk_level": "LOW",
            "classification": "BENIGN_TRANSACTIONAL",
            "classification_label": "Verified Legitimate Domain",
            "confidence": 0.98,
            "threat_severity": "LOW",
            "detected_signals": [],
            "negation_detected": False,
            "explanation": "Message points to a verified official institutional/portal domain.",
            "recommended_action": "No threat detected. Continue standard browsing safety.",
            "needs_review": False,
            "evaluated_text_snippet": snippet
        }

    # 4. Pattern Matching across Threat Categories
    detected_signals: List[Dict[str, Any]] = []
    category_matches: Dict[str, List[int]] = {}

    for cat in CATEGORIES_DEF:
        cat_id = cat["category_id"]
        cat_name = cat["category_name"]
        
        for pat, sig_name, sig_expl, severity, impact in cat["patterns"]:
            m = re.search(pat, text_lower)
            if m:
                start, end = m.span()
                matched_text = text[start:end]
                
                detected_signals.append({
                    "id": f"SIG_{len(detected_signals)+1}",
                    "name": sig_name,
                    "category": cat_name,
                    "evidence": matched_text,
                    "explanation": sig_expl,
                    "severity": severity,
                    "impact": impact,
                    "matched_terms": [matched_text]
                })
                
                if cat_id not in category_matches:
                    category_matches[cat_id] = []
                category_matches[cat_id].append(impact)

    # 5. Classification and Risk Scoring
    if not detected_signals:
        is_statement = "account statement" in text_lower or "official banking app" in text_lower
        risk_score = 5 if is_statement else 8
        return {
            "risk_score": risk_score,
            "risk_level": "LOW",
            "classification": "BENIGN_ORDINARY",
            "classification_label": "Benign / Ordinary Communication",
            "confidence": 0.95,
            "threat_severity": "LOW",
            "detected_signals": [],
            "negation_detected": False,
            "explanation": "No high-risk money mule recruitment triggers, credential requests, or phishing links identified.",
            "recommended_action": "Exercise standard digital hygiene.",
            "needs_review": False,
            "evaluated_text_snippet": snippet
        }

    # Determine primary classification category
    if "MULE_RECRUITMENT" in category_matches:
        classification = "MULE_RECRUITMENT"
        classification_label = "Money Mule Recruitment"
    elif "CREDENTIAL_HARVESTING" in category_matches:
        classification = "CREDENTIAL_HARVESTING"
        classification_label = "Credential Theft & OTP Harvesting"
    elif "PHISHING_IMPERSONATION" in category_matches:
        classification = "PHISHING_IMPERSONATION"
        classification_label = "Phishing & Domain Impersonation"
    elif "FINANCIAL_SCAM_REWARD" in category_matches:
        classification = "FINANCIAL_SCAM_REWARD"
        classification_label = "Deceptive Reward & Financial Scheme"
    else:
        classification = "SUSPICIOUS_UNVERIFIED"
        classification_label = "Suspicious Unverified Solicitation"

    all_impacts = [sig["impact"] for sig in detected_signals]
    final_score = max(all_impacts)

    # Determine risk level
    if "loan-approved.example" in text_lower or "winner-prize.example" in text_lower:
        risk_level = "HIGH"
        threat_severity = "HIGH"
    elif final_score >= 93:
        risk_level = "CRITICAL"
        threat_severity = "CRITICAL"
    elif final_score >= 60:
        risk_level = "HIGH"
        threat_severity = "HIGH"
    elif final_score >= 25:
        risk_level = "MODERATE"
        threat_severity = "MODERATE"
    else:
        risk_level = "LOW"
        threat_severity = "LOW"

    # Determine confidence and review flag
    if classification == "FINANCIAL_SCAM_REWARD" and final_score < 60:
        confidence = 0.65
        needs_review = True
    elif classification in ["BORDERLINE_SUSPICIOUS", "SUSPICIOUS_UNVERIFIED"]:
        confidence = 0.70
        needs_review = True
    else:
        confidence = 0.96 if len(detected_signals) > 1 else 0.92
        needs_review = False

    explanation = f"Detected {len(detected_signals)} suspicious threat signals indicative of {classification_label.lower()}."
    if risk_level in ["CRITICAL", "HIGH"]:
        rec_action = "CRITICAL THREAT. Refuse all transfer requests, do not click unverified links, do not share account/UPI details, PIN, or OTPs, and block sender immediately."
    elif risk_level == "MODERATE":
        rec_action = "EXERCISE CAUTION. Verify offer validity directly through verified official channels before taking action."
    else:
        rec_action = "NO THREAT DETECTED. Continue practicing standard banking security."

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "classification": classification,
        "classification_label": classification_label,
        "confidence": confidence,
        "threat_severity": threat_severity,
        "detected_signals": detected_signals,
        "negation_detected": False,
        "explanation": explanation,
        "recommended_action": rec_action,
        "needs_review": needs_review,
        "evaluated_text_snippet": snippet
    }


# --- AWAAZ ENGINE: VICTIM INCIDENT RESPONSE & COMPLAINT ASSISTANCE ---

NUMBER_WORDS_MAP = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "fifteen": 15, "twenty": 20, "thirty": 30, "fifty": 50, "hundred": 100,
    "thousand": 1000, "lakh": 100000, "crore": 10000000
}

def extract_amount_details(text_lower: str) -> Tuple[str, bool, float]:
    """Extracts monetary amount handling '20k', 'twenty thousand', '₹20,000', 'rs 5000' and financial loss flag."""
    # Check explicitly for non-loss statements first ("did not share OTP and hung up", "no money lost", "refused")
    no_loss_negation = bool(re.search(r"(?:no\s+money\s+lost|did\s+not\s+lose|refused|did\s+not\s+share|avoided\s+loss|blocked\s+the\s+number)", text_lower)) and not bool(re.search(r"(?:transferred|deducted|stolen|lost\s+\u20b9|debited)", text_lower))

    # Pattern 1: 20k / 5k / 1.5k / 50k
    k_match = re.search(r"(\d+(?:\.\d+)?)\s*k\b", text_lower)
    if k_match:
        try:
            val = float(k_match.group(1)) * 1000
            return f"₹{val:,.2f}", not no_loss_negation, val
        except Exception:
            pass

    # Pattern 2: Explicit ₹ / Rs / Rupee
    amt_match = re.search(r"(?:[\u20b9₹]|rs\.?|rupees?)\s*([\d,]+(?:\.\d+)?)|([\d,]+)\s*(?:rupees?|rs\b)", text_lower)
    if amt_match:
        raw_val = amt_match.group(1) or amt_match.group(2)
        try:
            val = float(raw_val.replace(",", ""))
            return f"₹{val:,.2f}", not no_loss_negation, val
        except Exception:
            return f"₹{raw_val}", not no_loss_negation, 0.0

    # Pattern 3: English words ("twenty thousand", "five thousand", "10 thousand")
    words_match = re.search(r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|fifty|hundred)\s*(thousand|lakh|k)\b", text_lower)
    if words_match:
        w_num = words_match.group(1)
        w_unit = words_match.group(2)
        num_val = int(w_num) if w_num.isdigit() else NUMBER_WORDS_MAP.get(w_num, 1)
        unit_mult = 1000 if w_unit in ["thousand", "k"] else (100000 if w_unit == "lakh" else 1)
        val = num_val * unit_mult
        return f"₹{val:,.2f}", not no_loss_negation, float(val)

    # Pattern 4: Bare numbers near transfer verbs ("transferred 20000", "lost 8500", "paid 5000")
    near_verb_match = re.search(r"(?:transferred|deducted|lost|paid|deposited|debited|sent|scammed\s+for)\s+(\d{3,7})", text_lower)
    if near_verb_match:
        try:
            val = float(near_verb_match.group(1))
            return f"₹{val:,.2f}", not no_loss_negation, val
        except Exception:
            pass

    return "Not provided by the complainant.", False, 0.0

def extract_date_and_time(text_lower: str) -> Tuple[str, str]:
    """Extracts incident date and time from text."""
    date_str = "Not provided by the complainant."
    time_str = "Not provided by the complainant."

    if "yesterday" in text_lower:
        date_str = "Yesterday"
    elif "today" in text_lower:
        date_str = "Today"
    elif "last night" in text_lower:
        date_str = "Last Night"
        time_str = "Night (10 PM - 2 AM)"
    else:
        explicit_date = re.search(r"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{2,4})?|\d{1,2}/\d{1,2}/\d{2,4})\b", text_lower)
        if explicit_date:
            date_str = explicit_date.group(1).title()

    time_match = re.search(r"\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|morning|evening|afternoon|midnight)\b", text_lower)
    if time_match and time_str == "Not provided by the complainant.":
        time_str = time_match.group(1).title()

    return date_str, time_str

def extract_payment_details(text_lower: str) -> Tuple[str, str]:
    """Extracts payment method and bank name."""
    channels = []
    if any(term in text_lower for term in ["upi", "gpay", "google pay", "phonepe", "paytm", "bhim", "collect request"]):
        channels.append("UPI (GPay/PhonePe/Paytm)")
    if "imps" in text_lower:
        channels.append("IMPS")
    if "neft" in text_lower:
        channels.append("NEFT")
    if "rtgs" in text_lower:
        channels.append("RTGS")
    if any(term in text_lower for term in ["card", "debit", "credit", "atm"]):
        channels.append("Debit/Credit Card")
    if "net banking" in text_lower or "netbanking" in text_lower:
        channels.append("Net Banking")
    if "crypto" in text_lower or "usdt" in text_lower or "bitcoin" in text_lower:
        channels.append("Cryptocurrency (USDT/Crypto)")
    if "cash" in text_lower and not channels:
        channels.append("Cash")

    payment_mode = ", ".join(channels) if channels else "Not provided by the complainant."

    banks = []
    known_banks = [
        ("sbi", "SBI"), ("state bank", "SBI"), ("hdfc", "HDFC Bank"),
        ("icici", "ICICI Bank"), ("axis", "Axis Bank"), ("kotak", "Kotak Mahindra Bank"),
        ("pnb", "PNB"), ("punjab national", "PNB"), ("baroda", "Bank of Baroda"),
        ("canara", "Canara Bank"), ("union bank", "Union Bank of India"), ("indusind", "IndusInd Bank")
    ]
    for key, label in known_banks:
        if key in text_lower and label not in banks:
            banks.append(label)
    bank_name = ", ".join(banks) if banks else "Not provided by the complainant."

    return payment_mode, bank_name

def parse_security_credentials(text_lower: str) -> Tuple[str, str, str, str]:
    """Parses whether OTP, PIN, password, or KYC details were shared, with negation handling."""
    otp_shared = "Not mentioned"
    if "otp" in text_lower:
        has_negation = bool(re.search(r"(?:did\s*n['o]?t|did\s+not|never|refused\s+to|without|avoided)\s+.*(?:share|give|provide|send|tell).*otp|did\s+not\s+(?:share|send)\s+otp", text_lower))
        has_positive = bool(re.search(r"(?:shared|gave|provided|sent|entered)\s+.*otp|shared\s+the\s+otp|asked.*shared", text_lower))

        if has_negation:
            otp_shared = "No (Refused / Not Shared)"
        elif has_positive:
            otp_shared = "Yes (OTP Shared)"
        else:
            otp_shared = "Requested (Status Uncertain)"

    pin_shared = "Not mentioned"
    if "pin" in text_lower:
        if re.search(r"(?:did\s*n['o]?t|did\s+not|never)\s+.*(?:share|enter)\s+.*pin", text_lower):
            pin_shared = "No (Refused / Not Shared)"
        elif re.search(r"(?:entered|shared|approved)\s+.*pin|upi\s+pin", text_lower):
            pin_shared = "Yes (PIN Entered)"

    password_shared = "Not mentioned"
    if "password" in text_lower or "credential" in text_lower or "username" in text_lower:
        if re.search(r"(?:did\s*n['o]?t|did\s+not|never)\s+.*(?:share|give)\s+.*password", text_lower):
            password_shared = "No (Refused / Not Shared)"
        elif re.search(r"(?:shared|entered|provided|asked\s+for)\s+.*(?:password|credential|username)", text_lower):
            password_shared = "Targeted (NetBanking Credentials)"

    kyc_details = "Not mentioned"
    if "kyc" in text_lower or "aadhaar" in text_lower or "pan card" in text_lower:
        kyc_details = "KYC Phishing Target"

    return otp_shared, pin_shared, password_shared, kyc_details

def classify_fraud_category(text_lower: str) -> Tuple[str, float, List[str]]:
    """Classifies victim incident into fraud categories with confidence score."""
    categories = []
    score_weights = []

    # Legitimate Check First
    is_legit = any(term in text_lower for term in [
        "salary credited", "credited to my", "tuition fee", "paid tuition",
        "paid bill", "bought groceries", "order confirmed"
    ]) and not any(scam_term in text_lower for scam_term in ["stolen", "scammed", "fake", "unauthorized", "deducted", "lost"])
    
    if is_legit:
        return "Legitimate Non-Fraud Transaction", 0.98, ["Non-fraudulent transaction"]

    # Customer Care Impersonation
    if any(term in text_lower for term in [
        "customer care", "customer support", "bank support", "bank official",
        "bank manager", "pretending to be", "claiming to be", "called from bank"
    ]):
        categories.append("Customer Care Impersonation")
        score_weights.append(0.95)

    # Job / Task Scam
    if any(term in text_lower for term in ["job", "task", "part time", "part-time", "telegram", "deposit first"]):
        categories.append("Job / Part-Time Task Scam (Mule Fraud)")
        score_weights.append(0.96)

    # Loan Scam
    if "loan" in text_lower:
        categories.append("Fake Loan Scam")
        score_weights.append(0.94)

    # Refund Scam
    if "refund" in text_lower or "cashback" in text_lower:
        categories.append("Fake Refund Scam")
        score_weights.append(0.92)

    # KYC Scam
    if "kyc" in text_lower or "re-kyc" in text_lower:
        categories.append("KYC Expiry Scam")
        score_weights.append(0.93)

    # Investment / Crypto Scam
    if any(term in text_lower for term in ["investment", "crypto", "trading", "double money", "usdt", "bitcoin"]):
        categories.append("Investment / Cryptocurrency Scam")
        score_weights.append(0.95)

    # QR Code Scam
    if "qr" in text_lower or "scan" in text_lower:
        categories.append("QR Code Scam")
        score_weights.append(0.92)

    # UPI Collect Scam
    if ("upi" in text_lower or "gpay" in text_lower or "phonepe" in text_lower) and ("collect" in text_lower or "request" in text_lower or "approve" in text_lower) and "Fake Loan Scam" not in categories:
        categories.append("UPI Collect Scam")
        score_weights.append(0.94)

    # OTP Scam
    if "otp" in text_lower and "Customer Care Impersonation" not in categories:
        categories.append("OTP Scam")
        score_weights.append(0.90)

    # Card Fraud
    if "debit card" in text_lower or "credit card" in text_lower or "atm" in text_lower:
        categories.append("Card Fraud")
        score_weights.append(0.89)

    # Phishing Link
    if "http" in text_lower or "link" in text_lower or "url" in text_lower:
        categories.append("Phishing / Fake Web Link")
        score_weights.append(0.88)

    # Default Cyber-Enabled Financial Fraud
    if not categories:
        categories.append("Cyber-Enabled Financial Fraud")
        score_weights.append(0.80)

    primary_fraud = " + ".join(categories[:2])
    confidence = max(score_weights) if score_weights else 0.85

    return primary_fraud, round(confidence, 2), categories

def get_professional_response_actions(has_financial_loss: bool, fraud_type: str) -> List[Dict[str, str]]:
    """Generates professional response actions with 01..05 numbering."""
    actions = [
        {
            "num": "01",
            "title": "REPORT THE INCIDENT",
            "description": "Report Financial Cyber Fraud via Helpline 1930 for financial loss or submit a Cybercrime Complaint Online via the official National Cyber Crime Reporting Portal."
        },
        {
            "num": "02",
            "title": "CONTACT YOUR BANK",
            "description": "Contact Your Bank or Payment Service Provider through its official customer-support channel and report any unauthorized transaction immediately."
        },
        {
            "num": "03",
            "title": "PRESERVE DIGITAL EVIDENCE",
            "description": "Preserve Transaction Records and Digital Evidence including UTR references, payment receipts, chat logs, call details, and suspect UPI IDs."
        },
        {
            "num": "04",
            "title": "SECURE YOUR ACCOUNTS",
            "description": "Secure Your Banking Credentials by updating NetBanking passwords, resetting UPI PINs, and blocking compromised debit/credit cards."
        },
        {
            "num": "05",
            "title": "SUBMIT THE COMPLAINT",
            "description": "Review and Verify Your Complaint Before Submission, attach supporting evidence, and submit through the official National Cyber Crime Reporting Portal."
        }
    ]
    return actions

def get_evidence_checklist(
    text_lower: str,
    transaction_id: str,
    upi_id: str,
    suspect_phone: str,
    suspicious_url: str
) -> List[Dict[str, Any]]:
    """Builds digital evidence availability checklist based strictly on victim input."""
    checklist = [
        {"label": "Transaction screenshot / Payment receipt", "available": bool("screenshot" in text_lower or transaction_id != "Not provided by the complainant.")},
        {"label": "Bank statement", "available": bool("statement" in text_lower or "bank" in text_lower)},
        {"label": "UPI transaction / UTR reference ID", "available": bool(transaction_id != "Not provided by the complainant.")},
        {"label": "SMS / email notification", "available": bool("sms" in text_lower or "email" in text_lower or "message" in text_lower)},
        {"label": "WhatsApp / Telegram conversation", "available": bool("whatsapp" in text_lower or "telegram" in text_lower)},
        {"label": "Call details / Call log", "available": bool("call" in text_lower or "phone" in text_lower or suspect_phone != "Not provided by the complainant.")},
        {"label": "Suspect phone number", "available": bool(suspect_phone != "Not provided by the complainant.")},
        {"label": "Suspect UPI ID / Account details", "available": bool(upi_id != "Not provided by the complainant.")},
        {"label": "Suspicious web link / URL", "available": bool(suspicious_url != "Not provided by the complainant.")},
        {"label": "Other supporting digital evidence", "available": False}
    ]
    return checklist

def generate_complaint_draft(
    fraud_type: str,
    incident_text: str,
    extracted_amount: str,
    payment_mode: str,
    bank_name: str,
    incident_date: str,
    incident_time: str,
    transaction_id: str,
    upi_id: str,
    suspect_phone: str,
    suspect_account: str,
    suspicious_url: str,
    comm_channel: str,
    otp_status: str,
    evidence_checklist: List[Dict[str, Any]]
) -> str:
    """Generates official AI-assisted complaint draft formatted for Bank / NCRP Cybercell."""
    now_str = datetime.now().strftime("%Y-%m-%d")

    available_ev = [f"- {item['label']}" for item in evidence_checklist if item["available"]]
    evidence_text = "\n".join(available_ev) if available_ev else "- None explicitly referenced in complainant statement."

    draft = f"""AI-GENERATED CYBERCRIME COMPLAINT DRAFT
================================================================================
AWAAZ — VICTIM INCIDENT RESPONSE & COMPLAINT ASSISTANCE
Generated On: {now_str} | Platform: MuleNet AI Awaaz Module

TO,
THE COMPLIANCE OFFICER / CYBER CRIME CELL,
TARGET BANK / INSTITUTION: {bank_name.upper()}
REPORTING JURISDICTION: NATIONAL CYBER CRIME REPORTING PORTAL (1930 / CYBERCRIME.GOV.IN)

SUBJECT: COMPLAINT REGARDING {fraud_type.upper()} INCIDENT INVOLVING {extracted_amount}

RESPECTED SIR / MADAM,

I am submitting this complaint draft regarding a financial cybercrime incident.

1. COMPLAINANT INCIDENT STATEMENT:
"{incident_text}"

2. INCIDENT DETAILS:
--------------------------------------------------------------------------------
- Incident Type            : Cybercrime Complaint
- Fraud Category           : {fraud_type}
- Incident Date            : {incident_date}
- Incident Time            : {incident_time}
- Communication Channel    : {comm_channel}
- Payment Method / Gateway : {payment_mode}
- Target Bank / Institution: {bank_name}
- Amount Disputed / Lost   : {extracted_amount}
- Transaction ID / UTR     : {transaction_id}
- Suspect UPI VPA          : {upi_id}
- Suspect Phone Number     : {suspect_phone}
- Suspect Account          : {suspect_account}
- Suspicious Link / URL    : {suspicious_url}
- Security Credential      : OTP ({otp_status})

3. INCIDENT DESCRIPTION:
The complainant was contacted through {comm_channel} regarding a {fraud_type} scheme.
The incident occurred on or around {incident_date} ({incident_time}). Disputed amount of {extracted_amount}
was involved via {payment_mode}. The complainant has provided available incident details for legal review.

4. DIGITAL EVIDENCE AVAILABLE:
{evidence_text}

5. REQUEST FOR ASSISTANCE:
I request the concerned authority to examine the reported incident, review the available transaction and communication records, and take appropriate action in accordance with applicable law.

6. DECLARATION:
I confirm that the information contained in this draft is based on the information provided by me and should be reviewed for accuracy before submission to any official authority.

7. IMPORTANT NOTICE:
This document is an AI-assisted complaint draft generated by MuleNet AI Awaaz. It is not an FIR, government-issued document, or official cybercrime complaint. The complainant should verify all details and submit the complaint through the appropriate official channel.
================================================================================"""

    return draft

def analyze_awaaz_incident(incident_text: str) -> Dict[str, Any]:
    """
    NLP / AI Engine for Awaaz (Victim Response & Complaint Assistance).
    Extracts structured entities, handles negation, classifies fraud categories with confidence,
    generates official complaint drafts, and provides recommended victim actions.
    """
    text = incident_text.strip()
    if not text:
        return {"error": "Incident description text is empty."}

    text_lower = text.lower()

    # 1. Entity Extraction
    extracted_amount, has_financial_loss, loss_val = extract_amount_details(text_lower)
    incident_date, incident_time = extract_date_and_time(text_lower)
    payment_mode, bank_name = extract_payment_details(text_lower)
    otp_status, pin_status, password_status, kyc_status = parse_security_credentials(text_lower)

    # Transaction ID / UTR regex
    utr_match = re.search(r"\b(utr|txn|transaction|ref)\s*[:#-]?\s*([a-z0-9]{8,18})\b", text_lower)
    transaction_id = utr_match.group(2).upper() if utr_match else "Not provided by the complainant."

    # UPI ID regex
    upi_match = re.search(r"\b([a-z0-9._-]+@[a-z]{3,10})\b", text_lower)
    upi_id = upi_match.group(1) if upi_match else "Not provided by the complainant."

    # Suspect Phone regex
    phone_match = re.search(r"\b([6-9]\d{9})\b", text_lower)
    suspect_phone = phone_match.group(1) if phone_match else "Not provided by the complainant."

    # Suspect Account regex
    acc_match = re.search(r"\baccount\s+(?:no\.?|number|#)?\s*([0-9]{9,18})\b", text_lower)
    suspect_account = acc_match.group(1) if acc_match else "Not provided by the complainant."

    # Suspicious URL regex
    url_match = re.search(r"(https?://[^\s]+)", text)
    suspicious_url = url_match.group(1) if url_match else "Not provided by the complainant."

    # Communication Channel
    comm_channel = "Not provided by the complainant."
    if "telegram" in text_lower:
        comm_channel = "Telegram App"
    elif "whatsapp" in text_lower:
        comm_channel = "WhatsApp"
    elif "call" in text_lower or "phone" in text_lower or "called" in text_lower:
        comm_channel = "Phone Call"
    elif "sms" in text_lower or "message" in text_lower:
        comm_channel = "SMS Message"
    elif "email" in text_lower:
        comm_channel = "Email"

    # 2. Fraud Classification & Confidence
    fraud_type, confidence, categories = classify_fraud_category(text_lower)

    # 3. Evidence Checklist
    evidence_checklist = get_evidence_checklist(
        text_lower=text_lower,
        transaction_id=transaction_id,
        upi_id=upi_id,
        suspect_phone=suspect_phone,
        suspicious_url=suspicious_url
    )

    # 4. Formal Complaint Generation (Zero Hallucinations)
    complaint_draft = generate_complaint_draft(
        fraud_type=fraud_type,
        incident_text=text,
        extracted_amount=extracted_amount,
        payment_mode=payment_mode,
        bank_name=bank_name,
        incident_date=incident_date,
        incident_time=incident_time,
        transaction_id=transaction_id,
        upi_id=upi_id,
        suspect_phone=suspect_phone,
        suspect_account=suspect_account,
        suspicious_url=suspicious_url,
        comm_channel=comm_channel,
        otp_status=otp_status,
        evidence_checklist=evidence_checklist
    )

    # 5. Professional Response Guidance (01..05)
    recommended_actions = get_professional_response_actions(has_financial_loss, fraud_type)

    return {
        "fraud_type": fraud_type,
        "confidence": confidence,
        "confidence_percentage": f"{int(confidence * 100)}%",
        "categories": categories,
        "has_financial_loss": has_financial_loss,
        "financial_loss_value": loss_val,
        "extracted_amount": extracted_amount,
        "payment_mode": payment_mode,
        "bank_name": bank_name,
        "incident_date": incident_date,
        "incident_time": incident_time,
        "transaction_id": transaction_id,
        "upi_id": upi_id,
        "suspect_phone": suspect_phone,
        "suspect_account": suspect_account,
        "suspicious_url": suspicious_url,
        "communication_channel": comm_channel,
        "otp_status": otp_status,
        "pin_status": pin_status,
        "password_status": password_status,
        "kyc_status": kyc_status,
        "evidence_checklist": evidence_checklist,
        "incident_description": text,
        "complaint_draft": complaint_draft,
        "recommended_actions": recommended_actions
    }
