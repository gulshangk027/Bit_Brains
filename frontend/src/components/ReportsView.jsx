import React, { useState, useEffect, Component } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Search, 
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Activity,
  User,
  Network,
  ShieldAlert,
  Clock,
  Eye
} from 'lucide-react';
import { generateInvestigationReportPDF } from '../utils/pdfGenerator';
import { getApiUrl } from '../config/api';

/**
 * React Error Boundary to prevent component crashes from turning the page blank.
 */
class ReportErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ReportErrorBoundary caught a rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#FEF2F2] p-10 rounded-2xl border border-[#F87171] text-center space-y-4 my-6 font-sans">
          <AlertTriangle className="w-12 h-12 text-[#B42318] mx-auto" />
          <h3 className="text-base font-bold text-[#B42318]">REPORT GENERATION ERROR</h3>
          <p className="text-xs text-[#5B6B7A] max-w-md mx-auto">
            Unable to render the investigation report due to a component rendering exception.
          </p>
          <div className="text-[11px] text-[#0F2747] font-mono bg-white p-3 rounded-lg border border-[#D9E2EC] inline-block max-w-xl text-left overflow-x-auto">
            {this.state.error?.toString()}
          </div>
          <br />
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-4 py-2 rounded-xl bg-[#D64545] hover:bg-[#B42318] text-white font-extrabold text-xs transition inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ReportsViewContent({ initialAccount }) {
  const getInitialAccountId = () => {
    if (initialAccount) {
      if (typeof initialAccount === 'object' && initialAccount.id) return initialAccount.id;
      if (typeof initialAccount === 'string') return initialAccount;
    }
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('accountId');
      if (q) return q;
    } catch (e) {}
    return 'ACC-100005';
  };

  const [accountId, setAccountId] = useState(getInitialAccountId());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleGenerateReport = async (idToGenerate = accountId) => {
    const targetId = (idToGenerate !== undefined && idToGenerate !== null) ? idToGenerate : accountId;
    if (!targetId || !targetId.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setAccountId(targetId);

    try {
      const res = await fetch(getApiUrl('/api/report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: targetId, mode: 'full_feature' })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setReportData(data);

      if (data && data.found) {
        setReportHistory(prev => {
          const exists = prev.find(item => item.report_id === data.report_id);
          if (exists) return prev;
          return [
            {
              report_id: data.report_id,
              account_id: data.account_id,
              risk_score: data.risk_score,
              risk_level: data.risk_level,
              classification: data.classification,
              timestamp: data.generation_timestamp,
              data: data
            },
            ...prev
          ].slice(0, 10);
        });
      }
    } catch (err) {
      console.error('Report generation fetch error:', err);
      setErrorMsg(err?.message || 'Network error or backend server unavailable.');
      setReportData({
        found: false,
        account_id: targetId,
        error: err?.message || 'Network error or backend server unavailable.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let target = null;
    if (initialAccount) {
      if (typeof initialAccount === 'object' && initialAccount.id) {
        target = initialAccount.id;
      } else if (typeof initialAccount === 'string') {
        target = initialAccount;
      }
    }
    if (!target) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        target = urlParams.get('accountId');
      } catch (e) {}
    }
    target = target || 'ACC-100005';
    setAccountId(target);
    handleGenerateReport(target);
  }, [initialAccount]);

  const handleCopy = () => {
    if (reportData && (reportData.markdown_report || reportData.report_markdown)) {
      const textToCopy = reportData.markdown_report || reportData.report_markdown;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (reportData && (reportData.markdown_report || reportData.report_markdown)) {
      const text = reportData.markdown_report || reportData.report_markdown;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MuleNet_Investigation_Report_${reportData.account_id || 'Account'}_${Date.now()}.txt`;
      link.click();
    }
  };

  const handleDownloadPdf = () => {
    try {
      if (reportData && reportData.found) {
        generateInvestigationReportPDF(reportData);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Unable to generate PDF document: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto font-sans">
      {/* Header & Module Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#D9E2EC] pb-6 gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase">
              MODULE 05 • FORMAL COMPLIANCE
            </span>
            <span className="text-xs text-[#5B6B7A] font-mono">AUTOMATED REPORT GENERATION ENGINE</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <FileText className="w-7 h-7 text-[#1565C0]" />
            INVESTIGATION REPORT GENERATOR
          </h1>
          <p className="text-xs text-[#5B6B7A] mt-1">
            Generates data-driven compliance & fraud investigation reports connected directly to Drishthi ML predictions and Network topology analysis.
          </p>
        </div>
      </div>

      {/* Account Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3 bg-[#F5F7FA] px-4 py-3 rounded-xl border border-[#D9E2EC] w-full">
            <Search className="w-4 h-4 text-[#7A8896] shrink-0" />
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateReport()}
              placeholder="Enter Account ID (e.g. ACC-100005, ACC-100012, ACC-100020, ACC-100099)..."
              className="bg-transparent text-xs text-[#0F2747] placeholder:text-[#7A8896] focus:outline-none w-full font-mono font-bold"
            />
          </div>

          <button
            onClick={() => handleGenerateReport()}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>{loading ? 'GENERATING REPORT...' : 'GENERATE REPORT'}</span>
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#D9E2EC]">
          <span className="text-[11px] font-bold text-[#5B6B7A] uppercase tracking-wider mr-1">
            Sample Accounts:
          </span>
          {['ACC-100005', 'ACC-100012', 'ACC-100020', 'ACC-100099'].map((id) => (
            <button
              key={id}
              onClick={() => handleGenerateReport(id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition border cursor-pointer ${
                accountId === id
                  ? 'bg-[#1565C0] text-white border-[#1565C0] font-bold'
                  : 'bg-[#F5F7FA] text-[#0F2747] border-[#D9E2EC] hover:bg-[#EEF3F8]'
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* STATE 1: Loading State */}
      {loading && (
        <div className="bg-white p-12 rounded-2xl border border-[#D9E2EC] text-center space-y-3 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-[#1565C0] animate-spin mx-auto" />
          <div className="text-sm font-bold text-[#0F2747] uppercase tracking-wider">GENERATING INVESTIGATION REPORT...</div>
          <div className="text-xs text-[#5B6B7A] font-mono">Running Drishthi ML inference, SHAP extraction & Network topology analysis</div>
        </div>
      )}

      {/* STATE 2: Error State */}
      {!loading && reportData && reportData.found === false && (
        <div className="bg-[#FFFBEB] p-10 rounded-2xl border border-[#FDE68A] text-center space-y-3 shadow-2xs font-sans">
          <AlertTriangle className="w-12 h-12 text-[#D98B00] mx-auto" />
          <h3 className="text-base font-bold text-[#D98B00]">ACCOUNT NOT FOUND</h3>
          <p className="text-xs text-[#5B6B7A] max-w-md mx-auto">
            {reportData.error || `No account matching ${reportData.account_id || accountId} was found in the active dataset.`}
          </p>
          <div className="text-[11px] text-[#7A8896] font-mono pt-2">
            Try valid accounts: ACC-100005, ACC-100012, ACC-100020, or ACC-100099
          </div>
        </div>
      )}

      {/* STATE 3: Success State - Report Preview */}
      {!loading && reportData && reportData.found && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#D9E2EC] shadow-sm font-sans">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#168A5B]"></span>
              <span className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                REPORT GENERATED • READY FOR COMPLIANCE EXPORT
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] text-[#0F2747] text-xs font-bold border border-[#D9E2EC] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4 text-[#168A5B]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED' : 'COPY REPORT'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F7FA] text-[#0F2747] text-xs font-bold border border-[#D9E2EC] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-[#1565C0]" />
                <span>DOWNLOAD TXT</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD PDF</span>
              </button>
            </div>
          </div>

          {/* Formal Investigation Report Document Card */}
          <div className="bg-white p-8 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-8 font-sans">
            {/* Document Header Banner */}
            <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EC] pb-4">
                <div>
                  <div className="text-[10px] font-bold text-[#1565C0] uppercase tracking-widest">
                    MULENET AI COMPLIANCE PLATFORM
                  </div>
                  <h2 className="text-xl font-extrabold text-[#0F2747] mt-1">
                    MULE ACCOUNT FRAUD INVESTIGATION REPORT
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-[#FEF2F2] text-[#D64545] border border-[#F87171]">
                    CONFIDENTIAL
                  </span>
                  <span className="text-xs font-mono text-[#1565C0] bg-white px-3 py-1 rounded-lg border border-[#D9E2EC] font-bold">
                    {reportData.account_id || accountId}
                  </span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-[#5B6B7A]">
                <div>
                  <span className="text-[10px] text-[#7A8896] uppercase block font-sans font-bold">Report ID</span>
                  <span className="font-bold text-[#0F2747]">{reportData.report_id || 'REP-PENDING'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8896] uppercase block font-sans font-bold">Timestamp</span>
                  <span className="font-bold text-[#0F2747]">{reportData.generation_timestamp || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8896] uppercase block font-sans font-bold">Mode</span>
                  <span className="font-bold text-[#1565C0]">{reportData.metadata?.mode || 'ML MODE'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8896] uppercase block font-sans font-bold">Model Status</span>
                  <span className="font-bold text-[#168A5B]">{reportData.metadata?.model_status || 'Active'}</span>
                </div>
              </div>
            </div>

            {/* 1. EXECUTIVE SUMMARY */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1565C0]" />
                <span>1. EXECUTIVE SUMMARY</span>
              </h3>
              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-xs text-[#0F2747] leading-relaxed">
                {reportData.executive_summary || 'Executive summary unavailable.'}
              </div>
            </div>

            {/* 2. RISK ASSESSMENT */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1565C0]" />
                <span>2. PREDICTIVE RISK ASSESSMENT</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Risk Score</div>
                  <div className="text-2xl font-extrabold text-[#0F2747] mt-1">{reportData.risk_score ?? 'N/A'} <span className="text-xs text-[#7A8896] font-normal">/ 100</span></div>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Risk Level</div>
                  <div className="text-lg font-extrabold text-[#D98B00] mt-1">{reportData.risk_level ?? 'N/A'}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Mule Probability</div>
                  <div className="text-2xl font-extrabold text-[#1565C0] mt-1">
                    {(Number(reportData.model_probability ?? 0) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Anomaly Score</div>
                  <div className="text-2xl font-extrabold text-[#0F2747] mt-1">{reportData.anomaly_score ?? 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* 3. TOP RISK CONTRIBUTING FEATURES */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1565C0]" />
                <span>3. MODEL EXPLAINABILITY & SHAP FEATURE IMPACTS</span>
              </h3>

              {Array.isArray(reportData.top_risk_features) && reportData.top_risk_features.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-[#D9E2EC]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#F5F7FA] text-[#5B6B7A] font-bold uppercase text-[10px] border-b border-[#D9E2EC]">
                      <tr>
                        <th className="p-3">Feature Name</th>
                        <th className="p-3">Feature ID</th>
                        <th className="p-3">Actual Value</th>
                        <th className="p-3">SHAP Impact</th>
                        <th className="p-3">Effect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9E2EC] text-[#0F2747]">
                      {reportData.top_risk_features.map((item, idx) => {
                        const effectStr = String(item?.effect || (Number(item?.shap_impact || 0) > 0 ? 'Increases Mule Risk' : 'Decreases Mule Risk'));
                        const isIncrease = effectStr.toLowerCase().includes('increase');
                        const shapNum = Number(item?.shap_impact || item?.shap_value || 0);

                        return (
                          <tr key={idx} className="hover:bg-[#F5F7FA] transition">
                            <td className="p-3 font-sans font-bold text-[#0F2747]">{item?.feature_name || item?.feature_id || 'Unknown Feature'}</td>
                            <td className="p-3 text-[#1565C0] text-[11px] font-bold">{item?.feature_id || 'F0'}</td>
                            <td className="p-3 font-bold">{String(item?.actual_value ?? 'N/A')}</td>
                            <td className={`p-3 font-bold ${shapNum > 0 ? 'text-[#D64545]' : 'text-[#168A5B]'}`}>
                              {shapNum > 0 ? `+${shapNum.toFixed(3)}` : shapNum.toFixed(3)}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                                isIncrease
                                  ? 'bg-[#FEF2F2] text-[#D64545] border border-[#F87171]'
                                  : 'bg-[#E6F4EA] text-[#168A5B] border border-[#A8DADC]'
                              }`}>
                                {effectStr}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-xs text-[#5B6B7A] font-mono italic">
                  Feature-level explanation is unavailable for this model prediction.
                </div>
              )}
            </div>

            {/* 4. ACCOUNT BEHAVIORAL PROFILE */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#1565C0]" />
                <span>4. ACCOUNT BEHAVIORAL PROFILE</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Average Balance (14D)</div>
                  <div className="text-sm font-extrabold text-[#0F2747] mt-1">
                    ₹{reportData.behavioral_profile?.avg_balance_14d !== undefined ? Number(reportData.behavioral_profile.avg_balance_14d).toLocaleString() : 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Account Tenure</div>
                  <div className="text-sm font-extrabold text-[#0F2747] mt-1">
                    {reportData.behavioral_profile?.tenure_days !== undefined ? `${reportData.behavioral_profile.tenure_days} Days` : 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">UPI Min Txns (7D)</div>
                  <div className="text-sm font-extrabold text-[#1565C0] mt-1">
                    {reportData.behavioral_profile?.upi_min_txns_7d ?? 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Cash Debits (14D)</div>
                  <div className="text-sm font-extrabold text-[#D98B00] mt-1">
                    {reportData.behavioral_profile?.cash_debit_txns_14d ?? 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. NETWORK INTELLIGENCE */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4 text-[#1565C0]" />
                <span>5. NETWORK INTELLIGENCE & GRAPH TOPOLOGY</span>
              </h3>

              {reportData.network_intelligence && reportData.network_intelligence.has_network ? (
                <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    <div className="p-2.5 rounded bg-white border border-[#D9E2EC]">
                      <div className="text-[9px] text-[#5B6B7A] font-sans">Primary Topology</div>
                      <div className="font-bold text-[#1565C0] mt-0.5">{reportData.network_intelligence.primary_topology || 'N/A'}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-[#D9E2EC]">
                      <div className="text-[9px] text-[#5B6B7A] font-sans">Degree (In/Out)</div>
                      <div className="font-bold text-[#0F2747] mt-0.5">
                        {reportData.network_intelligence.in_degree ?? 0} In / {reportData.network_intelligence.out_degree ?? 0} Out
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-[#D9E2EC]">
                      <div className="text-[9px] text-[#5B6B7A] font-sans">PageRank</div>
                      <div className="font-bold text-[#0F2747] mt-0.5">{reportData.network_intelligence.pagerank ?? '0.0'}</div>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-[#D9E2EC]">
                      <div className="text-[9px] text-[#5B6B7A] font-sans">Connected Accounts</div>
                      <div className="font-bold text-[#D98B00] mt-0.5">{reportData.network_intelligence.connected_accounts_count ?? 0}</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#0F2747] italic pt-1">
                    {reportData.network_intelligence.topology_explanation || 'No topology explanation available.'}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-xs text-[#5B6B7A] font-mono italic">
                  No significant network relationship data available.
                </div>
              )}
            </div>

            {/* 6. RISK INTERPRETATION & RECOMMENDED ACTION */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#1565C0]" />
                <span>6. RISK INTERPRETATION & RECOMMENDED ACTION</span>
              </h3>

              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-3">
                <div className="text-xs font-bold text-[#0F2747] leading-relaxed font-sans">
                  {reportData.risk_interpretation || 'Standard monitoring recommended.'}
                </div>

                <div className="pt-2 border-t border-[#D9E2EC] flex items-center justify-between">
                  <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">RECOMMENDED ACTION:</span>
                  <span className="px-3 py-1 rounded-lg bg-[#FEF2F2] text-[#D64545] border border-[#F87171] text-xs font-extrabold uppercase tracking-wider">
                    {reportData.recommended_action || 'MONITOR ACCOUNT ACTIVITY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer Footer */}
            <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-[10px] text-[#5B6B7A] leading-relaxed font-mono">
              <span className="font-bold text-[#0F2747]">COMPLIANCE NOTICE:</span> AI-assisted decision-support investigation report generated by MuleNet AI calibrated algorithms. Model outputs reflect behavioral probability scores and should be verified by authorized banking compliance and cybercrime investigators.
            </div>
          </div>
        </div>
      )}

      {/* Session Reports History */}
      {Array.isArray(reportHistory) && reportHistory.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
            <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1565C0]" />
              <span>RECENT SESSION REPORTS ({reportHistory.length})</span>
            </h3>
            <span className="text-[10px] text-[#5B6B7A] font-mono">CURRENT SESSION HISTORY</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#D9E2EC]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F5F7FA] text-[#5B6B7A] font-bold uppercase text-[10px] border-b border-[#D9E2EC]">
                <tr>
                  <th className="p-3">Report ID</th>
                  <th className="p-3">Account ID</th>
                  <th className="p-3">Risk Score</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EC] text-[#0F2747]">
                {reportHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F7FA] transition">
                    <td className="p-3 font-bold text-[#1565C0]">{item?.report_id || 'N/A'}</td>
                    <td className="p-3 font-bold text-[#0F2747]">{item?.account_id || 'N/A'}</td>
                    <td className="p-3 font-bold">{item?.risk_score ?? 'N/A'} / 100</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        item?.risk_level === 'CRITICAL'
                          ? 'bg-[#FEF2F2] text-[#B42318] border border-[#B42318]'
                          : item?.risk_level === 'HIGH'
                          ? 'bg-[#FDF2F2] text-[#D64545] border border-[#F87171]'
                          : 'bg-[#E6F4EA] text-[#168A5B] border border-[#A8DADC]'
                      }`}>
                        {item?.risk_level || 'LOW'}
                      </span>
                    </td>
                    <td className="p-3 text-[#5B6B7A] text-[11px]">{item?.timestamp || 'N/A'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setReportData(item.data)}
                        className="px-3 py-1 rounded bg-[#EEF3F8] hover:bg-[#1565C0] hover:text-white text-[#1565C0] border border-[#D9E2EC] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsView(props) {
  return (
    <ReportErrorBoundary>
      <ReportsViewContent {...props} />
    </ReportErrorBoundary>
  );
}
