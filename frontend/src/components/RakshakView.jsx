import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw,
  MessageSquare,
  HelpCircle,
  Clock,
  Info
} from 'lucide-react';

import VoiceInputButton from './VoiceInputButton';

const SAMPLE_MESSAGES = [
  {
    label: "Mule Recruitment (High Risk)",
    text: "Earn ₹5,000 daily from home! Just let us transfer money to your bank account, keep 10% commission and forward the remaining cash to our manager on Telegram."
  },
  {
    label: "Credential Harvesting (High Risk)",
    text: "Urgent SBI KYC Update required. Send your OTP and NetBanking PIN immediately to activate your account and claim bonus points."
  },
  {
    label: "Safety Educational Advisory (Negation Aware - Low Risk)",
    text: "Bank Security Warning: Never share your OTP, PIN, or banking password with anyone. Do not allow third parties to use your account to receive or transfer funds."
  },
  {
    label: "Generic Reward Offer (Unverified Promo - Needs Review)",
    text: "Congratulations! You have been selected for a special reward. Review the offer details to learn more."
  }
];

export default function RakshakView() {
  const [message, setMessage] = useState('');
  const [evaluatedMessage, setEvaluatedMessage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const activeRequestIdRef = useRef(0);

  // Check if current input differs from the evaluated message
  const isOutdated = Boolean(
    analysis && 
    evaluatedMessage !== null && 
    message.trim() !== evaluatedMessage.trim()
  );

  const handleAnalyze = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    const textToAnalyze = message.trim();
    if (!textToAnalyze) return;

    setIsAnalyzing(true);
    setError(null);

    // Track request ID to ignore stale out-of-order async responses
    const currentRequestId = ++activeRequestIdRef.current;

    try {
      const response = await fetch('/api/rakshak/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: textToAnalyze })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();

      // Guard against stale asynchronous responses
      if (currentRequestId === activeRequestIdRef.current) {
        setAnalysis(resData);
        setEvaluatedMessage(textToAnalyze);
      }
    } catch (err) {
      console.error('Rakshak analysis error:', err);
      if (currentRequestId === activeRequestIdRef.current) {
        setError('Failed to evaluate message against Rakshak API. Please verify backend connection.');
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleClear = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    activeRequestIdRef.current++;
    setMessage('');
    setEvaluatedMessage(null);
    setAnalysis(null);
    setError(null);
    setSelectedDemo(null);
  };

  const handleDemoSelect = (sampleText, idx) => {
    activeRequestIdRef.current++;
    setMessage(sampleText);
    setSelectedDemo(idx);
    // Explicitly reset previous analysis so results are not mistakenly associated with new input
    setAnalysis(null);
    setEvaluatedMessage(null);
    setError(null);
  };

  const handleTextChange = (e) => {
    setMessage(e.target.value);
    setSelectedDemo(null);
    if (error) setError(null);
  };

  const handleVoiceInput = (val) => {
    setMessage(val);
    setSelectedDemo(null);
    if (error) setError(null);
  };

  // Helper for severity styling
  const getSeverityStyle = (severity) => {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL':
        return 'bg-[#FEF2F2] text-[#B42318] border-[#B42318]';
      case 'HIGH':
        return 'bg-[#FDF2F2] text-[#D64545] border-[#F87171]';
      case 'MODERATE':
        return 'bg-[#FFFBEB] text-[#D98B00] border-[#FDE68A]';
      case 'LOW':
      default:
        return 'bg-[#E6F4EA] text-[#168A5B] border-[#A8DADC]';
    }
  };

  const riskScore = analysis ? (analysis.risk_score ?? analysis.riskScore ?? 0) : 0;
  const riskLevel = analysis ? (analysis.risk_level ?? analysis.riskLevel ?? 'LOW') : 'LOW';
  const confidence = analysis ? (analysis.confidence ?? 0.95) : 0.95;
  const classification = analysis ? (analysis.classification_label || analysis.classification || 'UNCLASSIFIED') : '';
  const detectedSignals = analysis ? (analysis.detected_signals || analysis.detectedSignals || []) : [];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto font-sans">
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-6 bg-white p-6 rounded-2xl border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#E6F4EA] text-[#168A5B] border border-[#A8DADC] uppercase">
              MODULE 01 • PREVENT
            </span>
            <span className="text-xs text-[#5B6B7A] font-mono">RECRUITMENT STAGE</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-[#168A5B]" />
            RAKSHAK — Onboarding & Recruitment Prevention
          </h1>
          <p className="text-xs text-[#5B6B7A] mt-1">
            Evidence-based recruitment prevention. Evaluates suspicious WhatsApp, Telegram, SMS, or job offers for authentic money-mule patterns, credential theft, and negation context.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#1565C0]" />
                <span>Paste Suspicious Message / Offer Text</span>
              </label>
              <div className="flex items-center gap-3">
                <VoiceInputButton 
                  currentText={message} 
                  onTextChange={handleVoiceInput} 
                  accentColor="blue"
                />
                <span className="text-[11px] text-[#5B6B7A] font-medium hidden sm:inline">Negation-Aware Engine</span>
              </div>
            </div>

            <textarea
              rows={6}
              value={message}
              onChange={handleTextChange}
              placeholder="Paste WhatsApp, Telegram, SMS, or job offer text here... e.g. 'Earn ₹5,000 daily from home. Let us use your bank account to receive payments and forward...'"
              className="w-full bg-[#F5F7FA] border border-[#D9E2EC] rounded-xl p-4 text-xs text-[#0F2747] placeholder:text-[#7A8896] focus:outline-none focus:border-[#1565C0] focus:bg-white resize-none font-mono"
            />

            {error && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#B42318] text-xs text-[#B42318] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-[#5B6B7A] hover:text-[#0F2747] flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Input</span>
              </button>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !message.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>ANALYZING THREAT SIGNALS...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>ANALYZE WITH RAKSHAK</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Demo Inputs */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#5B6B7A] flex items-center gap-1.5 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-[#1565C0]" />
              <span>Sample Recruitment Offers (Click to select):</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_MESSAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDemoSelect(sample.text, idx)}
                  className={`p-3.5 rounded-xl border text-left transition space-y-1 group cursor-pointer ${
                    selectedDemo === idx
                      ? 'bg-[#EEF3F8] border-[#1565C0] shadow-2xs'
                      : 'bg-white border-[#D9E2EC] hover:border-[#1565C0]'
                  }`}
                >
                  <div className="text-[11px] font-bold text-[#1565C0] flex items-center justify-between">
                    <span>{sample.label}</span>
                    {selectedDemo === idx && (
                      <span className="text-[10px] text-[#1565C0] font-mono bg-[#EEF3F8] px-2 py-0.5 rounded border border-[#D9E2EC]">Selected</span>
                    )}
                  </div>
                  <div className="text-xs text-[#5B6B7A] line-clamp-1 italic font-mono">
                    "{sample.text}"
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-5 space-y-6">
          {isAnalyzing ? (
            <div className="bg-white p-8 rounded-2xl border border-[#D9E2EC] text-center space-y-4 shadow-sm animate-pulse">
              <Sparkles className="w-10 h-10 text-[#1565C0] mx-auto animate-spin" />
              <h3 className="text-xs font-extrabold text-[#0F2747] uppercase tracking-wider">ANALYZING THREAT SIGNALS...</h3>
              <p className="text-xs text-[#5B6B7A] max-w-xs mx-auto">
                Running evidence extraction, checking negation context, and verifying against fraud taxonomy...
              </p>
            </div>
          ) : analysis ? (
            <div className={`p-6 rounded-2xl border transition-all shadow-sm space-y-5 bg-white ${
              riskScore >= 75
                ? 'border-[#B42318]'
                : riskScore >= 50
                ? 'border-[#D64545]'
                : riskScore >= 25
                ? 'border-[#D98B00]'
                : 'border-[#168A5B]'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#168A5B] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  RAKSHAK EVALUATION COMPLETE
                </span>
                <span className="text-[10px] text-[#7A8896] font-mono font-semibold">ENGINE: V2.4-EVIDENCE</span>
              </div>

              {/* Evaluated Message Snippet */}
              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#5B6B7A]" />
                    Evaluated Input
                  </span>
                  {evaluatedMessage && (
                    <span className="text-[10px] font-mono text-[#7A8896]">
                      {evaluatedMessage.length} chars
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#0F2747] font-mono italic line-clamp-2">
                  "{analysis.evaluated_text_snippet || evaluatedMessage}"
                </p>
              </div>

              {/* Outdated Analysis Warning Banner */}
              {isOutdated && (
                <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#B45309] font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D98B00] shrink-0" />
                  <span>
                    Analysis outdated — message has been modified. Click <strong>ANALYZE WITH RAKSHAK</strong> to evaluate updated text.
                  </span>
                </div>
              )}

              {/* Risk Gauge Header */}
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B7A]">
                      RECRUITMENT RISK SCORE
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-[#0F2747] flex items-center gap-2 mt-1">
                    <span>{riskScore}</span>
                    <span className="text-sm text-[#7A8896] font-sans font-normal">/ 100</span>
                  </div>
                  <span className="text-[10px] text-[#7A8896]">Threat severity score</span>
                </div>

                <div className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase border ${
                  riskScore >= 75
                    ? 'bg-[#FEF2F2] text-[#B42318] border-[#B42318]'
                    : riskScore >= 50
                    ? 'bg-[#FDF2F2] text-[#D64545] border-[#F87171]'
                    : riskScore >= 25
                    ? 'bg-[#FFFBEB] text-[#D98B00] border-[#FDE68A]'
                    : 'bg-[#E6F4EA] text-[#168A5B] border-[#A8DADC]'
                }`}>
                  {riskLevel}
                </div>
              </div>

              {/* Classification & Confidence (Clearly Distinguished) */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC]">
                <div>
                  <div className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider">Classification</div>
                  <div className="text-xs font-extrabold text-[#0F2747] mt-0.5 font-mono">{classification}</div>
                  <span className="text-[10px] text-[#7A8896]">Identified threat category</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider">Model Confidence</div>
                  <div className="text-xs font-extrabold text-[#1565C0] mt-0.5 font-mono">
                    {Math.round(confidence * 100)}%
                  </div>
                  <span className="text-[10px] text-[#7A8896]">Certainty of classification</span>
                </div>
              </div>

              {/* Needs Human Review Notice */}
              {analysis.needs_review && (
                <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#B45309] font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#D98B00] shrink-0" />
                  <span>Uncertain / Inconclusive pattern — Analyst human review recommended.</span>
                </div>
              )}

              {/* Negation Badge */}
              {(analysis.negation_detected || analysis.negationDetected) && (
                <div className="p-3 rounded-lg bg-[#EEF3F8] border border-[#D9E2EC] text-xs text-[#1565C0] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1565C0] shrink-0" />
                  <span>Negation keywords confirmed. Message provides protective advice rather than soliciting credentials.</span>
                </div>
              )}

              {/* Detected Signals */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center justify-between">
                  <span>Detected Threat Signals ({detectedSignals.length})</span>
                  {detectedSignals.length > 0 && (
                    <span className="text-[10px] text-[#5B6B7A] font-normal">Evidence-supported</span>
                  )}
                </div>

                {detectedSignals.length > 0 ? (
                  <div className="space-y-2.5">
                    {detectedSignals.map((sig, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F2747]">
                            • {typeof sig === 'string' ? sig : sig.name}
                          </span>
                          {typeof sig === 'object' && (
                            <span className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${getSeverityStyle(sig.severity)}`}>
                              {sig.severity || 'SIGNAL'} {sig.impact ? `(+${sig.impact})` : ''}
                            </span>
                          )}
                        </div>

                        {/* Supporting Evidence Quote */}
                        {typeof sig === 'object' && sig.evidence && (
                          <div className="bg-white p-2 rounded-lg border border-[#D9E2EC] space-y-0.5">
                            <span className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider">
                              Supporting Evidence:
                            </span>
                            <div className="text-xs text-[#B42318] font-mono font-medium">
                              "{sig.evidence}"
                            </div>
                          </div>
                        )}

                        {/* Explanation */}
                        {typeof sig === 'object' && sig.explanation && (
                          <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                            {sig.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      <span>No Strong Threat Indicators Detected</span>
                    </div>
                    <p className="text-[11px] text-[#15803D]">
                      No money mule recruitment patterns, credential harvesting requests, or malicious lookalike domains were found in the analyzed text.
                    </p>
                  </div>
                )}
              </div>

              {/* AI Explanation */}
              <div className="pt-4 border-t border-[#D9E2EC] space-y-1.5">
                <div className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                  AI Contextual Explanation
                </div>
                <p className="text-xs text-[#5B6B7A] leading-relaxed italic font-sans">
                  "{analysis.explanation}"
                </p>
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-1">
                <div className="text-[11px] font-bold text-[#1565C0] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Recommended Action
                </div>
                <p className="text-xs text-[#0F2747] font-semibold">
                  {analysis.recommended_action || analysis.recommendedAction}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-[#D9E2EC] text-center space-y-3 shadow-2xs">
              <ShieldCheck className="w-12 h-12 text-[#7A8896] mx-auto" />
              <h3 className="text-sm font-bold text-[#0F2747]">Awaiting Message Input</h3>
              <p className="text-xs text-[#5B6B7A] max-w-xs mx-auto">
                Paste a suspicious message or select a sample offer above to run the Rakshak recruitment threat evaluation engine.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
