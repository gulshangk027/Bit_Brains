import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw,
  User,
  SlidersHorizontal,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  ArrowRight,
  Share2,
  FileText,
  FileCheck2,
  ShieldCheck,
  Layers,
  ExternalLink,
  Filter,
  GitFork,
  ChevronRight
} from 'lucide-react';

export default function DrishthiView({ initialAccount, onNavigate, onSelectAccount }) {
  const getInitialTargetId = () => {
    if (initialAccount) {
      if (typeof initialAccount === 'object' && initialAccount.id) return initialAccount.id;
      if (typeof initialAccount === 'string') return initialAccount;
    }
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('accountId');
      if (q) return q;
    } catch (e) {}
    return 'ACC-100099';
  };

  const [accountId, setAccountId] = useState(getInitialTargetId());
  const [accountData, setAccountData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showRawFeatures, setShowRawFeatures] = useState(false);

  // Investigation Workspace State
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('timeline');
  const [timelineData, setTimelineData] = useState(null);
  const [timelineFilter, setTimelineFilter] = useState('ALL');
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [trailSource, setTrailSource] = useState(getInitialTargetId());
  const [trailDest, setTrailDest] = useState('ACC-100035');
  const [trailDepth, setTrailDepth] = useState(4);
  const [trailResult, setTrailResult] = useState(null);
  const [trailLoading, setTrailLoading] = useState(false);

  const [complaintsData, setComplaintsData] = useState(null);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintSearch, setComplaintSearch] = useState('');

  const fetchTimeline = async (id, dir = 'ALL') => {
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/transactions/${id}?direction=${dir}&limit=100`);
      const data = await res.json();
      setTimelineData(data);
    } catch (err) {
      console.error('Timeline error:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const fetchComplaints = async (id) => {
    setComplaintsLoading(true);
    try {
      const res = await fetch(`/api/complaints/${id}`);
      const data = await res.json();
      setComplaintsData(data);
    } catch (err) {
      console.error('Complaints error:', err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const fetchMoneyTrail = async (src, dst, depth = 4) => {
    if (!src || !dst) return;
    setTrailLoading(true);
    try {
      const res = await fetch('/api/money-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_account: src.trim(), 
          destination_account: dst.trim(), 
          max_depth: Number(depth) 
        })
      });
      const data = await res.json();
      setTrailResult(data);
    } catch (err) {
      console.error('Money trail error:', err);
    } finally {
      setTrailLoading(false);
    }
  };

  // Load account investigation data from active ML model
  const handleSearchAccount = async (idToSearch) => {
    const targetId = (idToSearch !== undefined && idToSearch !== null) ? idToSearch : accountId;
    if (!targetId || !targetId.trim()) return;
    setSearchLoading(true);
    setAccountId(targetId);
    setTrailSource(targetId);

    try {
      const res = await fetch(`/api/accounts/${targetId}?mode=full_feature`);
      const data = await res.json();
      setAccountData(data);

      // Concurrently fetch timeline & correlated complaints
      fetchTimeline(targetId, timelineFilter);
      fetchComplaints(targetId);

      // Auto-trace money trail if high risk
      const defaultDst = targetId === 'ACC-100035' ? 'ACC-CRYPTO-P2P' : (targetId === 'ACC-100001' ? 'ACC-100035' : 'ACC-100098');
      setTrailDest(defaultDst);
      fetchMoneyTrail(targetId, defaultDst, trailDepth);
    } catch (err) {
      console.error('Account fetch error:', err);
    } finally {
      setSearchLoading(false);
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
    target = target || 'ACC-100099';
    setAccountId(target);
    handleSearchAccount(target);
  }, [initialAccount]);

  const handleSelectPreset = (presetId) => {
    setAccountId(presetId);
    handleSearchAccount(presetId);
  };

  // Helper to get top 5-7 SHAP features sorted by absolute magnitude
  const getTopShapFeatures = () => {
    if (!accountData || !accountData.shap_contributions || accountData.shap_contributions.length === 0) {
      return [];
    }
    const sorted = [...accountData.shap_contributions].sort(
      (a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)
    );
    return sorted.slice(0, 7);
  };

  const topShapFeatures = getTopShapFeatures();
  const maxAbsShap = topShapFeatures.length > 0 
    ? Math.max(...topShapFeatures.map(item => Math.abs(item.shap_value)), 0.01)
    : 1.0;
  const isAllShapNegligible = maxAbsShap < 0.05;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header & Module Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#D9E2EC] pb-6 gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase">
              MODULE 02 • DETECT & INVESTIGATE
            </span>
            <span className="text-xs text-[#5B6B7A] font-mono">REAL-TIME ML INFERENCE ENGINE</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <Search className="w-7 h-7 text-[#1565C0]" />
            DRISHTHI — Bank Fraud Analytics & Detection
          </h1>
          <p className="text-xs text-[#5B6B7A] mt-1">
            Behavioral Intelligence Engine for real-time ML detection of suspicious mule accounts, calibrated probability scoring, and SHAP explainability.
          </p>
        </div>
      </div>

      {/* Account Search Bar & Presets */}
      <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3 bg-[#F5F7FA] px-4 py-3 rounded-xl border border-[#D9E2EC] w-full">
            <Search className="w-4 h-4 text-[#7A8896] shrink-0" />
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchAccount()}
              placeholder="Enter Account ID (e.g. ACC-100005, ACC-100012, ACC-100020, ACC-100099)..."
              className="bg-transparent text-xs text-[#0F2747] placeholder:text-[#7A8896] focus:outline-none w-full font-mono font-bold"
            />
          </div>
          
          <button
            onClick={() => handleSearchAccount()}
            disabled={searchLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>SEARCH ACCOUNT</span>
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#D9E2EC]">
          <span className="text-[11px] font-bold text-[#5B6B7A] uppercase tracking-wider mr-1">
            Sample Accounts:
          </span>
          {[
            { id: 'ACC-100005', label: 'ACC-100005 (Legitimate)', tag: 'low' },
            { id: 'ACC-100012', label: 'ACC-100012 (Moderate)', tag: 'mod' },
            { id: 'ACC-100020', label: 'ACC-100020 (Normal)', tag: 'low' },
            { id: 'ACC-100099', label: 'ACC-100099 (High Risk Mule)', tag: 'high' }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition border cursor-pointer ${
                accountId === preset.id
                  ? 'bg-[#1565C0] text-white border-[#1565C0] font-bold'
                  : 'bg-[#F5F7FA] text-[#0F2747] border-[#D9E2EC] hover:bg-[#EEF3F8]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Result Dashboard */}
      {accountData && accountData.found === false ? (
        <div className="bg-[#FFFBEB] p-10 rounded-2xl border border-[#FDE68A] text-center space-y-3 shadow-2xs">
          <AlertTriangle className="w-12 h-12 text-[#D98B00] mx-auto" />
          <h3 className="text-base font-bold text-[#D98B00]">Account Not Found in Dataset</h3>
          <p className="text-xs text-[#5B6B7A] max-w-md mx-auto">
            {accountData.error || `No record matching Account ID '${accountData.account_id}' was found in the active dataset.`}
          </p>
          <div className="text-[11px] text-[#7A8896] font-mono pt-2">
            Try preset accounts: ACC-100005, ACC-100012, ACC-100020, or ACC-100099
          </div>
        </div>
      ) : accountData ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Risk Gauge & Classification Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`bg-white p-6 rounded-2xl border text-center space-y-6 shadow-sm ${
              accountData.risk_score >= 75
                ? 'border-[#B42318]'
                : accountData.risk_score >= 50
                ? 'border-[#D64545]'
                : accountData.risk_score >= 25
                ? 'border-[#D98B00]'
                : 'border-[#168A5B]'
            }`}>
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                <span className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider">
                  PREDICTIVE RISK GAUGE
                </span>
                <span className="text-[10px] font-mono text-[#1565C0] bg-[#EEF3F8] px-2.5 py-0.5 rounded font-bold border border-[#D9E2EC]">
                  {accountData.account_id}
                </span>
              </div>

              {/* Circular Risk Score Gauge */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#E2E8F0]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      accountData.risk_score >= 75
                        ? 'text-[#B42318]'
                        : accountData.risk_score >= 50
                        ? 'text-[#D64545]'
                        : accountData.risk_score >= 25
                        ? 'text-[#D98B00]'
                        : 'text-[#168A5B]'
                    }
                    strokeDasharray={`${accountData.risk_score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold font-mono text-[#0F2747]">
                    {accountData.risk_score}
                  </span>
                  <span className="text-[10px] text-[#7A8896] font-bold uppercase tracking-wider">
                    / 100 RISK SCORE
                  </span>
                </div>
              </div>

              {/* Classification Badge */}
              <div className="space-y-2">
                <div className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider inline-block ${
                  accountData.risk_score >= 50
                    ? 'bg-[#FEF2F2] text-[#D64545] border border-[#F87171]'
                    : 'bg-[#E6F4EA] text-[#168A5B] border border-[#A8DADC]'
                }`}>
                  {accountData.classification}
                </div>

                <div className="text-xs text-[#5B6B7A] font-medium">
                  Risk Level: <span className="font-bold text-[#0F2747]">{accountData.risk_level}</span>
                </div>
              </div>

              {/* Model Scores Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#D9E2EC] text-left">
                <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-bold uppercase">Mule Probability</div>
                  <div className="text-base font-extrabold font-mono text-[#1565C0] mt-0.5">
                    {(accountData.model_probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-[#7A8896] font-mono">P(Mule) = {accountData.model_probability}</div>
                </div>
                
                <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-bold uppercase">Anomaly Score</div>
                  <div className="text-base font-extrabold font-mono text-[#D98B00] mt-0.5">
                    {accountData.anomaly_score}
                  </div>
                  <div className="text-[9px] text-[#7A8896] font-mono">Isolation Forest</div>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-left space-y-1">
                <div className="text-[10px] font-bold text-[#1565C0] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Recommended Action
                </div>
                <div className="text-xs font-bold text-[#0F2747]">
                  {accountData.recommended_action}
                </div>
              </div>

              {/* Concrete Flagged Risk Reasons */}
              {accountData.concrete_reasons && accountData.concrete_reasons.length > 0 && (
                <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-left space-y-2">
                  <div className="text-[10px] font-bold text-[#D98B00] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Concrete Flagged Reasons ({accountData.concrete_reasons.length})
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white text-[#D98B00] border border-[#FDE68A] font-bold">
                      EVIDENCE
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#0F2747]">
                    {accountData.concrete_reasons.map((r, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-[#D9E2EC]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D64545] mt-1.5 shrink-0"></span>
                        <span className="leading-snug font-medium">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: SHAP Explainability & Account Profile */}
          <div className="lg:col-span-8 space-y-6">
            {/* SHAP Explanation Banner */}
            <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EC] pb-3">
                <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1565C0]" />
                  <span>EXPLAINABLE AI • SHAP FEATURE BREAKDOWN</span>
                </h3>
                <span className="text-[10px] text-[#7A8896] font-mono uppercase">MODEL FEATURE IMPACT ANALYSIS</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-xs text-[#0F2747] leading-relaxed font-mono font-medium">
                "{accountData.explanation}"
              </div>

              {/* Top Contributing Features Visualization */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider">
                    TOP CONTRIBUTING FEATURE DRIVERS (Abs SHAP Magnitude)
                  </div>

                  {/* Visual Legend */}
                  <div className="flex items-center gap-3 text-[10px] font-bold font-mono">
                    <span className="flex items-center gap-1 text-[#D64545]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D64545]"></span>
                      + Increases Mule Risk
                    </span>
                    <span className="flex items-center gap-1 text-[#168A5B]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#168A5B]"></span>
                      − Decreases Mule Risk
                    </span>
                  </div>
                </div>

                {isAllShapNegligible && (
                  <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC] text-xs text-[#5B6B7A] font-mono">
                    Most features had negligible SHAP contribution for this account.
                  </div>
                )}

                {/* Zero-Centered Horizontal SHAP Bar List */}
                <div className="space-y-3 pt-1">
                  {topShapFeatures.map((item, idx) => {
                    const isPos = item.is_risk_increasing;
                    const absVal = Math.abs(item.shap_value);
                    const barPercent = Math.max(4, Math.round((absVal / maxAbsShap) * 100));

                    return (
                      <div key={idx} className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-2 hover:border-[#1565C0] transition">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-extrabold text-[#0F2747] text-xs truncate">
                              {item.variable_name}
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white text-[#1565C0] border border-[#D9E2EC] shrink-0 font-bold">
                              {item.feature_id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono font-bold">
                            <span className="text-[10px] text-[#5B6B7A]">Val: {item.actual_value}</span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${
                              isPos
                                ? 'bg-[#FEF2F2] text-[#D64545] border-[#F87171]'
                                : 'bg-[#E6F4EA] text-[#168A5B] border-[#A8DADC]'
                            }`}>
                              {item.shap_value > 0 ? `+${item.shap_value}` : item.shap_value}
                            </span>
                          </div>
                        </div>

                        {/* Dual-Direction Zero-Centered Progress Bar */}
                        <div className="relative h-2.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden border border-[#CBD5E1] flex items-center">
                          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#94A3B8] z-10"></div>
                          {isPos ? (
                            <div 
                              className="absolute left-1/2 h-full bg-[#D64545] rounded-r"
                              style={{ width: `${Math.min(barPercent / 2, 50)}%` }}
                            ></div>
                          ) : (
                            <div 
                              className="absolute right-1/2 h-full bg-[#168A5B] rounded-l"
                              style={{ width: `${Math.min(barPercent / 2, 50)}%` }}
                            ></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Behavioral Profile Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1565C0]" />
                  <span>ACCOUNT BEHAVIORAL PROFILE</span>
                </h3>
                <span className="text-[10px] text-[#7A8896] font-mono uppercase">ANCHOR FEATURE METRICS</span>
              </div>

              {accountData.behavioral_profile && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[9px] text-[#5B6B7A] uppercase font-sans font-bold">Avg Balance (14D)</div>
                    <div className="text-sm font-extrabold text-[#0F2747] mt-1">
                      ₹{accountData.behavioral_profile.avg_balance_14d?.toLocaleString() ?? 'N/A'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[9px] text-[#5B6B7A] uppercase font-sans font-bold">Tenure (Days)</div>
                    <div className="text-sm font-extrabold text-[#0F2747] mt-1">
                      {accountData.behavioral_profile.tenure_days ?? 'N/A'} Days
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[9px] text-[#5B6B7A] uppercase font-sans font-bold">UPI Min Txns (7D)</div>
                    <div className="text-sm font-extrabold text-[#1565C0] mt-1">
                      {accountData.behavioral_profile.upi_min_txns_7d ?? 'N/A'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[9px] text-[#5B6B7A] uppercase font-sans font-bold">Cash Debits (14D)</div>
                    <div className="text-sm font-extrabold text-[#D98B00] mt-1">
                      {accountData.behavioral_profile.cash_debit_txns_14d ?? 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Toggle Raw Feature Vector Drawer */}
              <div className="pt-2">
                <button
                  onClick={() => setShowRawFeatures(!showRawFeatures)}
                  className="w-full py-2.5 rounded-xl bg-[#F5F7FA] hover:bg-[#EEF3F8] text-[#0F2747] text-xs font-bold border border-[#D9E2EC] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>{showRawFeatures ? 'Hide Raw Feature Vector' : 'Inspect Raw Dataset Feature Vector (All Columns)'}</span>
                </button>

                {showRawFeatures && accountData.all_feature_values && (
                  <div className="mt-3 p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] max-h-60 overflow-y-auto font-mono text-[11px] space-y-1">
                    <div className="text-[10px] text-[#1565C0] font-bold uppercase tracking-wider pb-2 border-b border-[#D9E2EC]">
                      Row Index: {accountData.row_index} | Feature Hash: {accountData.feature_vector_hash}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      {Object.entries(accountData.all_feature_values).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-1.5 rounded bg-white border border-[#D9E2EC]">
                          <span className="text-[#5B6B7A]">{k}:</span>
                          <span className="text-[#0F2747] font-bold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PS-01 INVESTIGATION WORKSPACE (TIMELINE, MONEY-TRAIL & COMPLAINTS) */}
        <div className="bg-white rounded-2xl border border-[#D9E2EC] shadow-sm overflow-hidden space-y-0">
          {/* Workspace Header with Tabs */}
          <div className="p-6 border-b border-[#D9E2EC] bg-[#FAFCFF] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#EBF3FA] text-[#1268C4] border border-[#DCE5EF] uppercase">
                  PS-01 INVESTIGATION WORKSPACE
                </span>
                <span className="text-xs text-[#5B6B7A] font-mono">TARGET: {accountData.account_id}</span>
              </div>
              <h2 className="text-xl font-black text-[#0F2747] mt-1 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#1268C4]" />
                <span>Transaction Ledger, Money Trail & Victim Complaints</span>
              </h2>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-1.5 bg-[#F5F7FA] p-1.5 rounded-xl border border-[#D9E2EC] flex-wrap">
              {[
                { id: 'timeline', label: 'Transaction Timeline', icon: Clock },
                { id: 'money_trail', label: 'Money Trail (Multi-Hop)', icon: GitFork },
                { id: 'complaints', label: `Victim Complaints (${complaintsData?.correlated_count || 0})`, icon: FileText },
                { id: 'counterparties', label: 'Counterparties & Flow', icon: Share2 }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveWorkspaceTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeWorkspaceTab === tab.id
                        ? 'bg-[#1268C4] text-white shadow-2xs'
                        : 'text-[#5B6B7A] hover:text-[#0F2747]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: TRANSACTION TIMELINE */}
          {activeWorkspaceTab === 'timeline' && (
            <div className="p-6 space-y-6">
              {/* Timeline Metrics Banner */}
              {timelineData?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#5B6B7A] uppercase font-sans font-bold">Total Inflow Volume</div>
                    <div className="text-base font-extrabold text-[#168A5B] mt-1">
                      ₹{timelineData.summary.total_incoming_amount?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-[#7A8896] font-sans">{timelineData.summary.incoming_count} credits</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#5B6B7A] uppercase font-sans font-bold">Total Outflow Volume</div>
                    <div className="text-base font-extrabold text-[#D64545] mt-1">
                      ₹{timelineData.summary.total_outgoing_amount?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-[#7A8896] font-sans">{timelineData.summary.outgoing_count} debits</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#5B6B7A] uppercase font-sans font-bold">Rapid Pass-Through</div>
                    <div className="text-base font-extrabold text-[#D98B00] mt-1">
                      {(timelineData.summary.rapid_passthrough_ratio * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-[#7A8896] font-sans">Drained within 60 mins</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#5B6B7A] uppercase font-sans font-bold">Net Balance Change</div>
                    <div className="text-base font-extrabold text-[#0F2747] mt-1">
                      ₹{timelineData.summary.net_balance_change?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-[#7A8896] font-sans">Drain Ratio: {(timelineData.summary.drain_ratio * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}

              {/* Filter Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5B6B7A]">Direction Filter:</span>
                  {['ALL', 'INFLOW', 'OUTFLOW'].map(dir => (
                    <button
                      key={dir}
                      onClick={() => {
                        setTimelineFilter(dir);
                        fetchTimeline(accountId, dir);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                        timelineFilter === dir
                          ? 'bg-[#1565C0] text-white'
                          : 'bg-[#F5F7FA] text-[#5B6B7A] border border-[#D9E2EC] hover:text-[#0F2747]'
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-[#5B6B7A] font-mono">
                  Showing {timelineData?.timeline?.length || 0} chronological transaction entries
                </span>
              </div>

              {/* Transactions Table */}
              <div className="border border-[#D9E2EC] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F7FA] text-[#5B6B7A] font-bold uppercase tracking-wider text-[10px] border-b border-[#D9E2EC]">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Type & Amount</th>
                      <th className="p-3.5">Counterparty Account</th>
                      <th className="p-3.5">Channel</th>
                      <th className="p-3.5">Flags & Evidence</th>
                      <th className="p-3.5">Transaction Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E2EC] font-mono text-[#0F2747]">
                    {timelineData?.timeline && timelineData.timeline.length > 0 ? (
                      timelineData.timeline.map((tx, txIdx) => {
                        const isIn = tx.direction === 'INFLOW';
                        return (
                          <tr key={txIdx} className="hover:bg-[#F5F7FA] transition">
                            <td className="p-3.5 text-[#5B6B7A] text-[11px] whitespace-nowrap">
                              <div>{tx.timestamp}</div>
                              <div className="text-[10px] text-[#7A8896]">{tx.transaction_id}</div>
                            </td>

                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5 font-bold">
                                {isIn ? (
                                  <span className="text-[#168A5B] flex items-center gap-0.5">
                                    <ArrowDownRight className="w-3.5 h-3.5" />
                                    +₹{tx.amount?.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-[#D64545] flex items-center gap-0.5">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    -₹{tx.amount?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] uppercase font-sans font-bold text-[#7A8896]">{tx.direction}</div>
                            </td>

                            <td className="p-3.5">
                              <button
                                onClick={() => handleSelectPreset(tx.counterparty)}
                                className="font-bold text-[#1565C0] hover:underline flex items-center gap-1 cursor-pointer"
                                title="Inspect counterparty in Drishthi"
                              >
                                <span>{tx.counterparty}</span>
                                <ExternalLink className="w-3 h-3 text-[#1565C0]" />
                              </button>
                            </td>

                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] text-[10px] font-bold">
                                {tx.channel}
                              </span>
                            </td>

                            <td className="p-3.5">
                              {tx.flags && tx.flags.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {tx.flags.map((f, fIdx) => (
                                    <span key={fIdx} className="px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#D64545] border border-[#F87171] text-[9px] font-bold">
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#7A8896] text-[10px] font-sans">Standard Retail</span>
                              )}
                            </td>

                            <td className="p-3.5 text-[#5B6B7A] font-sans text-xs">
                              {tx.notes || '—'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-[#7A8896] font-sans italic">
                          No transactions recorded for this account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MONEY-TRAIL ANALYSIS */}
          {activeWorkspaceTab === 'money_trail' && (
            <div className="p-6 space-y-6">
              <div className="bg-[#F5F7FA] p-5 rounded-xl border border-[#D9E2EC] space-y-4">
                <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                  <span className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-[#1268C4]" />
                    Multi-Hop Layering & Money-Trail Query Parameters
                  </span>
                  <span className="text-[10px] font-mono text-[#5B6B7A]">TEMPORAL ORDER PRESERVED</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[11px] font-bold text-[#5B6B7A] uppercase">Source Account</label>
                    <input
                      type="text"
                      value={trailSource}
                      onChange={(e) => setTrailSource(e.target.value)}
                      placeholder="Source account (e.g. ACC-100001)"
                      className="w-full bg-white border border-[#D9E2EC] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-[#1268C4]"
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[11px] font-bold text-[#5B6B7A] uppercase">Destination Account</label>
                    <input
                      type="text"
                      value={trailDest}
                      onChange={(e) => setTrailDest(e.target.value)}
                      placeholder="Destination account (e.g. ACC-100035)"
                      className="w-full bg-white border border-[#D9E2EC] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-[#1268C4]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-[#5B6B7A] uppercase">Max Depth</label>
                    <select
                      value={trailDepth}
                      onChange={(e) => setTrailDepth(Number(e.target.value))}
                      className="w-full bg-white border border-[#D9E2EC] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F2747] focus:outline-none"
                    >
                      <option value={2}>2 Hops</option>
                      <option value={3}>3 Hops</option>
                      <option value={4}>4 Hops</option>
                      <option value={5}>5 Hops</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      onClick={() => fetchMoneyTrail(trailSource, trailDest, trailDepth)}
                      disabled={trailLoading}
                      className="w-full py-2.5 rounded-xl bg-[#1268C4] hover:bg-[#102B52] text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {trailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitFork className="w-3.5 h-3.5" />}
                      <span>Trace Trail</span>
                    </button>
                  </div>
                </div>

                {/* Preset Scenarios */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#D9E2EC] flex-wrap">
                  <span className="text-[10px] font-bold text-[#5B6B7A] uppercase">Demo Trail Scenarios:</span>
                  {[
                    { label: 'ACC-100001 → ACC-100035 (3-Hop Ring)', src: 'ACC-100001', dst: 'ACC-100035' },
                    { label: 'ACC-100099 → ACC-100098 (Transit Hop)', src: 'ACC-100099', dst: 'ACC-100098' },
                    { label: 'ACC-100098 → ACC-100020 (Layering Split)', src: 'ACC-100098', dst: 'ACC-100020' }
                  ].map((sc, scIdx) => (
                    <button
                      key={scIdx}
                      onClick={() => {
                        setTrailSource(sc.src);
                        setTrailDest(sc.dst);
                        fetchMoneyTrail(sc.src, sc.dst, 4);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#D9E2EC] text-[#1565C0] text-[11px] font-mono hover:bg-[#EEF3F8] transition cursor-pointer"
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trail Results */}
              {trailResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F2747]">
                      {trailResult.message}
                    </span>
                    {trailResult.paths_found > 0 && (
                      <span className="text-[10px] font-mono bg-[#E6F4EA] text-[#168A5B] px-2.5 py-1 rounded-lg border border-[#A8DADC] font-bold">
                        ✓ Temporally Ordered Fund Transit
                      </span>
                    )}
                  </div>

                  {trailResult.paths && trailResult.paths.length > 0 ? (
                    trailResult.paths.map((p, pIdx) => (
                      <div key={pIdx} className="bg-white p-5 rounded-xl border border-[#D9E2EC] shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-[#1268C4]">
                              Path #{pIdx + 1} ({p.hop_count} Hops)
                            </span>
                            {p.total_transit_duration_minutes !== null && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D98B00] border border-[#FDE68A] font-bold">
                                Transit Latency: {p.total_transit_duration_minutes} mins
                              </span>
                            )}
                          </div>

                          {p.intermediary_accounts?.length > 0 && (
                            <div className="text-[11px] text-[#D64545] font-mono font-bold">
                              Intermediaries: {p.intermediary_accounts.join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Visual Step-by-Step Flow */}
                        <div className="flex items-center gap-2 flex-wrap py-2 overflow-x-auto">
                          {p.account_sequence.map((acc, aIdx) => {
                            const isInter = p.intermediary_accounts.includes(acc);
                            const isTarget = acc === accountId;
                            return (
                              <React.Fragment key={aIdx}>
                                <div className={`p-2.5 rounded-xl border font-mono text-xs font-bold text-center ${
                                  isTarget
                                    ? 'bg-[#1565C0] text-white border-[#1565C0]'
                                    : isInter
                                    ? 'bg-[#FEF2F2] text-[#D64545] border-[#F87171]'
                                    : 'bg-[#F5F7FA] text-[#0F2747] border-[#D9E2EC]'
                                }`}>
                                  <div>{acc}</div>
                                  <div className="text-[9px] font-sans font-normal opacity-80">
                                    {aIdx === 0 ? 'Source' : aIdx === p.account_sequence.length - 1 ? 'Destination' : 'Intermediary'}
                                  </div>
                                </div>
                                {aIdx < p.account_sequence.length - 1 && (
                                  <div className="flex flex-col items-center px-1 text-[10px] font-mono text-[#5B6B7A]">
                                    <span>₹{p.hops[aIdx]?.amount?.toLocaleString()}</span>
                                    <ArrowRight className="w-4 h-4 text-[#1268C4]" />
                                    <span>{p.hops[aIdx]?.channel}</span>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Hop Breakdown Table */}
                        <div className="border border-[#D9E2EC] rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-[#F5F7FA] text-[#5B6B7A] text-[10px] uppercase font-bold border-b border-[#D9E2EC]">
                              <tr>
                                <th className="p-2.5">Hop #</th>
                                <th className="p-2.5">From Account</th>
                                <th className="p-2.5">To Account</th>
                                <th className="p-2.5">Amount</th>
                                <th className="p-2.5">Timestamp</th>
                                <th className="p-2.5">Channel</th>
                                <th className="p-2.5">Transit Latency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D9E2EC] text-[#0F2747]">
                              {p.hops.map((hop, hIdx) => (
                                <tr key={hIdx} className="hover:bg-[#F5F7FA]">
                                  <td className="p-2.5 font-bold">Hop {hop.hop_number}</td>
                                  <td className="p-2.5 text-[#1565C0] font-bold">{hop.from_account}</td>
                                  <td className="p-2.5 text-[#1565C0] font-bold">{hop.to_account}</td>
                                  <td className="p-2.5 font-bold text-[#D64545]">₹{hop.amount?.toLocaleString()}</td>
                                  <td className="p-2.5 text-[#5B6B7A] text-[11px]">{hop.timestamp}</td>
                                  <td className="p-2.5">{hop.channel}</td>
                                  <td className="p-2.5 text-[#5B6B7A]">
                                    {hop.latency_minutes_from_prev_hop !== null
                                      ? `${hop.latency_minutes_from_prev_hop} mins`
                                      : 'Origin Hop'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[#7A8896] bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] text-xs font-mono">
                      No qualifying money-trail path found between {trailSource} and {trailDest} within {trailDepth} hops.
                    </div>
                  )}

                  <div className="text-[10px] text-[#7A8896] font-mono">
                    Notice: {trailResult.disclaimer}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CORRELATED VICTIM COMPLAINTS */}
          {activeWorkspaceTab === 'complaints' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0F2747] uppercase">
                    AWAAZ Cybercrime Incident Registry
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] text-xs font-bold font-mono">
                    {complaintsData?.correlated_count || 0} Correlated Cases
                  </span>
                </div>

                <span className="text-[11px] text-[#5B6B7A] font-mono">
                  Target suspect match: {accountId}
                </span>
              </div>

              {complaintsData?.complaints && complaintsData.complaints.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {complaintsData.complaints.map((c, cIdx) => (
                    <div key={cIdx} className="bg-[#F5F7FA] p-5 rounded-xl border border-[#D9E2EC] space-y-3 hover:border-[#1565C0] transition">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#1565C0] font-mono">{c.complaint_id}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FEF2F2] text-[#D64545] border border-[#F87171] font-bold">
                          Loss: ₹{c.reported_amount?.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-[#0F2747]">{c.fraud_category}</div>
                        <div className="text-[10px] text-[#7A8896] font-mono">Incident Date: {c.incident_date} • Category: {c.complainant_category}</div>
                      </div>

                      <p className="text-xs text-[#0F2747] font-sans leading-relaxed line-clamp-3 bg-white p-3 rounded-lg border border-[#D9E2EC]">
                        "{c.incident_description}"
                      </p>

                      <div className="pt-2 border-t border-[#D9E2EC] flex items-center justify-between text-[10px] font-mono text-[#5B6B7A]">
                        <span>Portal ACK: {c.police_portal_ack}</span>
                        <span className="px-2 py-0.5 rounded bg-[#EBF3FA] text-[#1268C4] border border-[#DCE5EF] font-bold">
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-[#7A8896] bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-2">
                  <FileText className="w-8 h-8 text-[#7A8896] mx-auto" />
                  <div className="text-xs font-bold text-[#0F2747]">No Direct Victim Complaints Linked</div>
                  <div className="text-[11px] text-[#5B6B7A] max-w-sm mx-auto font-mono">
                    No citizen reports in the AWAAZ intelligence registry currently list {accountId} as an identified beneficiary.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COUNTERPARTIES & FLOW */}
          {activeWorkspaceTab === 'counterparties' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Senders / Fund Sources */}
                <div className="bg-[#F5F7FA] p-5 rounded-xl border border-[#D9E2EC] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-2">
                    <span className="text-xs font-bold text-[#168A5B] uppercase flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4" />
                      Inflow Senders ({accountData.counterparties?.senders?.length || 0})
                    </span>
                    <span className="text-[10px] font-mono text-[#5B6B7A]">FUND SOURCES</span>
                  </div>

                  <div className="space-y-1.5">
                    {accountData.counterparties?.senders && accountData.counterparties.senders.length > 0 ? (
                      accountData.counterparties.senders.map((s, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#D9E2EC] font-mono text-xs">
                          <span className="font-bold text-[#0F2747]">{s}</span>
                          <button
                            onClick={() => handleSelectPreset(s)}
                            className="text-[11px] text-[#1565C0] hover:underline font-bold"
                          >
                            Inspect Account →
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#7A8896] italic p-3 text-center">No sender accounts recorded.</div>
                    )}
                  </div>
                </div>

                {/* Receivers / Outflow Beneficiaries */}
                <div className="bg-[#F5F7FA] p-5 rounded-xl border border-[#D9E2EC] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-2">
                    <span className="text-xs font-bold text-[#D64545] uppercase flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4" />
                      Outflow Beneficiaries ({accountData.counterparties?.receivers?.length || 0})
                    </span>
                    <span className="text-[10px] font-mono text-[#5B6B7A]">DOWNSTREAM RECIPIENTS</span>
                  </div>

                  <div className="space-y-1.5">
                    {accountData.counterparties?.receivers && accountData.counterparties.receivers.length > 0 ? (
                      accountData.counterparties.receivers.map((r, rIdx) => (
                        <div key={rIdx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#D9E2EC] font-mono text-xs">
                          <span className="font-bold text-[#0F2747]">{r}</span>
                          <button
                            onClick={() => handleSelectPreset(r)}
                            className="text-[11px] text-[#1565C0] hover:underline font-bold"
                          >
                            Inspect Account →
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#7A8896] italic p-3 text-center">No receiver accounts recorded.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="p-4 rounded-xl bg-[#EBF3FA] border border-[#DCE5EF] flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs font-bold text-[#102B52]">
                  Need full network topology or formal evidentiary report?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate && onNavigate('networks')}
                    className="px-4 py-2 rounded-lg bg-white border border-[#DCE5EF] text-[#1268C4] hover:bg-[#F6F9FC] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Open Mule Networks Graph</span>
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('reports')}
                    className="px-4 py-2 rounded-lg bg-[#1268C4] hover:bg-[#102B52] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generate Formal Report</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-[#D9E2EC] text-center space-y-3 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-[#1565C0] animate-spin mx-auto" />
          <div className="text-sm font-bold text-[#0F2747]">Loading Drishthi ML Predictive Model Data...</div>
        </div>
      )}
    </div>
  );
}
