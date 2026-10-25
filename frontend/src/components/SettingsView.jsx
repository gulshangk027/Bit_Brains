import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sliders, 
  Cpu, 
  Upload, 
  BarChart2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Activity, 
  Database, 
  Zap, 
  Lock, 
  Sparkles, 
  ShieldAlert, 
  FileSpreadsheet, 
  SlidersHorizontal,
  Play,
  Check,
  CheckSquare,
  Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';

export default function SettingsView({
  datasetSummary,
  onRefreshDataset,
  isModelTrained,
  setIsModelTrained,
  trainedMetrics,
  setTrainedMetrics
}) {
  const [activeMlSection, setActiveMlSection] = useState('dataset');

  const [featureMode, setFeatureMode] = useState('full_feature');
  const [modelType, setModelType] = useState('xgboost');
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [activationLoading, setActivationLoading] = useState(false);
  const [metrics, setMetrics] = useState(trainedMetrics);
  const [modelStatus, setModelStatus] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadValidationReport, setUploadValidationReport] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState(null);

  const [featureDict, setFeatureDict] = useState([]);
  const [loadingDict, setLoadingDict] = useState(false);

  const [demoValues, setDemoValues] = useState({
    F115: 2.8,
    F321: 3.5,
    F527: 4.1,
    F531: 4.8,
    F670: 14.0,
    F1692: 8.0,
    F2082: 8.5,
    F2582: 15000.0,
    F2678: 45000.0,
    F2737: 32000.0,
    F3836: 1500.0,
    F3887: 45.0,
    F3889: 1.0,
    F3894: 22.0
  });

  const [customMlResult, setCustomMlResult] = useState(null);
  const [customMlLoading, setCustomMlLoading] = useState(false);

  const fetchModelStatus = async () => {
    try {
      const res = await fetch('/api/model/status');
      const data = await res.json();
      setModelStatus(data);
      if (data.active_mode) setFeatureMode(data.active_mode);
      if (data.metrics) {
        setMetrics(data.metrics);
        if (setTrainedMetrics) setTrainedMetrics(data.metrics);
        if (setIsModelTrained) setIsModelTrained(data.is_trained);
      }
    } catch (err) {
      console.error('Error fetching model status:', err);
    }
  };

  const fetchFeatureDict = async () => {
    setLoadingDict(true);
    try {
      const res = await fetch('/api/features/dictionary');
      const data = await res.json();
      setFeatureDict(data.dictionary || []);
    } catch (err) {
      console.error('Error fetching feature dictionary:', err);
    } finally {
      setLoadingDict(false);
    }
  };

  useEffect(() => {
    fetchModelStatus();
    fetchFeatureDict();
  }, []);

  useEffect(() => {
    if (trainedMetrics) setMetrics(trainedMetrics);
  }, [trainedMetrics]);

  const handleTrainModel = async () => {
    setTrainingLoading(true);
    setActionNotice(null);
    try {
      const res = await fetch('/api/model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: featureMode, model_type: modelType })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMetrics(data.metrics);
        if (setTrainedMetrics) setTrainedMetrics(data.metrics);
        if (setIsModelTrained) setIsModelTrained(true);
        fetchModelStatus();
        fetchCustomPrediction(demoValues);
        setActionNotice(`Successfully trained ${data.metrics.active_model_name}!`);
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Model training error:', err);
    } finally {
      setTrainingLoading(false);
    }
  };

  const handleActivateModel = async () => {
    setActivationLoading(true);
    setActionNotice(null);
    try {
      const res = await fetch('/api/model/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: featureMode, model_type: modelType })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMetrics(data.metrics);
        if (setTrainedMetrics) setTrainedMetrics(data.metrics);
        if (setIsModelTrained) setIsModelTrained(true);
        fetchModelStatus();
        setActionNotice(`Active model updated: ${data.metrics.active_model_name} (${featureMode}) is now active for Drishthi.`);
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Model activation error:', err);
    } finally {
      setActivationLoading(false);
    }
  };

  const safeParseApiResponse = async (res) => {
    let rawText = '';
    try {
      rawText = await res.text();
    } catch (err) {
      return {
        ok: false,
        status: res.status,
        message: `Failed to read network response: ${err.message}`
      };
    }

    if (!rawText || !rawText.trim()) {
      return {
        ok: false,
        status: res.status,
        message: `Server returned an empty response (HTTP ${res.status} ${res.statusText || ''}). Verify the backend server is running on http://127.0.0.1:8000.`
      };
    }

    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      const cleaned = rawText.replace(/<[^>]*>/g, '').trim().slice(0, 160);
      return {
        ok: false,
        status: res.status,
        message: `Server returned non-JSON response (HTTP ${res.status}): ${cleaned || res.statusText || 'Unexpected response format'}`
      };
    }

    let msg = data.message;
    if (!msg && data.detail) {
      if (typeof data.detail === 'string') {
        msg = data.detail;
      } else if (Array.isArray(data.detail)) {
        msg = data.detail.map(d => (d.msg ? `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}` : JSON.stringify(d))).join('; ');
      } else {
        msg = JSON.stringify(data.detail);
      }
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
      message: msg || (res.ok ? 'Operation successful' : `Request failed with HTTP ${res.status}`)
    };
  };

  const handleFileUpload = async (file, inputElement = null) => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadValidationReport(null);
    setUploadMetadata(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/dataset/upload', {
        method: 'POST',
        body: formData
      });

      const parsed = await safeParseApiResponse(res);

      if (parsed.ok && parsed.data?.status === 'success') {
        const meta = parsed.data.metadata || {};
        const retrainMsg = parsed.data.model_training_message;
        const successMsg = retrainMsg ? `${parsed.message} (${retrainMsg})` : parsed.message;
        setUploadSuccess(successMsg || 'Dataset successfully uploaded and validated.');
        setUploadMetadata(meta);
        if (parsed.data.validation_report) {
          setUploadValidationReport(parsed.data.validation_report);
        }
        if (onRefreshDataset) onRefreshDataset();
        fetchModelStatus();
        fetchFeatureDict();
      } else {
        const errorMsg = parsed.message || 'Failed to upload dataset.';
        setUploadError(errorMsg);
        if (parsed.data?.validation_report) {
          setUploadValidationReport(parsed.data.validation_report);
        }
      }
    } catch (err) {
      setUploadError(`Network error while uploading dataset: ${err.message}. Please check if the backend server is reachable.`);
    } finally {
      setUploading(false);
      if (inputElement) {
        inputElement.value = '';
      }
    }
  };

  const fetchCustomPrediction = async (values = demoValues) => {
    setCustomMlLoading(true);
    try {
      const res = await fetch('/api/predict/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: values, mode: featureMode })
      });
      const data = await res.json();
      setCustomMlResult(data);
    } catch (err) {
      console.error('Custom prediction error:', err);
    } finally {
      setCustomMlLoading(false);
    }
  };

  useEffect(() => {
    if (activeMlSection === 'testing') {
      fetchCustomPrediction(demoValues);
    }
  }, [demoValues, activeMlSection, featureMode]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Platform Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9E2EC] pb-6 bg-white p-6 rounded-2xl border shadow-2xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase">
              SYSTEM CONFIGURATION & MODEL ADMINISTRATION
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#1565C0]" />
            SETTINGS & ML MODEL CONFIGURATION
          </h1>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-4 rounded-xl bg-[#EEF3F8] border border-[#D9E2EC] text-xs font-bold text-[#1565C0] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1565C0] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* SECTION 1: Configurable Decision Support Risk Thresholds */}
      <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#1565C0]" />
          <span>Configurable Decision Support Risk Thresholds</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
            <span className="font-bold text-[#B42318]">CRITICAL RISK THRESHOLD</span>
            <div className="text-[#5B6B7A]">Score &ge; 75 (Action: FREEZE / IMMEDIATE INVESTIGATION)</div>
          </div>

          <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
            <span className="font-bold text-[#D64545]">HIGH RISK THRESHOLD</span>
            <div className="text-[#5B6B7A]">Score 50 - 74 (Action: RESTRICT / ENHANCED MONITORING)</div>
          </div>

          <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
            <span className="font-bold text-[#D98B00]">MEDIUM RISK THRESHOLD</span>
            <div className="text-[#5B6B7A]">Score 25 - 49 (Action: MONITOR ACCOUNT ACTIVITY)</div>
          </div>

          <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
            <span className="font-bold text-[#168A5B]">LOW RISK THRESHOLD</span>
            <div className="text-[#5B6B7A]">Score 0 - 24 (Action: NO IMMEDIATE ACTION REQUIRED)</div>
          </div>
        </div>

        <div className="pt-2 space-y-1">
          <h4 className="text-xs font-bold text-[#0F2747] uppercase">Professional Disclaimer</h4>
          <p className="text-xs text-[#5B6B7A] leading-relaxed font-mono p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
            "Drishthi is an AI-assisted fraud-risk decision-support system. Risk scores and recommendations are intended to support human investigation and applicable banking compliance procedures and should not independently determine account actions."
          </p>
        </div>
      </div>

      {/* SECTION 2: DRISHTHI ML CONFIGURATION */}
      <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9E2EC] pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase">
                REAL ML PIPELINE ADMINISTRATION
              </span>
            </div>
            <h2 className="text-xl font-black text-[#0F2747] mt-1 flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-[#1565C0]" />
              DRISHTHI ML CONFIGURATION
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#5B6B7A] bg-[#F5F7FA] px-3 py-1.5 rounded-xl border border-[#D9E2EC]">
            <span>Active Engine:</span>
            <span className="text-[#168A5B] font-bold">
              {metrics?.model_version || 'XGBoost v1'} ({featureMode})
            </span>
          </div>
        </div>

        {/* Sub Navigation Bar for ML Config Sections */}
        <div className="flex flex-wrap items-center gap-2 bg-[#F5F7FA] p-2 rounded-xl border border-[#D9E2EC]">
          {[
            { id: 'dataset', label: '1. Dataset Management', icon: Database },
            { id: 'feature', label: '2. Feature Configuration', icon: Layers },
            { id: 'training', label: '3. Model Training', icon: Cpu },
            { id: 'validation', label: '4. Model Validation', icon: BarChart2 },
            { id: 'management', label: '5. Active Model', icon: Activity },
            { id: 'testing', label: '6. Drishthi ML Testing', icon: SlidersHorizontal }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMlSection(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeMlSection === tab.id
                    ? 'bg-[#1565C0] text-white shadow-2xs font-extrabold'
                    : 'text-[#5B6B7A] hover:text-[#0F2747] hover:bg-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. DATASET MANAGEMENT */}
        {activeMlSection === 'dataset' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">Dataset Name</span>
                <div className="text-sm font-bold font-mono text-[#1565C0] truncate">
                  {datasetSummary?.filename || 'Synthetic Demonstration Data'}
                </div>
              </div>

              <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">Number of Records</span>
                <div className="text-xl font-extrabold font-mono text-[#0F2747]">
                  {datasetSummary?.total_rows ? datasetSummary.total_rows.toLocaleString() : (datasetSummary?.rows || 500)}
                </div>
              </div>

              <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">Available Features</span>
                <div className="text-xl font-extrabold font-mono text-[#1565C0]">
                  {datasetSummary?.total_features || datasetSummary?.columns || 118}
                </div>
              </div>

              <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">Target Variable</span>
                <div className="text-xl font-extrabold font-mono text-[#168A5B]">
                  F3924 (Mule Tag)
                </div>
              </div>
            </div>

            {/* CSV Upload Container */}
            <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#1565C0]" />
                  <span>Upload Custom Training Dataset</span>
                </h4>
                <span className="text-[10px] text-[#7A8896] font-mono font-bold">SUPPORTS CSV FORMAT ONLY</span>
              </div>

              {/* Requirement Hint Box */}
              <div className="p-3.5 bg-[#EEF3F8] rounded-xl border border-[#D0DFEF] text-xs space-y-1.5 text-[#102B52]">
                <div className="flex items-center gap-1.5 font-bold text-[#1268C4]">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Supervised Model Training Requirements</span>
                </div>
                <div className="text-[11px] text-[#4A5D71] leading-relaxed">
                  Dataset must contain target column <strong className="font-mono text-[#0F2747]">F3924</strong> (or <span className="font-mono">target</span> / <span className="font-mono">label</span> / <span className="font-mono">is_mule</span>) with binary tags: <span className="font-mono font-bold text-[#168A5B]">0</span> = Legitimate, <span className="font-mono font-bold text-[#D64545]">1</span> = Suspicious Mule.
                  Stratified 5-Fold validation requires at least <strong className="text-[#0F2747]">5 samples per class</strong> (min 10 records total).
                </div>
              </div>

              <div className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 bg-white transition ${uploading ? 'border-[#1565C0] bg-[#F8FAFC]' : 'border-[#D9E2EC] hover:border-[#1565C0]'}`}>
                <FileSpreadsheet className={`w-10 h-10 mx-auto ${uploading ? 'text-[#1565C0] animate-bounce' : 'text-[#7A8896]'}`} />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#0F2747]">
                    {uploading ? 'Validating and Ingesting CSV Dataset...' : 'Select or Drag & Drop CSV Training Data'}
                  </div>
                  <div className="text-[11px] text-[#5B6B7A] font-mono">
                    {uploading ? 'Checking headers, target column F3924, class distribution, and feature types' : "Target column 'F3924' will be auto-detected and validated for Stratified 5-Fold training"}
                  </div>
                </div>

                <input
                  type="file"
                  accept=".csv"
                  disabled={uploading}
                  onChange={(e) => handleFileUpload(e.target.files[0], e.target)}
                  className="hidden"
                  id="dataset-upload-input"
                />

                <label
                  htmlFor={uploading ? undefined : "dataset-upload-input"}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition shadow-2xs ${
                    uploading
                      ? 'bg-[#7A8896] text-white cursor-not-allowed opacity-80'
                      : 'bg-[#1565C0] hover:bg-[#0F2747] text-white cursor-pointer'
                  }`}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing CSV Upload...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload CSV File</span>
                    </>
                  )}
                </label>
              </div>

              {uploadSuccess && (
                <div className="p-4 rounded-xl bg-[#E6F4EA] border border-[#A8DADC] text-xs text-[#168A5B] space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#168A5B] shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                  {uploadMetadata && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#A8DADC]/50 text-[11px] font-mono text-[#0F2747]">
                      <div className="bg-white/80 p-2 rounded-lg">
                        <span className="text-[#5B6B7A] block text-[9px] uppercase">File</span>
                        <span className="font-bold truncate block">{uploadMetadata.filename}</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg">
                        <span className="text-[#5B6B7A] block text-[9px] uppercase">Records</span>
                        <span className="font-bold">{uploadMetadata.rows}</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg">
                        <span className="text-[#5B6B7A] block text-[9px] uppercase">Features</span>
                        <span className="font-bold">{uploadMetadata.columns}</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg">
                        <span className="text-[#5B6B7A] block text-[9px] uppercase">Target F3924</span>
                        <span className="font-bold text-[#168A5B]">
                          {uploadMetadata.suspicious_count} Mules / {uploadMetadata.legitimate_count} Legit
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#F87171] text-xs text-[#D64545] space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#D64545] shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  {uploadValidationReport?.validation_errors && uploadValidationReport.validation_errors.length > 0 && (
                    <div className="bg-white/90 p-3 rounded-lg border border-[#F87171]/40 space-y-1">
                      <div className="font-bold text-[10px] uppercase text-[#7A8896]">Specific Validation Errors:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#A82A2A]">
                        {uploadValidationReport.validation_errors.map((errItem, idx) => (
                          <li key={idx}>{errItem}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. FEATURE CONFIGURATION */}
        {activeMlSection === 'feature' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setFeatureMode('bank_finalized');
                  handleActivateModel();
                }}
                className={`p-5 rounded-2xl border text-left transition space-y-2 cursor-pointer ${
                  featureMode === 'bank_finalized'
                    ? 'border-[#1565C0] bg-[#EEF3F8] shadow-2xs'
                    : 'border-[#D9E2EC] bg-[#F5F7FA] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#1565C0] flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    Mode A: 18 Bank Finalized Anchors
                  </span>
                  {featureMode === 'bank_finalized' && (
                    <CheckCircle2 className="w-4 h-4 text-[#1565C0]" />
                  )}
                </div>
                <p className="text-[11px] text-[#5B6B7A] leading-relaxed font-mono">
                  Uses the 18 official bank anchor features (`F115`, `F321`, `F527`, `F531`, `F670`, `F1692`, `F2082`, `F2582`, `F2678`, `F2737`, `F3836`, `F3887`, `F3889`, `F3891`, `F3894`, etc.).
                </p>
              </button>

              <button
                onClick={() => {
                  setFeatureMode('full_feature');
                  handleActivateModel();
                }}
                className={`p-5 rounded-2xl border text-left transition space-y-2 cursor-pointer ${
                  featureMode === 'full_feature'
                    ? 'border-[#1565C0] bg-[#EEF3F8] shadow-2xs'
                    : 'border-[#D9E2EC] bg-[#F5F7FA] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#1565C0] flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Mode B: Full AI Feature Intelligence
                  </span>
                  {featureMode === 'full_feature' && (
                    <CheckCircle2 className="w-4 h-4 text-[#1565C0]" />
                  )}
                </div>
                <p className="text-[11px] text-[#5B6B7A] leading-relaxed font-mono">
                  Automated Variance Threshold filtering, collinearity pruning (&gt;0.95 drop), and top feature importance ranking across all dataset columns.
                </p>
              </button>
            </div>

            {/* Feature Table Inspector */}
            <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#1565C0]" />
                  <span>Dataset Feature Dictionary ({featureDict.length} Available Features)</span>
                </h4>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 font-mono text-xs">
                <div className="grid grid-cols-12 gap-2 text-[#5B6B7A] font-bold border-b border-[#D9E2EC] pb-2 px-2">
                  <span className="col-span-3">FEATURE ID</span>
                  <span className="col-span-4">VARIABLE NAME</span>
                  <span className="col-span-3">CATEGORY</span>
                  <span className="col-span-2 text-right">TYPE</span>
                </div>

                {featureDict.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-2 rounded bg-white border border-[#D9E2EC] hover:border-[#1565C0] items-center">
                    <span className="col-span-3 text-[#1565C0] font-bold">{item.feature_id}</span>
                    <span className="col-span-4 text-[#0F2747] font-bold">{item.variable}</span>
                    <span className="col-span-3 text-[#5B6B7A] text-[10px]">{item.category}</span>
                    <span className="col-span-2 text-right">
                      {item.is_bank_finalized ? (
                        <span className="px-2 py-0.5 rounded bg-[#E6F4EA] text-[#168A5B] text-[9px] font-bold border border-[#A8DADC]">
                          BANK ANCHOR
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#F5F7FA] text-[#5B6B7A] text-[9px] border border-[#D9E2EC]">
                          EXTENDED
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. MODEL TRAINING */}
        {activeMlSection === 'training' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-6">
              <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#1565C0]" />
                <span>Select Classifier Architecture & Initiate Model Training</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'xgboost', label: 'XGBoost Classifier', desc: 'Gradient Boosted Decision Trees (Primary Engine)', tag: 'PRIMARY' },
                  { id: 'random_forest', label: 'Random Forest', desc: 'Ensemble Bagging Decision Trees', tag: 'SUPPORTED' },
                  { id: 'logistic', label: 'Logistic Regression', desc: 'L2 Penalized Linear Binary Classifier', tag: 'SUPPORTED' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModelType(m.id)}
                    className={`p-4 rounded-xl border text-left transition space-y-2 cursor-pointer ${
                      modelType === m.id
                        ? 'border-[#1565C0] bg-[#EEF3F8] text-[#0F2747] shadow-2xs font-bold'
                        : 'border-[#D9E2EC] bg-white text-[#5B6B7A] hover:border-[#1565C0]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#0F2747]">{m.label}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                        m.tag === 'PRIMARY' ? 'bg-[#1565C0] text-white font-bold' : 'bg-[#F5F7FA] text-[#5B6B7A] border border-[#D9E2EC]'
                      }`}>
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5B6B7A] font-mono">{m.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#D9E2EC] gap-4">
                <div className="text-xs text-[#5B6B7A] font-mono">
                  Mode: <span className="text-[#1565C0] font-bold">{featureMode}</span> | Selected Model: <span className="text-[#0F2747] font-bold">{modelType.toUpperCase()}</span>
                </div>

                <button
                  onClick={handleTrainModel}
                  disabled={trainingLoading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {trainingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Training Stratified 5-Fold Model...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>TRAIN DRISHTHI MODEL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. MODEL VALIDATION */}
        {activeMlSection === 'validation' && (
          <div className="space-y-6">
            {metrics ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                    <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">Precision</span>
                    <div className="text-2xl font-extrabold font-mono text-[#1565C0]">
                      {metrics.precision}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                    <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">Recall</span>
                    <div className="text-2xl font-extrabold font-mono text-[#168A5B]">
                      {metrics.recall}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                    <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">F1 Score</span>
                    <div className="text-2xl font-extrabold font-mono text-[#0F2747]">
                      {metrics.f1_score}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                    <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">ROC-AUC</span>
                    <div className="text-2xl font-extrabold font-mono text-[#1565C0]">
                      {metrics.roc_auc}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                    <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">PR-AUC</span>
                    <div className="text-2xl font-extrabold font-mono text-[#1976D2]">
                      {metrics.pr_auc}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] space-y-1">
                    <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">FPR</span>
                    <div className="text-2xl font-extrabold font-mono text-[#D98B00]">
                      {metrics.false_positive_rate}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 p-6 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-4">
                    <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                      Stratified 5-Fold Confusion Matrix
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-center font-mono text-xs">
                      <div className="p-4 rounded-xl bg-[#E6F4EA] border border-[#A8DADC]">
                        <div className="text-[10px] text-[#168A5B] uppercase font-bold">True Negatives (TN)</div>
                        <div className="text-2xl font-extrabold text-[#0F2747] mt-1">
                          {metrics.confusion_matrix.tn}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#F87171]">
                        <div className="text-[10px] text-[#D64545] uppercase font-bold">False Positives (FP)</div>
                        <div className="text-2xl font-extrabold text-[#D64545] mt-1">
                          {metrics.confusion_matrix.fp}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                        <div className="text-[10px] text-[#D98B00] uppercase font-bold">False Negatives (FN)</div>
                        <div className="text-2xl font-extrabold text-[#D98B00] mt-1">
                          {metrics.confusion_matrix.fn}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#EEF3F8] border border-[#D9E2EC]">
                        <div className="text-[10px] text-[#1565C0] uppercase font-bold">True Positives (TP)</div>
                        <div className="text-2xl font-extrabold text-[#1565C0] mt-1">
                          {metrics.confusion_matrix.tp}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 p-6 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-4">
                    <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                      ROC Curve (AUC = {metrics.roc_auc})
                    </h4>

                    {metrics.roc_curve && (
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metrics.roc_curve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="fpr" stroke="#7A8896" fontSize={10} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -2, fill: '#7A8896', fontSize: 10 }} />
                            <YAxis stroke="#7A8896" fontSize={10} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#7A8896', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9E2EC', borderRadius: '0.5rem', fontSize: '11px', color: '#0F2747' }} />
                            <Area type="monotone" dataKey="tpr" stroke="#1565C0" fill="#1565C0" fillOpacity={0.2} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] text-center text-[#5B6B7A] text-xs">
                No model validation metrics calculated yet. Train a model under the Model Training tab.
              </div>
            )}
          </div>
        )}

        {/* 5. ACTIVE MODEL */}
        {activeMlSection === 'management' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-6">
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-4">
                <div>
                  <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#1565C0]" />
                    <span>Active Model Details & Status</span>
                  </h4>
                  <p className="text-[11px] text-[#5B6B7A] mt-1">
                    Currently active model utilized by Drishthi for real-time risk predictions.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#168A5B] border border-[#A8DADC] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACTIVE & PERSISTED TO DISK</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 bg-white rounded-xl border border-[#D9E2EC] space-y-1">
                  <span className="text-[#5B6B7A]">Active Model Name:</span>
                  <div className="font-bold text-[#1565C0] text-sm">
                    {metrics?.active_model_name || `Drishthi ${modelType.toUpperCase()} Classifier`}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#D9E2EC] space-y-1">
                  <span className="text-[#5B6B7A]">Model Version:</span>
                  <div className="font-bold text-[#0F2747] text-sm">
                    {metrics?.model_version || 'DRISHTHI-XGBOOST-v1'}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#D9E2EC] space-y-1">
                  <span className="text-[#5B6B7A]">Dataset Used:</span>
                  <div className="font-bold text-[#168A5B] truncate text-sm">
                    {metrics?.dataset_name || datasetSummary?.filename || 'Synthetic Data'}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#D9E2EC] space-y-1">
                  <span className="text-[#5B6B7A]">Last Trained Time:</span>
                  <div className="font-bold text-[#D98B00] text-sm">
                    {metrics?.last_trained_at || 'Just now'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#D9E2EC]">
                <button
                  onClick={handleTrainModel}
                  disabled={trainingLoading}
                  className="px-6 py-3 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs transition shadow-sm cursor-pointer"
                >
                  TRAIN MODEL
                </button>

                <button
                  onClick={handleActivateModel}
                  disabled={activationLoading}
                  className="px-6 py-3 rounded-xl bg-[#F5F7FA] hover:bg-[#EEF3F8] text-[#1565C0] font-extrabold text-xs border border-[#D9E2EC] transition cursor-pointer"
                >
                  {activationLoading ? 'Activating Model...' : 'ACTIVATE MODEL'}
                </button>

                <button
                  onClick={handleTrainModel}
                  disabled={trainingLoading}
                  className="px-6 py-3 rounded-xl bg-white hover:bg-[#F5F7FA] text-[#0F2747] font-extrabold text-xs border border-[#D9E2EC] transition cursor-pointer"
                >
                  RETRAIN MODEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. DRISHTHI ML TESTING */}
        {activeMlSection === 'testing' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-6">
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-4">
                <div>
                  <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#1565C0]" />
                    <span>Drishthi ML Testing (Active ML Model Sandbox)</span>
                  </h4>
                  <p className="text-[11px] text-[#5B6B7A] mt-1">
                    Interactively adjust feature sliders to run live prediction inference against the active ML model (`/api/predict/custom`).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sliders Input Column */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(demoValues).map(([feat, val]) => (
                      <div key={feat} className="p-3 bg-white rounded-xl border border-[#D9E2EC] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1565C0] font-mono">{feat}</span>
                          <span className="font-mono text-[#0F2747] font-extrabold">{val}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={feat.startsWith('F2') ? 100000 : 50}
                          step={feat.startsWith('F2') ? 1000 : 0.5}
                          value={val}
                          onChange={(e) => setDemoValues(prev => ({ ...prev, [feat]: Number(e.target.value) }))}
                          className="w-full accent-[#1565C0] cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => fetchCustomPrediction(demoValues)}
                    disabled={customMlLoading}
                    className="w-full py-3 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {customMlLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>RUN CUSTOM INFERENCE PREDICTION</span>
                  </button>
                </div>

                {/* Prediction Result Panel */}
                <div className="lg:col-span-5 space-y-4">
                  {customMlResult ? (
                    <div className="p-6 rounded-2xl bg-white border border-[#D9E2EC] shadow-sm text-center space-y-5">
                      <span className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider block">
                        SANDBOX PREDICTION RESULT
                      </span>

                      <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                        <span className="text-3xl font-extrabold font-mono text-[#0F2747]">
                          {customMlResult.risk_score}
                        </span>
                      </div>

                      <div className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase border ${
                        customMlResult.risk_score >= 50
                          ? 'bg-[#FEF2F2] text-[#D64545] border-[#F87171]'
                          : 'bg-[#E6F4EA] text-[#168A5B] border-[#A8DADC]'
                      }`}>
                        {customMlResult.classification}
                      </div>

                      <div className="text-xs text-[#5B6B7A] font-mono">
                        P(Mule) = {((customMlResult.model_probability ?? customMlResult.probability ?? 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-white border border-[#D9E2EC] text-center text-[#5B6B7A] text-xs">
                      Adjust sliders and click run to test live inference.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
