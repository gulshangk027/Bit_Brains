import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  Megaphone, 
  ArrowRight, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  FileCheck2,
  Landmark,
  Shield,
  Lock
} from 'lucide-react';

export default function OverviewView({ datasetSummary, onNavigate }) {
  const isDemo = datasetSummary?.is_demo ?? true;
  const totalAcc = datasetSummary?.distinct_accounts ?? datasetSummary?.rows ?? 500;
  const suspiciousAcc = datasetSummary?.suspicious_count ?? 114;
  const legitAcc = datasetSummary?.legitimate_count ?? 386;
  const muleRate = datasetSummary?.mule_rate ?? 22.8;
  const totalTxns = datasetSummary?.total_transactions ?? 68;
  const activeAlerts = datasetSummary?.active_alerts_count ?? 18;
  const avgRiskScore = datasetSummary?.avg_risk_score ?? 68.4;
  const victimCases = datasetSummary?.victim_cases_count ?? 5;
  const recruitmentWarnings = datasetSummary?.recruitment_warnings_count ?? 32;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* SECTION 1: HERO SECTION WITH INTEGRATED WATERMARK BANK ILLUSTRATION */}
      <div 
        className="bg-white p-8 lg:p-10 rounded-2xl border border-[#DCE5EF] shadow-sm relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 85% 50%, rgba(18, 104, 196, 0.06), transparent 45%), #FFFFFF'
        }}
      >
        {/* Subtle Bank Building & Security Watermark in Background (No Box, No Border, No Frame, No Card) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-7/12 max-w-xl opacity-25 pointer-events-none z-0 hidden md:block">
          <svg 
            viewBox="0 0 400 240" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full h-auto"
          >
            {/* Background City Skyline Silhouette */}
            <path d="M20 180 V130 H40 V100 H60 V180 Z" fill="#1268C4" fillOpacity="0.08" />
            <path d="M70 180 V110 H90 V85 H115 V180 Z" fill="#1268C4" fillOpacity="0.06" />
            <path d="M290 180 V95 H315 V125 H335 V180 Z" fill="#1268C4" fillOpacity="0.08" />
            <path d="M340 180 V120 H365 V145 H385 V180 Z" fill="#1268C4" fillOpacity="0.06" />

            {/* Giant Background Security Shield Watermark */}
            <path d="M200 20 L275 45 V105 C275 150 200 185 200 185 C200 185 125 150 125 105 V45 Z" fill="#EBF3FA" fillOpacity="0.5" stroke="#1268C4" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Pediment / Roof Triangle */}
            <path d="M80 85 L200 35 L320 85 Z" fill="#1268C4" fillOpacity="0.12" stroke="#1268C4" strokeWidth="2.5" strokeLinejoin="round" />
            
            {/* Cornice Bar */}
            <rect x="75" y="85" width="250" height="12" rx="2" fill="#102B52" fillOpacity="0.15" stroke="#102B52" strokeWidth="1.5" />
            
            {/* BANK Sign Plate */}
            <rect x="150" y="62" width="100" height="17" rx="3" fill="#FFFFFF" stroke="#1268C4" strokeWidth="1.5" />
            <text x="200" y="74" textAnchor="middle" fill="#1268C4" fontSize="9.5" fontWeight="900" letterSpacing="2.5">BANK</text>

            {/* Pediment Crest Shield */}
            <path d="M200 45 L209 52 V59 C209 64 204 67 200 68 C196 67 191 64 191 59 V52 Z" fill="#1268C4" fillOpacity="0.25" stroke="#1268C4" strokeWidth="1" />

            {/* Columns */}
            <rect x="98" y="97" width="18" height="75" fill="#FFFFFF" stroke="#1268C4" strokeWidth="1.5" rx="1" />
            <rect x="96" y="97" width="22" height="5" fill="#1268C4" fillOpacity="0.2" stroke="#1268C4" strokeWidth="1" />
            <rect x="96" y="167" width="22" height="5" fill="#1268C4" fillOpacity="0.2" stroke="#1268C4" strokeWidth="1" />

            <rect x="143" y="97" width="18" height="75" fill="#FFFFFF" stroke="#1268C4" strokeWidth="1.5" rx="1" />
            <rect x="141" y="97" width="22" height="5" fill="#1268C4" fillOpacity="0.2" stroke="#1268C4" strokeWidth="1" />
            <rect x="141" y="167" width="22" height="5" fill="#1268C4" fillOpacity="0.2" stroke="#1268C4" strokeWidth="1" />

            {/* Central Arch Door & Security Lock Symbol */}
            <path d="M185 172 V123 C185 114.7 191.7 108 200 108 C208.3 108 215 114.7 215 123 V172 Z" fill="#EBF3FA" stroke="#102B52" strokeWidth="1.5" />
            <circle cx="200" cy="132" r="6" stroke="#1268C4" strokeWidth="1.5" fill="#FFFFFF" />
            <rect x="197" y="137" width="6" height="12" rx="1" fill="#1268C4" />

            <rect x="239" y="97" width="18" height="75" fill="#FFFFFF" stroke="#1268C4" strokeWidth="1.5" rx="1" />
            <rect x="237" y="97" width="22" height="5" fill="#1268C4" fillOpacity="0.2" stroke="#1268C4" strokeWidth="1" />
            <rect x="237" y="167" width="22" height="5" fill="#1268C4" fillOpacity="0.2" stroke="#1268C4" strokeWidth="1" />

            <rect x="284" y="97" width="18" height="75" fill="#FFFFFF" stroke="#1268C4" strokeWidth="1.5" rx="1" />
            <rect x="282" y="97" width="22" height="5" fill="#1268C4" fillOpacity="0.2" stroke="#1268C4" strokeWidth="1" />
            <rect x="282" y="167" width="22" height="5" fill="#1268C4" fillOpacity="0.2" stroke="#1268C4" strokeWidth="1" />

            {/* Base Portico Steps */}
            <rect x="70" y="172" width="260" height="8" rx="1" fill="#102B52" fillOpacity="0.1" stroke="#102B52" strokeWidth="1.5" />
            <rect x="60" y="180" width="280" height="10" rx="2" fill="#FFFFFF" stroke="#1268C4" strokeWidth="1.5" />
            <rect x="50" y="190" width="300" height="12" rx="3" fill="#EBF3FA" stroke="#DCE5EF" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Hero Content (Positioned Above Watermark Background) */}
        <div className="relative z-10 space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF3FA] border border-[#DCE5EF] text-[#1268C4] text-[11px] font-extrabold tracking-wider uppercase">
            <Landmark className="w-3.5 h-3.5" />
            <span>UNIFIED FRAUD INTELLIGENCE PLATFORM</span>
          </div>

          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-[#102B52] tracking-tight">
              MULENET <span className="text-[#1268C4]">AI</span>
            </h1>
            
            <div className="text-sm font-extrabold tracking-widest text-[#1268C4] uppercase mt-2">
              PREVENT • DETECT • RESPOND
            </div>
          </div>

          <p className="text-[#60748A] text-sm lg:text-base leading-relaxed font-medium">
            AI-powered behavioral intelligence platform for preventing mule-account recruitment, detecting suspicious accounts, and assisting financial-fraud victims in structuring formal complaints.
          </p>

          {/* Hero CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('rakshak')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F6F9FC] text-[#102B52] text-xs font-extrabold border border-[#DCE5EF] transition flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4 text-[#168A5B]" />
              <span>Demo 1: Rakshak (Prevent)</span>
            </button>

            <button
              onClick={() => onNavigate('drishthi')}
              className="px-5 py-2.5 rounded-xl bg-[#1268C4] hover:bg-[#102B52] text-white font-extrabold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-white" />
              <span>Demo 2: Drishthi (CyberShield P2 ML)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('awaaz')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F6F9FC] text-[#102B52] text-xs font-extrabold border border-[#DCE5EF] transition flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Megaphone className="w-4 h-4 text-[#7C3AED]" />
              <span>Demo 3: Awaaz (Respond)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: MULE FRAUD LIFECYCLE ARCHITECTURE SECTION */}
      <div className="bg-white p-6 lg:p-8 rounded-2xl border border-[#DCE5EF] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DCE5EF] pb-4 gap-2">
          <h2 className="text-lg lg:text-xl font-extrabold text-[#102B52] flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#1268C4]" />
            <span>Mule Fraud Lifecycle Architecture</span>
          </h2>
          <span className="text-xs font-mono font-bold text-[#60748A] bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#DCE5EF]">
            RECRUITMENT → FUND TRANSIT → AFTERMATH
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 01 RAKSHAK */}
          <div 
            onClick={() => onNavigate('rakshak')}
            className="bg-white p-6 rounded-2xl border border-[#DCE5EF] hover:border-[#168A5B] cursor-pointer transition-all duration-200 space-y-4 group shadow-2xs hover:shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#E6F4EA] text-[#168A5B] border border-[#A8DADC]">
                  01 RAKSHAK
                </span>
                <span className="text-[10px] text-[#60748A] font-extrabold uppercase tracking-wider">
                  RECRUITMENT STAGE
                </span>
              </div>
              
              <div className="w-11 h-11 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#168A5B] border border-[#A8DADC]">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#102B52] group-hover:text-[#168A5B] transition">
                  PREVENT Recruitment
                </h3>
                <p className="text-xs text-[#60748A] mt-2 leading-relaxed font-medium">
                  Prevents legitimate citizens from being recruited as money mules via WhatsApp/Telegram NLP recruitment analysis & threat detection.
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#DCE5EF] text-xs font-extrabold text-[#168A5B] flex items-center gap-1.5">
              <span>Open Rakshak Engine</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: 02 DRISHTHI */}
          <div 
            onClick={() => onNavigate('drishthi')}
            className="bg-white p-6 rounded-2xl border-2 border-[#1268C4] shadow-sm cursor-pointer transition-all duration-200 space-y-4 group relative overflow-hidden flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#EBF3FA] text-[#1268C4] border border-[#DCE5EF]">
                  02 DRISHTHI
                </span>
                <span className="text-[10px] text-[#1268C4] font-extrabold uppercase tracking-wider">
                  DETECTION STAGE
                </span>
              </div>

              <div className="w-11 h-11 rounded-xl bg-[#EBF3FA] flex items-center justify-center text-[#1268C4] border border-[#DCE5EF]">
                <Search className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#102B52] group-hover:text-[#1268C4] transition flex items-center gap-2">
                  <span>DETECT Mule Accounts</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1268C4] text-white font-mono font-bold">AI/ML</span>
                </h3>
                <p className="text-xs text-[#60748A] mt-2 leading-relaxed font-medium">
                  Core AI/ML Engine for identifying suspicious account behavior, calculating 0-100 risk scores, SHAP explainability, and NetworkX mule graph analytics.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DCE5EF] text-xs font-extrabold text-[#1268C4] flex items-center gap-1.5">
              <span>Launch Drishthi ML Engine</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: 03 AWAAZ */}
          <div 
            onClick={() => onNavigate('awaaz')}
            className="bg-white p-6 rounded-2xl border border-[#DCE5EF] hover:border-[#7C3AED] cursor-pointer transition-all duration-200 space-y-4 group shadow-2xs hover:shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF]">
                  03 AWAAZ
                </span>
                <span className="text-[10px] text-[#60748A] font-extrabold uppercase tracking-wider">
                  AFTERMATH STAGE
                </span>
              </div>

              <div className="w-11 h-11 rounded-xl bg-[#F3E8FF] flex items-center justify-center text-[#7C3AED] border border-[#E9D5FF]">
                <Megaphone className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#102B52] group-hover:text-[#7C3AED] transition">
                  RESPOND to Victims
                </h3>
                <p className="text-xs text-[#60748A] mt-2 leading-relaxed font-medium">
                  Assists financial fraud victims by analyzing natural language incident descriptions, extracting financial details, and formatting structured complaints.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DCE5EF] text-xs font-extrabold text-[#7C3AED] flex items-center gap-1.5">
              <span>Open Awaaz Assistance</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PLATFORM INTELLIGENCE METRICS (KPI GRID) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#102B52] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1268C4]" />
            <span>Platform Intelligence Metrics</span>
          </h2>
          {isDemo && (
            <span className="text-[11px] font-extrabold text-[#D98B00] bg-[#FFFBEB] px-3 py-1 rounded-lg border border-[#FDE68A]">
              Synthetic Demonstration Dataset
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[#60748A] flex items-center justify-between">
              <span>Accounts Analyzed</span>
              <Users className="w-4 h-4 text-[#1268C4]" />
            </div>
            <div className="text-2xl font-black text-[#102B52] font-mono">{totalAcc}</div>
            <div className="text-[10px] text-[#60748A] font-medium">Distinct customer accounts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[#D64545] flex items-center justify-between">
              <span>Suspicious / Mule</span>
              <AlertTriangle className="w-4 h-4 text-[#D64545]" />
            </div>
            <div className="text-2xl font-black text-[#D64545] font-mono">{suspiciousAcc}</div>
            <div className="text-[10px] text-[#D64545] font-medium">Flagged risk accounts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[#168A5B] flex items-center justify-between">
              <span>Legitimate Accounts</span>
              <CheckCircle2 className="w-4 h-4 text-[#168A5B]" />
            </div>
            <div className="text-2xl font-black text-[#168A5B] font-mono">{legitAcc}</div>
            <div className="text-[10px] text-[#168A5B] font-medium">Normal activity profiles</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[#D98B00] flex items-center justify-between">
              <span>Mule Rate</span>
              <Activity className="w-4 h-4 text-[#D98B00]" />
            </div>
            <div className="text-2xl font-black text-[#D98B00] font-mono">{muleRate}%</div>
            <div className="text-[10px] text-[#D98B00] font-medium">
              {datasetSummary?.imbalance_ratio ? `Imbalance ratio ${datasetSummary.imbalance_ratio}` : 'Target ratio'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[#1268C4] flex items-center justify-between">
              <span>Transaction Records</span>
              <Activity className="w-4 h-4 text-[#1268C4]" />
            </div>
            <div className="text-2xl font-black text-[#1268C4] font-mono">{totalTxns}</div>
            <div className="text-[10px] text-[#60748A] font-medium">Ledger entries (distinct from accounts)</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[#D98B00] flex items-center justify-between">
              <span>Active Risk Alerts</span>
              <AlertTriangle className="w-4 h-4 text-[#D98B00]" />
            </div>
            <div className="text-2xl font-black text-[#102B52] font-mono">{activeAlerts}</div>
            <div className="text-[10px] text-[#60748A] font-medium">Prioritized for review</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[#60748A] flex items-center justify-between">
              <span>Avg Alert Risk Score</span>
              <Activity className="w-4 h-4 text-[#1268C4]" />
            </div>
            <div className="text-2xl font-black text-[#1268C4] font-mono">{avgRiskScore}</div>
            <div className="text-[10px] text-[#60748A] font-medium">Flagged accounts (0–100 scale)</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCE5EF] shadow-2xs space-y-1">
            <div className="text-xs font-bold text-[#7C3AED] flex items-center justify-between">
              <span>Correlated Complaints</span>
              <FileCheck2 className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <div className="text-2xl font-black text-[#102B52] font-mono">{victimCases}</div>
            <div className="text-[10px] text-[#60748A] font-medium">AWAAZ cybercrime reports</div>
          </div>
        </div>
      </div>

      {/* SECTION 4: MINIMAL BANKING FOOTER */}
      <footer className="pt-6 border-t border-[#DCE5EF] flex flex-col sm:flex-row items-center justify-between text-xs text-[#60748A] font-medium gap-2">
        <div>© 2026 MuleNet AI. All rights reserved.</div>
        <div className="flex items-center gap-2">
          <Landmark className="w-3.5 h-3.5 text-[#1268C4]" />
          <span>Securing Digital India's Financial Ecosystem</span>
        </div>
      </footer>
    </div>
  );
}
