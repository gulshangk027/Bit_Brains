import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  PieChart as PieIcon, 
  Activity, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Award,
  Layers,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/overview');
      if (!res.ok) throw new Error('Failed to fetch analytics overview');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
        <div className="flex items-center gap-3 text-[#1565C0]">
          <Activity className="w-6 h-6 animate-spin" />
          <span className="text-sm font-mono font-bold">Loading Platform Analytics...</span>
        </div>
      </div>
    );
  }

  const hasData = data && data.has_data;
  const ds = data?.dataset_summary || {};
  const isModelTrained = data?.is_model_trained || false;
  const perf = data?.model_performance || {};
  const featImp = data?.global_feature_importance || [];
  const riskDist = data?.risk_distribution || { low: 0, medium: 0, high: 0, critical: 0 };
  const modelInfo = data?.active_model_info || {};

  const pieData = hasData ? [
    { name: 'Legitimate', value: ds.legitimate_count, percentage: ds.legitimate_percentage, color: '#168A5B' },
    { name: 'Mule / Fraud', value: ds.mule_count, percentage: ds.mule_percentage, color: '#D64545' }
  ] : [];

  const riskChartData = [
    { tier: 'LOW (0–24)', count: riskDist.low, color: '#168A5B' },
    { tier: 'MEDIUM (25–49)', count: riskDist.medium, color: '#D98B00' },
    { tier: 'HIGH (50–74)', count: riskDist.high, color: '#D64545' },
    { tier: 'CRITICAL (75–100)', count: riskDist.critical, color: '#B42318' }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9E2EC] pb-6 bg-white p-6 rounded-2xl border shadow-2xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase">
              EXECUTIVE ANALYTICS
            </span>
            <span className="text-xs text-[#5B6B7A] font-mono">LIVE INTELLIGENCE DASHBOARD</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[#1565C0]" />
            PLATFORM FRAUD ANALYTICS
          </h1>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] hover:bg-[#EEF3F8] text-[#1565C0] text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH ANALYTICS</span>
        </button>
      </div>

      {!hasData ? (
        <div className="bg-white p-12 rounded-2xl border border-[#D9E2EC] text-center space-y-3 shadow-2xs">
          <Database className="w-12 h-12 text-[#7A8896] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F2747]">No Dataset Available</h3>
          <p className="text-xs text-[#5B6B7A] font-mono max-w-md mx-auto">
            Analytics data will appear after a dataset is loaded or uploaded in Settings.
          </p>
        </div>
      ) : (
        <>
          {/* SECTION 1: DATASET SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#1565C0]" /> TOTAL ACCOUNTS
              </div>
              <div className="text-2xl font-extrabold font-mono text-[#0F2747] mt-1">
                {ds.total_accounts?.toLocaleString() || '—'}
              </div>
              <div className="text-[10px] text-[#7A8896] font-mono">{ds.dataset_mode}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#168A5B]" /> LEGITIMATE ACCOUNTS
              </div>
              <div className="text-2xl font-extrabold font-mono text-[#168A5B] mt-1">
                {ds.legitimate_count?.toLocaleString() || '—'}
              </div>
              <div className="text-[10px] text-[#168A5B] font-mono">
                {ds.legitimate_percentage}% of total dataset
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#D64545]" /> MULE ACCOUNTS
              </div>
              <div className="text-2xl font-extrabold font-mono text-[#D64545] mt-1">
                {ds.mule_count?.toLocaleString() || '—'}
              </div>
              <div className="text-[10px] text-[#D64545] font-mono">
                {ds.mule_percentage}% of total dataset
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#1565C0]" /> MULE RATE & TARGET
              </div>
              <div className="text-2xl font-extrabold font-mono text-[#1565C0] mt-1">
                {ds.mule_rate_formatted || '—'}
              </div>
              <div className="text-[10px] text-[#5B6B7A] font-mono">
                Target: {ds.target_variable} | {ds.feature_count} Features
              </div>
            </div>
          </div>

          {/* SECTION 2: SIDE-BY-SIDE CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Target Class Breakdown */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2 border-b border-[#D9E2EC] pb-3">
                <PieIcon className="w-4 h-4 text-[#1565C0]" />
                <span>Target Class Breakdown (F3924)</span>
              </h3>

              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name, item) => [`${val.toLocaleString()} accounts (${item.payload.percentage}%)`, name]}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9E2EC', color: '#0F2747', borderRadius: '8px', fontSize: '11px', fontFamily: 'sans-serif', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#E6F4EA] border border-[#A8DADC]">
                  <div className="text-[10px] text-[#168A5B] font-bold">LEGITIMATE</div>
                  <div className="text-sm font-extrabold text-[#0F2747] mt-0.5">
                    {ds.legitimate_count?.toLocaleString()} <span className="text-xs text-[#168A5B] font-normal">({ds.legitimate_percentage}%)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#F87171]">
                  <div className="text-[10px] text-[#D64545] font-bold">MULE / FRAUD</div>
                  <div className="text-sm font-extrabold text-[#0F2747] mt-0.5">
                    {ds.mule_count?.toLocaleString()} <span className="text-xs text-[#D64545] font-normal">({ds.mule_percentage}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Global Feature Importance Ranking */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1565C0]" />
                  <span>Global Feature Importance Ranking</span>
                </h3>
                <span className="text-[10px] font-mono text-[#5B6B7A]">
                  {isModelTrained ? 'Trained Active Model Importances' : 'Train Model to View'}
                </span>
              </div>

              {!isModelTrained || featImp.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-[#7A8896] font-mono text-xs">
                  <AlertCircle className="w-8 h-8 text-[#CBD5E1]" />
                  <p>Train the Drishthi ML model to view feature importance.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {featImp.slice(0, 8).map((item, idx) => {
                    const maxImp = featImp[0]?.importance || 1.0;
                    const pctWidth = Math.max(6, Math.min(100, (item.importance / maxImp) * 100));

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0F2747] truncate max-w-[320px]">
                            {item.variable_name} <span className="text-[10px] font-mono text-[#7A8896]">({item.feature_id})</span>
                          </span>
                          <span className="font-mono text-[#1565C0] font-bold">
                            {item.importance}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#F5F7FA] rounded-full overflow-hidden border border-[#D9E2EC]">
                          <div 
                            className="h-full bg-[#1565C0] rounded-full transition-all duration-500"
                            style={{ width: `${pctWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: RISK SCORE DISTRIBUTION */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2 border-b border-[#D9E2EC] pb-3">
              <Activity className="w-4 h-4 text-[#1565C0]" />
              <span>Risk Score Distribution (0–100)</span>
            </h3>

            {!isModelTrained ? (
              <div className="p-8 text-center text-[#7A8896] font-mono text-xs">
                Train the Drishthi ML model to view risk distribution across analyzed accounts.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {riskChartData.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-2">
                    <div className="text-[10px] font-bold uppercase font-mono" style={{ color: item.color }}>
                      {item.tier}
                    </div>
                    <div className="text-xl font-extrabold font-mono text-[#0F2747]">
                      {item.count?.toLocaleString()} <span className="text-xs font-normal text-[#5B6B7A]">accounts</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${Math.min(100, (item.count / ds.total_accounts) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: MODEL PERFORMANCE METRICS */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
              <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-[#1565C0]" />
                <span>Model Performance</span>
              </h3>
              <span className="text-[10px] font-mono text-[#5B6B7A]">
                5-Fold Stratified CV Results
              </span>
            </div>

            {!isModelTrained || !perf.precision ? (
              <div className="p-8 text-center text-[#7A8896] font-mono text-xs">
                Model has not been trained yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-mono font-bold">PRECISION</div>
                  <div className="text-lg font-extrabold font-mono text-[#1565C0] mt-0.5">
                    {(perf.precision * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-mono font-bold">RECALL</div>
                  <div className="text-lg font-extrabold font-mono text-[#168A5B] mt-0.5">
                    {(perf.recall * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-mono font-bold">F1 SCORE</div>
                  <div className="text-lg font-extrabold font-mono text-[#0F2747] mt-0.5">
                    {(perf.f1_score * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-mono font-bold">ROC-AUC</div>
                  <div className="text-lg font-extrabold font-mono text-[#1565C0] mt-0.5">
                    {perf.roc_auc}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-mono font-bold">PR-AUC</div>
                  <div className="text-lg font-extrabold font-mono text-[#1976D2] mt-0.5">
                    {perf.pr_auc}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-mono font-bold">FPR</div>
                  <div className="text-lg font-extrabold font-mono text-[#D98B00] mt-0.5">
                    {(perf.false_positive_rate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: ACTIVE ML MODEL INFORMATION */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2 border-b border-[#D9E2EC] pb-3">
              <Cpu className="w-4 h-4 text-[#1565C0]" />
              <span>Active ML Model Information</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                <div className="text-[10px] text-[#7A8896]">MODEL</div>
                <div className="font-bold text-[#0F2747] mt-0.5 truncate">{modelInfo.model_name || 'Not Trained'}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                <div className="text-[10px] text-[#7A8896]">FEATURE MODE</div>
                <div className="font-bold text-[#1565C0] mt-0.5 truncate">{modelInfo.feature_mode || 'N/A'}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                <div className="text-[10px] text-[#7A8896]">VALIDATION</div>
                <div className="font-bold text-[#0F2747] mt-0.5 truncate">{modelInfo.validation_strategy || 'N/A'}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                <div className="text-[10px] text-[#7A8896]">STATUS</div>
                <div className={`font-bold mt-0.5 ${isModelTrained ? 'text-[#168A5B]' : 'text-[#D98B00]'}`}>
                  {isModelTrained ? 'Trained & Active' : 'Not Trained'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                <div className="text-[10px] text-[#7A8896]">LAST TRAINED</div>
                <div className="font-bold text-[#5B6B7A] mt-0.5 truncate">{modelInfo.last_trained_at || 'N/A'}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                <div className="text-[10px] text-[#7A8896]">TARGET VARIABLE</div>
                <div className="font-bold text-[#1565C0] mt-0.5">{modelInfo.target_variable || 'F3924'}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
