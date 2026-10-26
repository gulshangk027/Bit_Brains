/**
 * MuleNet AI - AWAAZ Client-Side Pattern Engine
 * 
 * Provides fallback parsing of incident reports when the Python backend is unreachable.
 */

export function analyzeAwaazClient(incidentText) {
  const text = (incidentText || "").trim();
  const textLower = text.toLowerCase();

  // 1. Loss Amount Extraction
  let lossStr = "Not provided by the complainant.";
  let lossVal = 0.0;
  let hasLoss = false;

  const noLossNegation = /(?:no\s+money\s+lost|did\s+not\s+lose|refused|did\s+not\s+share|avoided\s+loss|blocked\s+the\s+number)/i.test(textLower) &&
    !/(?:transferred|deducted|stolen|lost\s+₹|debited)/i.test(textLower);

  const kMatch = textLower.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  const amtMatch = textLower.match(/(?:[₹]|rs\.?|rupees?)\s*([\d,]+(?:\.\d+)?)|([\d,]+)\s*(?:rupees?|rs\b)/i);
  const nearVerbMatch = textLower.match(/(?:transferred|deducted|lost|paid|deposited|debited|sent|scammed\s+for)\s+(\d{3,7})/i);

  if (kMatch) {
    lossVal = parseFloat(kMatch[1]) * 1000;
    lossStr = `₹${lossVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    hasLoss = !noLossNegation;
  } else if (amtMatch) {
    const rawVal = amtMatch[1] || amtMatch[2];
    lossVal = parseFloat(rawVal.replace(/,/g, '')) || 0;
    lossStr = `₹${lossVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    hasLoss = !noLossNegation;
  } else if (nearVerbMatch) {
    lossVal = parseFloat(nearVerbMatch[1]) || 0;
    lossStr = `₹${lossVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    hasLoss = !noLossNegation;
  }

  // 2. Incident Date & Time
  let dateStr = "Not provided by the complainant.";
  let timeStr = "Not provided by the complainant.";

  if (textLower.includes("yesterday")) {
    dateStr = "Yesterday";
  } else if (textLower.includes("today")) {
    dateStr = "Today";
  } else if (textLower.includes("last night")) {
    dateStr = "Last Night";
    timeStr = "Night (10 PM - 2 AM)";
  }

  // 3. Payment Mode & Bank
  const channels = [];
  if (/upi|gpay|google pay|phonepe|paytm|bhim|collect request/i.test(textLower)) channels.push("UPI (GPay/PhonePe/Paytm)");
  if (/imps/i.test(textLower)) channels.push("IMPS");
  if (/neft/i.test(textLower)) channels.push("NEFT");
  if (/card|debit|credit|atm/i.test(textLower)) channels.push("Debit/Credit Card");
  if (/net banking|netbanking/i.test(textLower)) channels.push("Net Banking");
  if (/crypto|usdt|bitcoin/i.test(textLower)) channels.push("Cryptocurrency (USDT/Crypto)");
  const paymentMode = channels.length > 0 ? channels.join(", ") : "Not provided by the complainant.";

  const banks = [];
  if (/sbi|state bank/i.test(textLower)) banks.push("SBI");
  if (/hdfc/i.test(textLower)) banks.push("HDFC Bank");
  if (/icici/i.test(textLower)) banks.push("ICICI Bank");
  if (/axis/i.test(textLower)) banks.push("Axis Bank");
  if (/kotak/i.test(textLower)) banks.push("Kotak Mahindra Bank");
  if (/pnb|punjab national/i.test(textLower)) banks.push("PNB");
  const bankName = banks.length > 0 ? banks.join(", ") : "Not provided by the complainant.";

  // 4. Suspect Details
  const suspectAccMatch = text.match(/\b(ACC-\d{5,7}|\d{11,16})\b/i);
  const suspectAccount = suspectAccMatch ? suspectAccMatch[0] : "Not provided by the complainant.";

  const txnMatch = text.match(/\b(TXN-[\w-]+|\d{12})\b/i);
  const transactionId = txnMatch ? txnMatch[0] : "Not provided by the complainant.";

  // 5. Fraud Category
  let category = "Cyber-Enabled Financial Fraud";
  let urgency = hasLoss ? "CRITICAL (Financial Loss)" : "HIGH (Potential Fraud Attempt)";
  if (/customer care|support|pretending to be/i.test(textLower)) {
    category = "Customer Care Impersonation & Phishing Scam";
  } else if (/job|task|telegram|part time/i.test(textLower)) {
    category = "Part-Time Task / Money Mule Recruitment Scam";
  } else if (/loan/i.test(textLower)) {
    category = "Pre-Approved Loan Advance-Fee Fraud";
  } else if (/refund|cashback/i.test(textLower)) {
    category = "Fake Refund / Cashback Extraction Scam";
  }

  // 6. Generate Formal Complaint Draft
  const complaintDraft = `FORMAL CYBER FRAUD COMPLAINT STATEMENT
NATIONAL CYBER CRIME REPORTING PORTAL (cybercrime.gov.in)
----------------------------------------------------------------------
Incident Summary:
On ${dateStr}, the complainant was subjected to ${category}.

Incident Description:
${text}

Extracted Transaction & Evidence Details:
- Category of Incident: ${category}
- Financial Loss Reported: ${lossStr}
- Payment Mechanism / Gateway: ${paymentMode}
- Targeted Institution: ${bankName}
- Suspect Account / Entity: ${suspectAccount}
- Transaction / Reference ID: ${transactionId}

Requested Law Enforcement Action:
1. Immediately freeze beneficiary mule accounts associated with ${suspectAccount}.
2. Initiate lien mark on disputed fund outflow under Section 91 CrPC.
3. Track downstream money trail to prevent layered crypto/cash liquidation.
----------------------------------------------------------------------`;

  return {
    raw_statement: text,
    fraud_category: category,
    urgency_level: urgency,
    financial_loss: lossStr,
    loss_val: lossVal,
    has_loss: hasLoss,
    incident_date: dateStr,
    incident_time: timeStr,
    payment_channel: paymentMode,
    bank_targeted: bankName,
    suspect_account: suspectAccount,
    transaction_id: transactionId,
    complaint_draft: complaintDraft,
    engine_source: "client_fallback"
  };
}
