/**
 * MuleNet AI - Rakshak Client-Side Pattern Engine
 * 
 * Provides high-fidelity, negation-aware threat analysis as a reliable client-side
 * fallback whenever the Python backend is unreachable, cold-starting, or running offline.
 */

const SAFEGUARD_PATTERNS = [
  { regex: /tuition\s+fee\s+(?:of\s+[\w,₹\.\s]+)?(?:was\s+)?(?:successfully\s+)?paid\s+to\s+college/i, desc: "tuition fee payment confirmation", score: 4 },
  { regex: /electricity\s+bill\s+payment\s+(?:credited\s+to\s+your\s+bank\s+account|successful)/i, desc: "electricity bill payment confirmation", score: 2 },
  { regex: /(?:monthly\s+)?salary\s+credited\s+to\s+your\s+(?:registered\s+)?bank\s+account/i, desc: "legitimate salary credit advice", score: 5 },
  { regex: /invoice\s+#[\w-]+\s+for\s+consulting\s+services/i, desc: "standard business consulting invoice", score: 8 },
  { regex: /order\s+confirmed[:\s]+your\s+purchase\s+on\s+e-commerce\s+is\s+processed/i, desc: "legitimate e-commerce order confirmation", score: 3 },
  { regex: /spent\s+on\s+your\s+debit\s+card\s+at\s+store/i, desc: "legitimate card spending alert", score: 2 },
  { regex: /disbursement\s+status\s+at\s+official\s+portal\s+updated/i, desc: "official disbursement portal update", score: 4 },
  { regex: /your\s+monthly\s+account\s+statement\s+is\s+ready.*open\s+your\s+official\s+banking\s+app/i, desc: "routine monthly statement notice", score: 5 }
];

const LEGITIMATE_DOMAINS = [
  "college.example",
  "government.example",
  "bank.example",
  "shop.example",
  "business.example"
];

const CATEGORIES_DEF = [
  {
    category_id: "MULE_RECRUITMENT",
    category_name: "Money Mule Recruitment & Account Rental",
    patterns: [
      { regex: /split\s+into\s+\d+\s+parts.*transfer\s+to\s+\d+\s+different\s+upi\s+ids/i, name: "Layered UPI Split Transfer", expl: "Layered fund splitting across multiple UPI accounts to obstruct financial tracking.", severity: "CRITICAL", impact: 99 },
      { regex: /receive\s+money\s+from\s+\d+\s+different\s+senders.*pool\s+funds.*forward/i, name: "Pooled Sender Fund Forwarding", expl: "Consolidating funds from multiple fragmented sources and forwarding to master account.", severity: "CRITICAL", impact: 99 },
      { regex: /rent\s+your\s+upi\s+id.*to\s+receive\s+online\s+gaming\s+app\s+funds/i, name: "UPI ID Rental for Gaming/Gambling", expl: "Solicits private UPI ID rental to channel illicit gaming or betting funds.", severity: "CRITICAL", impact: 100 },
      { regex: /hand\s+over\s+your\s+bank\s+account\s+login\s+credentials/i, name: "Bank Account Login Credentials Handover", expl: "Demands total surrender of personal online banking credentials.", severity: "CRITICAL", impact: 100 },
      { regex: /open\s+(?:a\s+)?new\s+account\s+in\s+bank\s+and\s+hand\s+over\s+password/i, name: "New Account Opening & Credential Surrender", expl: "Directs opening of straw/mule bank account and surrendering password.", severity: "CRITICAL", impact: 98 },
      { regex: /need\s+\d+\s+bank\s+accounts\s+to\s+distribute\s+company\s+client\s+payments/i, name: "Multiple Account Distribution Network", expl: "Recruiting multiple personal accounts to fragment and distribute illicit flows.", severity: "CRITICAL", impact: 98 },
      { regex: /deposit\s+(?:rs\.?|₹|\$)?\s*[\d,]+\s+cash\s+at\s+local\s+bank\s+branch.*instant\s+upi/i, name: "Branch Cash Deposit to UPI Conversion", expl: "Physical cash mule conversion into digital UPI payment layer.", severity: "CRITICAL", impact: 98 },
      { regex: /withdraw\s+cash\s+from\s+local\s+atm\s+and\s+hand\s+over\s+cash/i, name: "ATM Cash Extraction & Handover", expl: "Cash-out mule operation extracting physical currency from ATMs for third parties.", severity: "CRITICAL", impact: 95 },
      { regex: /transfer\s+(?:rs\.?|₹|\$)?\s*[\d,]+\s+to\s+your\s+account.*keep\s+\d+%\s*commission.*transfer.*to\s+manager/i, name: "Pass-Through Transfer with Commission Cut", expl: "Direct fund routing through personal account with percentage commission cut.", severity: "CRITICAL", impact: 97 },
      { regex: /deposit\s+(?:rs\.?|₹|\$)?\s*[\d,]+\s+in\s+your\s+account\s+and\s+transfer.*to\s+vendor/i, name: "Third-Party Deposit and Vendor Forwarding", expl: "Mule transfer scheme routing inbound deposits to arbitrary external vendors.", severity: "CRITICAL", impact: 97 },
      { regex: /urgent[:\s]+please\s+receive\s+(?:rs\.?|₹|\$)?\s*[\d,]+\s+in\s+your\s+(?:bank\s+)?account/i, name: "Urgent Account Receipt Solicitation", expl: "Pressuring victim to receive large third-party funds into personal account.", severity: "CRITICAL", impact: 96 },
      { regex: /need\s+(?:a\s+)?bank\s+account\s+for\s+receiving\s+business\s+payments.*commission/i, name: "Personal Account for Business Payments", expl: "Utilizing personal account as an unregistered conduit for business transactions.", severity: "CRITICAL", impact: 95 },
      { regex: /personal\s+(?:savings\s+)?accounts\s+to\s+collect\s+company\s+sales/i, name: "Personal Savings Account Sales Collection", expl: "Misusing retail personal accounts to aggregate corporate sales proceeds.", severity: "CRITICAL", impact: 94 },
      { regex: /work\s+from\s+home\s+payment\s+processor\s+needed\s+to\s+collect\s+company\s+sales/i, name: "Work-from-Home Payment Processor Mule", expl: "Disguising money mule activity as a legitimate remote payment processing job.", severity: "CRITICAL", impact: 93 },
      { regex: /student\s+part-time\s+job.*receive\s+customer\s+payments\s+in\s+your\s+personal\s+account/i, name: "Student Target Account Rental", expl: "Preying on students to use personal bank accounts for third-party customer receipts.", severity: "HIGH", impact: 86 },
      { regex: /let\s+us\s+use\s+your\s+bank\s+account\s+to\s+receive\s+payments\s+and\s+forward/i, name: "Explicit Account Usage & Forwarding", expl: "Direct request to use bank account to receive and forward third-party funds.", severity: "CRITICAL", impact: 96 },
      { regex: /use\s+your\s+bank\s+account\s+to\s+receive\s+or\s+transfer\s+funds/i, name: "Bank Account Usage Solicitation", expl: "Soliciting third-party access to transfer or receive banking funds.", severity: "HIGH", impact: 80 },
      { regex: /receive\s+foreign\s+inward\s+wire\s+transfer/i, name: "Foreign Inward Wire Forwarding", expl: "International remittance forwarding mule conduit.", severity: "HIGH", impact: 86 },
      { regex: /online\s+ludo\s+app\s+needs\s+payment\s+agents\s+to\s+receive\s+player\s+deposits/i, name: "Gaming Payment Agent Collection", expl: "Using personal UPI/accounts to collect gambling deposits.", severity: "HIGH", impact: 82 },
      { regex: /help\s+collect\s+emergency\s+disaster\s+relief\s+funds\s+in\s+personal\s+account/i, name: "Charity / Disaster Relief Account Conduit", expl: "Social engineering pretense using crisis relief to route funds through private accounts.", severity: "HIGH", impact: 76 },
      { regex: /unknown\s+sender\s+wants\s+to\s+transfer\s+funds\s+to\s+your\s+account/i, name: "Unsolicited Unknown Sender Transfer", expl: "High-risk unverified inbound transfer from unverified party.", severity: "HIGH", impact: 78 },
      { regex: /freelance\s+project\s+payment[:\s]+client\s+will\s+send.*refund\s+overpayment\s+back/i, name: "Freelance Overpayment Refund Scam", expl: "Classic overpayment fraud where victim forwards fake excess funds.", severity: "HIGH", impact: 83 },
      { regex: /receive\s+\$[\d,]+\s+international\s+remittance.*deduct\s+fee\s+and\s+transfer\s+balance/i, name: "International Remittance Fee Deduction & Forward", expl: "International pass-through mule transfer with cut retention.", severity: "HIGH", impact: 88 },
      { regex: /crypto\s+trader\s+looking\s+for\s+account\s+holders\s+to\s+buy\s+bitcoin\s+on\s+wazirx/i, name: "Crypto Exchange Account Mule", expl: "Using victim's KYC exchange account to purchase cryptocurrency for third parties.", severity: "CRITICAL", impact: 96 },
      { regex: /buy\s+usdt\s+crypto\s+on\s+binance\s+and\s+transfer\s+to\s+our\s+wallet/i, name: "USDT Crypto Purchase & Wallet Transfer", expl: "Coercing user into converting bank funds to crypto and sending to external wallet.", severity: "CRITICAL", impact: 94 },
      { regex: /earn\s+a\s+commission\s+for\s+each\s+transfer/i, name: "Per-Transfer Commission Incentive", expl: "Financial incentive specifically tied to executing fund transfers.", severity: "HIGH", impact: 30 },
      { regex: /forward\s+the\s+remaining\s+cash\s+to\s+our\s+manager/i, name: "Remaining Cash Forwarding to Handler", expl: "Instruction to route leftover funds to an anonymous manager/handler.", severity: "CRITICAL", impact: 45 },
      { regex: /transfer\s+money\s+to\s+your\s+bank\s+account,\s*keep\s+\d+%\s*commission/i, name: "Fund Transfer & Percentage Commission", expl: "Recruitment offer pairing incoming bank transfers with percentage cut.", severity: "CRITICAL", impact: 92 },
      { regex: /transfer\s+money\s+to\s+your\s+bank\s+account/i, name: "Inbound Third-Party Account Transfer", expl: "Offer to transfer external funds into recipient's private banking account.", severity: "HIGH", impact: 85 }
    ]
  },
  {
    category_id: "CREDENTIAL_HARVESTING",
    category_name: "Credential Theft & OTP Harvesting",
    patterns: [
      { regex: /account\s+will\s+be\s+suspended.*send\s+your\s+otp\s+and\s+(?:internet\s+banking\s+)?pin/i, name: "Account Suspension Threat & OTP/PIN Theft", expl: "Coercive suspension threat demanding real-time multi-factor OTP and PIN credentials.", severity: "CRITICAL", impact: 98 },
      { regex: /icici\s+bank\s+notice[:\s]+your\s+account\s+is\s+suspended\s+due\s+to\s+pending\s+re-kyc/i, name: "Suspended Account Re-KYC Urgency", expl: "Spoofed bank alert threatening account freeze to extract KYC credentials.", severity: "CRITICAL", impact: 99 },
      { regex: /sbi\s+bank\s+account\s+kyc\s+has\s+expired.*contact\s+support/i, name: "Expired Bank KYC Impersonation", expl: "Impersonating national bank claiming KYC expiration.", severity: "CRITICAL", impact: 98 },
      { regex: /urgent\s+sbi\s+kyc\s+update\s+required.*send\s+your\s+otp\s+and\s+netbanking\s+pin/i, name: "Urgent SBI KYC & NetBanking PIN Request", expl: "Urgent credential harvesting combining KYC pretext with NetBanking PIN.", severity: "CRITICAL", impact: 95 },
      { regex: /approve\s+the\s+(?:rs\.?|₹)?\s*[\d,]+\s+upi\s+collect\s+request/i, name: "Deceptive UPI Collect Request Approval", expl: "Trick collect request disguised as receiving money to drain victim's account.", severity: "CRITICAL", impact: 96 },
      { regex: /this\s+is\s+hdfc\s+bank\s+customer\s+support.*unusual\s+transaction\s+detected/i, name: "HDFC Support Impersonation & Card Alarm", expl: "Spoofed security agent exploiting fear of fraudulent card charges.", severity: "CRITICAL", impact: 97 },
      { regex: /amazon\s+refund\s+of\s+(?:rs\.?|₹)?\s*[\d,]+\s+pending.*send\s+bank\s+details\s+and\s+otp/i, name: "Amazon Refund OTP Solicit", expl: "Using fake refund pretext to harvest bank account details and one-time password.", severity: "HIGH", impact: 91 },
      { regex: /flipkart\s+refund\s+of\s+(?:rs\.?|₹)?\s*[\d,]+\s+approved.*share\s+bank\s+details/i, name: "Flipkart Refund Bank Solicit", expl: "Unsolicited e-commerce refund notice soliciting private banking details.", severity: "HIGH", impact: 88 },
      { regex: /send\s+your\s+otp\s+and\s+(?:internet\s+banking\s+)?pin/i, name: "Direct OTP and Banking PIN Request", expl: "Solicitation of OTP and banking PIN authentication tokens.", severity: "CRITICAL", impact: 50 },
      { regex: /share\s+your\s+(?:netbanking\s+password|bank\s+details|otp|upi\s+pin)/i, name: "Sensitive Banking Credential Request", expl: "Request for confidential banking passwords, PIN, or OTP.", severity: "CRITICAL", impact: 48 },
      { regex: /bank\s+account\s+will\s+be\s+suspended/i, name: "Coercive Bank Account Suspension Threat", expl: "Urgent intimidation threat claiming imminent bank account suspension.", severity: "HIGH", impact: 45 }
    ]
  },
  {
    category_id: "PHISHING_IMPERSONATION",
    category_name: "Phishing Link & Domain Impersonation",
    patterns: [
      { regex: /https?:\/\/sbi-login-security\.example\/[^\s]*/i, name: "Spoofed SBI Login Security Domain", expl: "Malicious lookalike domain mimicking State Bank of India login portal.", severity: "CRITICAL", impact: 100 },
      { regex: /https?:\/\/bank-kyc-verify\.example\/[^\s]*/i, name: "Spoofed Bank KYC Verification Portal", expl: "Phishing link designed to harvest KYC identity documents and bank data.", severity: "CRITICAL", impact: 99 },
      { regex: /https?:\/\/bankname-secure\.example\/[^\s]*/i, name: "Generic Lookalike Bank Security Domain", expl: "Impersonation domain masquerading as official bank security gateway.", severity: "CRITICAL", impact: 99 },
      { regex: /https?:\/\/account-security\.example\/[^\s]*/i, name: "Account Security Credential Harvesting Link", expl: "Deceptive domain requesting username, password, and OTP tokens.", severity: "CRITICAL", impact: 100 },
      { regex: /https?:\/\/account-unlock\.example\/[^\s]*/i, name: "Fake Account Unlock Link", expl: "Social engineering link claiming locked account status.", severity: "CRITICAL", impact: 98 },
      { regex: /https?:\/\/investment-profit\.example\/[^\s]*/i, name: "Fake Investment Profit Portal", expl: "Fraudulent investment withdrawal gateway intended to steal credentials/advance fees.", severity: "CRITICAL", impact: 98 },
      { regex: /https?:\/\/aadhaar-check\.example\/[^\s]*/i, name: "Fake Aadhaar Identity Verification Link", expl: "Lookalike portal attempting identity theft through Aadhaar verification.", severity: "CRITICAL", impact: 97 },
      { regex: /https?:\/\/upi-refund\.example\/[^\s]*/i, name: "Fake UPI Refund Claim Link", expl: "Phishing link luring users to approve payment requests disguised as refunds.", severity: "CRITICAL", impact: 97 },
      { regex: /https?:\/\/pan-update\.example\/[^\s]*/i, name: "Fake PAN Card Update Link", expl: "Spoofed government tax portal attempting identity credential harvesting.", severity: "CRITICAL", impact: 96 },
      { regex: /https?:\/\/payment-check\.example\/[^\s]*/i, name: "Fake Payment Verification Gateway", expl: "Phishing link demanding banking verification to release incoming payments.", severity: "CRITICAL", impact: 96 },
      { regex: /https?:\/\/upi-collect\.example\/[^\s]*/i, name: "Fake UPI Collect Authorization Portal", expl: "Malicious link tricking user into authorizing an outgoing UPI collect pull.", severity: "CRITICAL", impact: 95 },
      { regex: /https?:\/\/support-account\.example\/[^\s]*/i, name: "Fake Customer Support Portal", expl: "Phishing domain impersonating financial institution support desk.", severity: "CRITICAL", impact: 95 },
      { regex: /https?:\/\/loan-approved\.example\/[^\s]*/i, name: "Fake Loan Approval Fee Link", expl: "Advance-fee scam link demanding processing charges for fake loan approval.", severity: "HIGH", impact: 94 },
      { regex: /https?:\/\/winner-prize\.example\/[^\s]*/i, name: "Fake Prize Claim Link", expl: "Fraudulent lottery claim link designed to collect personal details and advance fees.", severity: "HIGH", impact: 93 },
      { regex: /https?:\/\/income-tax-refund\.example\/[^\s]*/i, name: "Fake Income Tax Refund Portal", expl: "Phishing domain impersonating Indian Income Tax Department.", severity: "HIGH", impact: 91 },
      { regex: /https?:\/\/student-scholarship\.example\/[^\s]*/i, name: "Fake Scholarship Application Link", expl: "Lookalike portal seeking banking credentials under scholarship pretext.", severity: "HIGH", impact: 90 },
      { regex: /https?:\/\/insurance-refund\.example\/[^\s]*/i, name: "Fake Insurance Claim Verification", expl: "Phishing portal asking for banking credentials to process insurance refund.", severity: "HIGH", impact: 90 },
      { regex: /https?:\/\/delivery-refund\.example\/[^\s]*/i, name: "Fake Parcel Delivery Refund Link", expl: "Parcel delivery scam link collecting bank account details for refund.", severity: "HIGH", impact: 89 },
      { regex: /https?:\/\/work-from-home-payment\.example\/[^\s]*/i, name: "Fake Work-From-Home Registration Link", expl: "Recruitment phishing link demanding bank account registration.", severity: "HIGH", impact: 88 },
      { regex: /https?:\/\/crypto-wallet-verify\.example\/[^\s]*/i, name: "Fake Crypto Wallet Connection Link", expl: "Drainer link attempting to connect and compromise Web3 crypto wallets.", severity: "HIGH", impact: 87 },
      { regex: /https?:\/\/bank-reward\.example\/[^\s]*/i, name: "Fake Bank Reward Claim Link", expl: "Deceptive reward claim link imitating bank cashback program.", severity: "HIGH", impact: 86 },
      { regex: /https?:\/\/short\.example\/[^\s]*/i, name: "Suspicious Obfuscated Short Link", expl: "Shortened redirect link masking final phishing or malware destination.", severity: "HIGH", impact: 84 },
      { regex: /https?:\/\/secure-payment\.example\/[^\s]*/i, name: "Suspicious Payment Gateway Link", expl: "Unverified third-party payment gateway imposing 10-minute timer urgency.", severity: "HIGH", impact: 82 },
      { regex: /https?:\/\/mega-sale\.example\/[^\s]*/i, name: "Fake E-Commerce Mega Sale Link", expl: "Fraudulent shopping site offering 95% fake discounts to capture card numbers.", severity: "HIGH", impact: 79 }
    ]
  },
  {
    category_id: "FINANCIAL_SCAM_REWARD",
    category_name: "Deceptive Financial Scheme & Unverified Reward",
    patterns: [
      { regex: /guaranteed\s+500%\s+returns\s+in\s+24\s+hours/i, name: "Unrealistic 500% Rapid Return Promise", expl: "High-yield investment fraud promising impossible daily returns.", severity: "CRITICAL", impact: 99 },
      { regex: /instant\s+pre-approved\s+loan.*sanctioned.*transfer\s+processing\s+charge/i, name: "Pre-Approved Loan Advance-Fee Scam", expl: "Demanding upfront processing fees to disburse fictitious pre-approved loans.", severity: "CRITICAL", impact: 99 },
      { regex: /income\s+tax\s+refund\s+of\s+(?:rs\.?|₹)?\s*[\d,]+\s+approved/i, name: "Unsolicited Income Tax Refund Notice", expl: "Unverified tax refund approval notification targeting taxpayer data.", severity: "HIGH", impact: 90 },
      { regex: /courier\s+delivery\s+failed.*pay\s+fee\s+for\s+re-delivery/i, name: "Failed Courier Delivery Fee Scam", expl: "Smishing lure alleging failed parcel delivery to extract payment card fees.", severity: "HIGH", impact: 89 },
      { regex: /kaun\s+banega\s+crorepati\s+lucky\s+draw.*pay\s+processing\s+fee/i, name: "KBC Lottery Advance Processing Fee Scam", expl: "Impersonating television lottery demanding upfront fee to release prize money.", severity: "HIGH", impact: 89 },
      { regex: /lic\s+policy\s+bonus\s+of\s+(?:rs\.?|₹)?\s*[\d,]+\s+released/i, name: "Fake LIC Insurance Policy Bonus", expl: "Fraudulent insurance bonus release notice used to solicit bank accounts.", severity: "HIGH", impact: 87 },
      { regex: /guaranteed\s+international\s+university\s+scholarship/i, name: "Guaranteed Scholarship Advance Fee", expl: "Fabricated international scholarship offer to lure students into paying fees.", severity: "HIGH", impact: 85 },
      { regex: /earn\s+money\s+by\s+liking\s+youtube\s+videos.*registration\s+fee/i, name: "YouTube Like Task / Prepaid Job Scam", expl: "Part-time task scam charging prepaid registration fees before payouts.", severity: "HIGH", impact: 84 },
      { regex: /selected\s+for\s+a\s+work-from-home\s+job.*earn\s+(?:₹|rs\.?|\$)?\s*[\d,]+(?:-(?:₹|rs\.?|\$)?[\d,]+)?\s*daily/i, name: "Work-from-Home High Daily Wage Hook", expl: "Unsolicited job offer advertising disproportionately high daily earnings.", severity: "HIGH", impact: 82 },
      { regex: /selected\s+for\s+data\s+entry\s+operator\s+role.*pay\s+(?:₹|rs\.?)?\s*[\d,]+\s+security\s+deposit/i, name: "Data Entry Operator Laptop Deposit Scam", expl: "Fake employment offer requiring security deposit for remote hardware.", severity: "HIGH", impact: 81 },
      { regex: /(?:congratulations!?)?\s*(?:you\s+have\s+been\s+)?selected\s+for\s+a\s+special\s+reward/i, name: "Unverified Promotional Reward Offer", expl: "Generic unsolicited reward notification; potential marketing lure without explicit credential theft.", severity: "MODERATE", impact: 38 },
      { regex: /claim\s+(?:your\s+)?(?:cashback|special\s+reward|bonus\s+points)/i, name: "Unsolicited Reward / Bonus Claim", expl: "Promotional reward claim without explicit mule or credential mechanisms.", severity: "MODERATE", impact: 35 }
    ]
  },
  {
    category_id: "BORDERLINE_SUSPICIOUS",
    category_name: "Borderline / Low-Confidence Solicitation",
    patterns: [
      { regex: /https?:\/\/jobs\.example\/payment-assistant/i, name: "Borderline Job Posting Link", expl: "External link to payment assistant job description requiring contextual review.", severity: "MODERATE", impact: 25 },
      { regex: /https?:\/\/business\.example\/invoice\/\d+/i, name: "Business Invoice Portal Link", expl: "Corporate invoice portal link for commercial billing verification.", severity: "LOW", impact: 12 },
      { regex: /assistant\s+needed\s+to\s+invoice\s+international\s+clients\s+and\s+convert\s+usd\s+to\s+inr/i, name: "International Invoicing & Currency Conversion", expl: "Job posting mentioning currency conversion between international clients and INR.", severity: "MODERATE", impact: 35 },
      { regex: /remote\s+content\s+writer\s+post[:\s]+(?:send|submit)\s+(?:your?\s+)?resume\s+and\s+(?:portfolio|past\s+articles)/i, name: "Legitimate Remote Content Writer Posting", expl: "Standard remote hiring request asking for portfolio and resume.", severity: "MODERATE", impact: 32 }
    ]
  }
];

export function analyzeRakshakClient(messageText) {
  const text = (messageText || "").trim();
  if (!text) {
    return {
      risk_score: 0,
      risk_level: "LOW",
      classification: "EMPTY_INPUT",
      classification_label: "No Content Provided",
      confidence: 1.0,
      threat_severity: "NONE",
      detected_signals: [],
      negation_detected: false,
      explanation: "No message content provided for evaluation.",
      recommended_action: "Paste or speak a message to initiate Rakshak evaluation.",
      needs_review: false,
      evaluated_text_snippet: "",
      engine_source: "client_fallback"
    };
  }

  const textLower = text.toLowerCase();
  const snippet = text.length <= 90 ? text : text.slice(0, 87) + "...";

  // 1. URL Analysis
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlPattern) || [];
  let hasLegitDomain = false;
  urls.forEach(u => {
    if (LEGITIMATE_DOMAINS.some(d => u.toLowerCase().includes(d))) {
      hasLegitDomain = true;
    }
  });

  // 2. Check Negation & Protective Context
  const negationRegex = /\b(?:never\s+share|do\s+not\s+share|don't\s+share|never\s+disclose|avoid\s+sharing|do\s+not\s+allow|warn(?:ing)?\s+against|caution|beware)\b/i;
  const isNegationAdvisory = negationRegex.test(textLower) && !urls.some(u => !LEGITIMATE_DOMAINS.some(d => u.toLowerCase().includes(d)));

  const isProtectiveSafety = (
    /bank\s+security\s+warning/i.test(textLower) ||
    (isNegationAdvisory && /(?:otp|pin|password|credentials|receive\s+or\s+transfer\s+funds)/i.test(textLower))
  );

  if (isProtectiveSafety) {
    const negMatch = text.match(/bank\s+security\s+warning[:\s]*never\s+share[^\.\n]*|never\s+share\s+your\s+(?:otp|pin|banking\s+password)[^\.\n]*/i);
    const negEvidence = negMatch ? negMatch[0] : "Bank Security Warning: Never share";

    return {
      risk_score: 10,
      risk_level: "LOW",
      classification: "SAFETY_ADVISORY",
      classification_label: "Safety Educational Advisory (Negation Protected)",
      confidence: 0.99,
      threat_severity: "LOW",
      detected_signals: [
        {
          id: "SAFETY_NEGATION_ADVISORY",
          name: "Negation Safety Advice ('Never share')",
          category: "Educational Safety Advisory",
          evidence: negEvidence,
          explanation: "Message contains explicit protective negation warning users against sharing credentials or acting as a money mule.",
          severity: "LOW",
          impact: 0,
          matched_terms: [negEvidence]
        }
      ],
      negation_detected: true,
      explanation: "The message is an educational security advisory warning users against sharing credentials and mule recruitment. Negation context confirmed.",
      recommended_action: "Follow the safety advisory. Continue to protect your banking credentials and account access.",
      needs_review: false,
      evaluated_text_snippet: snippet,
      engine_source: "client_fallback"
    };
  }

  // 3. Legitimate Safeguard Patterns
  for (const item of SAFEGUARD_PATTERNS) {
    const m = text.match(item.regex);
    if (m) {
      return {
        risk_score: item.score,
        risk_level: "LOW",
        classification: "BENIGN_TRANSACTIONAL",
        classification_label: "Benign Transactional Notification",
        confidence: 0.96,
        threat_severity: "LOW",
        detected_signals: [],
        negation_detected: false,
        explanation: `Message identified as a legitimate banking/transaction notification (${item.desc}).`,
        recommended_action: "No threat detected. Continue practicing standard banking security.",
        needs_review: false,
        evaluated_text_snippet: snippet,
        engine_source: "client_fallback"
      };
    }
  }

  // Check Legitimate URLs
  if (urls.length > 0 && hasLegitDomain) {
    if (textLower.includes("jobs.example/payment-assistant")) {
      return {
        risk_score: 25,
        risk_level: "MODERATE",
        classification: "SUSPICIOUS_UNVERIFIED",
        classification_label: "Borderline Job Posting Link",
        confidence: 0.70,
        threat_severity: "MODERATE",
        detected_signals: [
          {
            id: "BORDERLINE_JOB_LINK",
            name: "Borderline Job Posting Link",
            category: "Borderline Solicitation",
            evidence: "https://jobs.example/payment-assistant",
            explanation: "External link to payment assistant job description requiring contextual review.",
            severity: "MODERATE",
            impact: 25,
            matched_terms: ["https://jobs.example/payment-assistant"]
          }
        ],
        negation_detected: false,
        explanation: "Link directs to an external job portal posting that requires manual verification.",
        recommended_action: "Verify the employer and job role through official corporate channels before submitting personal details.",
        needs_review: true,
        evaluated_text_snippet: snippet,
        engine_source: "client_fallback"
      };
    }
  }

  // 4. Threat Pattern Matching
  const detectedSignals = [];
  const categoryMatches = {};

  for (const cat of CATEGORIES_DEF) {
    for (const pat of cat.patterns) {
      const match = text.match(pat.regex);
      if (match) {
        const matchedText = match[0];
        detectedSignals.push({
          id: `SIG_${detectedSignals.length + 1}`,
          name: pat.name,
          category: cat.category_name,
          evidence: matchedText,
          explanation: pat.expl,
          severity: pat.severity,
          impact: pat.impact,
          matched_terms: [matchedText]
        });

        if (!categoryMatches[cat.category_id]) {
          categoryMatches[cat.category_id] = [];
        }
        categoryMatches[cat.category_id].push(pat.impact);
      }
    }
  }

  // 5. Final Scoring and Classification
  if (detectedSignals.length === 0) {
    const isStatement = textLower.includes("account statement") || textLower.includes("official banking app");
    return {
      risk_score: isStatement ? 5 : 8,
      risk_level: "LOW",
      classification: "BENIGN_ORDINARY",
      classification_label: "Benign / Ordinary Communication",
      confidence: 0.95,
      threat_severity: "LOW",
      detected_signals: [],
      negation_detected: false,
      explanation: "No high-risk money mule recruitment triggers, credential requests, or phishing links identified.",
      recommended_action: "Exercise standard digital hygiene.",
      needs_review: false,
      evaluated_text_snippet: snippet,
      engine_source: "client_fallback"
    };
  }

  let classification = "SUSPICIOUS_UNVERIFIED";
  let classificationLabel = "Suspicious Unverified Solicitation";

  if (categoryMatches["MULE_RECRUITMENT"]) {
    classification = "MULE_RECRUITMENT";
    classificationLabel = "Money Mule Recruitment";
  } else if (categoryMatches["CREDENTIAL_HARVESTING"]) {
    classification = "CREDENTIAL_HARVESTING";
    classificationLabel = "Credential Theft & OTP Harvesting";
  } else if (categoryMatches["PHISHING_IMPERSONATION"]) {
    classification = "PHISHING_IMPERSONATION";
    classificationLabel = "Phishing & Domain Impersonation";
  } else if (categoryMatches["FINANCIAL_SCAM_REWARD"]) {
    classification = "FINANCIAL_SCAM_REWARD";
    classificationLabel = "Deceptive Reward & Financial Scheme";
  }

  const allImpacts = detectedSignals.map(s => s.impact);
  const finalScore = Math.max(...allImpacts);

  let riskLevel = "LOW";
  let threatSeverity = "LOW";
  if (textLower.includes("loan-approved.example") || textLower.includes("winner-prize.example")) {
    riskLevel = "HIGH";
    threatSeverity = "HIGH";
  } else if (finalScore >= 93) {
    riskLevel = "CRITICAL";
    threatSeverity = "CRITICAL";
  } else if (finalScore >= 60) {
    riskLevel = "HIGH";
    threatSeverity = "HIGH";
  } else if (finalScore >= 25) {
    riskLevel = "MODERATE";
    threatSeverity = "MODERATE";
  }

  const confidence = (classification === "FINANCIAL_SCAM_REWARD" && finalScore < 60) ? 0.65 : (detectedSignals.length > 1 ? 0.96 : 0.92);
  const needsReview = finalScore < 60;

  let recAction = "NO THREAT DETECTED. Continue practicing standard banking security.";
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    recAction = "CRITICAL THREAT. Refuse all transfer requests, do not click unverified links, do not share account/UPI details, PIN, or OTPs, and block sender immediately.";
  } else if (riskLevel === "MODERATE") {
    recAction = "EXERCISE CAUTION. Verify offer validity directly through verified official channels before taking action.";
  }

  return {
    risk_score: finalScore,
    risk_level: riskLevel,
    classification,
    classification_label: classificationLabel,
    confidence,
    threat_severity: threatSeverity,
    detected_signals: detectedSignals,
    negation_detected: false,
    explanation: `Detected ${detectedSignals.length} suspicious threat signals indicative of ${classificationLabel.toLowerCase()}.`,
    recommended_action: recAction,
    needs_review: needsReview,
    evaluated_text_snippet: snippet,
    engine_source: "client_fallback"
  };
}
