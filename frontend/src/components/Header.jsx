import React, { useState } from 'react';
import { 
  Shield, 
  Cpu, 
  Database, 
  Upload, 
  CheckCircle2, 
  Activity,
  Layers,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { getApiUrl, API_BASE_URL } from '../config/api';

export default function Header({ 
  datasetSummary, 
  backendConnected,
  onRefreshDataset, 
  isModelTrained, 
  setIsModelTrained,
  onNavigateToSettings
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState(null);

  const safeParseApiResponse = async (res) => {
    let rawText = '';
    try {
      rawText = await res.text();
    } catch (err) {
      return { ok: false, status: res.status, message: `Failed to read network response: ${err.message}` };
    }

    if (!rawText || !rawText.trim()) {
      return { ok: false, status: res.status, message: `Server returned an empty response (HTTP ${res.status}). Verify backend is running on ${API_BASE_URL || 'http://localhost:8000'}.` };
    }

    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      const cleaned = rawText.replace(/<[^>]*>/g, '').trim().slice(0, 160);
      return { ok: false, status: res.status, message: `Server returned non-JSON (HTTP ${res.status}): ${cleaned || 'Unexpected format'}` };
    }

    let msg = data.message;
    if (!msg && data.detail) {
      msg = typeof data.detail === 'string' ? data.detail : (Array.isArray(data.detail) ? data.detail.map(d => d.msg).join('; ') : JSON.stringify(data.detail));
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
      message: msg || (res.ok ? 'Upload successful' : `Upload failed (HTTP ${res.status})`)
    };
  };

  const handleQuickUpload = async (e) => {
    const file = e.target.files[0];
    const inputEl = e.target;
    if (!file || uploading) return;

    setUploading(true);
    setUploadNotice(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(getApiUrl('/api/dataset/upload'), {
        method: 'POST',
        body: formData
      });
      const parsed = await safeParseApiResponse(res);
      if (parsed.ok && parsed.data?.status === 'success') {
        if (onRefreshDataset) onRefreshDataset();
        setUploadNotice({ type: 'success', message: parsed.message || 'Dataset loaded!' });
        setTimeout(() => setUploadNotice(null), 4000);
      } else {
        setUploadNotice({ type: 'error', message: parsed.message || 'Failed to upload CSV.' });
        setTimeout(() => setUploadNotice(null), 6000);
      }
    } catch (err) {
      setUploadNotice({ type: 'error', message: `Network error: ${err.message}` });
      setTimeout(() => setUploadNotice(null), 6000);
    } finally {
      setUploading(false);
      if (inputEl) {
        inputEl.value = '';
      }
    }
  };

  return (
    <header className="bg-white border-b border-[#DCE5EF] px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 font-sans shadow-2xs">
      {/* Left Status Indicators */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Engine Status */}
        {backendConnected ? (
          <div className="flex items-center gap-1.5 bg-[#E6F4EA] px-3 py-1.5 rounded-lg border border-[#A8DADC] text-[#168A5B] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#168A5B] animate-pulse"></span>
            <span>AI Backend: Connected</span>
          </div>
        ) : (
          <button 
            onClick={() => onRefreshDataset && onRefreshDataset()}
            className="flex items-center gap-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] px-3 py-1.5 rounded-lg border border-[#F87171] text-[#D64545] font-bold transition cursor-pointer"
            title={`Backend unreachable. Click to retry connection to ${API_BASE_URL || 'http://localhost:8000'}`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D64545] animate-ping"></span>
            <span>Backend: Disconnected (Retry)</span>
          </button>
        )}

        {/* Dataset Status */}
        <div className="flex items-center gap-1.5 bg-[#F6F9FC] px-3 py-1.5 rounded-lg border border-[#DCE5EF] text-[#102B52] font-semibold">
          <Database className="w-3.5 h-3.5 text-[#1268C4]" />
          <span>Dataset: {datasetSummary?.filename || 'Synthetic Demo Data'}</span>
          <span className="text-[10px] font-mono text-[#60748A]">({datasetSummary?.rows || 500} records)</span>
        </div>

        {/* Target Status */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#EBF3FA] px-3 py-1.5 rounded-lg border border-[#DCE5EF] text-[#1268C4] font-mono font-bold text-[11px]">
          <Layers className="w-3.5 h-3.5" />
          <span>Target: F3924 (FRAUD_TGT)</span>
        </div>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* ML Mode Switcher / Indicator Button */}
        <button
          onClick={() => onNavigateToSettings && onNavigateToSettings()}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#EBF3FA] hover:bg-[#1268C4] hover:text-white text-[#1268C4] border border-[#DCE5EF] text-xs font-bold transition cursor-pointer shadow-2xs"
          title="Click to manage ML Model in Settings"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>ML MODE (Active)</span>
        </button>

        {/* Quick Upload Notice Toast */}
        {uploadNotice && (
          <div className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition ${
            uploadNotice.type === 'success'
              ? 'bg-[#E6F4EA] border-[#A8DADC] text-[#168A5B]'
              : 'bg-[#FEF2F2] border-[#F87171] text-[#D64545]'
          }`}>
            {uploadNotice.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate max-w-[200px]" title={uploadNotice.message}>{uploadNotice.message}</span>
          </div>
        )}

        {/* CSV Upload Action */}
        <div className="relative">
          <input
            type="file"
            accept=".csv"
            disabled={uploading}
            onChange={handleQuickUpload}
            className="hidden"
            id="header-csv-upload"
          />
          <label
            htmlFor={uploading ? undefined : "header-csv-upload"}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-xs font-extrabold transition shadow-2xs ${
              uploading
                ? 'bg-[#7A8896] cursor-not-allowed opacity-80'
                : 'bg-[#1268C4] hover:bg-[#102B52] cursor-pointer'
            }`}
          >
            <Upload className={`w-3.5 h-3.5 ${uploading ? 'animate-bounce' : ''}`} />
            <span>{uploading ? 'Uploading...' : 'Upload CSV'}</span>
          </label>
        </div>
      </div>
    </header>
  );
}
