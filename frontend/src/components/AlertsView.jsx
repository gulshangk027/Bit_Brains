import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Filter, 
  Search, 
  CheckCircle2, 
  Eye, 
  Clock, 
  Check, 
  ArrowRight, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function AlertsView({ alerts: parentAlerts, onNavigateToAccount, onRefreshAlerts }) {
  const [localAlerts, setLocalAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL'); // 'ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'NEW', 'UNDER_REVIEW', 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingAlertId, setUpdatingAlertId] = useState(null);

  const activeAlerts = parentAlerts ?? localAlerts;

  const fetchAlerts = async () => {
    if (onRefreshAlerts) {
      onRefreshAlerts();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/alerts'));
      const data = await res.json();
      setLocalAlerts(data.alerts || []);
    } catch (err) {
      console.error('Alerts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!parentAlerts) {
      fetchAlerts();
    }
  }, [parentAlerts]);

  const handleStatusChange = async (alertId, newStatus) => {
    setUpdatingAlertId(alertId);
    try {
      const res = await fetch(getApiUrl(`/api/alerts/${alertId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: `Status updated by investigator to ${newStatus}` })
      });
      if (res.ok) {
        if (onRefreshAlerts) {
          onRefreshAlerts();
        } else {
          setLocalAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, status: newStatus } : a));
        }
      }
    } catch (err) {
      console.error('Failed to update alert status:', err);
    } finally {
      setUpdatingAlertId(null);
    }
  };

  const filteredAlerts = activeAlerts.filter(a => {
    if (severityFilter !== 'ALL' && a.risk_level !== severityFilter) return false;
    if (statusFilter !== 'ALL' && (a.status || 'NEW') !== statusFilter) return false;
    if (searchQuery.trim() && !a.account_id.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9E2EC] pb-6 bg-white p-6 rounded-2xl border shadow-2xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#FFFBEB] text-[#D98B00] border border-[#FDE68A] uppercase">
              BANK FRAUD MONITORING
            </span>
            <span className="text-xs text-[#5B6B7A] font-mono">AUTOMATED DECISION SUPPORT</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-[#D98B00]" />
            INTELLIGENT RISK ALERTS & MONITORING
          </h1>
          <p className="text-xs text-[#5B6B7A] mt-1">
            Real-time decision support alerts generated dynamically from Drishthi ML model prediction probabilities and banking risk thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAlerts}
            className="p-2.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] hover:bg-[#EEF3F8] text-[#1565C0] transition cursor-pointer"
            title="Refresh Alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[#F5F7FA] px-3.5 py-2 rounded-xl border border-[#D9E2EC] w-full md:w-72">
          <Search className="w-4 h-4 text-[#7A8896] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Account ID..."
            className="bg-transparent text-xs text-[#0F2747] placeholder:text-[#7A8896] focus:outline-none w-full font-mono"
          />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-[#5B6B7A] uppercase mr-1">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => {
            const count = activeAlerts.filter(a => lvl === 'ALL' ? true : a.risk_level === lvl).length;
            return (
              <button
                key={lvl}
                onClick={() => setSeverityFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  severityFilter === lvl
                    ? 'bg-[#1565C0] text-white shadow-2xs'
                    : 'bg-[#F5F7FA] text-[#5B6B7A] border border-[#D9E2EC] hover:text-[#0F2747]'
                }`}
              >
                <span>{lvl}</span>
                <span className={`text-[10px] px-1 rounded ${
                  severityFilter === lvl ? 'bg-white/20 text-white font-extrabold' : 'bg-white text-[#5B6B7A] border border-[#D9E2EC] font-mono'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Review Status Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-[#5B6B7A] uppercase mr-1">Status:</span>
          {['ALL', 'NEW', 'UNDER_REVIEW', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0F2747] text-white shadow-2xs'
                  : 'bg-[#F5F7FA] text-[#5B6B7A] border border-[#D9E2EC] hover:text-[#0F2747]'
              }`}
            >
              {st === 'UNDER_REVIEW' ? 'REVIEWING' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-[#D9E2EC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FA] text-[#5B6B7A] font-bold uppercase tracking-wider text-[10px] border-b border-[#D9E2EC]">
              <tr>
                <th className="p-4">Alert ID & Time</th>
                <th className="p-4">Account ID</th>
                <th className="p-4">Risk Assessment</th>
                <th className="p-4">Reason & Concrete Evidence</th>
                <th className="p-4">Review Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E2EC] font-mono text-[#0F2747]">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, idx) => {
                  const currentStatus = alert.status || 'NEW';
                  return (
                    <tr key={alert.alert_id || idx} className="hover:bg-[#F5F7FA] transition">
                      <td className="p-4 space-y-0.5">
                        <div className="font-bold text-[#0F2747]">{alert.alert_id || `ALT-2026-${idx+100}`}</div>
                        <div className="text-[#5B6B7A] text-[10px] font-sans">{alert.timestamp || '2026-08-20 12:00'}</div>
                      </td>

                      <td className="p-4">
                        <span className="font-extrabold text-[#1565C0] text-sm">{alert.account_id}</span>
                        {alert.relevant_txns && alert.relevant_txns.length > 0 && (
                          <div className="text-[10px] text-[#7A8896] mt-0.5">
                            Txns: {alert.relevant_txns.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </td>

                      <td className="p-4 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            alert.risk_level === 'CRITICAL'
                              ? 'bg-[#FEF2F2] text-[#B42318] border-[#B42318]'
                              : alert.risk_level === 'HIGH'
                              ? 'bg-[#FDF2F2] text-[#D64545] border-[#F87171]'
                              : alert.risk_level === 'MEDIUM'
                              ? 'bg-[#FFFBEB] text-[#D98B00] border-[#FDE68A]'
                              : 'bg-[#E6F4EA] text-[#168A5B] border-[#A8DADC]'
                          }`}>
                            {alert.risk_level} ({alert.risk_score})
                          </span>
                        </div>
                        <div className="text-[10px] font-sans font-bold text-[#5B6B7A]">
                          {alert.classification}
                        </div>
                      </td>

                      <td className="p-4 font-sans text-xs text-[#0F2747] max-w-md leading-relaxed">
                        <div className="font-medium">{alert.reason || 'High calibrated model risk score exceeding retail baseline.'}</div>
                        <div className="text-[10px] text-[#D98B00] font-bold font-mono mt-1">
                          Recommended: {alert.recommended_action}
                        </div>
                      </td>

                      <td className="p-4">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(alert.alert_id, e.target.value)}
                          disabled={updatingAlertId === alert.alert_id}
                          className={`text-xs font-bold font-sans rounded-lg px-2.5 py-1.5 border focus:outline-none cursor-pointer ${
                            currentStatus === 'RESOLVED'
                              ? 'bg-[#E6F4EA] text-[#168A5B] border-[#A8DADC]'
                              : currentStatus === 'UNDER_REVIEW'
                              ? 'bg-[#EEF3F8] text-[#1565C0] border-[#D9E2EC]'
                              : 'bg-[#FFFBEB] text-[#D98B00] border-[#FDE68A]'
                          }`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="UNDER_REVIEW">UNDER REVIEW</option>
                          <option value="RESOLVED">RESOLVED</option>
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => onNavigateToAccount && onNavigateToAccount(alert.account_id)}
                          className="px-3 py-1.5 rounded-lg bg-[#1565C0] text-white hover:bg-[#0F2747] font-sans font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Investigate</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#7A8896] font-sans italic">
                    No risk alerts found matching the current search and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
