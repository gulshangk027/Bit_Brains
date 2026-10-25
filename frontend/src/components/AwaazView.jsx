import React, { useState } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  FileText, 
  RotateCcw,
  ShieldCheck,
  Building2,
  DollarSign,
  Calendar,
  CreditCard,
  ListOrdered,
  Eye,
  X,
  FileCheck,
  Info,
  PhoneCall,
  ExternalLink
} from 'lucide-react';

import VoiceInputButton from './VoiceInputButton';
import { generateAwaazPDF } from '../utils/pdfGenerator';

const SAMPLE_INCIDENTS = [
  {
    label: "Customer Care Impersonation + OTP Scam (Financial Loss)",
    text: "Someone called me pretending to be SBI customer care. They said my KYC was incomplete and asked me to share an OTP. I shared the OTP and ₹20,000 was transferred from my account yesterday."
  },
  {
    label: "Telegram Part-Time Task Job Scam (Financial Loss)",
    text: "I joined a Telegram part-time job group on 15 August. They asked me to deposit ₹5,000 first and promised that I would get ₹10,000 back. After paying, they stopped responding."
  },
  {
    label: "UPI Collect Request Scam (Financial Loss)",
    text: "I received a UPI collect request from an unknown person. I thought it was a payment request and approved it. ₹8,500 was deducted from my account."
  },
  {
    label: "OTP Scam Attempt (NO Financial Loss)",
    text: "I received a call claiming to be HDFC bank support asking for my OTP to unblock my account, but I did NOT share my OTP and hung up immediately."
  },
  {
    label: "Hinglish Complaint Statement",
    text: "Mere account se 20k kat gaya UPI se. Someone called from bank pretending to be official and scammed me."
  }
];

export default function AwaazView() {
  const [incidentText, setIncidentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editedDraft, setEditedDraft] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);

  const handleAnalyze = async (textToAnalyze = incidentText) => {
    if (!textToAnalyze.trim()) return;
    setLoading(true);
    setRegisteredData(null);
    try {
      const res = await fetch('/api/awaaz/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_text: textToAnalyze })
      });
      const data = await res.json();
      setResult(data);
      setEditedDraft(data.complaint_draft);
    } catch (err) {
      console.error('Awaaz error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterComplaint = async () => {
    if (!result) return;
    setRegistering(true);
    try {
      const suspectAcc = result.suspect_account && result.suspect_account !== "Not provided by the complainant."
        ? result.suspect_account
        : "ACC-100099";
      const txnRef = result.transaction_id && result.transaction_id !== "Not provided by the complainant."
        ? result.transaction_id
        : "TXN-20260820-0001";
      const lossAmt = typeof result.loss_val === 'number' && result.loss_val > 0
        ? result.loss_val
        : 25000.0;

      const payload = {
        incident_date: result.incident_date && result.incident_date !== "Not provided by the complainant." ? result.incident_date : "2026-08-20",
        complainant_category: "Citizen Complainant",
        reported_amount: lossAmt,
        fraud_category: result.fraud_category || "Cyber-Enabled Financial Fraud",
        incident_description: incidentText,
        suspect_accounts: [suspectAcc],
        transaction_references: [txnRef],
        evidence_type: "AWAAZ AI Incident Statement & Complaint Record"
      };

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();
      if (resJson.status === 'success') {
        setRegisteredData(resJson.complaint);
      }
    } catch (err) {
      console.error('Complaint registration error:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([editedDraft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Awaaz_Cybercrime_Complaint_Draft_${Date.now()}.txt`;
    link.click();
  };

  const handleDownloadPDF = () => {
    if (result) {
      generateAwaazPDF({
        ...result,
        complaint_draft: editedDraft,
        incident_description: incidentText
      });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-6 bg-white p-6 rounded-2xl border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase">
              MODULE 03 • RESPOND & ASSIST
            </span>
            <span className="text-xs text-[#5B6B7A] font-mono">VICTIM INCIDENT RESPONSE & COMPLAINT ENGINE</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-[#1565C0]" />
            AWAAZ — Bank Fraud Victim Support & Complaint Center
          </h1>
          <p className="text-xs text-[#5B6B7A] mt-1">
            Get immediate assistance after financial fraud. Analyzes natural language fraud descriptions, extracts key details, and formats structured complaints for official reporting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Incident Statement Input & Presets */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1565C0]" />
                <span>Tell Us What Happened</span>
              </label>
              <div className="flex items-center gap-3">
                <VoiceInputButton 
                  currentText={incidentText} 
                  onTextChange={setIncidentText} 
                  accentColor="blue"
                />
                <span className="text-[11px] text-[#5B6B7A] font-medium hidden sm:inline">Natural Language NLP</span>
              </div>
            </div>

            <textarea
              rows={8}
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="Describe the fraud incident naturally... e.g., 'Someone called me pretending to be SBI customer care. They said my KYC was incomplete and asked me to share an OTP. I shared the OTP and ₹20,000 was transferred yesterday.'"
              className="w-full bg-[#F5F7FA] border border-[#D9E2EC] rounded-xl p-4 text-xs text-[#0F2747] placeholder:text-[#7A8896] focus:outline-none focus:border-[#1565C0] focus:bg-white resize-none font-mono"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => { setIncidentText(''); setResult(null); }}
                className="text-xs text-[#5B6B7A] hover:text-[#0F2747] flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Input</span>
              </button>

              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !incidentText.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Analyzing Incident...</span>
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4" />
                    <span>ANALYZE INCIDENT</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sample Incident Statements */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#5B6B7A] uppercase tracking-wider">
              Try Sample Incident Statements:
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_INCIDENTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => { setIncidentText(sample.text); handleAnalyze(sample.text); }}
                  className="p-3.5 rounded-xl bg-white border border-[#D9E2EC] hover:border-[#1565C0] text-left transition space-y-1 group cursor-pointer shadow-2xs"
                >
                  <div className="text-[11px] font-bold text-[#1565C0] flex items-center justify-between">
                    <span>{sample.label}</span>
                    <span className="text-[9px] font-mono text-[#7A8896]">Analyze Statement &rarr;</span>
                  </div>
                  <div className="text-xs text-[#5B6B7A] line-clamp-1 italic font-mono">
                    "{sample.text}"
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Structured Incident Analysis & Complaint Draft */}
        <div className="lg:col-span-6 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Incident Classification Header */}
              <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                  <span className="text-[10px] font-bold text-[#1565C0] uppercase tracking-wider">
                    INCIDENT CLASSIFICATION
                  </span>
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC]">
                    {result.confidence_percentage} Confidence
                  </span>
                </div>

                <div className="text-base font-extrabold text-[#0F2747]">
                  {result.fraud_type}
                </div>
              </div>

              {/* Extracted Structured Incident Details */}
              <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
                <div className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#168A5B]" />
                  <span>Extracted Structured Incident Details</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#5B6B7A] flex items-center gap-1 font-bold">
                      <DollarSign className="w-3 h-3 text-[#168A5B]" /> Amount Disputed / Lost
                    </div>
                    <div className={`text-sm font-extrabold font-mono mt-0.5 ${
                      result.has_financial_loss ? 'text-[#D64545]' : 'text-[#168A5B]'
                    }`}>
                      {result.extracted_amount}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#5B6B7A] flex items-center gap-1 font-bold">
                      <CreditCard className="w-3 h-3 text-[#1565C0]" /> Payment Channel
                    </div>
                    <div className="text-xs font-extrabold text-[#0F2747] mt-0.5">
                      {result.payment_mode}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#5B6B7A] flex items-center gap-1 font-bold">
                      <Building2 className="w-3 h-3 text-[#1565C0]" /> Target Bank / Institution
                    </div>
                    <div className="text-xs font-extrabold text-[#0F2747] mt-0.5">
                      {result.bank_name}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#5B6B7A] flex items-center gap-1 font-bold">
                      <Calendar className="w-3 h-3 text-[#D98B00]" /> Incident Date & Time
                    </div>
                    <div className="text-xs font-extrabold text-[#0F2747] mt-0.5">
                      {result.incident_date} ({result.incident_time})
                    </div>
                  </div>
                </div>
              </div>

              {/* Numbered Professional Response Guidance */}
              <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
                <div className="text-xs font-bold text-[#0F2747] flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-[#1565C0]" />
                  <span>RECOMMENDED RESPONSE ACTIONS</span>
                </div>

                <div className="space-y-2.5">
                  {result.recommended_actions?.map((act, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-1">
                      <div className="text-xs font-bold text-[#0F2747] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] flex items-center justify-center text-[11px] font-mono shrink-0 font-bold">
                          {act.num}
                        </span>
                        <span>{act.title}</span>
                      </div>
                      <p className="text-[11px] text-[#5B6B7A] leading-relaxed font-mono pl-8">
                        {act.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Reporting Options (Clean 2-Card Layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: Call 1930 */}
                <div className="p-4 rounded-2xl bg-white border border-[#D9E2EC] space-y-3 shadow-2xs hover:border-[#D64545] transition">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-[#0F2747] flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-[#D64545]" />
                      <span>HELPLINE 1930</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#FEF2F2] text-[#D64545] border border-[#F87171] rounded">URGENT</span>
                  </div>
                  <p className="text-[11px] text-[#5B6B7A] font-mono">
                    Report Financial Cyber Fraud via Helpline 1930 immediately to freeze fraudulent beneficiary accounts.
                  </p>
                  <a
                    href="tel:1930"
                    className="w-full py-2 rounded-xl bg-[#D64545] hover:bg-[#B42318] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>CALL HELPLINE — 1930</span>
                  </a>
                </div>

                {/* Card 2: Report Online */}
                <div className="p-4 rounded-2xl bg-white border border-[#D9E2EC] space-y-3 shadow-2xs hover:border-[#1565C0] transition">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-[#0F2747] flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-[#1565C0]" />
                      <span>CYBERCRIME.GOV.IN</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#5B6B7A]">PORTAL</span>
                  </div>
                  <p className="text-[11px] text-[#5B6B7A] font-mono">
                    Submit a Cybercrime Complaint Online directly to the National Cyber Crime Reporting Portal.
                  </p>
                  <a
                    href="https://www.cybercrime.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>REPORT ONLINE — CYBERCRIME.GOV.IN</span>
                  </a>
                </div>
              </div>

              {/* AI-GENERATED COMPLAINT DRAFT */}
              <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#0F2747] flex items-center gap-2 uppercase tracking-wider">
                      <FileCheck className="w-4 h-4 text-[#1565C0]" />
                      <span>AI-GENERATED COMPLAINT DRAFT</span>
                    </h3>
                    <p className="text-[10px] text-[#7A8896] font-mono mt-0.5">
                      Review and verify all details before official submission
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F5F7FA] hover:bg-[#EEF3F8] text-[#0F2747] text-xs font-bold border border-[#D9E2EC] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#1565C0]" />
                      <span>PREVIEW</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F5F7FA] hover:bg-[#EEF3F8] text-[#0F2747] text-xs font-bold border border-[#D9E2EC] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#168A5B]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'COPIED' : 'COPY'}</span>
                    </button>

                    <button
                      onClick={handleDownloadPDF}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1565C0] hover:bg-[#0F2747] text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD PDF</span>
                    </button>

                    <button
                      onClick={handleDownloadTxt}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F5F7FA] hover:bg-[#EEF3F8] text-[#5B6B7A] text-xs font-bold border border-[#D9E2EC] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>TXT</span>
                    </button>

                    <button
                      onClick={handleRegisterComplaint}
                      disabled={registering || registeredData}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                        registeredData
                          ? 'bg-[#E6F4EA] text-[#168A5B] border border-[#A8DADC]'
                          : 'bg-[#168A5B] hover:bg-[#0E6240] text-white'
                      }`}
                      title="Link and correlate this complaint into MuleNet intelligence workspace"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{registering ? 'SYNCING...' : registeredData ? `LINKED (${registeredData.complaint_id})` : 'SYNC TO REGISTRY'}</span>
                    </button>
                  </div>
                </div>

                {registeredData && (
                  <div className="p-3 rounded-xl bg-[#E6F4EA] border border-[#A8DADC] text-xs text-[#168A5B] flex items-center justify-between font-mono">
                    <span className="font-bold">
                      ✓ Complaint {registeredData.complaint_id} successfully linked to suspect account {registeredData.suspect_accounts?.join(', ') || 'ACC-100099'}. Visible across DRISHTHI & Reports!
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#A8DADC] font-bold">
                      NCRP: {registeredData.police_portal_ack}
                    </span>
                  </div>
                )}

                <textarea
                  rows={12}
                  value={editedDraft}
                  onChange={(e) => setEditedDraft(e.target.value)}
                  className="w-full bg-[#F5F7FA] border border-[#D9E2EC] rounded-xl p-4 text-[11px] font-mono text-[#0F2747] leading-relaxed focus:outline-none focus:border-[#1565C0] focus:bg-white resize-y"
                />

                <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-[10px] text-[#5B6B7A] font-mono space-y-1">
                  <div className="font-bold text-[#0F2747] flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-[#1565C0]" />
                    <span>IMPORTANT NOTICE & ACCURACY DISCLAIMER</span>
                  </div>
                  <p>
                    This document is an AI-assisted complaint draft generated by MuleNet AI Awaaz. It is not an FIR, government-issued document, or official cybercrime complaint. The complainant should verify all details and submit the complaint through the appropriate official channel.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-[#D9E2EC] text-center space-y-3 shadow-2xs">
              <Megaphone className="w-12 h-12 text-[#7A8896] mx-auto" />
              <h3 className="text-sm font-bold text-[#0F2747]">Ready to Analyze Incident Statement</h3>
              <p className="text-xs text-[#5B6B7A] max-w-sm mx-auto font-mono">
                Describe a financial fraud incident in the box or click any sample statement to extract structured data, generate an AI complaint PDF draft, and review response actions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && result && (
        <div className="fixed inset-0 z-50 bg-[#0F2747]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#D9E2EC] flex items-center justify-between bg-[#F5F7FA]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#1565C0]" />
                <span className="text-sm font-extrabold text-[#0F2747]">AI-Generated Complaint Draft Preview</span>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg bg-white hover:bg-[#EEF3F8] text-[#5B6B7A] border border-[#D9E2EC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-[#0F2747] whitespace-pre-wrap leading-relaxed space-y-4">
              {editedDraft}
            </div>

            <div className="p-4 border-t border-[#D9E2EC] bg-[#F5F7FA] flex items-center justify-between">
              <span className="text-[11px] text-[#5B6B7A] font-mono">Review details carefully before official submission.</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
